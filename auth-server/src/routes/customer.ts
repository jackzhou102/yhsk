import { Router, Request, Response } from 'express';
import { customerService } from '../services/customerService';

const router = Router();

/**
 * POST /api/customer/create
 * 创建客户
 */
router.post('/create', (req: Request, res: Response) => {
  const { name, email, phone, company } = req.body;
  
  if (!name || !email) {
    res.json({ success: false, message: '姓名和邮箱为必填项' });
    return;
  }
  
  const result = customerService.createCustomer({ name, email, phone, company });
  res.json(result);
});

/**
 * GET /api/customer/list
 * 获取客户列表
 */
router.get('/list', (_req: Request, res: Response) => {
  const customers = customerService.getAllCustomers();
  res.json({ success: true, data: customers });
});

/**
 * GET /api/customer/:id
 * 获取客户详情
 */
router.get('/:id', (req: Request, res: Response) => {
  const customer = customerService.getCustomerById(req.params.id);
  if (!customer) {
    res.json({ success: false, message: '客户不存在' });
    return;
  }
  res.json({ success: true, data: customer });
});

/**
 * PUT /api/customer/:id
 * 更新客户
 */
router.put('/:id', (req: Request, res: Response) => {
  const result = customerService.updateCustomer(req.params.id, req.body);
  res.json(result);
});

/**
 * DELETE /api/customer/:id
 * 删除客户
 */
router.delete('/:id', (req: Request, res: Response) => {
  const result = customerService.deleteCustomer(req.params.id);
  res.json(result);
});

export default router;