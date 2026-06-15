<template>
  <div>
    <van-tabs v-model:active="activeTab" color="#c96b7e" title-active-color="#c96b7e">
      <van-tab title="待接单" name="0">
        <OrderList :orders="pendingOrders" state-label="pending" @accept="doAccept" @refresh="loadAll" />
      </van-tab>
      <van-tab title="进行中" name="1">
        <OrderList :orders="activeOrders" state-label="active" @serve="doServe" @refresh="loadAll" />
      </van-tab>
      <van-tab title="历史" name="2">
        <OrderList :orders="doneOrders" state-label="done" @refresh="loadAll" />
      </van-tab>
    </van-tabs>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, defineComponent, h } from 'vue'
import { getAdminOrders, acceptOrder, serveOrder } from '../../../api/orderAdmin.js'
import { MEAL_NAMES, MEAL_EMOJIS, STATE_NAMES } from '../../../utils/mealType.js'
import { showToast } from 'vant'

const allOrders = ref([])
const activeTab = ref('0')
let timer = null

const pendingOrders = computed(() => allOrders.value.filter(o => o.state === 0))
const activeOrders = computed(() => allOrders.value.filter(o => o.state === 1 || o.state === 2))
const doneOrders = computed(() => allOrders.value.filter(o => o.state === 3))

async function loadAll() {
  try {
    const data = await getAdminOrders()
    allOrders.value = data || []
  } catch (e) {
    // 静默刷新失败
  }
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

// 子组件：订单列表
const OrderList = defineComponent({
  props: {
    orders: { type: Array, default: () => [] },
    stateLabel: { type: String, default: '' },
  },
  emits: ['accept', 'serve', 'refresh'],
  setup(props, { emit }) {
    function formatTime(ts) {
      if (!ts) return ''
      const d = new Date(ts * 1000)
      return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
    }

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
            style: 'background:#ffffff;border-radius:14px;padding:14px 16px;margin-bottom:10px;box-shadow:0 1px 3px rgba(0,0,0,0.06);'
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
            // 菜品
            h('div', { style: 'background:#f2f2f7;border-radius:10px;padding:8px 10px;margin-bottom:8px;' },
              (order.items || []).map(item =>
                h('div', { key: item.dishId, style: 'display:flex;justify-content:space-between;font-size:13px;padding:2px 0;color:#1c1c1e;' }, [
                  h('span', null, item.dishName),
                  h('span', { style: 'color:#aeaeb2;' }, `× ${item.quantity}`)
                ])
              )
            ),
            // 底部
            h('div', { style: 'display:flex;justify-content:space-between;align-items:center;' }, [
              h('span', { style: 'font-size:13px;color:#c96b7e;font-weight:600;' }, `${order.totalKiss}个😘`),
              h('div', { style: 'display:flex;gap:8px;' }, [
                props.stateLabel === 'pending' ? h('button', {
                  style: 'background:#c96b7e;color:#fff;border:none;border-radius:20px;padding:7px 16px;font-size:13px;font-weight:600;cursor:pointer;',
                  onClick: () => emit('accept', order.id)
                }, '接单 ✅') : null,
                props.stateLabel === 'active' && order.state === 1 ? h('button', {
                  style: 'background:#c96b7e;color:#fff;border:none;border-radius:20px;padding:7px 16px;font-size:13px;font-weight:600;cursor:pointer;',
                  onClick: () => emit('serve', order.id)
                }, '出餐 🍳') : null,
                props.stateLabel === 'done' && order.reviewScore ? h('span', { style: 'font-size:13px;color:#c96b7e;' }, `⭐ ${order.reviewScore}/10`) : null,
              ])
            ]),
            // 评价内容（已完成且有评价）
            props.stateLabel === 'done' && order.reviewContent ? h('div', {
              style: 'margin-top:8px;padding:8px 10px;background:#fef4f5;border-radius:8px;font-size:12px;color:#c96b7e;'
            }, `"${order.reviewContent}"`) : null,
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
