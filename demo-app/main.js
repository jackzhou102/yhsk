/**
 * YHSK Demo App - 授权验证演示
 * 
 * 这个文件演示了如何在您的软件中集成授权文件验证功能
 */

// ============================================
// 配置区域 - 根据您的需求修改
// ============================================

const CONFIG = {
  // 功能特性定义
  features: {
    basic: { name: '基础功能', icon: '✨' },
    advanced: { name: '高级功能', icon: '🚀' },
    export: { name: '数据导出', icon: '📊' },
    api: { name: 'API 接口', icon: '🔌' },
    priority_support: { name: '优先支持', icon: '🎯' },
    customization: { name: '定制功能', icon: '⚙️' }
  },

  // 授权类型显示名称
  licenseTypes: {
    trial: { name: '试用版', class: 'trial' },
    professional: { name: '专业版', class: 'professional' },
    enterprise: { name: '企业版', class: 'enterprise' }
  },

  // 本地存储键名
  storageKey: 'yhsk_demo_license'
};

// ============================================
// 授权验证核心代码
// ============================================

/**
 * 解析授权文件内容
 * @param {string} content - Base64 编码的授权文件内容
 * @returns {Object} - 解析后的授权数据
 */
function parseLicenseFile(content) {
  try {
    // 1. Base64 解码 - 使用 TextDecoder 正确处理 UTF-8 中文字符
    const binaryString = atob(content.trim());
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    const decoder = new TextDecoder('utf-8');
    const decoded = decoder.decode(bytes);

    // 2. 解析 JSON
    const licenseData = JSON.parse(decoded);

    return { success: true, data: licenseData };
  } catch (error) {
    return { success: false, message: '授权文件格式错误: ' + error.message };
  }
}

/**
 * 验证授权数据
 * @param {Object} licenseData - 授权数据
 * @param {string} machineCode - 当前机器码（可选，演示中跳过）
 * @returns {Object} - 验证结果
 */
function verifyLicense(licenseData, machineCode = null) {
  // 1. 检查必要字段
  if (!licenseData.licenseKey || !licenseData.expireAt) {
    return { valid: false, message: '授权文件缺少必要信息' };
  }

  // 2. 检查机器码（在实际应用中应该验证）
  // if (machineCode && licenseData.machineCode !== machineCode) {
  //   return { valid: false, message: '机器码不匹配，此授权文件不能在本机使用' };
  // }

  // 3. 检查过期时间
  const expireDate = new Date(licenseData.expireAt);
  const now = new Date();
  if (expireDate < now) {
    return { valid: false, message: '授权已过期，请续费' };
  }

  // 4. 计算剩余天数
  const remainingDays = Math.ceil((expireDate - now) / (1000 * 60 * 60 * 24));

  return {
    valid: true,
    license: licenseData,
    remainingDays
  };
}

/**
 * 从文件读取授权
 * @param {File} file - 授权文件
 * @returns {Promise<Object>} - 验证结果
 */
async function loadLicenseFromFile(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target.result;
      const parseResult = parseLicenseFile(content);

      if (!parseResult.success) {
        resolve(parseResult);
        return;
      }

      const verifyResult = verifyLicense(parseResult.data);
      resolve(verifyResult);
    };
    reader.onerror = () => {
      resolve({ valid: false, message: '文件读取失败' });
    };
    reader.readAsText(file);
  });
}

/**
 * 保存授权到本地存储
 * @param {Object} license - 授权数据
 */
function saveLicense(license) {
  localStorage.setItem(CONFIG.storageKey, JSON.stringify(license));
}

/**
 * 从本地存储加载授权
 * @returns {Object|null} - 授权数据
 */
function loadSavedLicense() {
  const saved = localStorage.getItem(CONFIG.storageKey);
  if (!saved) return null;

  try {
    return JSON.parse(saved);
  } catch {
    return null;
  }
}

/**
 * 清除本地授权
 */
function clearLicense() {
  localStorage.removeItem(CONFIG.storageKey);
  showUnlicensedView();
}

