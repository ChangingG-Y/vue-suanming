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
        </div>
      </div>

      <!-- 菜品详情（含缩略图） -->
      <div class="order-card">
        <div style="font-weight:700;color:#1c1c1e;margin-bottom:10px;">菜品清单</div>
        <div
          v-for="item in order.items"
          :key="item.id || item.dishId"
          style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid #f2f2f7;"
        >
          <!-- 缩略图 -->
          <div style="width:48px;height:48px;border-radius:10px;background:#fef4f5;flex-shrink:0;overflow:hidden;display:flex;align-items:center;justify-content:center;font-size:20px;">
            <img
              v-if="item.imageFileId"
              :src="thumbUrl(item.imageFileId)"
              style="width:48px;height:48px;object-fit:cover;"
            />
            <span v-else>🍽️</span>
          </div>
          <!-- 菜名 + 备注 -->
          <div style="flex:1;min-width:0;">
            <div style="color:#1c1c1e;font-size:14px;font-weight:500;">{{ item.dishName }}</div>
            <div v-if="item.remark" style="font-size:12px;color:#aeaeb2;margin-top:2px;">{{ item.remark }}</div>
          </div>
          <!-- 数量 + 价格 -->
          <div style="text-align:right;flex-shrink:0;">
            <div style="color:#aeaeb2;font-size:13px;">×{{ item.quantity }}</div>
            <div v-if="item.itemPrice !== null && item.itemPrice !== undefined" style="color:#c96b7e;font-size:12px;font-weight:600;">{{ item.itemPrice * item.quantity }}😘</div>
          </div>
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
        </div>
      </div>

      <!-- 评价（有评价时展示） -->
      <div v-if="order.review" class="order-card">
        <div style="font-weight:700;color:#1c1c1e;margin-bottom:12px;">我的评价</div>

        <!-- 分数气泡 -->
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:10px;">
          <div class="review-score-badge">
            <span class="review-score-num">{{ formatScore(order.review.score) }}</span>
            <span style="font-size:12px;color:rgba(255,255,255,0.85);font-weight:500;">分</span>
          </div>
          <div style="font-size:13px;color:#6d6d72;">{{ scoreLabel(order.review.score) }}</div>
        </div>

        <!-- 评价内容 -->
        <div v-if="order.review.content" style="font-size:14px;color:#3a3a3c;line-height:1.6;margin-bottom:10px;">
          {{ order.review.content }}
        </div>

        <!-- 评价图片 -->
        <div v-if="order.review.images && order.review.images.length" style="display:flex;gap:8px;flex-wrap:wrap;">
          <div
            v-for="(img, idx) in order.review.images"
            :key="idx"
            style="width:80px;height:80px;border-radius:10px;overflow:hidden;background:#fef4f5;"
          >
            <img
              :src="resolveFileUrl(img.thumbnailUrl || img.url)"
              style="width:80px;height:80px;object-fit:cover;cursor:pointer;"
              @click="previewImage(img.url)"
            />
          </div>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div style="padding:0 4px;">
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

    <!-- 图片预览弹窗 -->
    <van-popup v-model:show="showImagePreview" style="background:transparent;" @click="showImagePreview = false">
      <div style="max-width:100vw;max-height:100vh;display:flex;align-items:center;justify-content:center;padding:20px;">
        <img :src="previewUrl" style="max-width:90vw;max-height:85vh;border-radius:12px;object-fit:contain;" />
      </div>
    </van-popup>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { getOrderById, completeOrder } from '../../api/orderApi.js'
import { fileUrl, thumbUrl } from '../../api/orderFile.js'
import { MEAL_NAMES, MEAL_EMOJIS, STATE_NAMES } from '../../utils/mealType.js'
import { showToast } from 'vant'

const route = useRoute()
const order = ref(null)
const loading = ref(true)
const showPayConfirm = ref(false)
const showImagePreview = ref(false)
const previewUrl = ref('')

function formatTime(ts) {
  if (!ts) return ''
  const d = new Date(ts * 1000)
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function scoreLabel(s) {
  if (!s) return ''
  if (s <= 2) return '不太满意 😞'
  if (s <= 4) return '一般般 😐'
  if (s <= 6) return '还不错 🙂'
  if (s <= 8) return '很好吃！😊'
  if (s < 10) return '超级好吃！😍'
  return '满分小可爱！'
}

function formatScore(score) {
  if (score === null || score === undefined || score === '') return ''
  return Number(score).toFixed(1).replace(/\.0$/, '')
}

function resolveFileUrl(url) {
  if (!url) return ''
  if (/^https?:\/\//.test(url)) return url
  const match = String(url).match(/\/order\/file\/(\d+)(\/thumbnail)?$/)
  if (!match) return url
  return match[2] ? thumbUrl(match[1]) : fileUrl(match[1])
}

function previewImage(url) {
  previewUrl.value = resolveFileUrl(url)
  showImagePreview.value = true
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
  margin: 0 0 10px;
  padding: 14px 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
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

/* 评价分数气泡 */
.review-score-badge {
  display: inline-flex;
  align-items: baseline;
  gap: 2px;
  background: linear-gradient(135deg, #c96b7e 0%, #e8829a 100%);
  border-radius: 20px;
  padding: 6px 14px;
  box-shadow: 0 2px 8px rgba(201, 107, 126, 0.3);
}

.review-score-num {
  font-size: 22px;
  font-weight: 800;
  color: #fff;
  font-variant-numeric: tabular-nums;
  letter-spacing: 0;
}

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
