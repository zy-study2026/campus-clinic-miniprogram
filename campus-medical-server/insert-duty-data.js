const mysql = require('mysql2/promise');

async function insertTestData() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '123456',
    database: 'campus_medical'
  });

  try {
    // 插入医生排班数据（未来7天）
    const today = new Date();
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date.toISOString().split('T')[0]);
    }

    // 每个医生在每个科室的排班
    const duties = [
      // 内科 (dept_id=1) - 医生4 (李医生)
      { doctor_id: 4, department_id: 1 },
      // 外科 (dept_id=2) - 医生4 (李医生)
      { doctor_id: 4, department_id: 2 },
      // 口腔科 (dept_id=3) - 医生4 (李医生)
      { doctor_id: 4, department_id: 3 },
      // 皮肤科 (dept_id=4) - 医生4 (李医生)
      { doctor_id: 4, department_id: 4 }
    ];

    const timeSlots = ['上午 08:00-12:00', '下午 14:00-18:00'];

    for (const duty of duties) {
      for (const date of dates) {
        for (const timeSlot of timeSlots) {
          await connection.execute(
            'INSERT INTO doctor_duty (doctor_id, department_id, date, time_slot, max_appointments, booked_appointments) VALUES (?, ?, ?, ?, 10, 0)',
            [duty.doctor_id, duty.department_id, date, timeSlot]
          );
        }
      }
    }

    console.log('✅ 测试数据插入成功！');
    console.log(`插入 ${dates.length} 天 x ${duties.length} 个科室 x ${timeSlots.length} 个时段 = ${dates.length * duties.length * timeSlots.length} 条排班记录`);

  } catch (err) {
    console.error('❌ 数据插入失败:', err.message);
  } finally {
    await connection.end();
  }
}

insertTestData();