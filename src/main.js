import './assets/main.css'
import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import { createPinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import Vant from 'vant'
import 'vant/lib/index.css'
import App from './App.vue'

const router = createRouter({
  history: createWebHistory('/suanming/'),
  routes: [
    { path: '/', component: () => import('./views/SuanmingHome.vue') },
    { path: '/order/login', component: () => import('./views/order/LoginView.vue') },
    {
      path: '/order',
      component: () => import('./views/order/OrderLayout.vue'),
      meta: { requiresOrderAuth: true },
      children: [
        { path: 'menu', component: () => import('./views/order/MenuView.vue') },
        { path: 'orders', component: () => import('./views/order/OrdersView.vue') },
        { path: 'orders/:id', component: () => import('./views/order/OrderDetailView.vue') },
        { path: 'review/:orderId', component: () => import('./views/order/ReviewView.vue') },
        { path: 'history', component: () => import('./views/order/HistoryView.vue') },
        { path: 'profile', component: () => import('./views/order/ProfileView.vue') },
      ]
    },
    {
      path: '/order/admin',
      component: () => import('./views/order/admin/AdminLayout.vue'),
      meta: { requiresAdmin: true },
      children: [
        { path: '', redirect: '/order/admin/orders' },
        { path: 'orders', component: () => import('./views/order/admin/AdminOrdersView.vue') },
        { path: 'dishes', component: () => import('./views/order/admin/AdminDishesView.vue') },
        { path: 'categories', component: () => import('./views/order/admin/AdminCategoriesView.vue') },
        { path: 'ai-config', component: () => import('./views/order/admin/AdminAiConfigView.vue') },
        { path: 'layout-config', component: () => import('./views/order/admin/LayoutConfigView.vue') },
        { path: 'profile', component: () => import('./views/order/admin/AdminProfileView.vue') },
        { path: 'super', component: () => import('./views/order/admin/SuperAdminView.vue'), meta: { requiresSuperAdmin: true } },
      ]
    },
  ]
})

router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('order_token')
  const role = parseInt(localStorage.getItem('order_role') ?? '2')
  if (to.meta.requiresSuperAdmin) {
    if (!token) return next('/order/login')
    if (role !== 0) return next('/order/admin/orders')
  } else if (to.meta.requiresAdmin) {
    if (!token) return next('/order/login')
    if (role > 1) return next('/order/menu')
  } else if (to.meta.requiresOrderAuth) {
    if (!token) return next('/order/login')
    // admins accessing user routes → redirect to admin equivalent
    if (role <= 1 && to.path === '/order/profile') return next('/order/admin/profile')
    if (role <= 1 && to.path === '/order/menu') return next('/order/admin/orders')
  }
  next()
})

// 注册 Service Worker（PWA 安装条件）
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/suanming/sw.js').catch(() => {})
}

const app = createApp(App)
const pinia = createPinia()

app.use(ElementPlus)
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}
app.use(pinia)
app.use(router)
app.use(Vant)
app.mount('#app')
