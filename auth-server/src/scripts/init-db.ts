import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(__dirname, '../../data/license.db');
const db = new Database(dbPath);

// 创建表
db.exec(`
  -- 产品表
  CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

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
    product_id TEXT,
    product_name TEXT NOT NULL,
    license_type TEXT NOT NULL DEFAULT 'trial',
    max_devices INTEGER DEFAULT 1,
    expire_at TEXT,
    features TEXT DEFAULT '[]',
    status TEXT DEFAULT 'unused',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
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
`);

// 数据库迁移：为现有表添加新列
try {
  // 检查 licenses 表是否有 product_id 列
  const licensesColumns = db.prepare("PRAGMA table_info(licenses)").all() as any[];
  const hasProductId = licensesColumns.some(col => col.name === 'product_id');
  
  if (!hasProductId) {
    console.log('正在迁移数据库：添加 product_id 列...');
    db.exec('ALTER TABLE licenses ADD COLUMN product_id TEXT REFERENCES products(id)');
    console.log('数据库迁移完成');
  }
} catch (error) {
  console.log('数据库迁移检查:', error);
}

// 创建索引
db.exec(`
  CREATE INDEX IF NOT EXISTS idx_products_code ON products(code);
  CREATE INDEX IF NOT EXISTS idx_licenses_key ON licenses(license_key);
  CREATE INDEX IF NOT EXISTS idx_licenses_status ON licenses(status);
  CREATE INDEX IF NOT EXISTS idx_licenses_customer ON licenses(customer_id);
  CREATE INDEX IF NOT EXISTS idx_licenses_product ON licenses(product_id);
  CREATE INDEX IF NOT EXISTS idx_bindings_license ON device_bindings(license_id);
  CREATE INDEX IF NOT EXISTS idx_bindings_machine ON device_bindings(machine_code);
  CREATE INDEX IF NOT EXISTS idx_logs_license ON auth_logs(license_id);
`);

console.log('数据库初始化完成！');
console.log('数据库路径:', dbPath);

db.close();