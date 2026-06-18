<template>
  <div>
    <van-tabs v-model:active="activeTab" color="#c96b7e" title-active-color="#c96b7e">
      <van-tab title="待接单" name="0">
        <OrderList :orders="pendingOrders" state-label="pending" @accept="doAccept" @serve="doServe" @detail="openDetail" />
      </van-tab>
      <van-tab title="进行中" name="1">
        <OrderList :orders="activeOrders" state-label="active" @accept="doAccept" @serve="doServe" @detail="openDetail" />
      </van-tab>
      <van-tab title="历史" name="2">
        <OrderList :orders="doneOrders" state-label="done" @detail="openDetail" />
      </van-tab>
    </van-tabs>

    <!-- 订单详情弹窗 -->
    <van-popup v-model:show="showDetail" position="bottom" round :style="{ height: '85vh', display: 'flex', flexDirection: 'column' }">
      <div style="display:flex;justify-content:space-between;align-items:center;padding:14px 16px 10px;flex-shrink:0;border-bottom:1px solid #f2f2f7;">
        <span style="font-size:15px;font-weight:700;color:#1c1c1e;">订单详情</span>
        <span style="font-size:20px;cursor:pointer;color:#aeaeb2;" @click="showDetail = false">×</span>
      </div>

      <div style="flex:1;overflow-y:auto;padding:12px 16px;">
        <div v-if="detailLoading" style="text-align:center;padding:40px;">
          <van-loading color="#c96b7e" />
        </div>
        <template v-else-if="detailOrder">
          <!-- 头部信息 -->
          <div style="background:#fff;border-radius:14px;padding:14px;margin-bottom:10px;box-shadow:0 1px 3px rgba(0,0,0,0.06);">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
              <div style="display:flex;align-items:center;gap:6px;">
                <span style="font-size:18px;">{{ MEAL_EMOJIS[detailOrder.mealType] }}</span>
                <span style="font-weight:700;font-size:15px;color:#1c1c1e;">{{ MEAL_NAMES[detailOrder.mealType] }}</span>
                <span v-if="detailOrder.isAddDish" style="font-size:11px;background:#fef4f5;color:#c96b7e;border-radius:6px;padding:2px 8px;font-weight:600;">加菜</span>
              </div>
              <span style="font-size:12px;color:#aeaeb2;">{{ formatTime(detailOrder.createdAt) }}</span>
            </div>
            <div style="font-size:12px;color:#aeaeb2;">单号：{{ detailOrder.orderNo || detailOrder.id }}</div>
          </div>

          <!-- 菜品列表 -->
          <div style="background:#fff;border-radius:14px;padding:14px;margin-bottom:10px;box-shadow:0 1px 3px rgba(0,0,0,0.06);">
            <div style="font-size:13px;font-weight:700;color:#6d6d72;margin-bottom:10px;">点单内容</div>
            <div v-for="item in detailOrder.items" :key="item.dishId" style="padding:4px 0;border-bottom:1px solid #f2f2f7;">
              <div style="display:flex;justify-content:space-between;font-size:14px;color:#1c1c1e;">
                <span>{{ item.dishName }}</span>
                <span style="color:#aeaeb2;">× {{ item.quantity }}</span>
              </div>
              <div v-if="item.remark" style="font-size:12px;color:#c96b7e;margin-top:2px;">└ {{ item.remark }}</div>
            </div>
            <div style="display:flex;justify-content:flex-end;margin-top:10px;">
              <span style="font-size:14px;font-weight:700;color:#c96b7e;">合计 {{ detailOrder.totalKiss }}个😘</span>
            </div>
          </div>

          <!-- 整单备注 -->
          <div v-if="detailOrder.remark" style="background:#fff8ed;border-radius:14px;padding:12px 14px;margin-bottom:10px;font-size:13px;color:#6d6d72;line-height:1.6;">
            📝 {{ detailOrder.remark }}
          </div>

          <!-- 评价 -->
          <div v-if="detailOrder.hasReview" style="background:#fff;border-radius:14px;padding:14px;margin-bottom:10px;box-shadow:0 1px 3px rgba(0,0,0,0.06);">
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">
              <span style="font-size:13px;font-weight:700;color:#6d6d72;">用餐评价</span>
              <span style="background:#fef4f5;color:#c96b7e;border-radius:999px;padding:3px 10px;font-size:13px;font-weight:800;">{{ formatScore(detailOrder.reviewScore) }} 分</span>
            </div>
            <div v-if="detailOrder.reviewContent" style="font-size:13px;color:#1c1c1e;line-height:1.6;margin-bottom:10px;">"{{ detailOrder.reviewContent }}"</div>
            <!-- 评价图片 -->
            <div v-if="detailOrder.review && detailOrder.review.images && detailOrder.review.images.length" style="display:flex;gap:8px;flex-wrap:wrap;">
              <img
                v-for="(img, idx) in detailOrder.review.images"
                :key="idx"
                :src="resolveUrl(img.url)"
                style="width:80px;height:80px;object-fit:cover;border-radius:8px;cursor:pointer;"
                @click="previewReviewImages(idx)"
              />
            </div>
          </div>

          <!-- 操作按钮 -->
          <div v-if="detailOrder.state === 0 || (detailOrder.state === 1)" style="display:flex;gap:10px;margin-top:4px;">
            <button v-if="detailOrder.state === 0"
              style="flex:1;background:#c96b7e;color:#fff;border:none;border-radius:22px;padding:13px;font-size:15px;font-weight:600;cursor:pointer;"
              @click="doAcceptAndClose(detailOrder.id)">接单 ✅</button>
            <button v-if="detailOrder.state === 1"
              style="flex:1;background:#c96b7e;color:#fff;border:none;border-radius:22px;padding:13px;font-size:15px;font-weight:600;cursor:pointer;"
              @click="doServeAndClose(detailOrder.id)">出餐 🍳</button>
          </div>
        </template>
      </div>
    </van-popup>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, defineComponent, h } from 'vue'
