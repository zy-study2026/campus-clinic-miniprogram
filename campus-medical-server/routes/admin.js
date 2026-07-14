const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../config/db');
const adminAuth = require('../middleware/adminAuth');

router.use(adminAuth);

function getOrderStatus(status) {
  const statusMap = {
    0: '待支付',
    1: '已支付',
    2: '配送中',
    3: '已完成',
    4: '已取药'
  };
  return statusMap[status] || '未知';
}

function getApplyStatus(status) {
  const statusMap = {
    0: '待审核',
    1: '已通过',
    2: '已拒绝'
  };
  return statusMap[status] || '未知';
}

router.get('/stats', async (req, res) => {
  try {
    const [studentResult] = await db.execute('SELECT COUNT(*) as count FROM user WHERE role = 0');
    const [doctorResult] = await db.execute('SELECT COUNT(*) as count FROM user WHERE role = 1');
    const [appointmentResult] = await db.execute("SELECT COUNT(*) as count FROM appointment WHERE DATE(create_time) = CURDATE()");
    const [recordResult] = await db.execute('SELECT COUNT(*) as count FROM medical_record');

    res.success({
      student_count: studentResult[0].count,
      doctor_count: doctorResult[0].count,
      today_appointments: appointmentResult[0].count,
      total_records: recordResult[0].count
    });
  } catch (err) {
    console.error('[Admin] 统计数据查询失败:', err);
    res.error('统计数据查询失败');
  }
});

router.get('/students', async (req, res) => {
  try {
    const { keyword } = req.query;

    let sql = 'SELECT id, username, name, phone, gender, birth_date, is_phone_bound, create_time FROM user WHERE role = 0';
    const params = [];

    if (keyword) {
      sql += ' AND (username LIKE ? OR name LIKE ?)';
      params.push(`%${keyword}%`, `%${keyword}%`);
    }

    sql += ' ORDER BY create_time DESC';

    console.log('[Admin] 学生列表查询 SQL:', sql, '参数:', params);
    const [students] = await db.execute(sql, params);

    res.success(students);
  } catch (err) {
    console.error('[Admin] 学生列表查询失败:', err);
    res.error('学生列表查询失败');
  }
});

router.post('/student/add', async (req, res) => {
  try {
    const { username, name, phone, gender, birth_date } = req.body;

    if (!username || !name) {
      return res.fail('请填写账号和姓名');
    }

    const [existing] = await db.execute('SELECT id FROM user WHERE username = ?', [username]);
    if (existing.length > 0) {
      return res.fail('账号已存在');
    }

    const hashedPassword = await bcrypt.hash('123456', 10);
    const isPhoneBound = phone ? 1 : 0;

    await db.execute(
      'INSERT INTO user (username, password, name, phone, gender, birth_date, role, is_phone_bound) VALUES (?, ?, ?, ?, ?, ?, 0, ?)',
      [username, hashedPassword, name, phone || null, gender || 0, birth_date || null, isPhoneBound]
    );

    res.success(null, '学生添加成功');
  } catch (err) {
    console.error('[Admin] 学生添加失败:', err);
    res.error('学生添加失败');
  }
});

router.put('/student/update', async (req, res) => {
  try {
    const { id, name, phone, gender, birth_date } = req.body;

    if (!id || !name) {
      return res.fail('请填写姓名');
    }

    const isPhoneBound = phone ? 1 : 0;

    await db.execute(
      'UPDATE user SET name = ?, phone = ?, gender = ?, birth_date = ?, is_phone_bound = ? WHERE id = ? AND role = 0',
      [name, phone || null, gender || 0, birth_date || null, isPhoneBound, id]
    );

    res.success(null, '学生信息更新成功');
  } catch (err) {
    console.error('[Admin] 学生更新失败:', err);
    res.error('学生更新失败');
  }
});

router.delete('/student/delete', async (req, res) => {
  try {
    const { id } = req.body;

    if (!id) {
      return res.fail('请提供学生ID');
    }

    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
      await connection.execute('DELETE FROM drug_order WHERE student_id = ?', [id]);
      await connection.execute('DELETE FROM medical_record WHERE student_id = ?', [id]);
      await connection.execute('DELETE FROM appointment WHERE student_id = ?', [id]);
      await connection.execute('DELETE FROM medicine_apply WHERE student_id = ?', [id]);
      await connection.execute('DELETE FROM user WHERE id = ? AND role = 0', [id]);

      await connection.commit();
      res.success(null, '学生删除成功');
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  } catch (err) {
    console.error('[Admin] 学生删除失败:', err);
    res.error('学生删除失败');
  }
});

