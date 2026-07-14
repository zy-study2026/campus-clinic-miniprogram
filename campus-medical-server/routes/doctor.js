const express = require('express');
const router = express.Router();
const db = require('../config/db');

router.get('/appointments', async (req, res) => {
  try {
    const { doctorId, date, status } = req.query;

    if (!doctorId) {
      return res.fail('请提供医生ID');
    }

    let sql = `
      SELECT a.id, a.student_id, a.symptom, a.status, a.fee, a.create_time,
             u.name as student_name, u.username as student_username, u.phone as student_phone,
             u.gender as student_gender, u.birth_date as student_birth_date,
             dd.date, dd.time_slot,
             d.name as department_name
      FROM appointment a
      JOIN user u ON a.student_id = u.id
      JOIN doctor_duty dd ON a.duty_id = dd.id
      JOIN department d ON dd.department_id = d.id
      WHERE dd.doctor_id = ?
    `;
    const params = [doctorId];

    if (date) {
      sql += ' AND dd.date = ?';
      params.push(date);
    }

    if (status !== undefined && status !== null && status !== '') {
      sql += ' AND a.status = ?';
      params.push(parseInt(status));
    } else {
      sql += ' AND a.status = 0';
    }

    sql += ' ORDER BY dd.date DESC, dd.time_slot DESC';

    const [appointments] = await db.execute(sql, params);

    const result = appointments.map(item => ({
      ...item,
      statusText: getAppointmentStatus(item.status)
    }));

    res.success(result);
  } catch (err) {
    console.error('获取预约列表失败:', err);
    res.error('获取预约列表失败');
  }
});

router.put('/updateAppointmentStatus', async (req, res) => {
  try {
    const { appointmentId, status } = req.body;
    const { doctorId } = req.query;

    if (!appointmentId) {
      return res.fail('请提供预约ID');
    }

    if (status === undefined || status === null) {
      return res.fail('请提供状态');
    }

    const [appointments] = await db.execute(`
      SELECT a.*, dd.doctor_id
      FROM appointment a
      JOIN doctor_duty dd ON a.duty_id = dd.id
      WHERE a.id = ?
    `, [appointmentId]);

    if (appointments.length === 0) {
      return res.fail('预约不存在');
    }

    const appointment = appointments[0];

    if (doctorId && appointment.doctor_id !== parseInt(doctorId)) {
      return res.fail('无权操作此预约');
    }

    const newStatus = parseInt(status);

    if (newStatus !== 1 && newStatus !== 2 && newStatus !== 3) {
      return res.fail('状态值不合法');
    }

    const [result] = await db.execute(
      'UPDATE appointment SET status = ? WHERE id = ?',
      [newStatus, appointmentId]
    );

    if (result.affectedRows === 0) {
      return res.fail('更新失败');
    }

    res.success('状态更新成功');
  } catch (err) {
    console.error('更新预约状态失败:', err);
    res.error('更新预约状态失败');
  }
});

