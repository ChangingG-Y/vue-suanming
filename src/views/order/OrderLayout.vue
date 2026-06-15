<template>
  <div class="order-app">
    <RouterView />
    <van-tabbar v-model="active" active-color="#c96b7e" inactive-color="#aeaeb2">
      <van-tabbar-item @click="$router.push('/order/menu')">
        <template #icon>
          <span class="tab-icon" :class="{ 'tab-active': active === 0 }">🍱</span>
        </template>
        点饭饭
      </van-tabbar-item>
      <van-tabbar-item @click="$router.push('/order/orders')">
        <template #icon>
          <span class="tab-icon" :class="{ 'tab-active': active === 1 }">🍖</span>
        </template>
        小碗里
      </van-tabbar-item>
      <van-tabbar-item @click="$router.push('/order/history')">
        <template #icon>
          <span class="tab-icon" :class="{ 'tab-active': active === 2 }">📖</span>
        </template>
        干饭史
      </van-tabbar-item>
    </van-tabbar>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useRoute, RouterView } from 'vue-router'
import '../../assets/order.css'

const route = useRoute()
const active = ref(0)

watch(() => route.path, p => {
  if (p.includes('/menu')) active.value = 0
  else if (p.includes('/orders') && !p.includes('history')) active.value = 1
  else if (p.includes('/history')) active.value = 2
}, { immediate: true })
</script>

<style scoped>
.tab-icon {
  font-size: 20px;
  line-height: 1;
  display: inline-block;
  transition: transform 0.28s cubic-bezier(0.34,1.56,0.64,1), filter 0.2s;
  filter: grayscale(30%);
}
.tab-active {
  transform: translateY(-2px) scale(1.22);
  filter: grayscale(0%);
  animation: tabBounce 0.32s cubic-bezier(0.34,1.56,0.64,1);
}
@keyframes tabBounce {
  0%   { transform: translateY(-2px) scale(0.85); }
  60%  { transform: translateY(-4px) scale(1.28); }
  100% { transform: translateY(-2px) scale(1.22); }
}
</style>
