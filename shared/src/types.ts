// 授权类型枚举
export enum LicenseType {
  TRIAL = 'trial',           // 试用版
  PROFESSIONAL = 'professional', // 专业版
  ENTERPRISE = 'enterprise'  // 企业版
}

// 授权状态枚举
export enum LicenseStatus {
  UNUSED = 'unused',     // 未使用
  ACTIVE = 'active',     // 激活中
  EXPIRED = 'expired',   // 已过期
  REVOKED = 'revoked'    // 已撤销
}

// 设备绑定状态
export enum DeviceStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive'
}

// 产品信息接口
export interface Product {
  id: string;
  code: string;              // 产品代码
  name: string;              // 产品名称
  description?: string;      // 产品描述
  createdAt: Date | string;
  updatedAt: Date | string;
}

// 授权信息接口
export interface License {
  id: string;
  licenseKey: string;        // 授权码
  customerId?: string;       // 客户ID
  customerName?: string;     // 客户名称
  productId?: string;        // 产品ID
  productName: string;       // 产品名称
  licenseType: LicenseType;  // 授权类型
  maxDevices: number;        // 最大设备数
  expireAt: Date | string;   // 过期时间
  features: string[];        // 功能特性列表
  status: LicenseStatus;     // 状态
  createdAt: Date | string;
  updatedAt: Date | string;
}

// 设备绑定接口
export interface DeviceBinding {
  id: string;
  licenseId: string;
  machineCode: string;       // 机器码
  deviceName: string;        // 设备名称
  bindAt: Date | string;
  lastVerifyAt: Date | string;
  status: DeviceStatus;
}

// 客户信息接口
export interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  createdAt: Date | string;
}

// 授权文件接口
export interface LicenseFile {
  version: string;
  licenseKey: string;
  machineCode: string;
  product: string;
  type: LicenseType;
  features: string[];
  expireAt: string;
  issuedAt: string;
  issuer: string;
  signature: string;
}

// API 响应接口
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  code?: number;
}

// 在线授权验证请求
export interface VerifyRequest {
  licenseKey: string;
  machineCode: string;
  deviceName?: string;
}

// 在线授权验证响应
export interface VerifyResponse {
  valid: boolean;
  license?: License;
  message: string;
  remainingDays?: number;
  activeDeviceCount?: number;
  maxDevices?: number;
  remainingDevices?: number;
}

// 授权码生成请求
export interface GenerateLicenseRequest {
  productName: string;
  licenseType: LicenseType;
  maxDevices: number;
  expireDays: number;
  features: string[];
  customerId?: string;
  productId?: string;
}

// 离线授权文件生成请求
export interface GenerateOfflineRequest {
  licenseKey: string;
  machineCode: string;
  deviceName: string;
}

// 授权日志
export interface AuthLog {
  id: string;
  licenseId: string;
  machineCode: string;
  action: 'verify' | 'bind' | 'unbind' | 'revoke';
  ipAddress: string;
  result: 'success' | 'failed';
  message: string;
  createdAt: Date | string;
}

// 功能特性配置
export const FEATURE_CONFIG: Record<LicenseType, string[]> = {
  [LicenseType.TRIAL]: ['basic'],
  [LicenseType.PROFESSIONAL]: ['basic', 'advanced', 'export'],
  [LicenseType.ENTERPRISE]: ['basic', 'advanced', 'export', 'api', 'priority_support', 'customization']
};

// 授权类型显示名称
export const LICENSE_TYPE_NAMES: Record<LicenseType, string> = {
  [LicenseType.TRIAL]: '试用版',
  [LicenseType.PROFESSIONAL]: '专业版',
  [LicenseType.ENTERPRISE]: '企业版'
};

// 默认设备数量限制
export const DEFAULT_MAX_DEVICES: Record<LicenseType, number> = {
  [LicenseType.TRIAL]: 1,
  [LicenseType.PROFESSIONAL]: 3,
  [LicenseType.ENTERPRISE]: 10
};