router.post('/student/resetPassword', async (req, res) => {
  try {
    const { id } = req.body;

    if (!id) {
      return res.fail('请提供学生ID');
    }

    const hashedPassword = await bcrypt.hash('123456', 10);
    await db.execute('UPDATE user SET password = ? WHERE id = ? AND role = 0', [hashedPassword, id]);

    res.success(null, '密码重置成功');
  } catch (err) {
    console.error('[Admin] 密码重置失败:', err);
    res.error('密码重置失败');
  }
});

router.get('/doctors', async (req, res) => {
  try {
    const { keyword } = req.query;

    let sql = 'SELECT id, username, name, phone, gender, birth_date, is_phone_bound, create_time FROM user WHERE role = 1';
    const params = [];

    if (keyword) {
      sql += ' AND (username LIKE ? OR name LIKE ?)';
      params.push(`%${keyword}%`, `%${keyword}%`);
    }

    sql += ' ORDER BY create_time DESC';

    console.log('[Admin] 医生列表查询 SQL:', sql, '参数:', params);
    const [doctors] = await db.execute(sql, params);

    res.success(doctors);
  } catch (err) {
    console.error('[Admin] 医生列表查询失败:', err);
    res.error('医生列表查询失败');
  }
});

router.post('/doctor/add', async (req, res) => {
  try {
    const { username, name, phone, gender, birth_date } = req.body;

    if (!username || !name) {
      return res.fail('请填写工号和姓名');
    }

    const [existing] = await db.execute('SELECT id FROM user WHERE username = ?', [username]);
    if (existing.length > 0) {
      return res.fail('工号已存在');
    }

    const hashedPassword = await bcrypt.hash('123456', 10);
    const isPhoneBound = phone ? 1 : 0;

    await db.execute(
      'INSERT INTO user (username, password, name, phone, gender, birth_date, role, is_phone_bound) VALUES (?, ?, ?, ?, ?, ?, 1, ?)',
      [username, hashedPassword, name, phone || null, gender || 0, birth_date || null, isPhoneBound]
    );

    res.success(null, '医生添加成功');
  } catch (err) {
    console.error('[Admin] 医生添加失败:', err);
    res.error('医生添加失败');
  }
});

router.put('/doctor/update', async (req, res) => {
  try {
    const { id, name, phone, gender, birth_date } = req.body;

    if (!id || !name) {
      return res.fail('请填写姓名');
    }

    const isPhoneBound = phone ? 1 : 0;

    await db.execute(
      'UPDATE user SET name = ?, phone = ?, gender = ?, birth_date = ?, is_phone_bound = ? WHERE id = ? AND role = 1',
      [name, phone || null, gender || 0, birth_date || null, isPhoneBound, id]
    );

    res.success(null, '医生信息更新成功');
  } catch (err) {
    console.error('[Admin] 医生更新失败:', err);
    res.error('医生更新失败');
  }
});

router.delete('/doctor/delete', async (req, res) => {
  try {
    const { id } = req.body;

    if (!id) {
      return res.fail('请提供医生ID');
    }

    const [duties] = await db.execute('SELECT id FROM doctor_duty WHERE doctor_id = ? LIMIT 1', [id]);
    if (duties.length > 0) {
      return res.fail('该医生有排班安排，无法删除');
    }

    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
      await connection.execute('DELETE FROM medical_record WHERE doctor_id = ?', [id]);
      await connection.execute('DELETE FROM user WHERE id = ? AND role = 1', [id]);

      await connection.commit();
      res.success(null, '医生删除成功');
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  } catch (err) {
    console.error('[Admin] 医生删除失败:', err);
    res.error('医生删除失败');
  }
});

router.post('/doctor/resetPassword', async (req, res) => {
  try {
    const { id } = req.body;

    if (!id) {
      return res.fail('请提供医生ID');
    }

    const hashedPassword = await bcrypt.hash('123456', 10);
    await db.execute('UPDATE user SET password = ? WHERE id = ? AND role = 1', [hashedPassword, id]);

    res.success(null, '密码重置成功');
  } catch (err) {
    console.error('[Admin] 医生密码重置失败:', err);
    res.error('密码重置失败');
  }
});

