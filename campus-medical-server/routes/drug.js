const express = require('express');
const router = express.Router();
const db = require('../config/db');

router.get('/categories', async (req, res) => {
  try {
    const [categories] = await db.execute('SELECT * FROM drug_category');
    res.success(categories);
  } catch (err) {
    console.error('获取药品分类失败:', err);
    res.error('获取药品分类失败');
  }
});

router.get('/list', async (req, res) => {
  try {
    const { categoryId, keyword } = req.query;
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const offset = (page - 1) * pageSize;
    
    let sql = `
      SELECT d.id, d.name, c.name as category_name, d.price, d.stock, d.indication
      FROM drug d
      JOIN drug_category c ON d.category_id = c.id
      WHERE 1=1
    `;
    const params = [];

    if (categoryId && categoryId !== '0') {
      sql += ' AND d.category_id = ?';
      params.push(parseInt(categoryId));
    }

    if (keyword) {
      sql += ' AND d.name LIKE ?';
      params.push(`%${keyword}%`);
    }

    sql += ` ORDER BY d.id DESC LIMIT ${offset}, ${pageSize}`;

    const [drugs] = await db.execute(sql, params);

    let countSql = 'SELECT COUNT(*) as total FROM drug d JOIN drug_category c ON d.category_id = c.id WHERE 1=1';
    const countParams = [];
    
    if (categoryId && categoryId !== '0') {
      countSql += ' AND d.category_id = ?';
      countParams.push(parseInt(categoryId));
    }

    if (keyword) {
      countSql += ' AND d.name LIKE ?';
      countParams.push(`%${keyword}%`);
    }

    const [countResult] = await db.execute(countSql, countParams);

    res.success({
      list: drugs,
      total: countResult[0].total,
      page: page,
      pageSize: pageSize
    });
  } catch (err) {
    console.error('获取药品列表失败:', err);
    res.error('获取药品列表失败');
  }
});

