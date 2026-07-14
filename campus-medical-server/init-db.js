const fs = require('fs');
const mysql = require('mysql2/promise');

async function initDatabase() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '123456',
      charset: 'utf8mb4'
    });

    await connection.query('CREATE DATABASE IF NOT EXISTS campus_medical DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
    await connection.query('USE campus_medical');

    const sql = fs.readFileSync('database.sql', 'utf8');
    const statements = sql.split(';').filter(s => s.trim());

    for (const statement of statements) {
      if (statement.trim()) {
        await connection.query(statement);
      }
    }

    await connection.end();
    console.log('✅ 数据库初始化成功！');
  } catch (err) {
    console.error('❌ 数据库初始化失败:', err.message);
    process.exit(1);
  }
}

initDatabase();