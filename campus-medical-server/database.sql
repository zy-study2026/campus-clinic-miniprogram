-- 创建数据库
CREATE DATABASE IF NOT EXISTS campus_medical DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE campus_medical;

-- 1. user 表
CREATE TABLE IF NOT EXISTS `user` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `username` VARCHAR(50) NOT NULL UNIQUE COMMENT '学号/工号',
  `password` VARCHAR(255) NOT NULL COMMENT '加密密码',
  `name` VARCHAR(50) NOT NULL COMMENT '姓名',
  `phone` VARCHAR(20) DEFAULT NULL COMMENT '手机号',
  `role` TINYINT NOT NULL DEFAULT 0 COMMENT '角色 0学生 1医生 2管理员',
  `is_phone_bound` TINYINT NOT NULL DEFAULT 0 COMMENT '是否绑定手机号 0未绑定 1已绑定',
  `gender` TINYINT DEFAULT NULL COMMENT '性别 0男 1女',
  `birth_date` DATE DEFAULT NULL COMMENT '出生日期',
  `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  INDEX `idx_username` (`username`),
  INDEX `idx_role` (`role`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';

-- 2. department 表
CREATE TABLE IF NOT EXISTS `department` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(50) NOT NULL UNIQUE COMMENT '科室名称',
  `description` VARCHAR(200) DEFAULT NULL COMMENT '科室描述'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='科室表';

-- 3. doctor_duty 表
CREATE TABLE IF NOT EXISTS `doctor_duty` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `doctor_id` INT NOT NULL COMMENT '医生ID',
  `department_id` INT NOT NULL COMMENT '科室ID',
  `date` DATE NOT NULL COMMENT '值班日期',
  `time_slot` VARCHAR(50) NOT NULL COMMENT '时间段',
  `max_appointments` INT NOT NULL DEFAULT 10 COMMENT '最大号源',
  `booked_appointments` INT NOT NULL DEFAULT 0 COMMENT '已预约数',
  INDEX `idx_doctor_id` (`doctor_id`),
  INDEX `idx_department_id` (`department_id`),
  INDEX `idx_date` (`date`),
  CONSTRAINT `fk_doctor_duty_doctor` FOREIGN KEY (`doctor_id`) REFERENCES `user`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_doctor_duty_department` FOREIGN KEY (`department_id`) REFERENCES `department`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='医生值班表';

-- 4. appointment 表
CREATE TABLE IF NOT EXISTS `appointment` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `student_id` INT NOT NULL COMMENT '学生ID',
  `duty_id` INT NOT NULL COMMENT '值班ID',
  `symptom` VARCHAR(200) DEFAULT NULL COMMENT '症状描述',
  `status` TINYINT NOT NULL DEFAULT 0 COMMENT '状态 0已预约 1已就诊 2已取消',
  `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '预约时间',
  INDEX `idx_student_id` (`student_id`),
  INDEX `idx_duty_id` (`duty_id`),
  INDEX `idx_status` (`status`),
  CONSTRAINT `fk_appointment_student` FOREIGN KEY (`student_id`) REFERENCES `user`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_appointment_duty` FOREIGN KEY (`duty_id`) REFERENCES `doctor_duty`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='预约表';

