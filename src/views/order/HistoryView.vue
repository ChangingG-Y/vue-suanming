<template>
  <div style="padding-bottom:60px;">
    <div class="page-header">历史账单</div>

    <!-- 统计条 -->
    <div v-if="stats" class="stats-bar">
      <div style="flex:1;text-align:center;border-right:1px solid #e5e5ea;">
        <div style="font-size:20px;font-weight:800;color:#c96b7e;">{{ stats.totalKiss }}</div>
        <div style="font-size:11px;color:#aeaeb2;margin-top:2px;">累计😘</div>
      </div>
      <div style="flex:1;text-align:center;border-right:1px solid #e5e5ea;">
        <div style="font-size:20px;font-weight:800;color:#c96b7e;">{{ stats.totalDays }}</div>
        <div style="font-size:11px;color:#aeaeb2;margin-top:2px;">累计天数</div>
      </div>
      <div style="flex:1;text-align:center;">
        <div style="font-size:20px;font-weight:800;color:#c96b7e;">{{ stats.maxDayKiss }}</div>
        <div style="font-size:11px;color:#aeaeb2;margin-top:2px;">最高单日</div>
      </div>
    </div>

    <div v-if="loading" style="text-align:center;padding:40px;">
      <van-loading color="#c96b7e" />
    </div>

    <div v-else-if="historyDays.length === 0" style="text-align:center;padding:60px;color:#aeaeb2;">
      <div style="font-size:48px;">📋</div>
      <p style="margin-top:12px;font-size:14px;">还没有历史账单哦~</p>
    </div>

    <!-- 按天显示 -->
    <div v-else>
      <div v-for="(day, idx) in historyDays" :key="day.date" style="margin:8px 12px;" :style="{ animationDelay: idx * 0.05 + 's' }" class="day-card-wrap">
        <div
          class="day-card"
          @click="toggleDay(idx)"
        >
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <div>
              <div style="font-size:16px;font-weight:700;color:#1c1c1e;">{{ formatDate(day.date) }}</div>
              <div style="font-size:12px;color:#aeaeb2;margin-top:2px;">{{ day.orders.length }} 笔点单</div>
            </div>
            <div style="text-align:right;">
              <div style="font-size:18px;font-weight:800;color:#c96b7e;">{{ dayTotal(day.orders) }}个😘</div>
            </div>
          </div>

          <!-- 展开内容 -->
          <div v-if="expandedDays.has(idx)" style="margin-top:10px;border-top:1px solid #e5e5ea;padding-top:10px;">
            <div
              v-for="order in day.orders"
              :key="order.id"
              style="margin-bottom:10px;padding:10px;background:#f2f2f7;border-radius:10px;"
              @click.stop="router.push(`/order/orders/${order.id}`)"
            >
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                <span style="font-weight:600;color:#1c1c1e;">{{ MEAL_EMOJIS[order.mealType] }} {{ MEAL_NAMES[order.mealType] }}</span>
                <span :class="`status-badge status-${order.state}`">{{ STATE_NAMES[order.state] }}</span>
              </div>
              <div v-for="item in order.items" :key="item.dishId" style="font-size:12px;color:#6d6d72;display:flex;justify-content:space-between;padding:2px 0;">
                <span>{{ item.dishName }}</span>
                <span>× {{ item.quantity }}</span>
              </div>
              <div style="display:flex;justify-content:space-between;margin-top:6px;align-items:center;">
                <span style="font-size:12px;color:#c96b7e;font-weight:600;">小计：{{ order.totalKiss }}个😘</span>
                <div v-if="order.reviewScore" class="score-badge">
                  {{ formatScore(order.reviewScore) }} 分
                </div>
              </div>
              <div v-if="order.reviewContent" style="margin-top:6px;font-size:12px;color:#6d6d72;background:#fef4f5;border-radius:8px;padding:6px 10px;line-height:1.5;">
                "{{ order.reviewContent }}"
              </div>
              <div style="font-size:11px;color:#aeaeb2;margin-top:4px;text-align:right;">点开看详情</div>
            </div>
          </div>

          <div style="text-align:center;margin-top:6px;color:#aeaeb2;font-size:12px;">
            {{ expandedDays.has(idx) ? '▲ 收起' : '▼ 展开' }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getOrderHistory } from '../../api/orderApi.js'
