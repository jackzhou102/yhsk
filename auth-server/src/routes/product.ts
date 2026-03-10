import { Router, Request, Response } from 'express';
import { productService } from '../services/productService';

const router = Router();

/**
 * POST /api/product/create
 * 创建产品
 */
router.post('/create', (req: Request, res: Response) => {
  const { code, name, description } = req.body;

  if (!code || !name) {
    res.json({ success: false, message: '产品代码和名称为必填项' });
    return;
  }

  const result = productService.createProduct({ code, name, description });
  res.json(result);
});

/**
 * GET /api/product/list
 * 获取产品列表
 */
router.get('/list', (_req: Request, res: Response) => {
  const products = productService.getAllProducts();
  res.json({ success: true, data: products });
});

/**
 * GET /api/product/:id
 * 获取产品详情
 */
router.get('/:id', (req: Request, res: Response) => {
  const product = productService.getProductById(req.params.id);
  if (!product) {
    res.json({ success: false, message: '产品不存在' });
    return;
  }
  res.json({ success: true, data: product });
});

/**
 * PUT /api/product/:id
 * 更新产品
 */
router.put('/:id', (req: Request, res: Response) => {
  const result = productService.updateProduct(req.params.id, req.body);
  res.json(result);
});

/**
 * DELETE /api/product/:id
 * 删除产品
 */
router.delete('/:id', (req: Request, res: Response) => {
  const result = productService.deleteProduct(req.params.id);
  res.json(result);
});

export default router;