-- 5. medical_record 表
CREATE TABLE IF NOT EXISTS `medical_record` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `appointment_id` INT NOT NULL COMMENT '预约ID',
  `student_id` INT NOT NULL COMMENT '学生ID',
  `doctor_id` INT NOT NULL COMMENT '医生ID',
  `subjective` VARCHAR(500) DEFAULT NULL COMMENT '主诉',
  `present_illness` VARCHAR(1000) DEFAULT NULL COMMENT '现病史',
  `past_history` VARCHAR(1000) DEFAULT NULL COMMENT '既往史',
  `examination` VARCHAR(1000) DEFAULT NULL COMMENT '检查',
  `diagnosis` VARCHAR(500) DEFAULT NULL COMMENT '诊断',
  `treatment` VARCHAR(1000) DEFAULT NULL COMMENT '处理',
  `record_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '记录时间',
  INDEX `idx_appointment_id` (`appointment_id`),
  INDEX `idx_student_id` (`student_id`),
  INDEX `idx_doctor_id` (`doctor_id`),
  CONSTRAINT `fk_medical_record_appointment` FOREIGN KEY (`appointment_id`) REFERENCES `appointment`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_medical_record_student` FOREIGN KEY (`student_id`) REFERENCES `user`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_medical_record_doctor` FOREIGN KEY (`doctor_id`) REFERENCES `user`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='病历表';

-- 6. drug_category 表
CREATE TABLE IF NOT EXISTS `drug_category` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(50) NOT NULL UNIQUE COMMENT '药品分类名称'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='药品分类表';

-- 7. drug 表
CREATE TABLE IF NOT EXISTS `drug` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL COMMENT '药品名称',
  `category_id` INT NOT NULL COMMENT '分类ID',
  `stock` INT NOT NULL DEFAULT 0 COMMENT '库存',
  `price` DECIMAL(10,2) NOT NULL DEFAULT 0.00 COMMENT '价格',
  `indication` VARCHAR(500) DEFAULT NULL COMMENT '功能主治',
  `usage` VARCHAR(500) DEFAULT NULL COMMENT '用法用量',
  `image_url` VARCHAR(500) DEFAULT NULL COMMENT '图片地址',
  INDEX `idx_category_id` (`category_id`),
  INDEX `idx_name` (`name`),
  CONSTRAINT `fk_drug_category` FOREIGN KEY (`category_id`) REFERENCES `drug_category`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='药品表';

-- 8. drug_order 表
CREATE TABLE IF NOT EXISTS `drug_order` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `student_id` INT NOT NULL COMMENT '学生ID',
  `drug_id` INT NOT NULL COMMENT '药品ID',
  `quantity` INT NOT NULL DEFAULT 1 COMMENT '数量',
  `total_price` DECIMAL(10,2) NOT NULL DEFAULT 0.00 COMMENT '总价',
  `receiver_name` VARCHAR(50) NOT NULL COMMENT '收货人姓名',
  `receiver_phone` VARCHAR(20) NOT NULL COMMENT '收货人电话',
  `receiver_address` VARCHAR(500) NOT NULL COMMENT '收货地址',
  `status` TINYINT NOT NULL DEFAULT 0 COMMENT '状态 0待支付 1已支付 2配送中 3已完成 4已取消',
  `order_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '下单时间',
  `pay_time` DATETIME DEFAULT NULL COMMENT '支付时间',
  `delivery_estimate_time` DATETIME DEFAULT NULL COMMENT '预计送达时间',
  INDEX `idx_student_id` (`student_id`),
  INDEX `idx_drug_id` (`drug_id`),
  INDEX `idx_status` (`status`),
  CONSTRAINT `fk_drug_order_student` FOREIGN KEY (`student_id`) REFERENCES `user`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_drug_order_drug` FOREIGN KEY (`drug_id`) REFERENCES `drug`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='药品订单表';

-- 9. announcement 表
CREATE TABLE IF NOT EXISTS `announcement` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(100) NOT NULL COMMENT '标题',
  `content` TEXT NOT NULL COMMENT '内容',
  `publish_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '发布时间',
  INDEX `idx_publish_time` (`publish_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='公告表';

-- 插入示例数据

-- 插入科室数据
INSERT INTO `department` (`name`, `description`) VALUES
('内科', '主要处理感冒、发烧、咳嗽等常见内科疾病'),
('外科', '主要处理外伤、皮肤感染等外科疾病'),
('口腔科', '主要处理口腔疾病和牙齿问题'),
('皮肤科', '主要处理皮肤相关疾病');

-- 插入药品分类数据
INSERT INTO `drug_category` (`name`) VALUES
('感冒发烧类'),
('肠胃消化类'),
('皮肤外用类'),
('口腔咽喉类'),
('抗过敏类');

-- 插入管理员账号 (密码: 123456)
INSERT INTO `user` (`username`, `password`, `name`, `phone`, `role`, `is_phone_bound`, `gender`, `birth_date`) VALUES
('ADMIN001', '$2b$10$kMOrQMDj7OxdPIOV2yGUZOqvmNAFOn5Jn8CYTc.4YL0RCRF4yyQBC', '系统管理员', '13800138000', 2, 1, 1, '1980-01-01');

-- 插入示例学生 (密码: 123456)
INSERT INTO `user` (`username`, `password`, `name`, `phone`, `role`, `is_phone_bound`, `gender`, `birth_date`) VALUES
('2024001', '$2b$10$leaIaRswAXF1C7Fr28TVheyqaJcaJEellzV6NXJT20rPrMBDRLY/i', '张三', NULL, 0, 0, 0, '2006-05-15');

-- 插入示例医生 (密码: 123456)
INSERT INTO `user` (`username`, `password`, `name`, `phone`, `role`, `is_phone_bound`, `gender`, `birth_date`) VALUES
('DOC001', '$2b$10$I.adEscOmaLLK8YLC988LOXguTO.Yn3kq3qLuHvUIBQRVTmmksdNO', '李医生', '13900139000', 1, 0, 1, '1975-03-20');

-- 插入示例药品数据
INSERT INTO `drug` (`name`, `category_id`, `stock`, `price`, `indication`, `usage`) VALUES
('感冒灵颗粒', 1, 100, 15.00, '解热镇痛。用于感冒引起的头痛，发热，鼻塞，流涕，咽痛', '开水冲服，一次10克，一日3次'),
('布洛芬缓释胶囊', 1, 80, 25.00, '用于缓解轻至中度疼痛如头痛、关节痛、偏头痛等，也用于普通感冒或流行性感冒引起的发热', '口服。成人，一次1粒，一日2次（早晚各一次）'),
('健胃消食片', 2, 120, 12.00, '健胃消食。用于脾胃虚弱所致的食积，症见不思饮食、嗳腐酸臭、脘腹胀满；消化不良见上述证候者', '口服，可以咀嚼。一次3片，一日3次'),
('蒙脱石散', 2, 60, 18.00, '用于成人及儿童急、慢性腹泻', '口服，成人一次1袋，一日3次；儿童用量遵医嘱'),
('皮炎平软膏', 3, 50, 20.00, '用于过敏性皮炎、脂溢性皮炎、神经性皮炎、接触性皮炎、湿疹等', '外用，涂于患处，每日2-3次'),
('口腔溃疡散', 4, 40, 8.00, '清热，消肿，止痛。用于火热内蕴所致的口舌生疮、黏膜破溃、红肿疼痛', '外用，涂擦患处，一日2-3次'),
('西瓜霜喷剂', 4, 60, 16.00, '清热解毒，消肿止痛。用于风热上攻、肺胃热盛所致的乳蛾、喉痹、口糜', '外用，喷、吹或敷于患处，一次适量，一日数次'),
('氯雷他定片', 5, 70, 30.00, '用于缓解过敏性鼻炎有关的症状，如喷嚏、流涕、鼻痒、鼻塞以及眼部痒及烧灼感', '口服。成人及12岁以上儿童，一日1次，一次1片');

-- 插入示例公告
INSERT INTO `announcement` (`title`, `content`) VALUES
('医务室开放时间调整通知', '各位同学：医务室开放时间从下周一起调整为周一至周五8:00-18:00，周六周日9:00-16:00。请同学们合理安排就诊时间。'),
('流感预防小贴士', '近期流感高发，请同学们注意保暖，勤洗手，保持室内通风。如有发烧、咳嗽等症状，请及时就医。');