router.get('/detail/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const [drugs] = await db.execute(`
      SELECT d.*, c.name as category_name
      FROM drug d
      JOIN drug_category c ON d.category_id = c.id
      WHERE d.id = ?
    `, [id]);

    if (drugs.length === 0) {
      return res.fail('药品不存在');
    }

    res.success(drugs[0]);
  } catch (err) {
    console.error('获取药品详情失败:', err);
    res.error('获取药品详情失败');
  }
});

router.post('/order/create', async (req, res) => {
  try {
    const { drugId, quantity, receiverName, receiverPhone, receiverAddress, studentId } = req.body;

    if (!drugId || !quantity || !receiverName || !receiverPhone || !receiverAddress || !studentId) {
      return res.fail('请填写完整信息');
    }

    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
      const [drugs] = await connection.execute(
        'SELECT * FROM drug WHERE id = ? FOR UPDATE',
        [drugId]
      );

      if (drugs.length === 0) {
        await connection.rollback();
        return res.fail('药品不存在');
      }

      const drug = drugs[0];
      if (drug.stock < quantity) {
        await connection.rollback();
        return res.fail('库存不足');
      }

      const [studentRows] = await connection.execute(
        'SELECT id FROM user WHERE username = ? AND role = 0',
        [studentId]
      );

      if (studentRows.length === 0) {
        await connection.rollback();
        return res.fail('学生不存在');
      }

      const studentIdNum = studentRows[0].id;
      const totalPrice = (drug.price * quantity).toFixed(2);

      const [result] = await connection.execute(
        'INSERT INTO drug_order (student_id, drug_id, quantity, total_price, receiver_name, receiver_phone, receiver_address, status) VALUES (?, ?, ?, ?, ?, ?, ?, 0)',
        [studentIdNum, drugId, quantity, totalPrice, receiverName, receiverPhone, receiverAddress]
      );

      await connection.commit();
      res.success({ orderId: result.insertId });
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  } catch (err) {
    console.error('创建订单失败:', err);
    res.error('创建订单失败');
  }
});

router.post('/order/simulatePay/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;

    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
      const [orders] = await connection.execute(
        'SELECT * FROM drug_order WHERE id = ? FOR UPDATE',
        [orderId]
      );

      if (orders.length === 0) {
        await connection.rollback();
        return res.fail('订单不存在');
      }

      const order = orders[0];
      if (order.status !== 0) {
        await connection.rollback();
        return res.fail('订单状态不允许支付');
      }

      const [drugs] = await connection.execute(
        'SELECT * FROM drug WHERE id = ? FOR UPDATE',
        [order.drug_id]
      );

      if (drugs.length === 0) {
        await connection.rollback();
        return res.fail('药品不存在');
      }

      const drug = drugs[0];
      if (drug.stock < order.quantity) {
        await connection.rollback();
        return res.fail('库存不足');
      }

      await connection.execute(
        'UPDATE drug SET stock = stock - ? WHERE id = ?',
        [order.quantity, order.drug_id]
      );

      const deliveryEstimateTime = new Date();
      deliveryEstimateTime.setDate(deliveryEstimateTime.getDate() + 2);

      await connection.execute(
        'UPDATE drug_order SET status = 1, pay_time = NOW(), delivery_estimate_time = ? WHERE id = ?',
        [deliveryEstimateTime, orderId]
      );

      await connection.commit();
      res.success('支付成功');
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  } catch (err) {
    console.error('模拟支付失败:', err);
    res.error('支付失败');
  }
});

router.get('/student/orders', async (req, res) => {
  try {
    const { studentId, status } = req.query;

    if (!studentId) {
      return res.fail('请提供学生账号');
    }

    const [studentRows] = await db.execute(
      'SELECT id FROM user WHERE username = ? AND role = 0',
      [studentId]
    );

    if (studentRows.length === 0) {
      return res.fail('学生不存在');
    }

    const studentIdNum = studentRows[0].id;

    let query = `
      SELECT 
        o.id, o.status, o.quantity, o.total_price, o.order_time, o.pay_time, o.delivery_estimate_time,
        d.name as drug_name, d.price as drug_price
      FROM drug_order o
      JOIN drug d ON o.drug_id = d.id
      WHERE o.student_id = ?
    `;
    const params = [studentIdNum];

    if (status !== undefined && status !== '' && status !== 'all') {
      query += ' AND o.status = ?';
      params.push(parseInt(status));
    }

    query += ' ORDER BY o.order_time DESC';

    const [orders] = await db.execute(query, params);

    const result = orders.map(order => ({
      ...order,
      statusText: getStatusText(order.status)
    }));

    res.success(result);
  } catch (err) {
    console.error('获取订单列表失败:', err);
    res.error('获取订单列表失败');
  }
});

router.get('/order/detail/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;

    const [orders] = await db.execute(`
      SELECT 
        o.*,
        d.name as drug_name, d.price as drug_price,
        u.name as student_name
      FROM drug_order o
      JOIN drug d ON o.drug_id = d.id
      JOIN user u ON o.student_id = u.id
      WHERE o.id = ?
    `, [orderId]);

    if (orders.length === 0) {
      return res.fail('订单不存在');
    }

    const order = orders[0];
    res.success({
      ...order,
      statusText: getStatusText(order.status),
      clinicPhone: '0731-12345678'
    });
  } catch (err) {
    console.error('获取订单详情失败:', err);
    res.error('获取订单详情失败');
  }
});

router.post('/order/cancel', async (req, res) => {
  try {
    const { orderId } = req.body;

    if (!orderId) {
      return res.fail('请提供订单ID');
    }

    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
      const [orders] = await connection.execute(
        'SELECT * FROM drug_order WHERE id = ? FOR UPDATE',
        [orderId]
      );

      if (orders.length === 0) {
        await connection.rollback();
        return res.fail('订单不存在');
      }

      const order = orders[0];
      if (order.status !== 0) {
        await connection.rollback();
        return res.fail('订单状态不允许取消');
      }

      await connection.execute(
        'UPDATE drug_order SET status = 4 WHERE id = ?',
        [orderId]
      );

      await connection.commit();
      res.success('取消成功');
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  } catch (err) {
    console.error('取消订单失败:', err);
    res.error('取消订单失败');
  }
});

function getStatusText(status) {
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