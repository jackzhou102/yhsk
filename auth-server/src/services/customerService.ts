import getDatabase from '../database';
import { Customer, ApiResponse } from '../../../shared/dist';
import { generateId } from '../../../shared/dist/crypto';

export class CustomerService {
  /**
   * 创建客户
   */
  createCustomer(data: { name: string; email: string; phone?: string; company?: string }): ApiResponse<Customer> {
    const db = getDatabase();
    try {
      const id = generateId();
      const now = new Date().toISOString();
      
      const stmt = db.prepare(`
        INSERT INTO customers (id, name, email, phone, company, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      stmt.run(id, data.name, data.email, data.phone || null, data.company || null, now);
      
      const customer = this.getCustomerById(id);
      return { success: true, data: customer! };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }

  /**
   * 根据ID获取客户
   */
  getCustomerById(id: string): Customer | null {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM customers WHERE id = ?');
    const row = stmt.get(id) as any;
    if (!row) return null;
    return {
      id: row.id,
      name: row.name,
      email: row.email,
      phone: row.phone,
      company: row.company,
      createdAt: row.created_at
    };
  }

  /**
   * 获取所有客户
   */
  getAllCustomers(): Customer[] {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM customers ORDER BY created_at DESC');
    const rows = stmt.all() as any[];
    return rows.map(row => ({
      id: row.id,
      name: row.name,
      email: row.email,
      phone: row.phone,
      company: row.company,
      createdAt: row.created_at
    }));
  }

  /**
   * 更新客户
   */
  updateCustomer(id: string, data: Partial<Customer>): ApiResponse<Customer> {
    const db = getDatabase();
    try {
      const fields: string[] = [];
      const values: any[] = [];
      
      if (data.name !== undefined) { fields.push('name = ?'); values.push(data.name); }
      if (data.email !== undefined) { fields.push('email = ?'); values.push(data.email); }
      if (data.phone !== undefined) { fields.push('phone = ?'); values.push(data.phone); }
      if (data.company !== undefined) { fields.push('company = ?'); values.push(data.company); }
      
      if (fields.length === 0) {
        return { success: false, message: '没有要更新的字段' };
      }
      
      values.push(id);
      const stmt = db.prepare(`UPDATE customers SET ${fields.join(', ')} WHERE id = ?`);
      stmt.run(...values);
      
      const customer = this.getCustomerById(id);
      return { success: true, data: customer! };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }

  /**
   * 删除客户
   */
  deleteCustomer(id: string): ApiResponse<boolean> {
    const db = getDatabase();
    try {
      db.prepare('DELETE FROM customers WHERE id = ?').run(id);
      return { success: true, data: true };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }
}

export const customerService = new CustomerService();