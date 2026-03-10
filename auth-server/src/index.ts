import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';

// 导入路由
import licenseRouter from './routes/license';
import customerRouter from './routes/customer';
import productRouter from './routes/product';
import logsRouter from './routes/logs';

// 确保数据目录存在
const dataDir = path.join(__dirname, '../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// 初始化数据库
import './scripts/init-db';

const app: Express = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 请求日志
app.use((req: Request, _res: Response, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// 静态文件服务（管理后台）
const adminDistPath = path.join(__dirname, '../../admin-web/dist');
if (fs.existsSync(adminDistPath)) {
  app.use(express.static(adminDistPath));
}

// API 路由
app.use('/api/auth', licenseRouter);
app.use('/api/license', licenseRouter);
app.use('/api/customer', customerRouter);
app.use('/api/product', productRouter);
app.use('/api/logs', logsRouter);

// 健康检查
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// SPA 回退（管理后台）
app.get('*', (_req: Request, res: Response) => {
  const indexPath = path.join(adminDistPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).json({ message: 'Not Found' });
  }
});

// 错误处理
app.use((err: Error, _req: Request, res: Response, _next: () => void) => {
  console.error('Error:', err.message);
  res.status(500).json({ success: false, message: '服务器内部错误' });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════╗
║       YHSK 授权服务已启动                   ║
╠════════════════════════════════════════════╣
║  API 地址: http://localhost:${PORT}           ║
║  管理后台: http://localhost:${PORT}           ║
╚════════════════════════════════════════════╝
  `);
});

export default app;