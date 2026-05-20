// ============================================================
// app.js — UI 交互逻辑
// ============================================================

let currentMode = 'encode'; // 'encode' | 'decode'

// ── 初始化 ─────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  document.getElementById('keyInput').value = 'ikun';
  updateModeUI();
});



// ── 模式切换 ───────────────────────────────────────────────
function switchMode(mode) {
  currentMode = mode;
  updateModeUI();
  clearOutput();
}

function updateModeUI() {
  const encBtn = document.getElementById('encodeBtn');
  const decBtn = document.getElementById('decodeBtn');
  const actionBtn = document.getElementById('actionBtn');
  const inputLabel = document.getElementById('inputLabel');
  const outputLabel = document.getElementById('outputLabel');
  const inputArea = document.getElementById('inputText');

  if (currentMode === 'encode') {
    encBtn.classList.add('active');
    decBtn.classList.remove('active');
    actionBtn.textContent = '🐔 开始加密';
    inputLabel.textContent = '✏️ 输入原文';
    outputLabel.textContent = '🎵 鸡你太美语言';
    inputArea.placeholder = '在这里输入要加密的文字（支持中文、英文、数字、符号）...';
  } else {
    decBtn.classList.add('active');
    encBtn.classList.remove('active');
    actionBtn.textContent = '🔑 开始解密';
    inputLabel.textContent = '🎵 输入鸡你太美语言';
    outputLabel.textContent = '📜 解密原文';
    inputArea.placeholder = '在这里粘贴鸡你太美语言密文...';
  }
}

// ── 执行加密/解密 ──────────────────────────────────────────
function doAction() {
  const key = document.getElementById('keyInput').value.trim();
  const text = document.getElementById('inputText').value;

  // 验证密钥
  const keyErr = JNTM.validateKey(key);
  if (keyErr) {
    showToast('⚠️ ' + keyErr, 'error');
    document.getElementById('keyInput').focus();
    return;
  }

  if (!text.trim()) {
    showToast('⚠️ 请先输入内容', 'error');
    return;
  }

  const outputBox = document.getElementById('outputText');
  outputBox.innerHTML = '<span class="processing">处理中...</span>';

  // 异步处理防止阻塞 UI
  setTimeout(() => {
    try {
      if (currentMode === 'encode') {
        const result = JNTM.encode(text, key);
        outputBox.textContent = result;
        showToast('✅ 加密成功！', 'success');
      } else {
        const result = JNTM.decode(text, key);
        if (result === null) {
          outputBox.innerHTML = '<span class="error-text">❌ 解密失败：密钥不正确或密文已损坏</span>';
          showToast('❌ 解密失败，请检查密钥', 'error');
        } else {
          outputBox.textContent = result;
          showToast('✅ 解密成功！', 'success');
        }
      }
    } catch (e) {
      outputBox.innerHTML = '<span class="error-text">❌ 处理出错：' + e.message + '</span>';
      showToast('❌ 处理出错', 'error');
    }
  }, 50);
}

// ── 辅助操作 ───────────────────────────────────────────────
function clearInput() {
  document.getElementById('inputText').value = '';
  clearOutput();
}

function clearOutput() {
  const outputBox = document.getElementById('outputText');
  outputBox.innerHTML = '<span class="output-placeholder">翻译结果将显示在这里...</span>';
}

function copyOutput() {
  const text = document.getElementById('outputText').textContent;
  if (!text || text === '翻译结果将显示在这里...') {
    showToast('⚠️ 没有可复制的内容', 'error');
    return;
  }
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(() => {
      showToast('📋 已复制到剪贴板', 'success');
    }).catch(() => fallbackCopy(text));
  } else {
    fallbackCopy(text);
  }
}

function fallbackCopy(text) {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.cssText = 'position:fixed;top:-9999px;left:-9999px';
  document.body.appendChild(ta);
  ta.select();
  try {
    document.execCommand('copy');
    showToast('📋 已复制到剪贴板', 'success');
  } catch {
    showToast('❌ 复制失败，请手动复制', 'error');
  }
  document.body.removeChild(ta);
}

function swapIO() {
  const outputText = document.getElementById('outputText').textContent;
  if (!outputText || outputText === '翻译结果将显示在这里...' || outputText.includes('❌')) {
    showToast('⚠️ 没有可互换的内容', 'error');
    return;
  }
  document.getElementById('inputText').value = outputText;
  clearOutput();

  // 自动切换模式
  switchMode(currentMode === 'encode' ? 'decode' : 'encode');
  showToast('🔄 已互换内容并切换模式', 'success');
}

function generateRandomKey() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  const len = Math.floor(Math.random() * 5) + 4; // 4~8
  let key = '';
  for (let i = 0; i < len; i++) {
    key += chars[Math.floor(Math.random() * chars.length)];
  }
  document.getElementById('keyInput').value = key;
  showToast('🎲 已生成随机密钥：' + key, 'success');
}

// ── Toast 提示 ─────────────────────────────────────────────
let toastTimer = null;
function showToast(msg, type = 'success') {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.className = 'toast show ' + (type === 'error' ? 'toast-error' : 'toast-success');
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.remove('show');
  }, 2500);
}

// ── 赞赏码弹窗 ─────────────────────────────────────────────
let rewardTimer = null;
let rewardCountdown = null;

function showReward() {
  const overlay = document.getElementById('rewardOverlay');
  const timerLabel = document.getElementById('rewardTimer');
  overlay.classList.add('show');

  let seconds = 10;
  timerLabel.textContent = seconds + '秒后自动关闭';

  if (rewardCountdown) clearInterval(rewardCountdown);
  rewardCountdown = setInterval(() => {
    seconds--;
    if (seconds > 0) {
      timerLabel.textContent = seconds + '秒后自动关闭';
    } else {
      clearInterval(rewardCountdown);
      hideReward();
    }
  }, 1000);
}

function hideReward() {
  const overlay = document.getElementById('rewardOverlay');
  overlay.classList.remove('show');
  if (rewardCountdown) {
    clearInterval(rewardCountdown);
    rewardCountdown = null;
  }
}
