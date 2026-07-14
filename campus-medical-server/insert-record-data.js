const mysql = require('mysql2/promise');

async function insertTestRecords() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '123456',
    database: 'campus_medical'
  });

  try {
    const [students] = await connection.execute('SELECT id FROM user WHERE role = 0 LIMIT 1');
    const [doctors] = await connection.execute('SELECT id FROM user WHERE role = 1 LIMIT 1');
    const [duties] = await connection.execute('SELECT id FROM doctor_duty LIMIT 1');

    if (students.length === 0 || doctors.length === 0 || duties.length === 0) {
      console.log('⚠️ 缺少必要的数据');
      await connection.end();
      return;
    }

    const studentId = students[0].id;
    const doctorId = doctors[0].id;
    const dutyId = duties[0].id;

    const [appointmentResult] = await connection.execute(
      'INSERT INTO appointment (student_id, duty_id, status) VALUES (?, ?, 1)',
      [studentId, dutyId]
    );
    const appointmentId = appointmentResult.insertId;

    await connection.execute(`
      INSERT INTO medical_record (student_id, doctor_id, appointment_id, subjective, present_illness, past_history, examination, diagnosis, treatment, record_time)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `, [
      studentId,
      doctorId,
      appointmentId,
      '头痛、发热2天',
      '患者于2天前无明显诱因出现头痛，伴发热，体温最高38.5℃，无咳嗽、咳痰，无恶心、呕吐。',
      '既往体健，无高血压、糖尿病病史，无手术史。',
      '体温38.2℃，脉搏88次/分，呼吸20次/分，血压120/80mmHg。神清，精神可。咽部充血，扁桃体Ⅰ度肿大。心肺听诊无异常。',
      '上呼吸道感染',
      '1. 复方氨酚烷胺胶囊 1粒/次，2次/日\n2. 多喝水，注意休息\n3. 体温超过38.5℃时口服布洛芬混悬液\n4. 3天后复诊'
    ]);

    console.log('✅ 测试病历数据插入成功！');

  } catch (err) {
    console.error('❌ 数据插入失败:', err.message);
  } finally {
    await connection.end();
  }
}

insertTestRecords();