import { MEAL_NAMES, MEAL_EMOJIS, STATE_NAMES } from '../../utils/mealType.js'
import { showToast } from 'vant'

const router = useRouter()
const historyDays = ref([])
const loading = ref(true)
const expandedDays = ref(new Set())

const stats = computed(() => {
  if (historyDays.value.length === 0) return null
  let totalKiss = 0
  let maxDayKiss = 0
  historyDays.value.forEach(day => {
    const dayKiss = dayTotal(day.orders)
    totalKiss += dayKiss
    if (dayKiss > maxDayKiss) maxDayKiss = dayKiss
  })
  return {
    totalKiss,
    totalDays: historyDays.value.length,
    maxDayKiss
  }
})

function dayTotal(orders) {
  return orders.reduce((s, o) => s + (o.totalKiss || 0), 0)
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  return `${d.getMonth() + 1}月${d.getDate()}日 ${days[d.getDay()]}`
}

function formatScore(score) {
  if (score === null || score === undefined || score === '') return ''
  return Number(score).toFixed(1).replace(/\.0$/, '')
}

function toggleDay(idx) {
  if (expandedDays.value.has(idx)) {
    expandedDays.value.delete(idx)
  } else {
    expandedDays.value.add(idx)
  }
  // 触发响应式更新
  expandedDays.value = new Set(expandedDays.value)
}

onMounted(async () => {
  try {
    const data = await getOrderHistory()
    if (Array.isArray(data)) {
      historyDays.value = data
    } else {
      historyDays.value = []
    }
    // 默认展开前3天
    for (let i = 0; i < Math.min(3, historyDays.value.length); i++) {
      expandedDays.value.add(i)
    }
  } catch (e) {
    showToast({ message: e.message, type: 'fail' })
  }
  loading.value = false
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

.stats-bar {
  display: flex;
  background: #ffffff;
  margin: 10px 12px;
  border-radius: 18px;
  padding: 16px;
  box-shadow: 0 1px 6px rgba(0,0,0,0.06), 0 0 0 0.5px rgba(0,0,0,0.03);
  animation: cardSlideUp 0.38s cubic-bezier(0.34,1.56,0.64,1) both;
}

.day-card-wrap {
  animation: cardSlideUp 0.38s cubic-bezier(0.34,1.56,0.64,1) both;
}
@keyframes cardSlideUp {
  from { opacity: 0; transform: translateY(14px) scale(0.97); }
  to   { opacity: 1; transform: none; }
}

.day-card {
  background: #ffffff;
  border-radius: 18px;
  padding: 14px 16px;
  box-shadow: 0 1px 6px rgba(0,0,0,0.06), 0 0 0 0.5px rgba(0,0,0,0.03);
  cursor: pointer;
  transition: transform 0.16s cubic-bezier(0.34,1.56,0.64,1);
}

.score-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 50px;
  border-radius: 999px;
  background: #ffffff;
  color: #c96b7e;
  font-size: 13px;
  font-weight: 800;
  padding: 4px 9px;
}
.day-card:active { transform: scale(0.986); }

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  border-radius: 20px;
  padding: 2px 8px;
  font-size: 11px;
  font-weight: 700;
}
.status-badge::before {
  content: '';
  width: 5px; height: 5px;
  border-radius: 50%;
  background: currentColor;
  flex-shrink: 0;
}
.status-0 { background: #fff8ed; color: #ff9f0a; }
.status-1 { background: #edfaf2; color: #34c759; }
.status-2 { background: #fef0f4; color: #c96b7e; }
.status-3 { background: #f5f5f7; color: #aeaeb2; }
</style>