router.get('/departments', async (req, res) => {
  try {
    const [departments] = await db.execute('SELECT id, name, description FROM department ORDER BY id DESC');
    res.success(departments);
  } catch (err) {
    console.error('[Admin] 科室列表查询失败:', err);
    res.error('科室列表查询失败');
  }
});

router.post('/department/add', async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.fail('请输入科室名');
    }

    const [existing] = await db.execute('SELECT id FROM department WHERE name = ?', [name]);
    if (existing.length > 0) {
      return res.fail('科室已存在');
    }

    await db.execute('INSERT INTO department (name, description) VALUES (?, ?)', [name, description || null]);
    res.success(null, '科室添加成功');
  } catch (err) {
    console.error('[Admin] 科室添加失败:', err);
    res.error('科室添加失败');
  }
});

router.put('/department/update', async (req, res) => {
  try {
    const { id, name, description } = req.body;

    if (!id || !name) {
      return res.fail('请填写完整信息');
    }

    await db.execute('UPDATE department SET name = ?, description = ? WHERE id = ?', [name, description || null, id]);
    res.success(null, '科室更新成功');
  } catch (err) {
    console.error('[Admin] 科室更新失败:', err);
    res.error('科室更新失败');
  }
});

router.delete('/department/delete', async (req, res) => {
  try {
    const { id } = req.body;

    if (!id) {
      return res.fail('请提供科室ID');
    }

    const [duties] = await db.execute('SELECT id FROM doctor_duty WHERE department_id = ? LIMIT 1', [id]);
    if (duties.length > 0) {
      return res.fail('该科室有排班安排，无法删除');
    }

    await db.execute('DELETE FROM department WHERE id = ?', [id]);
    res.success(null, '科室删除成功');
  } catch (err) {
    console.error('[Admin] 科室删除失败:', err);
    res.error('科室删除失败');
  }
});

router.get('/duties', async (req, res) => {
  try {
    const { doctorId, date } = req.query;

    let sql = `
      SELECT dd.id, dd.doctor_id, dd.department_id, dd.date, dd.time_slot,
             dd.max_appointments, dd.booked_appointments,
             u.name as doctor_name, d.name as department_name
      FROM doctor_duty dd
      LEFT JOIN user u ON dd.doctor_id = u.id
      LEFT JOIN department d ON dd.department_id = d.id
      WHERE 1=1
    `;
    const params = [];

    if (doctorId) {
      sql += ' AND dd.doctor_id = ?';
      params.push(doctorId);
    }

    if (date) {
      sql += ' AND dd.date = ?';
      params.push(date);
    }

    sql += ' ORDER BY dd.date DESC, dd.time_slot DESC';

    console.log('[Admin] 排班列表查询 SQL:', sql, '参数:', params);
    const [duties] = await db.execute(sql, params);

    res.success(duties);
  } catch (err) {
    console.error('[Admin] 排班列表查询失败:', err);
    res.error('排班列表查询失败');
  }
});

router.post('/duty/add', async (req, res) => {
  try {
    const { doctorId, departmentId, date, timeSlot, maxAppointments } = req.body;

    if (!doctorId || !departmentId || !date || !timeSlot || maxAppointments === undefined) {
      return res.fail('请填写完整信息');
    }

    const [existing] = await db.execute(
      'SELECT id FROM doctor_duty WHERE doctor_id = ? AND date = ? AND time_slot = ?',
      [doctorId, date, timeSlot]
    );
    if (existing.length > 0) {
      return res.fail('该医生在该时间段已有排班');
    }

    await db.execute(
      'INSERT INTO doctor_duty (doctor_id, department_id, date, time_slot, max_appointments, booked_appointments) VALUES (?, ?, ?, ?, ?, 0)',
      [doctorId, departmentId, date, timeSlot, maxAppointments]
    );

    res.success(null, '排班添加成功');
  } catch (err) {
    console.error('[Admin] 排班添加失败:', err);
    res.error('排班添加失败');
  }
});

