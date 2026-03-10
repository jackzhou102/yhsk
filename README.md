# YHSK 授权工具系统

一个完整的软件授权管理系统，支持在线授权和离线授权两种模式。

## 功能特点

### 🔐 双模式授权

| 模式 | 说明 | 适用场景 |
|------|------|----------|
| **在线授权** | 实时连接服务端验证，支持远程管理和即时撤销 | 有网络环境 |
| **离线授权** | 导入授权文件本地验证，无需网络连接 | 内网、离线环境 |

### 📋 授权类型

| 类型 | 设备数 | 功能特性 | 适用场景 |
|------|--------|----------|----------|
| **试用版** | 1台 | 基础功能 | 产品试用、评估 |
| **专业版** | 3台 | 基础 + 高级 + 导出 | 个人用户、小团队 |
| **企业版** | 10台 | 全部功能 + API + 优先支持 | 企业用户、大规模部署 |

### 🛡️ 安全机制

- **机器码绑定** - 基于 CPU、主板、硬盘等硬件特征生成唯一标识
- **授权文件加密** - AES 加密 + HMAC-SHA256 签名
- **设备数量限制** - 同一授权码绑定设备数限制
- **远程撤销** - 在线授权支持服务端即时撤销
- **过期提醒** - 授权即将过期时自动提醒

### 📊 管理功能

- **授权码生成** - 一键生成授权码，支持自定义有效期和功能
- **客户管理** - 管理客户信息，关联授权
- **设备管理** - 查看绑定设备，支持解绑
- **授权日志** - 完整的验证记录，便于审计

---

## 系统架构

```
┌─────────────────────────────────────────────────────────────────┐
│                        授权工具系统                               │
├──────────────────────────────┬──────────────────────────────────┤
│      前端 PC 端工具            │       后台授权服务端              │
│  ┌────────────────────────┐  │  ┌────────────────────────────┐  │
│  │  • 在线授权验证         │  │  │  • 授权管理 API            │  │
│  │  • 离线授权导入         │  │  │  • 客户管理                │  │
│  │  • 机器码生成           │  │  │  • 授权码生成/分发         │  │
│  │  • 授权状态监控         │  │  │  • 在线验证服务            │  │
│  │  • 授权到期提醒         │  │  │  • 数据统计分析            │  │
│  └────────────────────────┘  │  └────────────────────────────┘  │
└──────────────────────────────┴──────────────────────────────────┘
```

---

## 项目结构

```
yhsk/
├── auth-server/          # 后台授权服务端 (Node.js + Express + SQLite)
│   ├── src/
│   │   ├── routes/       # API 路由
│   │   ├── services/     # 业务逻辑
│   │   ├── database/     # 数据库配置
│   │   └── scripts/      # 初始化脚本
│   └── package.json
│
├── admin-web/            # 管理后台界面 (Vue3 + Element Plus)
│   ├── src/
│   │   ├── views/        # 页面组件
│   │   ├── layouts/      # 布局组件
│   │   ├── api/          # API 接口
│   │   └── router/       # 路由配置
│   └── package.json
│
├── pc-client/            # PC端授权工具 (Electron + Vue3)
│   ├── electron/         # Electron 主进程
│   ├── src/              # Vue 渲染进程
│   │   ├── views/        # 页面组件
│   │   ├── stores/       # 状态管理
│   │   └── api/          # API 接口
│   └── package.json
│
└── shared/               # 共享模块 (类型定义、加密工具)
    └── src/
        ├── types.ts      # 类型定义
        └── crypto.ts     # 加密工具
```

---

## 快速开始

### 1. 安装依赖

```bash
# 安装所有项目依赖
npm install
```

### 2. 启动服务端

```bash
# 开发模式启动服务端
cd auth-server
npm run dev

# 服务端运行在 http://localhost:3000
```

### 3. 启动管理后台

```bash
# 开发模式启动管理后台
cd admin-web
npm run dev

# 管理后台运行在 http://localhost:5173
```

### 4. 启动PC客户端

```bash
# 开发模式启动PC客户端
cd pc-client
npm run electron:dev
```

---

## API 接口

