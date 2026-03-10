import { v4 as uuidv4 } from 'uuid';
import getDatabase from '../database';
import {
  License,
  LicenseType,
  LicenseStatus,
  DeviceBinding,
  DeviceStatus,
  ApiResponse,
  VerifyRequest,
  VerifyResponse,
  GenerateLicenseRequest,
  LicenseFile,
  FEATURE_CONFIG,
  DEFAULT_MAX_DEVICES
} from '../../../shared/dist';
import {
  generateLicenseKey,
  generateId,
  sign,
  base64Encode
} from '../../../shared/dist/crypto';

export class LicenseService {
  /**
   * 生成授权码
   */
  generateLicense(data: GenerateLicenseRequest): ApiResponse<License> {
    try {
      const db = getDatabase();
      const id = generateId();
      const licenseKey = generateLicenseKey();
      const now = new Date().toISOString();
      const expireAt = new Date(Date.now() + data.expireDays * 24 * 60 * 60 * 1000).toISOString();

      const stmt = db.prepare(`
        INSERT INTO licenses (id, license_key, customer_id, product_name, license_type, max_devices, expire_at, features, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      stmt.run(
        id,
        licenseKey,
        data.customerId || null,
        data.productName,
        data.licenseType,
        data.maxDevices || DEFAULT_MAX_DEVICES[data.licenseType],
        expireAt,
        JSON.stringify(data.features || FEATURE_CONFIG[data.licenseType]),
        LicenseStatus.UNUSED,
        now,
        now
      );

      const license = this.getLicenseById(id);
      return { success: true, data: license! };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }

  /**
   * 根据ID获取授权
   */
  getLicenseById(id: string): License | null {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM licenses WHERE id = ?');
    const row = stmt.get(id) as any;
    if (!row) return null;
    return this.rowToLicense(row);
  }

  /**
   * 根据授权码获取授权
   */
  getLicenseByKey(licenseKey: string): License | null {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM licenses WHERE license_key = ?');
    const row = stmt.get(licenseKey) as any;
    if (!row) return null;
    return this.rowToLicense(row);
  }

  /**
   * 获取所有授权
   */
  getAllLicenses(): License[] {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM licenses ORDER BY created_at DESC');
    const rows = stmt.all() as any[];
    return rows.map(row => this.rowToLicense(row));
  }

  /**
   * 在线验证授权
   */
  verifyLicense(data: VerifyRequest, ipAddress: string): ApiResponse<VerifyResponse> {
    const db = getDatabase();
    
    try {
      // 查找授权
      const license = this.getLicenseByKey(data.licenseKey);
      if (!license) {
        this.logAuth(null, data.machineCode, 'verify', ipAddress, 'failed', '授权码不存在');
        return { success: false, message: '授权码不存在', data: { valid: false, message: '授权码不存在' } };
      }

      // 检查授权状态
      if (license.status === LicenseStatus.REVOKED) {
        this.logAuth(license.id, data.machineCode, 'verify', ipAddress, 'failed', '授权已被撤销');
        return { success: false, message: '授权已被撤销', data: { valid: false, message: '授权已被撤销' } };
      }

      // 检查过期时间
      const expireDate = new Date(license.expireAt);
      const now = new Date();
      if (expireDate < now) {
        this.updateLicenseStatus(license.id, LicenseStatus.EXPIRED);
        this.logAuth(license.id, data.machineCode, 'verify', ipAddress, 'failed', '授权已过期');
        return { success: false, message: '授权已过期', data: { valid: false, message: '授权已过期' } };
      }

      // 检查设备绑定
      const bindings = this.getDeviceBindings(license.id);
      const existingBinding = bindings.find(b => b.machineCode === data.machineCode);

      if (existingBinding) {
        // 已绑定的设备，更新验证时间
        this.updateLastVerifyTime(existingBinding.id);
        this.logAuth(license.id, data.machineCode, 'verify', ipAddress, 'success', '验证成功');
        
        const remainingDays = Math.ceil((expireDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
        return {
          success: true,
          data: {
            valid: true,
            license,
            message: '验证成功',
            remainingDays
          }
        };
      }

      // 新设备，检查设备数量限制
      const activeDevices = bindings.filter(b => b.status === DeviceStatus.ACTIVE);
      if (activeDevices.length >= license.maxDevices) {
        this.logAuth(license.id, data.machineCode, 'verify', ipAddress, 'failed', '设备数量已达上限');
        return {
          success: false,
          message: `设备数量已达上限（${license.maxDevices}台）`,
          data: { valid: false, message: '设备数量已达上限' }
        };
      }

      // 绑定新设备
      this.bindDevice(license.id, data.machineCode, data.deviceName || 'Unknown');
      
      // 更新授权状态为激活
      if (license.status === LicenseStatus.UNUSED) {
        this.updateLicenseStatus(license.id, LicenseStatus.ACTIVE);
      }

      this.logAuth(license.id, data.machineCode, 'bind', ipAddress, 'success', '设备绑定成功');
      
      const remainingDays = Math.ceil((expireDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
      return {
        success: true,
        data: {
          valid: true,
          license,
          message: '设备绑定成功',
          remainingDays
        }
      };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }

  /**
   * 生成离线授权文件
   */
  generateOfflineLicense(licenseKey: string, machineCode: string, deviceName: string): ApiResponse<string> {
    const license = this.getLicenseByKey(licenseKey);
    if (!license) {
      return { success: false, message: '授权码不存在' };
    }

    if (license.status === LicenseStatus.REVOKED) {
      return { success: false, message: '授权已被撤销' };
    }

    const expireDate = new Date(license.expireAt);
    if (expireDate < new Date()) {
      return { success: false, message: '授权已过期' };
    }

    // 构建授权文件内容
    const licenseFile: LicenseFile = {
      version: '1.0',
      licenseKey: license.licenseKey,
      machineCode: machineCode,
      product: license.productName,
      type: license.licenseType,
      features: license.features,
      expireAt: license.expireAt as string,
      issuedAt: new Date().toISOString(),
      issuer: 'YHSK License System',
      signature: ''
    };

    // 生成签名
    const contentToSign = JSON.stringify({
      version: licenseFile.version,
      licenseKey: licenseFile.licenseKey,
      machineCode: licenseFile.machineCode,
      product: licenseFile.product,
      type: licenseFile.type,
      expireAt: licenseFile.expireAt
    });
    licenseFile.signature = sign(contentToSign);

    // 编码为 Base64
    const encoded = base64Encode(JSON.stringify(licenseFile));
    
    return { success: true, data: encoded };
  }

  /**
   * 撤销授权
   */
  revokeLicense(id: string): ApiResponse<boolean> {
    const db = getDatabase();
    try {
      const stmt = db.prepare('UPDATE licenses SET status = ?, updated_at = ? WHERE id = ?');
      stmt.run(LicenseStatus.REVOKED, new Date().toISOString(), id);
      return { success: true, data: true };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }

  /**
   * 删除授权
   */
  deleteLicense(id: string): ApiResponse<boolean> {
    const db = getDatabase();
    try {
      // 先删除相关设备绑定
      db.prepare('DELETE FROM device_bindings WHERE license_id = ?').run(id);
      // 删除授权
      db.prepare('DELETE FROM licenses WHERE id = ?').run(id);
      return { success: true, data: true };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }

  /**
   * 绑定设备
   */
  private bindDevice(licenseId: string, machineCode: string, deviceName: string): void {
    const db = getDatabase();
    const id = generateId();
    const now = new Date().toISOString();
    
    const stmt = db.prepare(`
      INSERT INTO device_bindings (id, license_id, machine_code, device_name, bind_at, last_verify_at, status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(id, licenseId, machineCode, deviceName, now, now, DeviceStatus.ACTIVE);
  }

  /**
   * 解绑设备
   */
  unbindDevice(licenseId: string, machineCode: string): ApiResponse<boolean> {
    const db = getDatabase();
    try {
      const stmt = db.prepare('DELETE FROM device_bindings WHERE license_id = ? AND machine_code = ?');
      stmt.run(licenseId, machineCode);
      return { success: true, data: true };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }

  /**
   * 获取设备绑定列表
   */
  getDeviceBindings(licenseId: string): DeviceBinding[] {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM device_bindings WHERE license_id = ?');
    const rows = stmt.all(licenseId) as any[];
    return rows.map(row => ({
      id: row.id,
      licenseId: row.license_id,
      machineCode: row.machine_code,
      deviceName: row.device_name,
      bindAt: row.bind_at,
      lastVerifyAt: row.last_verify_at,
      status: row.status as DeviceStatus
    }));
  }

  /**
   * 更新最后验证时间
   */
  private updateLastVerifyTime(bindingId: string): void {
    const db = getDatabase();
    db.prepare('UPDATE device_bindings SET last_verify_at = ? WHERE id = ?').run(new Date().toISOString(), bindingId);
  }

  /**
   * 更新授权状态
   */
  private updateLicenseStatus(id: string, status: LicenseStatus): void {
    const db = getDatabase();
    db.prepare('UPDATE licenses SET status = ?, updated_at = ? WHERE id = ?').run(status, new Date().toISOString(), id);
  }

  /**
   * 记录授权日志
   */
  private logAuth(licenseId: string | null, machineCode: string, action: string, ipAddress: string, result: string, message: string): void {
    const db = getDatabase();
    const id = generateId();
    db.prepare(`
      INSERT INTO auth_logs (id, license_id, machine_code, action, ip_address, result, message, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, licenseId, machineCode, action, ipAddress, result, message, new Date().toISOString());
  }

  /**
   * 获取授权日志
   */
  getAuthLogs(limit: number = 100): any[] {
    const db = getDatabase();
    const stmt = db.prepare(`
      SELECT l.*, lc.license_key 
      FROM auth_logs l 
      LEFT JOIN licenses lc ON l.license_id = lc.id
      ORDER BY l.created_at DESC 
      LIMIT ?
    `);
    return stmt.all(limit);
  }

  /**
   * 数据库行转 License 对象
   */
  private rowToLicense(row: any): License {
    return {
      id: row.id,
      licenseKey: row.license_key,
      customerId: row.customer_id,
      customerName: row.customer_name,
      productName: row.product_name,
      licenseType: row.license_type as LicenseType,
      maxDevices: row.max_devices,
      expireAt: row.expire_at,
      features: JSON.parse(row.features || '[]'),
      status: row.status as LicenseStatus,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }
}

export const licenseService = new LicenseService();