router.put('/duty/update', async (req, res) => {
  try {
    const { id, departmentId, date, timeSlot, maxAppointments } = req.body;

    if (!id) {
      return res.fail('请提供排班ID');
    }

    await db.execute(
      'UPDATE doctor_duty SET department_id = ?, date = ?, time_slot = ?, max_appointments = ? WHERE id = ?',
      [departmentId, date, timeSlot, maxAppointments, id]
    );

    res.success(null, '排班更新成功');
  } catch (err) {
    console.error('[Admin] 排班更新失败:', err);
    res.error('排班更新失败');
  }
});

router.delete('/duty/delete', async (req, res) => {
  try {
    const { id } = req.body;

    if (!id) {
      return res.fail('请提供排班ID');
    }

    const [appointments] = await db.execute('SELECT id FROM appointment WHERE duty_id = ? LIMIT 1', [id]);
    if (appointments.length > 0) {
      return res.fail('该排班有预约记录，无法删除');
    }

    await db.execute('DELETE FROM doctor_duty WHERE id = ?', [id]);
    res.success(null, '排班删除成功');
  } catch (err) {
    console.error('[Admin] 排班删除失败:', err);
    res.error('排班删除失败');
  }
});

router.get('/appointments', async (req, res) => {
  try {
    const sql = `
      SELECT a.id, a.student_id, a.duty_id, a.symptom, a.status, a.fee, a.create_time,
             u.name as student_name, u.username as student_username,
             d.name as department_name,
             dd.date as appointment_date, dd.time_slot
      FROM appointment a
      LEFT JOIN user u ON a.student_id = u.id
      LEFT JOIN doctor_duty dd ON a.duty_id = dd.id
      LEFT JOIN department d ON dd.department_id = d.id
      ORDER BY a.create_time DESC
    `;

    console.log('[Admin] 预约列表查询 SQL:', sql);
    const [appointments] = await db.execute(sql);

    const result = appointments.map(item => ({
      ...item,
      statusText: item.status === 0 ? '待就诊' : item.status === 1 ? '已就诊' : item.status === 2 ? '已取药' : '未知'
    }));

    res.success(result);
  } catch (err) {
    console.error('[Admin] 预约列表查询失败:', err);
    res.error('预约列表查询失败');
  }
});

router.get('/medical-records', async (req, res) => {
  try {
    const sql = `
      SELECT mr.id, mr.appointment_id, mr.student_id, mr.doctor_id,
             mr.subjective, mr.present_illness, mr.past_history,
             mr.examination, mr.diagnosis, mr.treatment, mr.record_time,
             u.name as student_name, u.username as student_username,
             du.name as doctor_name,
             d.name as department_name
      FROM medical_record mr
      LEFT JOIN user u ON mr.student_id = u.id
      LEFT JOIN user du ON mr.doctor_id = du.id
      LEFT JOIN department d ON mr.department_id = d.id
      ORDER BY mr.record_time DESC
    `;

    console.log('[Admin] 病历列表查询 SQL:', sql);
    const [records] = await db.execute(sql);

    res.success(records);
  } catch (err) {
    console.error('[Admin] 病历列表查询失败:', err);
    res.error('病历列表查询失败');
  }
});

router.get('/medicine-applies', async (req, res) => {
  try {
    const { status } = req.query;

    let sql = `
      SELECT ma.id, ma.student_id, ma.medicine, ma.address, ma.status, ma.apply_time, ma.reject_reason,
             u.name as student_name, u.username as student_username
      FROM medicine_apply ma
      LEFT JOIN user u ON ma.student_id = u.id
    `;
    const params = [];

    if (status !== undefined && status !== '') {
      sql += ' WHERE ma.status = ?';
      params.push(status);
    }

    sql += ' ORDER BY ma.apply_time DESC';

    console.log('[Admin] 药品申请列表查询 SQL:', sql, '参数:', params);
    const [applies] = await db.execute(sql, params);

    const result = applies.map(item => ({
      ...item,
      statusText: getApplyStatus(item.status)
    }));

    res.success(result);
  } catch (err) {
    console.error('[Admin] 药品申请列表查询失败:', err);
    res.error('药品申请列表查询失败');
  }
});

router.put('/medicine-apply/updateStatus', async (req, res) => {
  try {
    const { id, status, rejectReason } = req.body;

    if (!id || status === undefined) {
      return res.fail('请提供完整信息');
    }

    await db.execute(
      'UPDATE medicine_apply SET status = ?, reject_reason = ? WHERE id = ?',
      [status, rejectReason || null, id]
    );

    res.success(null, '状态更新成功');
  } catch (err) {
    console.error('[Admin] 药品申请状态更新失败:', err);
    res.error('状态更新失败');
  }
});

