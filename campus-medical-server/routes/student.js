const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { simulatePay, simulateRefund, getAppointmentFee } = require('../controllers/payment');

router.get('/departments', async (req, res) => {
  try {
    const [departments] = await db.execute('SELECT * FROM department');
    res.success(departments);
  } catch (err) {
    console.error('科室查询失败:', err);
    res.error('科室查询失败');
  }
});

router.get('/doctors/byDepartment', async (req, res) => {
  try {
    const { deptId } = req.query;
    let sql = `
      SELECT u.id, u.name, u.phone, u.gender,
             d.name as department_name, dd.department_id
      FROM user u
      JOIN doctor_duty dd ON u.id = dd.doctor_id
      JOIN department d ON dd.department_id = d.id
      WHERE u.role = 1
    `;
    let params = [];

    if (deptId) {
      sql += ' AND dd.department_id = ?';
      params.push(deptId);
    }

    sql += ' GROUP BY u.id, u.name, u.phone, u.gender, d.name, dd.department_id';

    const [doctors] = await db.execute(sql, params);
    res.success(doctors);
  } catch (err) {
    console.error('医生查询失败:', err);
    res.error('医生查询失败');
  }
});

router.get('/duty/available', async (req, res) => {
  try {
    const { doctorId, date } = req.query;

    if (!doctorId || !date) {
      return res.fail('请选择医生和日期');
    }

    const [duties] = await db.execute(`
      SELECT
        dd.id,
        dd.time_slot,
        dd.max_appointments,
        dd.booked_appointments,
        (dd.max_appointments - dd.booked_appointments) as remaining
      FROM doctor_duty dd
      WHERE dd.doctor_id = ?
        AND dd.date = ?
        AND dd.booked_appointments < dd.max_appointments
      ORDER BY dd.time_slot
    `, [doctorId, date]);

    res.success(duties);
  } catch (err) {
    console.error('获取可用时段失败:', err);
    res.error('获取可用时段失败');
  }
});

router.post('/appointment', async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const { studentId, dutyId, symptom } = req.body;

    if (!studentId || !dutyId) {
      await connection.rollback();
      return res.fail('请选择就诊时间');
    }

    const [studentRows] = await connection.execute(
      'SELECT id FROM user WHERE username = ? AND role = 0',
      [studentId]
    );
    if (studentRows.length === 0) {
      await connection.rollback();
      return res.fail('学生账号不存在');
    }
    const studentDbId = studentRows[0].id;

    const [existing] = await connection.execute(
      'SELECT * FROM appointment WHERE student_id = ? AND duty_id = ? AND status = 0',
      [studentDbId, dutyId]
    );

    if (existing.length > 0) {
      await connection.rollback();
      return res.fail('您已预约该时段');
    }

    const [duty] = await connection.execute(
      'SELECT id, booked_appointments, max_appointments FROM doctor_duty WHERE id = ? FOR UPDATE',
      [dutyId]
    );

    if (duty.length === 0) {
      await connection.rollback();
      return res.fail('预约时段不存在');
    }

    const remaining = duty[0].max_appointments - duty[0].booked_appointments;
    if (remaining <= 0) {
      await connection.rollback();
      return res.fail('该时段已约满');
    }

    const fee = getAppointmentFee();
    const paySuccess = await simulatePay(fee, studentId);
    if (!paySuccess) {
      await connection.rollback();
      return res.status(200).json({ code: 400, msg: '支付失败' });
    }

    await connection.execute(
      'INSERT INTO appointment (student_id, duty_id, symptom, status, fee) VALUES (?, ?, ?, 0, ?)',
      [studentDbId, dutyId, symptom || null, fee]
    );

    await connection.execute(
      'UPDATE doctor_duty SET booked_appointments = booked_appointments + 1 WHERE id = ?',
      [dutyId]
    );

    await connection.commit();
    res.success(null, '预约成功');
  } catch (err) {
    await connection.rollback();
    console.error('预约失败:', err);
    res.error('预约失败');
  } finally {
    connection.release();
  }
});

router.get('/appointments', async (req, res) => {
  try {
    const { studentId } = req.query;

    if (!studentId) {
      return res.fail('请提供学生账号');
    }

    const [studentRows] = await db.execute(
      'SELECT id FROM user WHERE username = ? AND role = 0',
      [studentId]
    );

    if (studentRows.length === 0) {
      return res.fail('学生账号不存在');
    }

    const studentDbId = studentRows[0].id;

    const [appointments] = await db.execute(`
      SELECT
        a.id,
        a.symptom,
        a.status,
        a.fee,
        a.create_time,
        dd.date,
        dd.time_slot,
        d.name as department_name,
        u.name as doctor_name
      FROM appointment a
      JOIN doctor_duty dd ON a.duty_id = dd.id
      JOIN department d ON dd.department_id = d.id
      JOIN user u ON dd.doctor_id = u.id
      WHERE a.student_id = ?
      ORDER BY a.create_time DESC
    `, [studentDbId]);

    res.success(appointments);
  } catch (err) {
    console.error('预约查询失败:', err);
    res.error('预约查询失败');
  }
});

