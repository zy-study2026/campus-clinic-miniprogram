# 校园医务室微信小程序

基于 UniApp + Node.js + MySQL 的校园医务室服务平台，涵盖学生预约挂号、电子病历、药品商城、AI导诊等核心功能。

## 项目简介

本系统针对高校医务室传统线下模式（排队久、病历乱、药品购买不便）设计，实现了：

- 学生端：在线预约挂号、电子病历查询、药品购买、订单管理、AI导诊
- 医生端：预约审核、病历填写
- 管理员端：用户管理、排班管理、药品管理、订单管理、公告管理

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | UniApp + Vue3 |
| 后端 | Node.js + Express |
| 数据库 | MySQL 8.0 |
| AI | 讯飞星火大模型 |

## 项目结构

```
campus-clinic-miniprogram/
├── campus-medical-client/     # 前端（UniApp + Vue3）
│   ├── src/
│   │   ├── pages/             # 页面
│   │   ├── utils/             # 工具（request封装等）
│   │   └── static/            # 静态资源
│   └── package.json
│
└── campus-medical-server/     # 后端（Node.js + Express）
    ├── routes/                # API路由
    ├── config/                # 配置文件
    ├── app.js                 # 入口文件
    └── package.json
```

## 本地运行

### 环境要求

- Node.js 16+
- MySQL 8.0
- 微信开发者工具（前端预览）

### 后端启动

```bash
cd campus-medical-server
npm install
# 配置 MySQL（修改 config/db.js 中的账号密码）
node app.js
```

后端默认运行在 `http://localhost:3000`

### 前端启动

```bash
cd campus-medical-client
npm install
# 用 HBuilderX 或微信开发者工具打开
# 修改 utils/request.js 中的 baseURL 为本机 IP（真机调试时需要）
```

## 核心功能

### 学生端
- 登录认证（首次登录绑定手机号）
- 预约挂号（实时号源、取消预约自动退号）
- 电子病历查询
- 药品商城（浏览、搜索、下单、模拟支付）
- 订单管理
- AI导诊（症状问答推荐科室/药品）

### 医生端
- 预约审核
- 病历填写（主诉、现病史、诊断、治疗建议）
- 病历查看

### 管理员端
- 学生/医生管理（增删改查、重置密码）
- 排班管理
- 药品管理
- 订单管理（状态更新）
- 公告管理

## 作品集说明

本仓库还包含以下测试相关文档：

- `test-cases-and-defects.xlsx`：功能测试用例（覆盖学生/医生/管理员三大角色）
- `test-cases-and-defects.md`：缺陷报告（记录开发过程中发现并修复的 Bug）

## License

仅供学习交流使用
