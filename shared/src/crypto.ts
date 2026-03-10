import CryptoJS from 'crypto-js';
import { v4 as uuidv4 } from 'uuid';

// RSA 密钥对（实际应用中应从配置或环境变量读取）
let RSA_KEYS = {
  publicKey: '',
  privateKey: ''
};

/**
 * 初始化 RSA 密钥对
 * 注意：实际项目中应该使用真正的 RSA 密钥对
 * 这里简化使用 AES 对称加密模拟签名过程
 */
export function initKeys(): void {
  // 生成一个固定的签名密钥（实际应使用 RSA 非对称加密）
  RSA_KEYS.privateKey = 'YHSK-LICENSE-PRIVATE-KEY-2024';
  RSA_KEYS.publicKey = 'YHSK-LICENSE-PUBLIC-KEY-2024';
}

/**
 * 获取公钥（用于客户端验证签名）
 */
export function getPublicKey(): string {
  return RSA_KEYS.publicKey;
}

/**
 * 生成授权码
 * 格式: XXXX-XXXX-XXXX-XXXX
 */
export function generateLicenseKey(): string {
  const segments: string[] = [];
  for (let i = 0; i < 4; i++) {
    const segment = CryptoJS.lib.WordArray.random(2).toString().toUpperCase();
    segments.push(segment);
  }
  return segments.join('-');
}

/**
 * 生成唯一 ID
 */
export function generateId(): string {
  return uuidv4();
}

/**
 * AES 加密
 */
export function encrypt(data: string, key?: string): string {
  const secretKey = key || RSA_KEYS.privateKey;
  return CryptoJS.AES.encrypt(data, secretKey).toString();
}

/**
 * AES 解密
 */
export function decrypt(encryptedData: string, key?: string): string {
  const secretKey = key || RSA_KEYS.publicKey;
  const bytes = CryptoJS.AES.decrypt(encryptedData, secretKey);
  return bytes.toString(CryptoJS.enc.Utf8);
}

/**
 * 生成签名
 */
export function sign(data: string): string {
  const signature = CryptoJS.HmacSHA256(data, RSA_KEYS.privateKey);
  return signature.toString(CryptoJS.enc.Base64);
}

/**
 * 验证签名
 */
export function verify(data: string, signature: string): boolean {
  const expectedSignature = CryptoJS.HmacSHA256(data, RSA_KEYS.publicKey);
  return expectedSignature.toString(CryptoJS.enc.Base64) === signature;
}

/**
 * SHA256 哈希
 */
export function sha256(data: string): string {
  return CryptoJS.SHA256(data).toString();
}

/**
 * 生成机器码哈希
 */
export function generateMachineCodeHash(components: string[]): string {
  const combined = components.join('|');
  return sha256(combined).substring(0, 32).toUpperCase();
}

/**
 * Base64 编码
 */
export function base64Encode(data: string): string {
  return CryptoJS.enc.Base64.stringify(CryptoJS.enc.Utf8.parse(data));
}

/**
 * Base64 解码
 */
export function base64Decode(encoded: string): string {
  return CryptoJS.enc.Utf8.stringify(CryptoJS.enc.Base64.parse(encoded));
}

// 初始化密钥
initKeys();

export default {
  generateLicenseKey,
  generateId,
  encrypt,
  decrypt,
  sign,
  verify,
  sha256,
  generateMachineCodeHash,
  base64Encode,
  base64Decode,
  getPublicKey
};