<template>
  <div class="login-page">
    <!-- 装饰光晕 -->
    <div class="glow glow-1"></div>
    <div class="glow glow-2"></div>

    <div class="login-hero">
      <div class="hero-emoji">🍱</div>
      <h1 class="hero-title">小新补给站🍱(๑´ڡ`๑)</h1>
      <p class="hero-sub">今天想吃点什么呀~</p>
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
          {{ loading ? '登录中…' : '进入小新补给站' }}
        </span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { login } from '../../api/orderAuth.js'
import { useOrderAuthStore } from '../../stores/orderAuth.js'

const router = useRouter()
const authStore = useOrderAuthStore()
const form = ref({ username: '', password: '' })
const error = ref('')
const loading = ref(false)

async function doLogin() {
  if (!form.value.username || !form.value.password) {
    error.value = '请输入用户名和密码'
    return
  }
  error.value = ''
  loading.value = true
  try {
    const resp = await login(form.value.username, form.value.password)
    authStore.setAuth(resp)
    if (resp.role === 1) router.push('/order/admin/orders')
    else router.push('/order/menu')
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
/* ── 页面背景 ── */
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

/* ── 动态光晕 ── */
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

/* ── Hero ── */
.login-hero {
  text-align: center;
  margin-bottom: 28px;
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

/* ── 卡片 ── */
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

/* ── 输入框 ── */
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

/* ── 错误提示 ── */
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

/* ── 登录按钮 ── */
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

/* loading spinner */
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