router.get('/drugs', async (req, res) => {
  try {
    const { keyword, categoryId } = req.query;

    let sql = `
      SELECT d.id, d.name, d.category_id, d.stock, d.price, d.indication, d.usage,
             dc.name as category_name
      FROM drug d
      LEFT JOIN drug_category dc ON d.category_id = dc.id
      WHERE 1=1
    `;
    const params = [];

    if (keyword) {
      sql += ' AND d.name LIKE ?';
      params.push(`%${keyword}%`);
    }

    if (categoryId) {
      sql += ' AND d.category_id = ?';
      params.push(categoryId);
    }

    sql += ' ORDER BY d.id DESC';

    console.log('[Admin] 药品列表查询 SQL:', sql, '参数:', params);
    const [drugs] = await db.execute(sql, params);

    res.success(drugs);
  } catch (err) {
    console.error('[Admin] 药品列表查询失败:', err);
    res.error('药品列表查询失败');
  }
});

router.get('/drug/categories', async (req, res) => {
  try {
    const [categories] = await db.execute('SELECT id, name FROM drug_category ORDER BY id DESC');
    res.success(categories);
  } catch (err) {
    console.error('[Admin] 药品分类查询失败:', err);
    res.error('药品分类查询失败');
  }
});

router.post('/drug/add', async (req, res) => {
  try {
    const { name, categoryId, stock, price, indication, usage } = req.body;

    if (!name || !categoryId || stock === undefined || price === undefined) {
      return res.fail('请填写完整信息');
    }

    await db.execute(
      'INSERT INTO drug (name, category_id, stock, price, indication, usage) VALUES (?, ?, ?, ?, ?, ?)',
      [name, categoryId, stock, price, indication || null, usage || null]
    );

    res.success(null, '药品添加成功');
  } catch (err) {
    console.error('[Admin] 药品添加失败:', err);
    res.error('药品添加失败');
  }
});

router.put('/drug/update', async (req, res) => {
  try {
    const { id, name, categoryId, stock, price, indication, usage } = req.body;

    if (!id) {
      return res.fail('请提供药品ID');
    }

    await db.execute(
      'UPDATE drug SET name = ?, category_id = ?, stock = ?, price = ?, indication = ?, `usage` = ? WHERE id = ?',
      [name, categoryId, stock, price, indication || null, usage || null, id]
    );

    res.success(null, '药品更新成功');
  } catch (err) {
    console.error('[Admin] 药品更新失败:', err);
    res.error('药品更新失败');
  }
});

router.delete('/drug/delete', async (req, res) => {
  try {
    const { id } = req.body;

    if (!id) {
      return res.fail('请提供药品ID');
    }

    const [orders] = await db.execute('SELECT id FROM drug_order WHERE drug_id = ? AND status IN (0, 1, 2) LIMIT 1', [id]);
    if (orders.length > 0) {
      return res.fail('该药品有未完成订单，无法删除');
    }

    await db.execute('DELETE FROM drug WHERE id = ?', [id]);
    res.success(null, '药品删除成功');
  } catch (err) {
    console.error('[Admin] 药品删除失败:', err);
    res.error('药品删除失败');
  }
});

router.post('/drug/category/add', async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.fail('请输入分类名');
    }

    const [existing] = await db.execute('SELECT id FROM drug_category WHERE name = ?', [name]);
    if (existing.length > 0) {
      return res.fail('分类已存在');
    }

    await db.execute('INSERT INTO drug_category (name) VALUES (?)', [name]);
    res.success(null, '分类添加成功');
  } catch (err) {
    console.error('[Admin] 分类添加失败:', err);
    res.error('分类添加失败');
  }
});

router.put('/drug/category/update', async (req, res) => {
  try {
    const { id, name } = req.body;

    if (!id || !name) {
      return res.fail('请填写完整信息');
    }

    await db.execute('UPDATE drug_category SET name = ? WHERE id = ?', [name, id]);
    res.success(null, '分类更新成功');
  } catch (err) {
    console.error('[Admin] 分类更新失败:', err);
    res.error('分类更新失败');
  }
});

