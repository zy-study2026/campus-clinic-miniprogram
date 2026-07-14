# 校园医务室小程序 - 测试用例与缺陷报告

## 一、测试用例

### 模块1：学生端预约挂号

#### TC-APP-001：正常预约挂号
**前置条件**：学生已登录，医生有可用号源
**测试步骤**：
1. 选择科室 → 选择医生 → 选择日期 → 选择可用时段
2. 填写症状（可选）
3. 点击"确认预约"
4. 在支付确认弹窗中点击"确认支付"
**预期结果**：
- 预约成功，返回 code=200，msg="预约成功"
- doctor_duty.booked_appointments +1
- appointment 表新增记录，status=0，fee=10.00
- 控制台打印 `[模拟支付] 用户 xxx 支付 10 元`

#### TC-APP-002：重复预约同一时段
**前置条件**：学生已预约某时段
**测试步骤**：尝试再次预约同一时段
**预期结果**：返回 code=400，msg="您已预约该时段"

#### TC-APP-003：号源已满
**前置条件**：某时段 booked_appointments >= max_appointments
**测试步骤**：尝试预约该时段
**预期结果**：返回 code=400，msg="该时段已约满"

#### TC-APP-004：预约时段不存在
**测试步骤**：使用无效的 dutyId 提交预约
**预期结果**：返回 code=400，msg="预约时段不存在"

#### TC-APP-005：学生账号不存在
**测试步骤**：使用不存在的 studentId 提交预约
**预期结果**：返回 code=400，msg="学生账号不存在"

---

### 模块2：学生端取消预约

#### TC-CAN-001：正常取消未就诊预约
**前置条件**：存在 status=0 的预约记录
**测试步骤**：点击"取消预约" → 确认退款
**预期结果**：
- 取消成功，返回 code=200，msg="取消成功"
- appointment.status 更新为 2
- doctor_duty.booked_appointments -1
- 控制台打印 `[模拟退款] 用户 xxx 退款 10 元`

#### TC-CAN-002：取消已就诊预约
**前置条件**：存在 status=1 的预约记录
**测试步骤**：尝试取消该预约
**预期结果**：返回 code=400，msg="只能取消未就诊的预约"

#### TC-CAN-003：取消不存在的预约
**测试步骤**：使用无效的 appointmentId 取消
**预期结果**：返回 code=400，msg="预约不存在"

---

### 模块3：学生端预约列表

#### TC-LST-001：查询个人预约列表
**前置条件**：学生有预约记录
**测试步骤**：访问"我的预约"页面
**预期结果**：
- 返回 code=200，data 包含预约记录列表
- 每条记录包含：id, symptom, status, fee, create_time, date, time_slot, department_name, doctor_name
- 按 create_time DESC 排序

#### TC-LST-002：查询无预约记录
**前置条件**：学生无任何预约记录
**测试步骤**：访问"我的预约"页面
**预期结果**：返回 code=200，data=[]

---

### 模块4：医生端预约管理

#### TC-DOC-APP-001：查询医生预约列表
**前置条件**：医生有预约记录
**测试步骤**：访问医生端预约页面
**预期结果**：
- 返回 code=200，data 包含医生的预约记录
- 默认只返回 status=0 的预约
- 每条记录包含 fee 字段

#### TC-DOC-APP-002：筛选特定日期预约
**测试步骤**：选择日期后点击"筛选"
**预期结果**：只返回指定日期的预约记录

#### TC-DOC-APP-003：筛选不同状态预约
**测试步骤**：切换状态标签（待就诊/已就诊/已取消）
**预期结果**：返回对应状态的预约记录

---

### 模块5：病历管理

#### TC-REC-001：正常保存病历
**前置条件**：存在 status=0 的预约，医生有权限
**测试步骤**：填写完整病历信息并提交
**预期结果**：
- 病历保存成功，返回 code=200
- medical_record 表新增记录
- appointment.status 更新为 1（已就诊）

#### TC-REC-002：保存病历缺少必填字段
**测试步骤**：缺少 subjective/present_illness/examination/diagnosis/treatment 中任一字段
**预期结果**：返回 code=400，msg="请填写完整信息"

#### TC-REC-003：保存病历权限验证
**测试步骤**：医生尝试保存其他医生的预约病历
**预期结果**：返回 code=400，msg="无权操作此预约"

#### TC-REC-004：重复保存病历
**前置条件**：某预约已存在病历记录
**测试步骤**：再次尝试保存病历
**预期结果**：返回 code=400，msg="该预约已存在病历记录"

---

### 模块6：AI导诊

#### TC-AI-001：正常咨询
**测试步骤**：输入症状描述如"头痛发烧"
**预期结果**：
- 返回 code=200，data.reply 包含：
  1. 推荐科室（从数据库实际科室中选择）
  2. 推荐药品（从数据库实际药品中选择）
  3. 护理建议
  4. 免责声明

#### TC-AI-002：空输入
**测试步骤**：提交空消息
**预期结果**：返回 code=400，msg="请输入症状描述"

#### TC-AI-003：网络超时
**测试步骤**：模拟网络超时场景
**预期结果**：返回 code=500，msg="AI服务连接超时"

---

### 模块7：管理员端

#### TC-ADM-APP-001：查询所有预约列表
**测试步骤**：访问管理员端预约管理页面
**预期结果**：
- 返回所有状态的预约记录
- 每条记录包含 fee 字段

---

## 二、缺陷报告

