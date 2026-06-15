<template>
  <div class="login-page">
    <div class="glow glow-1"></div>
    <div class="glow glow-2"></div>

    <div class="login-hero">
      <div class="hero-emoji">{{ layout.loginEmoji }}</div>
      <h1 class="hero-title">{{ layout.loginTitle }}</h1>
      <p class="hero-sub">{{ layout.loginSub }}</p>
    </div>

    <!-- 历史登录快选 -->
    <div v-if="historyList.length > 0" class="history-section">
      <div class="history-label">最近登录</div>
      <div class="history-chips">
        <div
          v-for="h in historyList"
          :key="h.username"
          class="history-chip"
          @click="fillHistory(h)"
        >
          <span class="chip-nick">{{ h.nickname || h.username }}</span>
          <span class="chip-user">{{ h.username }}</span>
          <span class="chip-del" @click.stop="removeHistory(h.username)">×</span>
        </div>
      </div>
    </div>

    <div class="login-card">
      <div class="input-group">
        <label>用户名</label>
        <div class="input-wrap">
          <input v-model="form.username" type="text" placeholder="输入用户名" @keyup.enter="doLogin" />
        </div>
      </div>
      <div class="input-group">
        <label>密码</label>
        <div class="input-wrap">
          <input v-model="form.password" type="password" placeholder="输入密码" @keyup.enter="doLogin" />
        </div>
      </div>
      <p v-if="error" class="error-tip">{{ error }}</p>
      <button class="login-btn" :class="{ loading }" :disabled="loading" @click="doLogin">
        <span class="btn-content">
          <span v-if="loading" class="spinner"></span>
          {{ loading ? '登录中…' : layout.loginBtn }}
        </span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { login } from '../../api/orderAuth.js'
import { getPublicLayoutConfig, getLayoutConfig } from '../../api/orderConfig.js'
import { useOrderAuthStore } from '../../stores/orderAuth.js'
import { useLayoutConfigStore } from '../../stores/layoutConfig.js'

const router = useRouter()
const route = useRoute()
const authStore = useOrderAuthStore()
const layoutStore = useLayoutConfigStore()
const layout = computed(() => layoutStore.config)

const form = ref({ username: '', password: '' })
const error = ref('')
const loading = ref(false)

const HISTORY_KEY = 'order_login_history'
const historyList = ref([])

function loadHistory() {
  try {
    historyList.value = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]')
  } catch {
    historyList.value = []
  }
}

function saveHistory(resp, password) {
  const h = { username: form.value.username, password, nickname: resp.nickname || '' }
  let list = historyList.value.filter(x => x.username !== h.username)
  list.unshift(h)
  if (list.length > 5) list = list.slice(0, 5)
  historyList.value = list
  localStorage.setItem(HISTORY_KEY, JSON.stringify(list))
}

function fillHistory(h) {
  form.value.username = h.username
  form.value.password = h.password
}

function removeHistory(username) {
  historyList.value = historyList.value.filter(x => x.username !== username)
  localStorage.setItem(HISTORY_KEY, JSON.stringify(historyList.value))
}

async function doLogin() {
  if (!form.value.username || !form.value.password) {
    error.value = '请输入用户名和密码'
    return
  }
  error.value = ''
  loading.value = true
  try {
    const resp = await login(form.value.username, form.value.password)
    saveHistory(resp, form.value.password)
    authStore.setAuth(resp)
    // Load layout config after login
    try {
      const cfg = await getLayoutConfig()
      if (cfg) layoutStore.setConfig(cfg)
    } catch {}
    if (resp.role <= 1) router.push('/order/admin/orders')
    else router.push('/order/menu')
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  loadHistory()
  // 读 ?tenantId= 参数，无需登录直接拉对应租户的配置
  const urlTenantId = route.query.tenantId ? Number(route.query.tenantId) : null
  const storedTenantId = localStorage.getItem('order_login_tenant_id')
  const tenantId = urlTenantId || (storedTenantId ? Number(storedTenantId) : 1)
  if (urlTenantId) localStorage.setItem('order_login_tenant_id', String(urlTenantId))
  // URL 里有 tenantId 时强制重拉（避免之前缓存了其他租户的配置）
  if (urlTenantId || !layoutStore.loaded) {
    try {
      const cfg = await getPublicLayoutConfig(tenantId)
      if (cfg) layoutStore.setConfig(cfg)
    } catch {}
  }
})
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  background: #f2f2f7;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
  position: relative;
  overflow: hidden;
}

.glow {
  position: absolute;
  border-radius: 50%;
  filter: blur(60px);
  pointer-events: none;
  animation: floatGlow 6s ease-in-out infinite alternate;
}
.glow-1 {
  width: 280px; height: 280px;
  background: radial-gradient(circle, rgba(201,107,126,0.18) 0%, transparent 70%);
  top: -60px; left: -60px;
  animation-delay: 0s;
}
.glow-2 {
  width: 220px; height: 220px;
  background: radial-gradient(circle, rgba(201,107,126,0.12) 0%, transparent 70%);
  bottom: 40px; right: -40px;
  animation-delay: -3s;
}
@keyframes floatGlow {
  from { transform: translate(0, 0) scale(1); }
  to   { transform: translate(16px, 20px) scale(1.08); }
}

