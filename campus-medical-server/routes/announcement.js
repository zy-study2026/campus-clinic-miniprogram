const express = require('express');
const router = express.Router();
const db = require('../config/db');

router.get('/list', async (req, res) => {
  try {
    const [announcements] = await db.execute(
      'SELECT id, title, content, create_time FROM announcement ORDER BY create_time DESC'
    );

    const result = announcements.map(item => ({
      ...item,
      create_time: item.create_time ? new Date(item.create_time).toISOString().slice(0, 19).replace('T', ' ') : ''
    }));

    res.success(result);
  } catch (err) {
    console.error('获取公告列表失败:', err);
    res.error('获取公告列表失败');
  }
});

router.get('/detail', async (req, res) => {
  try {
    const { id } = req.query;

    if (!id) {
      return res.fail('请提供公告ID');
    }

    const [announcements] = await db.execute(
      'SELECT id, title, content, create_time FROM announcement WHERE id = ?',
      [id]
    );

    if (announcements.length === 0) {
      return res.fail('公告不存在');
    }

    const announcement = announcements[0];
    announcement.create_time = announcement.create_time
      ? new Date(announcement.create_time).toISOString().slice(0, 19).replace('T', ' ')
      : '';

    res.success(announcement);
  } catch (err) {
    console.error('获取公告详情失败:', err);
    res.error('获取公告详情失败');
  }
});

module.exports = router;