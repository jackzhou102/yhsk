import si from 'systeminformation'
import crypto from 'crypto'

/**
 * 获取机器唯一标识
 * 基于 CPU、主板、硬盘等信息生成
 */
export async function machineIdSync(): Promise<string> {
  try {
    // 获取硬件信息
    const [cpu, system, disk] = await Promise.all([
      si.cpu(),
      si.system(),
      si.diskLayout()
    ])

    // 组合硬件信息
    const components = [
      cpu.manufacturer,
      cpu.brand,
      system.manufacturer,
      system.model,
      disk.length > 0 ? disk[0].serialNum : 'unknown'
    ]

    // 生成哈希
    const rawId = components.filter(Boolean).join('-')
    const hash = crypto.createHash('sha256').update(rawId).digest('hex')
    
    // 返回格式化的机器码 (XXXX-XXXX-XXXX-XXXX)
    const shortHash = hash.substring(0, 16).toUpperCase()
    return [
      shortHash.substring(0, 4),
      shortHash.substring(4, 8),
      shortHash.substring(8, 12),
      shortHash.substring(12, 16)
    ].join('-')
  } catch (error) {
    // 如果获取硬件信息失败，使用备选方案
    const fallback = crypto.randomBytes(8).toString('hex').toUpperCase()
    return [
      fallback.substring(0, 4),
      fallback.substring(4, 8),
      fallback.substring(8, 12),
      fallback.substring(12, 16)
    ].join('-')
  }
}

/**
 * 获取设备名称
 */
export async function getDeviceName(): Promise<string> {
  try {
    const osInfo = await si.osInfo()
    return `${osInfo.hostname} (${osInfo.distro})`
  } catch {
    return 'Unknown Device'
  }
}