import { getAdminOrders, getAdminOrderById, acceptOrder, serveOrder } from '../../../api/orderAdmin.js'
import { MEAL_NAMES, MEAL_EMOJIS, STATE_NAMES } from '../../../utils/mealType.js'
import { absImgUrl } from '../../../api/orderFile.js'
import { showToast, showImagePreview } from 'vant'

const allOrders = ref([])
const activeTab = ref('0')
let timer = null

const showDetail = ref(false)
const detailOrder = ref(null)
const detailLoading = ref(false)

const pendingOrders = computed(() => allOrders.value.filter(o => o.state === 0))
const activeOrders = computed(() => allOrders.value.filter(o => o.state === 1 || o.state === 2))
const doneOrders = computed(() => allOrders.value.filter(o => o.state === 3))

function resolveUrl(url) {
  return absImgUrl(url)
}

function formatTime(ts) {
  if (!ts) return ''
  const d = new Date(ts * 1000)
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function formatScore(score) {
  if (score === null || score === undefined || score === '') return ''
  return Number(score).toFixed(1).replace(/\.0$/, '')
}

async function loadAll() {
  try {
    const data = await getAdminOrders()
    allOrders.value = data || []
  } catch (e) {
    // 静默刷新失败
  }
}

async function openDetail(orderId) {
  showDetail.value = true
  detailLoading.value = true
  detailOrder.value = null
  try {
    detailOrder.value = await getAdminOrderById(orderId)
  } catch (e) {
    showToast({ message: e.message, type: 'fail' })
    showDetail.value = false
  } finally {
    detailLoading.value = false
  }
}

function previewReviewImages(startIdx) {
  const images = (detailOrder.value?.review?.images || []).map(img => resolveUrl(img.url))
  if (!images.length) return
  showImagePreview({ images, startPosition: startIdx, closeable: true })
}

async function doAccept(id) {
  try {
    await acceptOrder(id)
    showToast({ message: '已接单 ✅', type: 'success' })
    await loadAll()
  } catch (e) {
    showToast({ message: e.message, type: 'fail' })
  }
}

async function doServe(id) {
  try {
    await serveOrder(id)
    showToast({ message: '出餐成功 🍳', type: 'success' })
    await loadAll()
  } catch (e) {
    showToast({ message: e.message, type: 'fail' })
  }
}

async function doAcceptAndClose(id) {
  await doAccept(id)
  showDetail.value = false
}

async function doServeAndClose(id) {
  await doServe(id)
  showDetail.value = false
}

// 子组件：订单列表
const OrderList = defineComponent({
  props: {
    orders: { type: Array, default: () => [] },
    stateLabel: { type: String, default: '' },
  },
  emits: ['accept', 'serve', 'detail'],
  setup(props, { emit }) {
    return () => {
      if (props.orders.length === 0) {
        return h('div', { style: 'text-align:center;padding:40px;color:#aeaeb2;' }, [
          h('div', { style: 'font-size:36px;' }, '🍽️'),
          h('p', { style: 'margin-top:10px;font-size:13px;' }, '暂无订单')
        ])
      }

      return h('div', { style: 'padding:8px 12px;' },
        props.orders.map(order =>
          h('div', {
            key: order.id,
            style: 'background:#ffffff;border-radius:14px;padding:14px 16px;margin-bottom:10px;box-shadow:0 1px 3px rgba(0,0,0,0.06);cursor:pointer;',
            onClick: () => emit('detail', order.id)
          }, [
            // 头部
            h('div', { style: 'display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;' }, [
              h('div', { style: 'display:flex;align-items:center;gap:6px;' }, [
                h('span', { style: 'font-size:16px;' }, MEAL_EMOJIS[order.mealType]),
                h('span', { style: 'font-weight:700;color:#1c1c1e;' }, MEAL_NAMES[order.mealType]),
                order.isAddDish ? h('span', {
                  style: 'font-size:11px;background:#fef4f5;color:#c96b7e;border-radius:6px;padding:2px 8px;font-weight:600;'
                }, '加菜') : null,
              ]),
              h('span', { style: 'font-size:12px;color:#aeaeb2;' }, formatTime(order.createdAt)),
            ]),
            // 菜品（含单品备注）
            h('div', { style: 'background:#f2f2f7;border-radius:10px;padding:8px 10px;margin-bottom:8px;' },
              (order.items || []).map(item =>
                h('div', { key: item.dishId, style: 'padding:2px 0;' }, [
                  h('div', { style: 'display:flex;justify-content:space-between;font-size:13px;color:#1c1c1e;' }, [
                    h('span', null, item.dishName),
                    h('span', { style: 'color:#aeaeb2;' }, `× ${item.quantity}`)
                  ]),
                  item.remark ? h('div', { style: 'font-size:11px;color:#c96b7e;padding-left:2px;margin-top:1px;' }, `└ ${item.remark}`) : null
                ])
              )
            ),
            // 整单备注
            order.remark ? h('div', {
              style: 'margin-bottom:8px;padding:7px 10px;background:#fff8ed;border-radius:8px;font-size:12px;color:#6d6d72;line-height:1.5;'
            }, `📝 ${order.remark}`) : null,
            // 底部
            h('div', { style: 'display:flex;justify-content:space-between;align-items:center;' }, [
              h('span', { style: 'font-size:13px;color:#c96b7e;font-weight:600;' }, `${order.totalKiss}个😘`),
              h('div', { style: 'display:flex;gap:8px;', onClick: e => e.stopPropagation() }, [
                props.stateLabel === 'pending' ? h('button', {
                  style: 'background:#c96b7e;color:#fff;border:none;border-radius:20px;padding:7px 16px;font-size:13px;font-weight:600;cursor:pointer;',
                  onClick: (e) => { e.stopPropagation(); emit('accept', order.id) }
                }, '接单 ✅') : null,
                props.stateLabel === 'active' && order.state === 1 ? h('button', {
                  style: 'background:#c96b7e;color:#fff;border:none;border-radius:20px;padding:7px 16px;font-size:13px;font-weight:600;cursor:pointer;',
                  onClick: (e) => { e.stopPropagation(); emit('serve', order.id) }
                }, '出餐 🍳') : null,
                order.reviewScore ? h('span', {
                  style: 'font-size:13px;color:#c96b7e;background:#fef4f5;border-radius:999px;padding:5px 10px;font-weight:800;'
                }, `${formatScore(order.reviewScore)} 分`) : null,
              ])
            ]),
            // 评价内容
            order.reviewContent ? h('div', {
              style: 'margin-top:8px;padding:8px 10px;background:#fef4f5;border-radius:8px;font-size:12px;color:#c96b7e;'
            }, `"${order.reviewContent}"`) : null,
            // 点击提示
            h('div', { style: 'text-align:right;margin-top:4px;font-size:11px;color:#c8c8cc;' }, '点击查看详情 →'),
          ])
        )
      )
    }
  }
})

onMounted(() => {
  loadAll()
  timer = setInterval(loadAll, 10000)
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})
</script>
