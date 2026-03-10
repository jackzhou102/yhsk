import { Router, Request, Response } from 'express';
import { licenseService } from '../services/licenseService';
import { LicenseType, GenerateLicenseRequest } from '../../../shared/dist';

const router = Router();

/**
 * POST /api/auth/verify
 * 在线授权验证
 */
router.post('/verify', (req: Request, res: Response) => {
  const { licenseKey, machineCode, deviceName } = req.body;
  
  if (!licenseKey || !machineCode) {
    res.json({ success: false, message: '缺少必要参数' });
    return;
  }
  
  const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';
  const result = licenseService.verifyLicense({ licenseKey, machineCode, deviceName }, ipAddress);
  res.json(result);
});

/**
 * POST /api/auth/unbind
 * 解绑设备
 */
router.post('/unbind', (req: Request, res: Response) => {
  const { licenseId, machineCode } = req.body;
  
  if (!licenseId || !machineCode) {
    res.json({ success: false, message: '缺少必要参数' });
    return;
  }
  
  const result = licenseService.unbindDevice(licenseId, machineCode);
  res.json(result);
});

/**
 * POST /api/license/generate
 * 生成授权码
 */
router.post('/generate', (req: Request, res: Response) => {
  const { productName, licenseType, maxDevices, expireDays, features, customerId, productId } = req.body;

  if (!licenseType || !expireDays) {
    res.json({ success: false, message: '缺少必要参数' });
    return;
  }

  if (!productName && !productId) {
    res.json({ success: false, message: '产品名称或产品ID必须提供一项' });
    return;
  }

  if (!Object.values(LicenseType).includes(licenseType)) {
    res.json({ success: false, message: '无效的授权类型' });
    return;
  }

  const data: GenerateLicenseRequest = {
    productName: productName || '',
    licenseType,
    maxDevices: maxDevices || 1,
    expireDays,
    features: features || [],
    customerId,
    productId
  };

  const result = licenseService.generateLicense(data);
  res.json(result);
});

/**
 * POST /api/license/offline
 * 生成离线授权文件
 */
router.post('/offline', (req: Request, res: Response) => {
  const { licenseKey, machineCode, deviceName } = req.body;
  
  if (!licenseKey || !machineCode) {
    res.json({ success: false, message: '缺少必要参数' });
    return;
  }
  
  const result = licenseService.generateOfflineLicense(licenseKey, machineCode, deviceName || 'Unknown');
  res.json(result);
});

/**
 * GET /api/license/list
 * 获取授权列表
 */
router.get('/list', (_req: Request, res: Response) => {
  const licenses = licenseService.getAllLicenses();
  res.json({ success: true, data: licenses });
});

/**
 * GET /api/license/:id
 * 获取授权详情
 */
router.get('/:id', (req: Request, res: Response) => {
  const license = licenseService.getLicenseById(req.params.id);
  if (!license) {
    res.json({ success: false, message: '授权不存在' });
    return;
  }
  
  const bindings = licenseService.getDeviceBindings(req.params.id);
  res.json({ success: true, data: { license, bindings } });
});

/**
 * POST /api/license/revoke/:id
 * 撤销授权
 */
router.post('/revoke/:id', (req: Request, res: Response) => {
  const result = licenseService.revokeLicense(req.params.id);
  res.json(result);
});

/**
 * DELETE /api/license/:id
 * 删除授权
 */
router.delete('/:id', (req: Request, res: Response) => {
  const result = licenseService.deleteLicense(req.params.id);
  res.json(result);
});

export default router;