// ============================================
// UI 更新函数
// ============================================

function showAlert(message, type = 'error') {
  const alertBox = document.getElementById('alertBox');
  alertBox.innerHTML = `<div class="alert alert-${type}">${message}</div>`;
  setTimeout(() => {
    alertBox.innerHTML = '';
  }, 5000);
}

function showUnlicensedView() {
  document.getElementById('unlicensedView').classList.remove('hidden');
  document.getElementById('licensedView').classList.add('hidden');
}

function showLicensedView(license, remainingDays) {
  document.getElementById('unlicensedView').classList.add('hidden');
  document.getElementById('licensedView').classList.remove('hidden');

  // 更新授权信息
  document.getElementById('infoProduct').textContent = license.product || '-';
  document.getElementById('infoKey').textContent = license.licenseKey || '-';

  const typeInfo = CONFIG.licenseTypes[license.type] || { name: license.type, class: '' };
  const typeEl = document.getElementById('infoType');
  typeEl.textContent = typeInfo.name;
  typeEl.className = 'info-value ' + typeInfo.class;

  const expireDate = new Date(license.expireAt);
  document.getElementById('infoExpire').textContent = expireDate.toLocaleDateString('zh-CN');

  const daysEl = document.getElementById('infoDays');
  daysEl.textContent = remainingDays + ' 天';
  if (remainingDays <= 30) {
    daysEl.style.color = '#f59e0b';
  }

  // 更新功能列表
  updateFeatureList(license.features || []);
}

function updateFeatureList(enabledFeatures) {
  const featureList = document.getElementById('featureList');
  let html = '';

  for (const [key, feature] of Object.entries(CONFIG.features)) {
    const enabled = enabledFeatures.includes(key);
    html += `
      <div class="feature-item ${enabled ? 'enabled' : 'disabled'}">
        <span class="icon">${enabled ? feature.icon : '🔒'}</span>
        ${feature.name}
      </div>
    `;
  }

  featureList.innerHTML = html;
}

// ============================================
// 事件处理
// ============================================

// 文件选择处理
document.getElementById('fileInput').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const result = await loadLicenseFromFile(file);

  if (result.valid) {
    saveLicense(result.license);
    showLicensedView(result.license, result.remainingDays);
    showAlert('授权验证成功！', 'success');
  } else {
    showAlert(result.message, 'error');
  }

  // 清空文件输入
  e.target.value = '';
});

// 使用演示授权
function showDemoLicense() {
  // 创建一个演示授权
  const demoLicense = {
    version: '1.0',
    licenseKey: 'DEMO-DEMO-DEMO-DEMO',
    machineCode: 'DEMO-MACHINE-CODE',
    product: 'YHSK Demo Product',
    type: 'professional',
    features: ['basic', 'advanced', 'export'],
    expireAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
    issuedAt: new Date().toISOString(),
    issuer: 'YHSK License System',
    signature: 'DEMO_SIGNATURE'
  };

  saveLicense(demoLicense);
  showLicensedView(demoLicense, 365);
  showAlert('已加载演示授权（专业版，有效期1年）', 'success');
}

// 清除授权
function clearLicense() {
  localStorage.removeItem(CONFIG.storageKey);
  showUnlicensedView();
}

// ============================================
// 初始化
// ============================================

// 页面加载时检查本地授权
document.addEventListener('DOMContentLoaded', () => {
  const savedLicense = loadSavedLicense();

  if (savedLicense) {
    const result = verifyLicense(savedLicense);
    if (result.valid) {
      showLicensedView(result.license, result.remainingDays);
    } else {
      showAlert('本地授权已失效: ' + result.message, 'error');
      clearLicense();
    }
  }
});

// ============================================
// 导出函数供外部使用
// ============================================

// 如果需要在其他地方使用这些函数
window.YHSKLicense = {
  parseLicenseFile,
  verifyLicense,
  loadLicenseFromFile,
  saveLicense,
  loadSavedLicense,
  clearLicense
};