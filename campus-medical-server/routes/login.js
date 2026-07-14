const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../config/db');

const smsCodes = {};

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.fail('请输入账号和密码');
    }

    const [users] = await db.execute('SELECT * FROM user WHERE username = ?', [username]);
    
    if (users.length === 0) {
      return res.fail('账号或密码错误');
    }

    const user = users[0];
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      return res.fail('账号或密码错误');
    }

    const roleMap = { 0: 'student', 1: 'doctor', 2: 'admin' };
    res.success({
      id: user.id,
      username: user.username,
      role: roleMap[user.role],
      roleValue: user.role,
      name: user.name,
      phone: user.phone,
      is_phone_bound: user.is_phone_bound
    }, '登录成功');
    
  } catch (err) {
    console.error('登录失败:', err);
    res.error('登录失败，请重试');
  }
});

router.post('/sendSms', async (req, res) => {
  try {
    const { phone } = req.body;
    
    if (!phone) {
      return res.fail('请输入手机号');
    }

    const code = '123456';
    smsCodes[phone] = { code, expireTime: Date.now() + 5 * 60 * 1000 };
    
    res.success({ code }, '验证码已发送');
    
  } catch (err) {
    console.error('发送验证码失败:', err);
    res.error('发送验证码失败');
  }
});

router.post('/bindPhone', async (req, res) => {
  try {
    const { phone, code, username } = req.body;
    
    if (!phone || !code || !username) {
      return res.fail('请填写完整信息');
    }

    const storedCode = smsCodes[phone];
    if (!storedCode || storedCode.code !== code || Date.now() > storedCode.expireTime) {
      return res.fail('验证码错误或已过期');
    }

    const [phoneUsers] = await db.execute('SELECT * FROM user WHERE phone = ? AND phone IS NOT NULL', [phone]);
    if (phoneUsers.length > 0 && phoneUsers[0].username !== username) {
      return res.fail('该手机号已被其他账号绑定');
    }

    await db.execute('UPDATE user SET phone = ?, is_phone_bound = 1 WHERE username = ?', [phone, username]);
    
    delete smsCodes[phone];
    
    res.success(null, '手机号绑定成功');
    
  } catch (err) {
    console.error('绑定失败:', err);
    res.error('绑定失败，请重试');
  }
});

router.post('/forgetPassword', async (req, res) => {
  try {
    const { username, phone, code, newPassword } = req.body;
    
    if (!username || !phone || !code || !newPassword) {
      return res.fail('请填写完整信息');
    }

    const storedCode = smsCodes[phone];
    if (!storedCode || storedCode.code !== code || Date.now() > storedCode.expireTime) {
      return res.fail('验证码错误或已过期');
    }

    const [users] = await db.execute('SELECT * FROM user WHERE username = ?', [username]);
    
    if (users.length === 0) {
      return res.fail('账号不存在');
    }

    const user = users[0];
    if (!user.phone || user.phone !== phone) {
      return res.fail('手机号与账号不匹配');
    }

    if (user.is_phone_bound !== 1) {
      return res.fail('该账号未绑定手机号，请联系管理员');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await db.execute('UPDATE user SET password = ? WHERE username = ?', [hashedPassword, username]);
    
    delete smsCodes[phone];
    
    res.success(null, '密码重置成功');
    
  } catch (err) {
    console.error('重置密码失败:', err);
    res.error('重置密码失败');
  }
});

router.post('/changePassword', async (req, res) => {
  try {
    const { username, oldPassword, newPassword } = req.body;
    
    if (!username || !oldPassword || !newPassword) {
      return res.fail('请填写完整信息');
    }

    const [users] = await db.execute('SELECT * FROM user WHERE username = ?', [username]);
    
    if (users.length === 0) {
      return res.fail('账号不存在');
    }

    const user = users[0];
    const isPasswordValid = await bcrypt.compare(oldPassword, user.password);
    
    if (!isPasswordValid) {
      return res.fail('原密码错误');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await db.execute('UPDATE user SET password = ? WHERE username = ?', [hashedPassword, username]);
    
    res.success(null, '密码修改成功');
    
  } catch (err) {
    console.error('修改密码失败:', err);
    res.error('修改密码失败');
  }
});

router.post('/changePhone', async (req, res) => {
  try {
    const { username, oldPhone, oldPhoneCode, newPhone, newPhoneCode } = req.body;
    
    if (!username || !oldPhone || !oldPhoneCode || !newPhone || !newPhoneCode) {
      return res.fail('请填写完整信息');
    }

    const oldStoredCode = smsCodes[oldPhone];
    if (!oldStoredCode || oldStoredCode.code !== oldPhoneCode || Date.now() > oldStoredCode.expireTime) {
      return res.fail('旧手机号验证码错误或已过期');
    }

    const newStoredCode = smsCodes[newPhone];
    if (!newStoredCode || newStoredCode.code !== newPhoneCode || Date.now() > newStoredCode.expireTime) {
      return res.fail('新手机号验证码错误或已过期');
    }

    const [phoneUsers] = await db.execute('SELECT * FROM user WHERE phone = ? AND phone IS NOT NULL', [newPhone]);
    if (phoneUsers.length > 0 && phoneUsers[0].username !== username) {
      return res.fail('新手机号已被其他账号绑定');
    }

    await db.execute('UPDATE user SET phone = ? WHERE username = ?', [newPhone, username]);
    
    delete smsCodes[oldPhone];
    delete smsCodes[newPhone];
    
    res.success(null, '手机号修改成功');
    
  } catch (err) {
    console.error('修改手机号失败:', err);
    res.error('修改手机号失败');
  }
});

router.get('/user/info', async (req, res) => {
  try {
    const { username } = req.query;
    
    if (!username) {
      return res.fail('请提供用户名');
    }

    const [users] = await db.execute('SELECT name, username, phone, gender, birth_date FROM user WHERE username = ?', [username]);
    
    if (users.length === 0) {
      return res.fail('用户不存在');
    }

    res.success(users[0]);
    
  } catch (err) {
    console.error('获取用户信息失败:', err);
    res.error('获取用户信息失败');
  }
});

router.post('/logout', async (req, res) => {
  try {
    res.success(null, '退出成功');
  } catch (err) {
    console.error('退出失败:', err);
    res.error('退出失败');
  }
});

router.get('/departments', async (req, res) => {
  try {
    const [departments] = await db.execute('SELECT * FROM department');
    res.success(departments);
  } catch (err) {
    console.error('科室查询失败:', err);
    res.error('科室查询失败');
  }
});

module.exports = router;