.login-hero {
  text-align: center;
  margin-bottom: 20px;
  animation: heroIn 0.6s cubic-bezier(0.34,1.56,0.64,1) both;
}
@keyframes heroIn {
  from { opacity: 0; transform: translateY(-20px) scale(0.92); }
  to   { opacity: 1; transform: none; }
}
.hero-emoji {
  font-size: 68px;
  margin-bottom: 10px;
  display: inline-block;
  animation: emojiWiggle 2.4s ease-in-out infinite;
  filter: drop-shadow(0 4px 12px rgba(201,107,126,0.22));
}
@keyframes emojiWiggle {
  0%,100% { transform: rotate(-4deg) scale(1); }
  50%      { transform: rotate(4deg) scale(1.06); }
}
.hero-title {
  font-size: 22px;
  font-weight: 800;
  color: #1c1c1e;
  letter-spacing: 0.2px;
  margin: 0 0 6px;
  line-height: 1.3;
}
.hero-sub {
  font-size: 14px;
  color: #6d6d72;
  margin-top: 4px;
}

/* 历史登录 */
.history-section {
  width: 100%;
  max-width: 360px;
  margin-bottom: 12px;
}
.history-label {
  font-size: 11px;
  color: #aeaeb2;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 8px;
}
.history-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.history-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: rgba(255,255,255,0.85);
  border: 1px solid rgba(229,229,234,0.8);
  border-radius: 20px;
  padding: 6px 12px;
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;
}
.history-chip:hover { border-color: #c96b7e; background: #fef4f5; }
.chip-nick { font-size: 13px; font-weight: 600; color: #1c1c1e; }
.chip-user { font-size: 11px; color: #aeaeb2; }
.chip-del {
  font-size: 14px;
  color: #aeaeb2;
  line-height: 1;
  margin-left: 2px;
  transition: color 0.15s;
}
.chip-del:hover { color: #ff3b30; }

.login-card {
  background: rgba(255, 255, 255, 0.86);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border-radius: 24px;
  padding: 28px 22px;
  width: 100%;
  max-width: 360px;
  box-shadow:
    0 2px 24px rgba(0,0,0,0.07),
    0 0 0 1px rgba(255,255,255,0.9) inset,
    0 1px 0 rgba(255,255,255,0.6) inset;
  animation: cardIn 0.55s cubic-bezier(0.34,1.56,0.64,1) 0.1s both;
}
@keyframes cardIn {
  from { opacity: 0; transform: translateY(24px) scale(0.96); }
  to   { opacity: 1; transform: none; }
}

.input-group { margin-bottom: 16px; }
.input-group label {
  display: block;
  font-size: 12px;
  color: #6d6d72;
  font-weight: 700;
  margin-bottom: 7px;
  letter-spacing: 0.4px;
  text-transform: uppercase;
}
.input-wrap {
  border-radius: 12px;
  background: #f7f7f9;
  transition: box-shadow 0.22s, background 0.22s;
}
.input-wrap:focus-within {
  background: #fff;
  box-shadow: 0 0 0 2px #c96b7e, 0 2px 12px rgba(201,107,126,0.12);
}
.input-wrap input {
  width: 100%;
  padding: 13px 14px;
  border-radius: 12px;
  border: none;
  font-size: 15px;
  outline: none;
  box-sizing: border-box;
  color: #1c1c1e;
  background: transparent;
}

.error-tip {
  color: #e53935;
  font-size: 12px;
  margin: -6px 0 12px;
  animation: shake 0.4s cubic-bezier(0.36,0.07,0.19,0.97);
}
@keyframes shake {
  10%,90%  { transform: translateX(-2px); }
  20%,80%  { transform: translateX(3px); }
  30%,50%,70% { transform: translateX(-4px); }
  40%,60%  { transform: translateX(4px); }
}

.login-btn {
  width: 100%;
  padding: 14px;
  background: #c96b7e;
  color: #fff;
  border: none;
  border-radius: 22px;
  font-size: 16px;
  font-weight: 700;
  letter-spacing: 0.4px;
  cursor: pointer;
  margin-top: 4px;
  transition: transform 0.15s cubic-bezier(0.34,1.56,0.64,1), opacity 0.15s, box-shadow 0.15s;
  box-shadow: 0 4px 16px rgba(201,107,126,0.32);
  position: relative;
  overflow: hidden;
}
.login-btn::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(255,255,255,0.12) 0%, transparent 60%);
  border-radius: inherit;
}
.login-btn:active:not(:disabled) {
  transform: scale(0.96);
  box-shadow: 0 2px 8px rgba(201,107,126,0.2);
}
.login-btn:disabled { opacity: 0.55; cursor: not-allowed; }
.btn-content { display: flex; align-items: center; justify-content: center; gap: 8px; }
.spinner {
  width: 16px; height: 16px;
  border: 2px solid rgba(255,255,255,0.4);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
  flex-shrink: 0;
}
@keyframes spin { to { transform: rotate(360deg); } }
</style>
