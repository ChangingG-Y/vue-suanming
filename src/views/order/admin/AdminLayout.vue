<template>
  <div class="admin-app">
    <div class="admin-header">
      <span>🍱 小新补给站 管理</span>
      <div style="display:flex;align-items:center;gap:12px;">
        <span class="admin-nick">{{ nickname }}</span>
        <span class="logout-btn" title="退出登录" @click="doLogout">⏏︎</span>
      </div>
    </div>
    <RouterView style="padding-bottom:60px;" />
    <van-tabbar v-model="active" active-color="#c96b7e" inactive-color="#aeaeb2">
      <van-tabbar-item icon="orders-o" @click="$router.push('/order/admin/orders')">订单管理</van-tabbar-item>
      <van-tabbar-item icon="column" @click="$router.push('/order/admin/dishes')">菜品管理</van-tabbar-item>
      <van-tabbar-item icon="apps-o" @click="$router.push('/order/admin/categories')">分类管理</van-tabbar-item>
      <van-tabbar-item icon="setting-o" @click="$router.push('/order/admin/ai-config')">AI配置</van-tabbar-item>
    </van-tabbar>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { RouterView, useRoute, useRouter } from 'vue-router'
import { useOrderAuthStore } from '../../../stores/orderAuth.js'

const authStore = useOrderAuthStore()
const nickname = authStore.nickname
const route = useRoute()
const router = useRouter()
const active = ref(0)

function doLogout() {
  authStore.clearAuth()
  router.push('/order/login')
}

watch(() => route.path, p => {
  if (p.includes('/ai-config')) active.value = 3
  else if (p.includes('/categories')) active.value = 2
  else if (p.includes('/dishes')) active.value = 1
  else active.value = 0
}, { immediate: true })
</script>

<style scoped>
.admin-app {
  background: #f2f2f7;
  min-height: 100vh;
}

.admin-header {
  background: rgba(255, 255, 255, 0.88);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(229, 229, 234, 0.7);
  padding: 14px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 700;
  font-size: 16px;
  color: #1c1c1e;
  position: sticky;
  top: 0;
  z-index: 10;
}

.admin-nick {
  font-size: 13px;
  color: #6d6d72;
}

.logout-btn {
  font-size: 18px;
  color: #aeaeb2;
  cursor: pointer;
  line-height: 1;
  transition: color 0.15s;
  user-select: none;
}

.logout-btn:hover {
  color: #c96b7e;
}
</style>
