const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-role']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.use((req, res, next) => {
  res.success = (data = null, msg = '操作成功') => {
    res.json({ code: 200, msg, data });
  };
  
  res.error = (msg = '操作失败', code = 500) => {
    res.json({ code, msg, data: null });
  };
  
  res.fail = (msg = '请求失败', code = 400) => {
    res.json({ code, msg, data: null });
  };
  
  next();
});

const loginRouter = require('./routes/login');
const studentRouter = require('./routes/student');
const doctorRouter = require('./routes/doctor');
const adminRouter = require('./routes/admin');
const drugRouter = require('./routes/drug');
const announcementRouter = require('./routes/announcement');
const aiRouter = require('./routes/ai');

app.use('/api', aiRouter);
app.use('/api', loginRouter);
app.use('/api/student', studentRouter);
app.use('/api/doctor', doctorRouter);
app.use('/api/admin', adminRouter);
app.use('/api/drug', drugRouter);
app.use('/api/announcement', announcementRouter);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.error('服务器内部错误');
});

app.listen(PORT, () => {
  console.log(`🚀 后端服务启动成功！`);
  console.log(`👉 访问地址：http://localhost:${PORT}`);
});