router.post('/cancelAppointment', async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const { appointmentId } = req.body;

    if (!appointmentId) {
      await connection.rollback();
      return res.fail('请提供预约ID');
    }

    const [appointment] = await connection.execute(
      'SELECT duty_id, status, fee, student_id FROM appointment WHERE id = ? FOR UPDATE',
      [appointmentId]
    );

    if (appointment.length === 0) {
      await connection.rollback();
      return res.fail('预约不存在');
    }

    if (appointment[0].status !== 0) {
      await connection.rollback();
      return res.fail('只能取消未就诊的预约');
    }

    const refundSuccess = await simulateRefund(appointment[0].fee, appointment[0].student_id);
    if (!refundSuccess) {
      await connection.rollback();
      return res.status(200).json({ code: 400, msg: '退款失败' });
    }

    await connection.execute(
      'UPDATE appointment SET status = 2 WHERE id = ?',
      [appointmentId]
    );

    await connection.execute(
      'UPDATE doctor_duty SET booked_appointments = booked_appointments - 1 WHERE id = ?',
      [appointment[0].duty_id]
    );

    await connection.commit();
    res.success(null, '取消成功');
  } catch (err) {
    await connection.rollback();
    console.error('取消预约失败:', err);
    res.error('取消预约失败');
  } finally {
    connection.release();
  }
});

router.get('/medical-record', async (req, res) => {
  try {
    const { studentId } = req.query;

    if (!studentId) {
      return res.fail('请提供学生账号');
    }

    const [studentRows] = await db.execute(
      'SELECT id, name, gender, username, birth_date FROM user WHERE username = ? AND role = 0',
      [studentId]
    );

    if (studentRows.length === 0) {
      return res.fail('学生账号不存在');
    }

    const student = studentRows[0];

    const birthDate = new Date(student.birth_date);
    const now = new Date();
    let age = now.getFullYear() - birthDate.getFullYear();
    if (now.getMonth() < birthDate.getMonth() ||
        (now.getMonth() === birthDate.getMonth() && now.getDate() < birthDate.getDate())) {
      age--;
    }

    const [records] = await db.execute(`
      SELECT
        mr.id,
        mr.subjective as chief_complaint,
        mr.present_illness as present_history,
        mr.past_history,
        mr.examination,
        mr.diagnosis,
        mr.treatment,
        mr.record_time,
        a.symptom,
        dd.date,
        dd.time_slot,
        d.name as department_name,
        u.name as doctor_name
      FROM medical_record mr
      JOIN appointment a ON mr.appointment_id = a.id
      JOIN doctor_duty dd ON a.duty_id = dd.id
      JOIN department d ON dd.department_id = d.id
      JOIN user u ON mr.doctor_id = u.id
      WHERE mr.student_id = ?
      ORDER BY mr.record_time DESC
    `, [student.id]);

    const result = records.map(record => ({
      ...record,
      name: student.name,
      gender: student.gender === 1 ? '男' : '女',
      age: age >= 0 ? age : 0,
      student_id: student.username
    }));

    res.success(result);
  } catch (err) {
    console.error('病历查询失败:', err);
    res.error('病历查询失败');
  }
});

router.get('/info', async (req, res) => {
  try {
    const { username } = req.query;

    if (!username) {
      return res.fail('请提供用户名');
    }

    const [users] = await db.execute(
      'SELECT id, username, name, phone, gender, birth_date, role, is_phone_bound, create_time FROM user WHERE username = ? AND role = 0',
      [username]
    );

    if (users.length === 0) {
      return res.fail('用户不存在');
    }

    res.success(users[0]);
  } catch (err) {
    console.error('查询学生信息失败:', err);
    res.error('查询信息失败');
  }
});

router.put('/info', async (req, res) => {
  try {
    const { username, gender, birth_date } = req.body;

    if (!username) {
      return res.fail('请提供用户名');
    }

    const updates = [];
    const params = [];

    if (gender !== undefined) {
      updates.push('gender = ?');
      params.push(gender);
    }

    if (birth_date !== undefined) {
      updates.push('birth_date = ?');
      params.push(birth_date);
    }

    if (updates.length === 0) {
      return res.fail('没有需要更新的字段');
    }

    params.push(username);

    await db.execute(
      `UPDATE user SET ${updates.join(', ')} WHERE username = ? AND role = 0`,
      params
    );

    res.success(null, '信息更新成功');
  } catch (err) {
    console.error('更新学生信息失败:', err);
    res.error('更新信息失败');
  }
});

module.exports = router;