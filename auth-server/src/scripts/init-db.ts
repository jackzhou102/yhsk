import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(__dirname, '../../data/license.db');
const db = new Database(dbPath);

// 创建表
db.exec(`
  -- 客户表
  CREATE TABLE IF NOT EXISTS customers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    company TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  -- 授权码表
  CREATE TABLE IF NOT EXISTS licenses (
    id TEXT PRIMARY KEY,
    license_key TEXT UNIQUE NOT NULL,
    customer_id TEXT,
    customer_name TEXT,
    product_name TEXT NOT NULL,
    license_type TEXT NOT NULL DEFAULT 'trial',
    max_devices INTEGER DEFAULT 1,
    expire_at TEXT,
    features TEXT DEFAULT '[]',
    status TEXT DEFAULT 'unused',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id)
  );

  -- 设备绑定表
  CREATE TABLE IF NOT EXISTS device_bindings (
    id TEXT PRIMARY KEY,
    license_id TEXT NOT NULL,
    machine_code TEXT NOT NULL,
    device_name TEXT,
    bind_at TEXT DEFAULT CURRENT_TIMESTAMP,
    last_verify_at TEXT,
    status TEXT DEFAULT 'active',
    UNIQUE(license_id, machine_code),
    FOREIGN KEY (license_id) REFERENCES licenses(id)
  );

  -- 授权日志表
  CREATE TABLE IF NOT EXISTS auth_logs (
    id TEXT PRIMARY KEY,
    license_id TEXT,
    machine_code TEXT,
    action TEXT NOT NULL,
    ip_address TEXT,
    result TEXT NOT NULL,
    message TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  -- 创建索引
  CREATE INDEX IF NOT EXISTS idx_licenses_key ON licenses(license_key);
  CREATE INDEX IF NOT EXISTS idx_licenses_status ON licenses(status);
  CREATE INDEX IF NOT EXISTS idx_bindings_license ON device_bindings(license_id);
  CREATE INDEX IF NOT EXISTS idx_bindings_machine ON device_bindings(machine_code);
  CREATE INDEX IF NOT EXISTS idx_logs_license ON auth_logs(license_id);
`);

console.log('数据库初始化完成！');
console.log('数据库路径:', dbPath);

db.close();