# YHSK 授权工具系统

一个完整的软件授权管理系统，支持在线授权验证和授权文件生成。

## 功能特点

### 🔐 授权验证

- **在线验证** - 实时连接服务端验证授权码
- **授权文件生成** - 验证成功后生成 `.lic` 授权文件
- **灵活的机器码** - 支持使用本机机器码或输入其他机器码，方便为其他设备生成授权文件

### 📋 授权类型

| 类型 | 设备数 | 功能特性 | 适用场景 |
|------|--------|----------|----------|
| **试用版** | 1台 | 基础功能 | 产品试用、评估 |
| **专业版** | 3台 | 基础 + 高级 + 导出 | 个人用户、小团队 |
| **企业版** | 10台 | 全部功能 + API + 优先支持 | 企业用户、大规模部署 |

### 🛡️ 安全机制

- **机器码绑定** - 基于 CPU、主板、硬盘等硬件特征生成唯一标识
- **授权文件加密** - Base64 编码 + HMAC-SHA256 签名
- **设备数量限制** - 同一授权码绑定设备数限制
- **远程撤销** - 支持服务端即时撤销授权

### 📊 管理功能

- **产品管理** - 管理产品信息（代码、名称、描述）
- **客户管理** - 管理客户信息，关联授权
- **授权码生成** - 一键生成授权码，关联产品和客户
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
│  │  • 授权验证             │  │  │  • 授权管理 API            │  │
│  │  • 机器码生成/输入      │  │  │  • 产品管理                │  │
│  │  • 授权文件下载         │  │  │  • 客户管理                │  │
│  │  • 授权状态监控         │  │  │  • 授权码生成/分发         │  │
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
├── shared/               # 共享模块 (类型定义、加密工具)
│   └── src/
│       ├── types.ts      # 类型定义
│       └── crypto.ts     # 加密工具
│
└── demo-app/             # 演示应用 (展示如何使用授权文件)
    ├── index.html
    └── main.js
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
| `/api/auth/verify` | POST | 授权验证 |
| `/api/auth/generate-license-file` | POST | 生成授权文件 |
| `/api/auth/unbind` | POST | 解绑设备 |

### 授权管理

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/license/generate` | POST | 生成授权码 |
| `/api/license/list` | GET | 获取授权列表 |
| `/api/license/:id` | GET | 获取授权详情 |
| `/api/license/revoke/:id` | POST | 撤销授权 |
| `/api/license/:id` | DELETE | 删除授权 |

### 产品管理

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/product/create` | POST | 创建产品 |
| `/api/product/list` | GET | 获取产品列表 |
| `/api/product/:id` | GET | 获取产品详情 |
| `/api/product/:id` | PUT | 更新产品 |
| `/api/product/:id` | DELETE | 删除产品 |

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

### 授权验证流程

```
1. PC端启动 → 自动获取本机机器码
2. 输入机器码（可使用本机或粘贴其他机器码）
3. 输入授权码
4. 点击"验证授权"按钮
5. 系统连接服务端验证
6. 验证成功 → 下载授权文件 (.lic)
7. 将授权文件复制到目标软件的授权目录中使用
```

### 管理员操作流程

```
1. 登录管理后台
2. 创建产品（产品代码、名称、描述）
3. 创建客户（姓名、邮箱、公司等）
4. 生成授权码（选择产品、客户、授权类型、有效期）
5. 将授权码发送给用户
```

---

## 授权文件格式

授权文件为 Base64 编码的 JSON 数据：

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

### 如何在您的软件中使用授权文件

参考 `demo-app/` 目录中的示例代码：

```javascript
// 读取并验证授权文件
async function verifyLicense(licensePath) {
  // 1. 读取授权文件
  const content = await fs.readFile(licensePath, 'utf-8');
  
  // 2. Base64 解码
  const binaryString = atob(content.trim());
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  const decoder = new TextDecoder('utf-8');
  const decoded = decoder.decode(bytes);
  
  // 3. 解析 JSON
  const license = JSON.parse(decoded);
  
  // 4. 验证机器码
  const machineCode = await getMachineCode();
  if (license.machineCode !== machineCode) {
    return { valid: false, message: '机器码不匹配' };
  }
  
  // 5. 验证过期时间
  if (new Date(license.expireAt) < new Date()) {
    return { valid: false, message: '授权已过期' };
  }
  
  // 6. 验证签名（可选，需要共享密钥）
  // ...
  
  return { valid: true, license };
}
```

---

## 数据模型

### 产品表 (products)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | TEXT | 主键 |
| code | TEXT | 产品代码 (唯一) |
| name | TEXT | 产品名称 |
| description | TEXT | 产品描述 |
| created_at | TEXT | 创建时间 |
| updated_at | TEXT | 更新时间 |

### 客户表 (customers)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | TEXT | 主键 |
| name | TEXT | 客户名称 |
| email | TEXT | 邮箱 |
| phone | TEXT | 电话 |
| company | TEXT | 公司 |
| created_at | TEXT | 创建时间 |

### 授权码表 (licenses)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | TEXT | 主键 |
| license_key | TEXT | 授权码 (唯一) |
| customer_id | TEXT | 客户ID |
| customer_name | TEXT | 客户名称 |
| product_id | TEXT | 产品ID |
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

## License

MIT