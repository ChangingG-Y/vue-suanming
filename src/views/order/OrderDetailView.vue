<template>
  <div style="padding-bottom:60px;background:#f2f2f7;min-height:100vh;">
    <div class="page-header" style="display:flex;align-items:center;gap:10px;">
      <span style="cursor:pointer;font-size:18px;color:#c96b7e;" @click="$router.back()">←</span>
      <span>订单详情</span>
    </div>

    <div v-if="loading" style="text-align:center;padding:40px;">
      <van-loading color="#c96b7e" />
    </div>

    <div v-else-if="order" style="padding:12px;">
      <!-- 状态卡片 -->
      <div class="order-card" style="text-align:center;padding:20px;">
        <div style="font-size:36px;margin-bottom:8px;">
          {{ order.state === 0 ? '⏳' : order.state === 1 ? '🍳' : order.state === 2 ? '🍽️' : '✅' }}
        </div>
        <div :class="`status-badge status-${order.state}`" style="font-size:15px;padding:6px 18px;">
          {{ STATE_NAMES[order.state] }}
        </div>
        <div style="margin-top:8px;font-size:13px;color:#6d6d72;">
          {{ MEAL_EMOJIS[order.mealType] }} {{ MEAL_NAMES[order.mealType] }}
          <span v-if="order.isAddDish" class="tag-badge" style="margin-left:6px;">加菜</span>
        </div>
      </div>

      <!-- 菜品详情 -->
      <div class="order-card">
        <div style="font-weight:700;color:#1c1c1e;margin-bottom:10px;">菜品清单</div>
        <div v-for="item in order.items" :key="item.dishId" style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #e5e5ea;">
          <span style="color:#1c1c1e;">{{ item.dishName }}</span>
          <span style="color:#aeaeb2;">× {{ item.quantity }}</span>
        </div>
        <div style="display:flex;justify-content:space-between;margin-top:10px;font-weight:700;">
          <span style="color:#1c1c1e;">合计</span>
          <span style="color:#c96b7e;">{{ order.totalKiss }}个😘</span>
        </div>
      </div>

      <!-- 备注 -->
      <div v-if="order.remark" class="order-card">
        <div style="font-weight:700;color:#1c1c1e;margin-bottom:6px;">备注</div>
        <div style="color:#6d6d72;font-size:14px;">{{ order.remark }}</div>
      </div>

      <!-- 时间信息 -->
      <div class="order-card">
        <div style="font-size:13px;color:#6d6d72;">
          <div>下单时间：{{ formatTime(order.createdAt) }}</div>
          <div v-if="order.acceptedAt" style="margin-top:4px;">接单时间：{{ formatTime(order.acceptedAt) }}</div>
          <div v-if="order.servedAt" style="margin-top:4px;">出餐时间：{{ formatTime(order.servedAt) }}</div>
          <div v-if="order.completedAt" style="margin-top:4px;">完成时间：{{ formatTime(order.completedAt) }}</div>
        </div>
      </div>

      <!-- 评价 -->
      <div v-if="order.review" class="order-card">
        <div style="font-weight:700;color:#1c1c1e;margin-bottom:8px;">我的评价</div>
        <div style="font-size:20px;margin-bottom:6px;">
          <span v-for="i in 10" :key="i">{{ i <= order.review.score ? '💗' : '🤍' }}</span>
        </div>
        <div style="font-size:13px;color:#6d6d72;">{{ order.review.content }}</div>
      </div>

      <!-- 操作按钮 -->
      <div style="padding:0 12px;">
        <button
          v-if="order.state === 2"
          class="btn-primary"
          style="width:100%;padding:13px;"
          @click="openPayConfirm"
        >
          饭好了！支付😘
        </button>
        <button
          v-if="order.state === 3 && !order.review"
          class="btn-outline"
          style="width:100%;padding:13px;margin-top:8px;"
          @click="$router.push(`/order/review/${order.id}`)"
        >
          写评价
        </button>
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
        <p style="font-size:16px;color:#1c1c1e;">要支付 {{ order?.totalKiss }}个😘 吗？</p>
        <p style="font-size:13px;color:#6d6d72;margin-top:8px;">（就是真的😘哦）</p>
      </div>
    </van-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getOrderById, completeOrder } from '../../api/orderApi.js'
import { MEAL_NAMES, MEAL_EMOJIS, STATE_NAMES } from '../../utils/mealType.js'
import { showToast } from 'vant'

const route = useRoute()
const router = useRouter()
const order = ref(null)
const loading = ref(true)
const showPayConfirm = ref(false)

function formatTime(ts) {
  if (!ts) return ''
  const d = new Date(ts * 1000)
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

onMounted(async () => {
  try {
    order.value = await getOrderById(route.params.id)
  } catch (e) {
    showToast({ message: e.message, type: 'fail' })
  }
  loading.value = false
})

function openPayConfirm() {
  showPayConfirm.value = true
}

async function doComplete() {
  try {
    await completeOrder(order.value.id)
    showToast({ message: '支付成功！', type: 'success' })
    order.value = await getOrderById(route.params.id)
  } catch (e) {
    showToast({ message: e.message, type: 'fail' })
  }
}
</script>

<style scoped>
.page-header {
  background: rgba(255, 255, 255, 0.88);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(229, 229, 234, 0.7);
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
  border-radius: 14px;
  margin: 8px 0;
  padding: 14px 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
}

.tag-badge {
  display: inline-block;
  background: #fef4f5;
  color: #c96b7e;
  border-radius: 6px;
  font-size: 11px;
  padding: 2px 8px;
  font-weight: 600;
}

.status-badge {
  display: inline-block;
  border-radius: 8px;
  padding: 2px 10px;
  font-size: 12px;
  font-weight: 600;
}
.status-0 { background: #fff3e0; color: #ff9f0a; }
.status-1 { background: #e8f5e9; color: #34c759; }
.status-2 { background: #fce4ec; color: #c96b7e; }
.status-3 { background: #f5f5f5; color: #aeaeb2; }

.btn-primary {
  background: #c96b7e;
  color: #fff;
  border: none;
  border-radius: 22px;
  font-size: 15px;
  font-weight: 600;
  letter-spacing: 0.3px;
  cursor: pointer;
}

.btn-outline {
  background: transparent;
  color: #c96b7e;
  border: 1.5px solid #c96b7e;
  border-radius: 22px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
}
</style>
