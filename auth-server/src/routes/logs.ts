import { Router, Request, Response } from 'express';
import { licenseService } from '../services/licenseService';

const router = Router();

/**
 * GET /api/logs/list
 * 获取授权日志
 */
router.get('/list', (req: Request, res: Response) => {
  const limit = parseInt(req.query.limit as string) || 100;
  const logs = licenseService.getAuthLogs(limit);
  res.json({ success: true, data: logs });
});

export default router;