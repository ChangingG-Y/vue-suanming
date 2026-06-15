<template>
  <div style="padding-bottom: 60px;">
    <!-- 顶部标题 -->
    <div class="page-header">我的点单</div>

    <!-- 加载中 -->
    <div v-if="loading" style="text-align:center;padding:40px;">
      <van-loading color="#c96b7e" size="24" />
    </div>

    <!-- 无订单 -->
    <div v-else-if="orders.length === 0" style="text-align:center;padding:60px 20px;color:#aeaeb2;">
      <div style="font-size:48px;">🍽️</div>
      <p style="margin-top:12px;font-size:14px;">今天还没有点单哦~</p>
      <button class="btn-primary" style="margin-top:16px;" @click="$router.push('/order/menu')">去点菜 →</button>
    </div>

    <!-- 订单列表 -->
    <div v-else>
      <div
        v-for="(order, i) in orders"
        :key="order.id"
        class="order-card"
        :style="{ animationDelay: i * 0.05 + 's' }"
        @click="$router.push(`/order/orders/${order.id}`)"
      >
        <!-- 订单头部 -->
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
          <div style="display:flex;align-items:center;gap:8px;">
            <span style="font-size:18px;">{{ MEAL_EMOJIS[order.mealType] }}</span>
            <span style="font-weight:700;font-size:15px;color:#1c1c1e;">{{ MEAL_NAMES[order.mealType] }}</span>
            <span v-if="order.isAddDish" class="tag-badge">加菜</span>
          </div>
          <span :class="`status-badge status-${order.state}`">{{ STATE_NAMES[order.state] }}</span>
        </div>

        <!-- 下单时间 -->
        <div style="font-size:12px;color:#aeaeb2;margin-bottom:8px;">{{ formatTime(order.createdAt) }} · 点开看详情</div>

        <!-- 菜品列表 -->
        <div style="background:#f2f2f7;border-radius:10px;padding:8px 10px;margin-bottom:10px;">
          <div v-for="item in order.items" :key="item.dishId" style="display:flex;justify-content:space-between;font-size:13px;padding:3px 0;color:#1c1c1e;">
            <span>{{ item.dishName }}</span>
            <span style="color:#aeaeb2;">× {{ item.quantity }}</span>
          </div>
        </div>

        <!-- 评价内容摘要（已完成且有评价时显示） -->
        <div v-if="order.state === 3 && order.hasReview && order.reviewContent" style="background:#fef4f5;border-radius:8px;padding:7px 10px;margin-bottom:10px;font-size:12px;color:#6d6d72;line-height:1.5;">
          "{{ order.reviewContent }}"
        </div>

        <!-- 总计 + 操作按钮 -->
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <span style="font-size:13px;color:#6d6d72;">共 {{ order.totalKiss || totalKissFromItems(order.items) }}个😘</span>

          <!-- 操作按钮 -->
          <div style="display:flex;gap:8px;align-items:center;">
            <!-- state==0：待接单，可撤单 -->
            <button
              v-if="order.state === 0"
              class="btn-cancel-order"
              @click.stop="openCancelConfirm(order)"
            >
              撤单
            </button>

            <!-- state==2：饭好了，显示支付按钮 -->
            <button
              v-if="order.state === 2"
              class="btn-primary"
              style="padding:7px 14px;font-size:13px;"
              @click.stop="openPayConfirm(order)"
            >
              饭好了！支付😘
            </button>

            <!-- state==3 且无评价：写评价 -->
            <button
              v-if="order.state === 3 && !order.hasReview"
              class="btn-outline"
              style="padding:7px 14px;font-size:13px;"
              @click.stop="$router.push(`/order/review/${order.id}`)"
            >
              写评价
            </button>

            <!-- state==3 且有评价：显示评分 -->
            <span v-if="order.state === 3 && order.hasReview" class="score-badge">
              {{ formatScore(order.reviewScore) }} 分
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- 支付确认弹窗 -->
    <van-dialog
      v-model:show="showPayConfirm"
      title="支付😘"
      show-cancel-button
      confirm-button-color="#c96b7e"
      @confirm="doComplete"
      @cancel="showPayConfirm = false"
    >
      <div style="padding:16px;text-align:center;">
        <p style="font-size:16px;color:#1c1c1e;">
          要支付 {{ currentOrder?.totalKiss || totalKissFromItems(currentOrder?.items) }}个😘 吗？
        </p>
        <p style="font-size:13px;color:#6d6d72;margin-top:8px;">（就是真的😘哦）</p>
      </div>
    </van-dialog>

    <!-- 撤单确认弹窗 -->
    <van-dialog
      v-model:show="showCancelConfirm"
      title="撤单"
      message="撤单后菜品会恢复到购物车，可以重新修改后下单"
      show-cancel-button
      confirm-button-text="确认撤单"
      confirm-button-color="#ff3b30"
      @confirm="doCancel"
      @cancel="showCancelConfirm = false"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { getMyOrders, completeOrder, cancelOrder } from '../../api/orderApi.js'
import { useCartStore } from '../../stores/cart.js'
import { MEAL_NAMES, MEAL_EMOJIS, STATE_NAMES } from '../../utils/mealType.js'
import { showToast } from 'vant'

const router = useRouter()
const cart = useCartStore()
const orders = ref([])
const loading = ref(true)
const showPayConfirm = ref(false)
const showCancelConfirm = ref(false)
const currentOrder = ref(null)
let timer = null