router.delete('/drug/category/delete', async (req, res) => {
  try {
    const { id } = req.body;

    if (!id) {
      return res.fail('请提供分类ID');
    }

    const [drugs] = await db.execute('SELECT id FROM drug WHERE category_id = ? LIMIT 1', [id]);
    if (drugs.length > 0) {
      return res.fail('该分类下有药品，无法删除');
    }

    await db.execute('DELETE FROM drug_category WHERE id = ?', [id]);
    res.success(null, '分类删除成功');
  } catch (err) {
    console.error('[Admin] 分类删除失败:', err);
    res.error('分类删除失败');
  }
});

router.get('/orders', async (req, res) => {
  try {
    const { status } = req.query;

    let sql = `
      SELECT do.id, do.student_id, do.drug_id, do.quantity, do.total_price,
             do.receiver_name, do.receiver_phone, do.receiver_address,
             do.status, do.order_time, do.pay_time, do.delivery_estimate_time,
             d.name as drug_name,
             u.name as student_name, u.username as student_username
      FROM drug_order do
      LEFT JOIN drug d ON do.drug_id = d.id
      LEFT JOIN user u ON do.student_id = u.id
    `;
    const params = [];

    if (status !== undefined && status !== '') {
      sql += ' WHERE do.status = ?';
      params.push(status);
    }

    sql += ' ORDER BY do.order_time DESC';

    console.log('[Admin] 订单列表查询 SQL:', sql, '参数:', params);
    const [orders] = await db.execute(sql, params);

    const result = orders.map(order => ({
      ...order,
      statusText: getOrderStatus(order.status)
    }));

    res.success(result);
  } catch (err) {
    console.error('[Admin] 订单列表查询失败:', err);
    res.error('订单列表查询失败');
  }
});

router.put('/order/updateStatus', async (req, res) => {
  try {
    const { id, status } = req.body;

    if (!id || status === undefined) {
      return res.fail('请提供完整信息');
    }

    const [existing] = await db.execute('SELECT status FROM drug_order WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.fail('订单不存在');
    }

    const currentStatus = existing[0].status;

    if (status === 1) {
      await db.execute('UPDATE drug_order SET status = ?, pay_time = NOW() WHERE id = ?', [status, id]);
    } else if (status === 3 && currentStatus === 2) {
      await db.execute('UPDATE drug_order SET status = ? WHERE id = ?', [status, id]);
    } else {
      await db.execute('UPDATE drug_order SET status = ? WHERE id = ?', [status, id]);
    }

    res.success(null, '订单状态更新成功');
  } catch (err) {
    console.error('[Admin] 订单状态更新失败:', err);
    res.error('订单状态更新失败');
  }
});

router.get('/announcements', async (req, res) => {
  try {
    const [announcements] = await db.execute('SELECT id, title, content, create_time FROM announcement ORDER BY create_time DESC');
    res.success(announcements);
  } catch (err) {
    console.error('[Admin] 公告列表查询失败:', err);
    res.error('公告列表查询失败');
  }
});

router.post('/announcement/add', async (req, res) => {
  try {
    const { title, content } = req.body;

    if (!title || !content) {
      return res.fail('请填写完整信息');
    }

    await db.execute('INSERT INTO announcement (title, content) VALUES (?, ?)', [title, content]);
    res.success(null, '公告发布成功');
  } catch (err) {
    console.error('[Admin] 公告发布失败:', err);
    res.error('公告发布失败');
  }
});

router.put('/announcement/update', async (req, res) => {
  try {
    const { id, title, content } = req.body;

    if (!id || !title || !content) {
      return res.fail('请填写完整信息');
    }

    await db.execute('UPDATE announcement SET title = ?, content = ? WHERE id = ?', [title, content, id]);
    res.success(null, '公告更新成功');
  } catch (err) {
    console.error('[Admin] 公告更新失败:', err);
    res.error('公告更新失败');
  }
});

router.delete('/announcement/delete', async (req, res) => {
  try {
    const { id } = req.body;

    if (!id) {
      return res.fail('请提供公告ID');
    }

    await db.execute('DELETE FROM announcement WHERE id = ?', [id]);
    res.success(null, '公告删除成功');
  } catch (err) {
    console.error('[Admin] 公告删除失败:', err);
    res.error('公告删除失败');
  }
});

module.exports = router;