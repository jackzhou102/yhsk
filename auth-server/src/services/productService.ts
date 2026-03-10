import getDatabase from '../database';
import { Product, ApiResponse } from '../../../shared/dist';
import { generateId } from '../../../shared/dist/crypto';

export class ProductService {
  /**
   * 创建产品
   */
  createProduct(data: { code: string; name: string; description?: string }): ApiResponse<Product> {
    const db = getDatabase();

    try {
      // 检查产品代码是否已存在
      const existing = db.prepare('SELECT id FROM products WHERE code = ?').get(data.code);
      if (existing) {
        return { success: false, message: '产品代码已存在' };
      }

      const id = generateId();
      const now = new Date().toISOString();

      const stmt = db.prepare(`
        INSERT INTO products (id, code, name, description, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `);

      stmt.run(id, data.code, data.name, data.description || null, now, now);

      const product = this.getProductById(id);
      return { success: true, data: product! };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }

  /**
   * 根据ID获取产品
   */
  getProductById(id: string): Product | null {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM products WHERE id = ?');
    const row = stmt.get(id) as any;
    if (!row) return null;
    return this.rowToProduct(row);
  }

  /**
   * 根据代码获取产品
   */
  getProductByCode(code: string): Product | null {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM products WHERE code = ?');
    const row = stmt.get(code) as any;
    if (!row) return null;
    return this.rowToProduct(row);
  }

  /**
   * 获取所有产品
   */
  getAllProducts(): Product[] {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM products ORDER BY created_at DESC');
    const rows = stmt.all() as any[];
    return rows.map(row => this.rowToProduct(row));
  }

  /**
   * 更新产品
   */
  updateProduct(id: string, data: { name?: string; description?: string }): ApiResponse<Product> {
    const db = getDatabase();

    try {
      const product = this.getProductById(id);
      if (!product) {
        return { success: false, message: '产品不存在' };
      }

      const now = new Date().toISOString();
      const stmt = db.prepare(`
        UPDATE products SET name = ?, description = ?, updated_at = ? WHERE id = ?
      `);
      stmt.run(data.name || product.name, data.description ?? product.description, now, id);

      const updated = this.getProductById(id);
      return { success: true, data: updated! };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }

  /**
   * 删除产品
   */
  deleteProduct(id: string): ApiResponse<boolean> {
    const db = getDatabase();

    try {
      // 检查是否有授权关联此产品
      const licenseCount = db.prepare('SELECT COUNT(*) as count FROM licenses WHERE product_id = ?').get(id) as any;
      if (licenseCount.count > 0) {
        return { success: false, message: '该产品下存在授权记录，无法删除' };
      }

      db.prepare('DELETE FROM products WHERE id = ?').run(id);
      return { success: true, data: true };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }

  /**
   * 数据库行转 Product 对象
   */
  private rowToProduct(row: any): Product {
    return {
      id: row.id,
      code: row.code,
      name: row.name,
      description: row.description,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }
}

export const productService = new ProductService();