### 授权验证

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/auth/verify` | POST | 在线授权验证 |
| `/api/auth/unbind` | POST | 解绑设备 |

### 授权管理

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/license/generate` | POST | 生成授权码 |
| `/api/license/offline` | POST | 生成离线授权文件 |
| `/api/license/list` | GET | 获取授权列表 |
| `/api/license/:id` | GET | 获取授权详情 |
| `/api/license/revoke/:id` | POST | 撤销授权 |
| `/api/license/:id` | DELETE | 删除授权 |

### 客户管理

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/customer/create` | POST | 创建客户 |
| `/api/customer/list` | GET | 获取客户列表 |
| `/api/customer/:id` | GET | 获取客户详情 |
| `/api/customer/:id` | PUT | 更新客户 |
| `/api/customer/:id` | DELETE | 删除客户 |

### 日志查询

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/logs/list` | GET | 获取授权日志 |

---

## 使用流程

### 在线授权流程

```
1. PC端启动 → 自动获取机器码
2. 用户输入授权码
3. 点击"在线授权"按钮
4. 系统连接服务端验证
5. 验证成功 → 设备自动绑定
6. 显示授权信息，可正常使用软件
```

### 离线授权流程

```
1. PC端启动 → 复制机器码
2. 将机器码发送给管理员
3. 管理员在后台生成离线授权文件 (.lic)
4. 用户将授权文件导入PC端
5. 系统本地验证签名和机器码
6. 验证成功 → 显示授权信息
```

---

## 数据模型

### 授权码表 (licenses)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | TEXT | 主键 |
| license_key | TEXT | 授权码 (唯一) |
| customer_id | TEXT | 客户ID |
| product_name | TEXT | 产品名称 |
| license_type | TEXT | 授权类型 |
| max_devices | INTEGER | 最大设备数 |
| expire_at | TEXT | 过期时间 |
| features | TEXT | 功能特性 (JSON) |
| status | TEXT | 状态 |
| created_at | TEXT | 创建时间 |
| updated_at | TEXT | 更新时间 |

### 设备绑定表 (device_bindings)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | TEXT | 主键 |
| license_id | TEXT | 授权ID |
| machine_code | TEXT | 机器码 |
| device_name | TEXT | 设备名称 |
| bind_at | TEXT | 绑定时间 |
| last_verify_at | TEXT | 最后验证时间 |
| status | TEXT | 状态 |

### 授权日志表 (auth_logs)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | TEXT | 主键 |
| license_id | TEXT | 授权ID |
| machine_code | TEXT | 机器码 |
| action | TEXT | 操作类型 |
| ip_address | TEXT | IP地址 |
| result | TEXT | 结果 |
| message | TEXT | 消息 |
| created_at | TEXT | 创建时间 |

---

## 授权文件格式

```json
{
  "version": "1.0",
  "licenseKey": "XXXX-XXXX-XXXX-XXXX",
  "machineCode": "MACHINE-CODE",
  "product": "产品名称",
  "type": "professional",
  "features": ["basic", "advanced", "export"],
  "expireAt": "2027-03-09T00:00:00Z",
  "issuedAt": "2026-03-09T00:00:00Z",
  "issuer": "YHSK License System",
  "signature": "BASE64_SIGNATURE"
}
```

---

## 构建部署

### 构建服务端

```bash
cd auth-server
npm run build
npm start
```

### 构建管理后台

```bash
cd admin-web
npm run build
# 静态文件输出到 dist/ 目录
```

### 构建PC客户端

```bash
cd pc-client
npm run electron:build
# 安装包输出到 release/ 目录
```

---

## 技术栈

| 组件 | 技术 |
|------|------|
| **服务端** | Node.js + Express + TypeScript |
| **数据库** | SQLite (better-sqlite3) |
| **管理后台** | Vue3 + Element Plus + Vite |
| **PC客户端** | Electron + Vue3 + Element Plus |
| **加密** | crypto-js (AES + HMAC-SHA256) |
| **机器码** | systeminformation |

---

## 系统要求

### 服务端
- Node.js >= 18.0
- 支持 Windows / macOS / Linux

### PC客户端
- Windows 10+ / macOS 10.15+ / Linux

---

## 许可证

MIT License