### DEF-000：病历保存时插入不存在的 department_id 字段（已修复）

**问题描述**：
在 `routes/doctor.js` 第 156-161 行，保存病历时尝试将 `department_id` 字段插入到 `medical_record` 表中，但该表实际不存在此字段，导致保存失败。

**错误信息**：
```
Unknown column 'department_id' in 'field list'
```

**代码位置**：
[routes/doctor.js:156](file:///d:/campus-medical-server/routes/doctor.js#L156)

**修复方案**：
从 INSERT 语句中移除 `department_id` 字段及其对应值。

**修复状态**：✅ **已修复**（2026-05-26）

---

### DEF-001：医生端预约列表默认只看待就诊，无法查看已就诊记录（原 DEF-001）

**问题描述**：
在 `routes/doctor.js` 第 36 行，当未传 status 参数时，默认强制添加 `AND a.status = 0` 条件，导致医生无法查看已就诊的预约记录。

**影响范围**：
- 医生端预约列表页面，"已就诊"标签筛选功能失效
- 医生无法查看自己已处理过的预约记录

**代码位置**：
[routes/doctor.js:36](file:///d:/campus-medical-server/routes/doctor.js#L36)

```javascript
} else {
  sql += ' AND a.status = 0';  // 问题：默认只看待就诊
}
```

**修复建议**：
当 status 参数为空时，不添加任何状态过滤条件，允许查看所有状态的预约记录。

---

### DEF-002：取消预约时退款函数传入的 userId 不正确（原 DEF-002）

**问题描述**：
在 `routes/student.js` 第 221 行，取消预约时调用 `simulateRefund` 函数，传入的 userId 参数使用的是 `appointmentId`（预约ID），而不是实际的学生用户ID。

**影响范围**：
- 模拟退款日志中显示的用户ID不正确，不利于排查问题
- 如果后续将模拟支付改为真实支付，会导致支付记录关联错误

**代码位置**：
[routes/student.js:221](file:///d:/campus-medical-server/routes/student.js#L221)

```javascript
const refundSuccess = await simulateRefund(appointment[0].fee, appointmentId);
// 问题：第二个参数应传入学生ID，而非预约ID
```

**修复建议**：
在查询预约时同时获取 student_id，并将学生ID传入 refund 函数：

```javascript
const [appointment] = await connection.execute(
  'SELECT duty_id, status, fee, student_id FROM appointment WHERE id = ? FOR UPDATE',
  [appointmentId]
);
// ...
const refundSuccess = await simulateRefund(appointment[0].fee, appointment[0].student_id);
```

**修复状态**：✅ **已修复**（2026-07-02）

---

### DEF-003：病历保存成功后缺少异常预约状态处理（原 DEF-003）

**问题描述**：
在 `routes/doctor.js` 第 163-167 行，病历保存成功后只处理了 status=0 的情况，将其更新为 status=1。但没有处理其他状态（如已取消 status=2）的异常情况。

**影响范围**：
- 如果预约已被学生取消（status=2），医生仍可保存病历并将状态改为已就诊，业务逻辑不一致

**代码位置**：
[routes/doctor.js:163-167](file:///d:/campus-medical-server/routes/doctor.js#L163)

```javascript
if (appointment.status === 0) {
  await connection.execute(
    'UPDATE appointment SET status = 1 WHERE id = ?',
    [appointmentId]
  );
}
```

**修复建议**：
在保存病历前检查预约状态，如果不是待就诊状态，给出提示或阻止保存。

---

### DEF-004：预约列表接口缺少状态文本映射（原 DEF-004）

**问题描述**：
学生端 `GET /api/student/appointments` 返回的预约记录中没有状态文本（statusText），只有数值状态码。前端需要自行处理状态映射。

**影响范围**：
- 前端需要维护状态映射逻辑，增加前后端不一致风险
- 如果状态枚举变更，前端需要同步修改

**代码位置**：
[routes/student.js:168-185](file:///d:/campus-medical-server/routes/student.js#L168)

**修复建议**：
参考医生端的实现，在返回数据时添加 statusText 字段。

---

### DEF-005：医生端更新预约状态接口参数传递方式不一致（原 DEF-005）

**问题描述**：
`PUT /api/doctor/updateAppointmentStatus` 接口中，appointmentId 和 status 通过 body 传递，而 doctorId 通过 query 传递。参数传递方式不统一，增加前端调用复杂度。

**代码位置**：
[routes/doctor.js:55-58](file:///d:/campus-medical-server/routes/doctor.js#L55)

```javascript
const { appointmentId, status } = req.body;
const { doctorId } = req.query;
```

**修复建议**：
统一参数传递方式，将所有参数放在 body 中。

---

## 三、状态枚举定义（数据库为唯一真源）

| 值 | 语义 | 说明 |
|---|---|---|
| 0 | 待就诊 | 预约成功，等待就诊 |
| 1 | 已就诊 | 医生已填写病历 |
| 2 | 已取消 | 学生取消预约或退款成功 |

---

## 四、测试优先级

| 优先级 | 测试用例 | 缺陷 |
|--------|----------|------|
| **P0** | TC-APP-001, TC-APP-002, TC-APP-003 | DEF-002（已修复）, DEF-003 |
| **P1** | TC-CAN-001, TC-CAN-002, TC-REC-001, TC-REC-004 | DEF-001, DEF-004 |
| **P2** | 其他所有测试用例 | DEF-005 |