router.post('/medicalRecord', async (req, res) => {
  try {
    const { appointmentId, subjective, present_illness, past_history, examination, diagnosis, treatment, doctorId } = req.body;

    if (!appointmentId) {
      return res.fail('请提供预约ID');
    }

    if (!doctorId) {
      return res.fail('请提供医生ID');
    }

    if (!subjective || !present_illness || !examination || !diagnosis || !treatment) {
      return res.fail('请填写完整信息');
    }

    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
      const [appointments] = await connection.execute(`
        SELECT a.*, dd.doctor_id, dd.department_id
        FROM appointment a
        JOIN doctor_duty dd ON a.duty_id = dd.id
        WHERE a.id = ?
      `, [appointmentId]);

      if (appointments.length === 0) {
        await connection.rollback();
        return res.fail('预约不存在');
      }

      const appointment = appointments[0];

      if (parseInt(appointment.doctor_id) !== parseInt(doctorId)) {
        await connection.rollback();
        return res.fail('无权操作此预约');
      }

      const [existing] = await connection.execute(
        'SELECT id FROM medical_record WHERE appointment_id = ?',
        [appointmentId]
      );

      if (existing.length > 0) {
        await connection.rollback();
        return res.fail('该预约已存在病历记录');
      }

      await connection.execute(`
        INSERT INTO medical_record (appointment_id, student_id, doctor_id,
          subjective, present_illness, past_history, examination, diagnosis, treatment)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [appointmentId, appointment.student_id, appointment.doctor_id,
        subjective, present_illness, past_history || '', examination, diagnosis, treatment]);

      if (appointment.status === 0) {
        await connection.execute(
          'UPDATE appointment SET status = 1 WHERE id = ?',
          [appointmentId]
        );
      }

      await connection.commit();
      res.success('病历提交成功，预约状态已更新为已就诊');
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  } catch (err) {
    console.error('保存病历失败:', err);
    res.error('保存病历失败');
  }
});

router.get('/medicalRecords', async (req, res) => {
  try {
    const { doctorId } = req.query;

    if (!doctorId) {
      return res.fail('请提供医生ID');
    }

    const [records] = await db.execute(`
      SELECT mr.id, mr.appointment_id, mr.subjective, mr.present_illness,
             mr.past_history, mr.examination, mr.diagnosis, mr.treatment, mr.record_time,
             u.name as student_name, u.username as student_username, u.phone as student_phone,
             dd.date, dd.time_slot
      FROM medical_record mr
      JOIN user u ON mr.student_id = u.id
      JOIN appointment a ON mr.appointment_id = a.id
      JOIN doctor_duty dd ON a.duty_id = dd.id
      WHERE mr.doctor_id = ?
      ORDER BY mr.record_time DESC
    `, [doctorId]);

    res.success(records);
  } catch (err) {
    console.error('获取病历列表失败:', err);
    res.error('获取病历列表失败');
  }
});

router.get('/medicalRecord/detail/:recordId', async (req, res) => {
  try {
    const { recordId } = req.params;

    const [records] = await db.execute(`
      SELECT mr.*,
             u.name as student_name, u.username as student_username, u.phone as student_phone,
             u.gender as student_gender, u.birth_date as student_birth_date,
             dd.date, dd.time_slot, a.symptom
      FROM medical_record mr
      JOIN user u ON mr.student_id = u.id
      JOIN appointment a ON mr.appointment_id = a.id
      JOIN doctor_duty dd ON a.duty_id = dd.id
      WHERE mr.id = ?
    `, [recordId]);

    if (records.length === 0) {
      return res.fail('病历不存在');
    }

    res.success(records[0]);
  } catch (err) {
    console.error('获取病历详情失败:', err);
    res.error('获取病历详情失败');
  }
});

router.get('/orders', async (req, res) => {
  try {
    const { status } = req.query;

    let sql = `
      SELECT o.id, o.student_id, o.drug_id, o.quantity, o.total_price,
             o.receiver_name, o.receiver_phone, o.receiver_address,
             o.status, o.order_time, o.pay_time, o.delivery_estimate_time,
             u.name as student_name, u.username as student_username,
             d.name as drug_name, d.price as drug_price, d.category_id
      FROM drug_order o
      JOIN user u ON o.student_id = u.id
      JOIN drug d ON o.drug_id = d.id
    `;
    const params = [];

    if (status !== undefined && status !== null && status !== '') {
      sql += ' WHERE o.status = ?';
      params.push(parseInt(status));
    }

    sql += ' ORDER BY o.order_time DESC';

    const [orders] = await db.execute(sql, params);

    const result = orders.map(order => ({
      ...order,
      total_price: parseFloat(order.total_price) || 0,
      quantity: parseInt(order.quantity) || 0,
      drug_id: parseInt(order.drug_id) || 0,
      student_id: parseInt(order.student_id) || 0,
      status: parseInt(order.status) || 0,
      statusText: getOrderStatus(parseInt(order.status))
    }));

    res.success(result);
  } catch (err) {
    console.error('获取订单列表失败:', err);
    res.error('获取订单列表失败');
  }
});

router.get('/info', async (req, res) => {
  try {
    const { username } = req.query;

    if (!username) {
      return res.fail('请提供用户名');
    }

    const [users] = await db.execute(
      'SELECT id, username, name, phone, gender, birth_date, role, is_phone_bound, create_time FROM user WHERE username = ? AND role = 1',
      [username]
    );

    if (users.length === 0) {
      return res.fail('用户不存在');
    }

    res.success(users[0]);
  } catch (err) {
    console.error('查询医生信息失败:', err);
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
      `UPDATE user SET ${updates.join(', ')} WHERE username = ? AND role = 1`,
      params
    );

    res.success(null, '信息更新成功');
  } catch (err) {
    console.error('更新医生信息失败:', err);
    res.error('更新信息失败');
  }
});

function getAppointmentStatus(status) {
  const statusMap = {
    0: '待就诊',
    1: '已就诊',
    2: '已取消',
    3: '已完成'
  };
  return statusMap[status] || '未知';
}

function getOrderStatus(status) {
  const statusMap = {
    0: '待支付',
    1: '已支付',
    2: '配送中',
    3: '已完成',
    4: '已取消'
  };
  return statusMap[status] || '未知';
}

module.exports = router;