function formatTime(ts) {
  if (!ts) return ''
  const d = new Date(ts * 1000)  // 秒级时间戳转毫秒
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function totalKissFromItems(items) {
  if (!items) return 0
  return items.reduce((s, i) => s + (i.itemPrice || i.price || 0) * i.quantity, 0)
}

function formatScore(score) {
  if (score === null || score === undefined || score === '') return ''
  return Number(score).toFixed(1).replace(/\.0$/, '')
}

async function loadOrders() {
  try {
    const data = await getMyOrders()
    // 筛选今天的订单
    const today = new Date()
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
    orders.value = (data || []).filter(o => {
      // orderDate 是 "2026-06-15" 格式字符串，直接比较
      if (!o.orderDate) return true
      return o.orderDate === todayStr
    })
  } catch (e) {
    if (loading.value) showToast({ message: e.message, type: 'fail' })
  } finally {
    loading.value = false
  }
}

function openPayConfirm(order) {
  currentOrder.value = order
  showPayConfirm.value = true
}

function openCancelConfirm(order) {
  currentOrder.value = order
  showCancelConfirm.value = true
}

async function doCancel() {
  if (!currentOrder.value) return
  try {
    await cancelOrder(currentOrder.value.id)
    // 恢复购物车
    cart.restoreFromOrderItems(currentOrder.value.items)
    showToast({ message: '已撤单，菜品已还原到购物车', type: 'success' })
    await loadOrders()
    router.push('/order/menu')
  } catch (e) {
    showToast({ message: e.message, type: 'fail' })
  }
  showCancelConfirm.value = false
}

async function doComplete() {
  if (!currentOrder.value) return
  try {
    await completeOrder(currentOrder.value.id)
    showToast({ message: '支付成功，谢谢宝贝！', type: 'success' })
    await loadOrders()
  } catch (e) {
    showToast({ message: e.message, type: 'fail' })
  }
  showPayConfirm.value = false
}

onMounted(() => {
  loadOrders()
  timer = setInterval(loadOrders, 10000)
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})
</script>

<style scoped>
.page-header {
  background: rgba(255, 255, 255, 0.88);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-bottom: 1px solid rgba(229, 229, 234, 0.6);
  padding: 14px 16px;
  font-weight: 700;
  font-size: 17px;
  color: #1c1c1e;
  position: sticky;
  top: 0;
  z-index: 5;
}

.order-card {
  background: #ffffff;
  border-radius: 18px;
  margin: 8px 12px;
  padding: 14px 16px;
  box-shadow: 0 1px 6px rgba(0, 0, 0, 0.06), 0 0 0 0.5px rgba(0,0,0,0.03);
  animation: cardSlideUp 0.38s cubic-bezier(0.34,1.56,0.64,1) both;
  transition: transform 0.15s;
}
.order-card:active { transform: scale(0.988); }
@keyframes cardSlideUp {
  from { opacity: 0; transform: translateY(16px) scale(0.97); }
  to   { opacity: 1; transform: none; }
}

.tag-badge {
  display: inline-block;
  background: #fef4f5;
  color: #c96b7e;
  border-radius: 20px;
  font-size: 11px;
  padding: 2px 9px;
  font-weight: 700;
}

.score-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 50px;
  border-radius: 999px;
  background: #fef4f5;
  color: #c96b7e;
  font-size: 13px;
  font-weight: 800;
  padding: 5px 10px;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  border-radius: 20px;
  padding: 3px 10px;
  font-size: 12px;
  font-weight: 700;
}
.status-badge::before {
  content: '';
  width: 6px; height: 6px;
  border-radius: 50%;
  background: currentColor;
  flex-shrink: 0;
}
.status-0 { background: #fff8ed; color: #ff9f0a; }
.status-1 { background: #edfaf2; color: #34c759; }
.status-2 { background: #fef0f4; color: #c96b7e; }
.status-3 { background: #f5f5f7; color: #aeaeb2; }

/* 待接单 badge 脉冲 */
.status-0::before { animation: pulse 1.6s ease-in-out infinite; }
@keyframes pulse {
  0%,100% { opacity: 1; transform: scale(1); }
  50%      { opacity: 0.4; transform: scale(0.7); }
}

.btn-primary {
  background: #c96b7e;
  color: #fff;
  border: none;
  border-radius: 22px;
  padding: 8px 18px;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.3px;
  cursor: pointer;
  box-shadow: 0 3px 10px rgba(201,107,126,0.26);
  transition: transform 0.15s cubic-bezier(0.34,1.56,0.64,1);
}
.btn-primary:active { transform: scale(0.93); }

.btn-outline {
  background: transparent;
  color: #c96b7e;
  border: 1.5px solid #c96b7e;
  border-radius: 22px;
  padding: 7px 14px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.15s, transform 0.15s cubic-bezier(0.34,1.56,0.64,1);
}
.btn-outline:hover { background: #fef4f5; }
.btn-outline:active { transform: scale(0.93); }

.btn-cancel-order {
  background: transparent;
  color: #aeaeb2;
  border: 1px solid #e5e5ea;
  border-radius: 22px;
  padding: 6px 12px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: color 0.15s, border-color 0.15s;
}
.btn-cancel-order:hover { color: #ff3b30; border-color: #ff3b30; }
</style>
