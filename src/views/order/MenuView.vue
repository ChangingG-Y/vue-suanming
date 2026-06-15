<template>
  <div style="padding-bottom: 130px;">

    <!-- ── 顶部标题栏 ── -->
    <div class="page-header">
      <!-- 左侧：标题 + 切换按钮紧跟在一行 -->
      <div style="display:flex;flex-direction:column;gap:2px;">
        <div style="display:flex;align-items:center;gap:8px;">
          <div class="header-title">
            {{ selectedDateLabel }}{{ MEAL_NAMES[selectedMealType] }} {{ MEAL_EMOJIS[selectedMealType] }}
          </div>
          <button class="switch-btn" @click="showMealPicker = true">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="margin-right:3px;"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>
            切换
          </button>
        </div>
        <div v-if="mealInfo?.canAddDish && !manualSelected" class="header-sub">
          已点晚饭，加菜中 🍳
        </div>
      </div>
      <!-- 右侧：仅退出 -->
      <button class="logout-btn" title="退出登录" @click="doLogout">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M18.36 6.64a9 9 0 1 1-12.73 0"/>
          <line x1="12" y1="2" x2="12" y2="12"/>
        </svg>
      </button>
    </div>

    <!-- ── 餐次选择弹窗 ── -->
    <van-popup v-model:show="showMealPicker" position="bottom" round :style="{ paddingBottom: '28px' }">
      <div class="picker-sheet">
        <!-- 拖拽条 -->
        <div class="sheet-handle"></div>
        <div class="sheet-title">选择点餐时间</div>

        <div class="picker-section-label">日期</div>
        <div class="picker-row">
          <div
            v-for="d in dateOptions" :key="d.value"
            :class="['picker-chip', { active: selectedDate === d.value }]"
            @click="selectedDate = d.value"
          >{{ d.label }}</div>
        </div>

        <div class="picker-section-label" style="margin-top:14px;">餐次</div>
        <div class="picker-row">
          <div
            v-for="m in mealOptions" :key="m.value"
            :class="['picker-chip', { active: selectedMealType === m.value }]"
            @click="selectedMealType = m.value"
          >{{ m.emoji }} {{ m.label }}</div>
        </div>

        <button class="btn-primary" style="width:100%;padding:14px;margin-top:20px;" @click="confirmMealPick">确认</button>
      </div>
    </van-popup>

    <!-- ── 左右布局 ── -->
    <div style="display:flex;height:calc(100vh - 110px);overflow:hidden;">
      <!-- 左侧分类 -->
      <van-sidebar v-model="activeCategoryIndex" style="width:88px;flex-shrink:0;overflow-y:auto;background:#f2f2f7;">
        <van-sidebar-item
          v-for="cat in categories" :key="cat.id"
          :title="cat.name"
          @click="onCategoryClick(cat)"
        />
      </van-sidebar>

      <!-- 右侧菜品列表 -->
      <div style="flex:1;overflow-y:auto;padding:8px;">
        <div v-if="loadingDishes" style="text-align:center;padding:40px;color:#aeaeb2;">
          <van-loading color="#c96b7e" />
          <p style="margin-top:8px;font-size:13px;">加载中…</p>
        </div>
        <div v-else-if="dishes.length === 0" style="text-align:center;padding:40px;color:#aeaeb2;">
          <div style="font-size:36px;">🍽️</div>
          <p style="margin-top:8px;font-size:13px;">暂无菜品</p>
        </div>
        <template v-else>
          <div
            v-for="(dish, i) in dishes" :key="dish.id"
            class="dish-card"
            :style="{ animationDelay: i * 0.04 + 's' }"
          >
            <div class="dish-img">
              <img v-if="dish.imageFileId" :src="thumbUrl(dish.imageFileId)" style="width:72px;height:72px;border-radius:10px;object-fit:cover;" />
              <span v-else style="font-size:28px;">🍽️</span>
            </div>
            <div style="flex:1;min-width:0;">
              <div style="font-weight:700;font-size:15px;color:#1c1c1e;">{{ dish.name }}</div>
              <div v-if="dish.description" style="font-size:12px;color:#6d6d72;margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">{{ dish.description }}</div>
              <div class="kiss-price" style="margin-top:5px;">{{ dish.price }}个😘</div>
            </div>
            <div style="display:flex;align-items:center;gap:6px;flex-shrink:0;">
              <template v-if="cart.getQuantity(dish.id) > 0">
                <button class="qty-btn minus" @click="cart.removeDish(dish.id)">－</button>
                <span class="qty-count">{{ cart.getQuantity(dish.id) }}</span>
              </template>
              <button class="qty-btn plus" @click="cart.addDish(dish)">＋</button>
            </div>
          </div>
        </template>
      </div>
    </div>

    <!-- ── 底部购物车栏 ── -->
    <Transition name="cart-slide">
      <div v-if="true" class="cart-bar">
        <div class="cart-icon-wrap" :class="{ 'has-items': cart.totalCount > 0 }" @click="showCart = cart.totalCount > 0">
          <span class="cart-emoji">🛒</span>
          <Transition name="badge-pop">
            <span v-if="cart.totalCount > 0" class="cart-badge">{{ cart.totalCount }}</span>
          </Transition>
        </div>
        <div style="flex:1;">
          <Transition name="fade-slide" mode="out-in">
            <div v-if="cart.totalCount > 0" key="has" style="font-size:13px;color:#c96b7e;font-weight:600;">
              共 {{ cart.totalKiss }}个😘
            </div>
            <div v-else key="empty" style="font-size:13px;color:#aeaeb2;">还没选菜哦~</div>
          </Transition>
        </div>
        <Transition name="btn-pop">
          <button v-if="cart.totalCount > 0" class="btn-primary" style="padding:10px 22px;font-size:14px;" @click="openCheckout">
            去结算
          </button>
        </Transition>
      </div>
    </Transition>

    <!-- ── 结算弹窗 ── -->
    <van-popup v-model:show="showCart" position="bottom" round :style="{ maxHeight: '82vh', overflowY: 'auto' }">
      <div class="checkout-sheet">
        <div class="sheet-handle"></div>
        <div style="font-size:16px;font-weight:700;color:#1c1c1e;margin-bottom:14px;display:flex;align-items:center;gap:8px;">
          我的选单 🛒
          <span v-if="mealInfo?.canAddDish" class="tag-badge">加菜中</span>
        </div>

        <div v-for="item in cart.items" :key="item.dishId" class="cart-item-row">
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <div>
              <span style="font-weight:600;color:#1c1c1e;">{{ item.dishName }}</span>
              <span style="color:#aeaeb2;font-size:12px;margin-left:6px;">× {{ item.quantity }}</span>
            </div>
            <span class="kiss-price">{{ item.price * item.quantity }}个😘</span>
          </div>
          <input
            v-model="itemRemarks[item.dishId]"
            placeholder="备注（如：少辣/不要香菜）"
            class="remark-input"
          />
        </div>

        <div class="total-row">
          <span style="font-weight:700;color:#1c1c1e;">合计</span>
          <span style="font-size:17px;font-weight:800;color:#c96b7e;">{{ cart.totalKiss }}个😘</span>
        </div>

        <div style="margin-top:12px;">
          <label style="font-size:13px;color:#6d6d72;font-weight:600;">整单备注</label>
          <input
            v-model="orderRemark"
            placeholder="有什么特殊要求嘛~"
            class="remark-input"
            style="margin-top:6px;"
          />
        </div>

        <div class="ai-section">
          <div style="font-size:13px;color:#1c1c1e;font-weight:600;margin-bottom:6px;">🤖 AI 营养建议</div>
          <div v-if="aiLoading" style="display:flex;align-items:center;justify-content:center;padding:10px;color:#aeaeb2;">
            <van-loading size="16px" color="#c96b7e" />
            <span style="margin-left:8px;font-size:12px;">正在分析热量…</span>
          </div>
          <div v-else-if="aiAdvice" style="font-size:13px;color:#1c1c1e;line-height:1.7;">{{ aiAdvice }}</div>
          <div v-else-if="aiEnabled === false" style="font-size:12px;color:#aeaeb2;text-align:center;">AI建议已关闭</div>
          <div v-else style="font-size:12px;color:#aeaeb2;text-align:center;">暂无分析结果</div>
        </div>

        <button class="btn-primary" style="width:100%;margin-top:16px;padding:14px;" @click="doSubmitOrder">
          下单并支付😘
        </button>
      </div>
    </van-popup>

  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { getCategories, getDishes, getMealTypeInfo } from '../../api/orderMenu.js'
import { createOrder, getCalorieAdvice } from '../../api/orderApi.js'
import { useCartStore } from '../../stores/cart.js'
import { useOrderAuthStore } from '../../stores/orderAuth.js'
import { thumbUrl } from '../../api/orderFile.js'
import { MEAL_NAMES, MEAL_EMOJIS } from '../../utils/mealType.js'
import { showToast } from 'vant'

const cart = useCartStore()
const router = useRouter()
const authStore = useOrderAuthStore()

// 退出登录
function doLogout() {
  authStore.clearAuth()
  router.push('/order/login')
}

// ---- 餐次 / 日期选择 ----
const today = new Date()
const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1)

function fmtDate(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

const dateOptions = [
  { label: '今天', value: fmtDate(today) },
  { label: '明天', value: fmtDate(tomorrow) },
]
const mealOptions = [
  { label: '早饭', value: 0, emoji: '🌅' },
  { label: '午饭', value: 1, emoji: '☀️' },
  { label: '晚饭', value: 2, emoji: '🌙' },
]

const showMealPicker = ref(false)
const manualSelected = ref(false)

// 当前选中的日期和餐次（初始由后端返回值决定）
const selectedDate = ref(fmtDate(today))
const selectedMealType = ref(0)

const selectedDateLabel = computed(() => {
  const opt = dateOptions.find(d => d.value === selectedDate.value)
  return opt ? opt.label : ''
})

function confirmMealPick() {
  manualSelected.value = true
  showMealPicker.value = false
  // 切换餐次后更新 mealInfo 的 mealType（不影响后端，仅影响下单 payload）
  if (mealInfo.value) {
    mealInfo.value = { ...mealInfo.value, mealType: selectedMealType.value }
  }
}
// ---- end ----

const categories = ref([])
const dishes = ref([])
const activeCategoryIndex = ref(0)
const mealInfo = ref(null)
const loadingDishes = ref(false)
const showCart = ref(false)
const orderRemark = ref('')

// 每道菜的独立备注，key = dishId
const itemRemarks = reactive({})

// AI 热量分析状态
const aiLoading = ref(false)
const aiAdvice = ref('')
const aiEnabled = ref(true)


onMounted(async () => {
  try {
    const [cats, info] = await Promise.all([getCategories(), getMealTypeInfo()])
    categories.value = cats || []
    mealInfo.value = info
    // 用后端返回的餐次初始化选择器
    if (info?.mealType !== undefined) {
      selectedMealType.value = info.mealType
    }
    if (cats && cats.length > 0) {
      loadingDishes.value = true
      dishes.value = await getDishes(cats[0].id)
      loadingDishes.value = false
    }
  } catch (e) {
    showToast({ message: e.message, type: 'fail' })
  }
})

async function onCategoryClick(cat) {
  const idx = categories.value.findIndex(c => c.id === cat.id)
  activeCategoryIndex.value = idx
  loadingDishes.value = true
  try {
    dishes.value = await getDishes(cat.id)
  } catch (e) {
    showToast({ message: e.message, type: 'fail' })
  }
  loadingDishes.value = false
}

function openCheckout() {
  if (cart.items.length === 0) return
  showCart.value = true
}

// 打开结算弹窗时自动获取 AI 热量建议
watch(showCart, async (val) => {
  if (!val || cart.items.length === 0) return
  aiLoading.value = true
  aiAdvice.value = ''
  try {
    const items = cart.items.map(i => ({
      dishId: i.dishId,
      dishName: i.dishName,
      quantity: i.quantity,
      remark: itemRemarks[i.dishId] || ''
    }))
    const result = await getCalorieAdvice(items)
    if (result && result.enabled === false) {
      aiEnabled.value = false
    } else {
      aiEnabled.value = true
      aiAdvice.value = result?.advice || ''
    }
  } catch (e) {
    // AI 失败不影响点单
    console.warn('AI calorie advice failed:', e.message)
  } finally {
    aiLoading.value = false
  }
})

async function doSubmitOrder() {
  if (cart.items.length === 0) {
    showToast('还没有选菜哦~')
    return
  }
  try {
    if (!manualSelected.value) {
      mealInfo.value = await getMealTypeInfo()
      if (mealInfo.value?.mealType !== undefined) {
        selectedMealType.value = mealInfo.value.mealType
      }
    }
    const orderData = {
      mealType: selectedMealType.value,
      mealDate: selectedDate.value,
      isAddDish: (!manualSelected.value && mealInfo.value?.canAddDish) ? 1 : 0,
      parentOrderId: (!manualSelected.value && mealInfo.value?.todayDinnerOrderId) || 0,
      remark: orderRemark.value,
      verifyWord: '亲亲kiss',
      items: cart.items.map(i => ({
        dishId: i.dishId,
        dishName: i.dishName,
        quantity: i.quantity,
        remark: itemRemarks[i.dishId] || ''
      }))
    }
    await createOrder(orderData)
    cart.clear()
    showCart.value = false
    orderRemark.value = ''
    Object.keys(itemRemarks).forEach(k => delete itemRemarks[k])
    showToast({ message: '下单成功！等待小岳接单 🍳', type: 'success' })
    router.push('/order/orders')
  } catch (e) {
    showToast({ message: e.message, type: 'fail' })
  }
}
</script>

<style scoped>
/* ── Header ── */
.page-header {
  background: rgba(255, 255, 255, 0.88);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-bottom: 1px solid rgba(229, 229, 234, 0.6);
  padding: 12px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: sticky;
  top: 0;
  z-index: 10;
}
.header-title {
  font-size: 17px;
  font-weight: 700;
  color: #1c1c1e;
  letter-spacing: 0.1px;
}
.header-sub {
  font-size: 12px;
  color: #6d6d72;
  margin-top: 2px;
}

/* ── 切换按钮 ── */
.switch-btn {
  display: inline-flex;
  align-items: center;
  font-size: 13px;
  color: #c96b7e;
  font-weight: 600;
  cursor: pointer;
  background: #fef4f5;
  border: none;
  border-radius: 20px;
  padding: 6px 12px;
  user-select: none;
  transition: background 0.18s, transform 0.15s cubic-bezier(0.34,1.56,0.64,1);
}
.switch-btn:active { transform: scale(0.93); }

/* ── 关机退出按钮 ── */
.logout-btn {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  border: none;
  background: #f5f5f7;
  color: #aeaeb2;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.18s, color 0.18s, transform 0.15s cubic-bezier(0.34,1.56,0.64,1);
}
.logout-btn:hover { background: #fef4f5; color: #c96b7e; }
.logout-btn:active { transform: scale(0.88); }

/* ── 餐次选择面板 ── */
.picker-sheet {
  padding: 10px 16px 4px;
}
.sheet-handle {
  width: 36px; height: 4px;
  background: #e5e5ea;
  border-radius: 2px;
  margin: 0 auto 16px;
}
.sheet-title {
  font-size: 16px;
  font-weight: 700;
  color: #1c1c1e;
  margin-bottom: 14px;
}
.picker-section-label {
  font-size: 11px;
  color: #aeaeb2;
  font-weight: 700;
  letter-spacing: 0.6px;
  text-transform: uppercase;
  margin-bottom: 8px;
}
.picker-row {
  display: flex;
  gap: 8px;
}
.picker-chip {
  flex: 1;
  text-align: center;
  padding: 10px 6px;
  border-radius: 12px;
  border: 1.5px solid #e5e5ea;
  font-size: 14px;
  font-weight: 600;
  color: #6d6d72;
  cursor: pointer;
  background: #ffffff;
  transition: all 0.18s cubic-bezier(0.34,1.56,0.64,1);
  user-select: none;
}
.picker-chip.active {
  border-color: #c96b7e;
  background: #fef4f5;
  color: #c96b7e;
  transform: scale(1.04);
}
.picker-chip:active { transform: scale(0.95); }

/* ── 菜品卡片 ── */
.dish-card {
  background: #ffffff;
  border-radius: 16px;
  padding: 12px;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 12px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
  animation: dishIn 0.35s cubic-bezier(0.34,1.56,0.64,1) both;
  transition: transform 0.18s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.18s;
}
.dish-card:active { transform: scale(0.985); }
@keyframes dishIn {
  from { opacity: 0; transform: translateY(12px) scale(0.97); }
  to   { opacity: 1; transform: none; }
}

.dish-img {
  width: 72px; height: 72px;
  border-radius: 12px;
  background: #fef4f5;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  overflow: hidden;
}

.kiss-price {
  color: #c96b7e;
  font-weight: 700;
  font-size: 14px;
}

/* ── 数量 ── */
.qty-count {
  font-weight: 700;
  font-size: 15px;
  min-width: 20px;
  text-align: center;
  color: #1c1c1e;
}
.qty-btn {
  width: 30px; height: 30px;
  border-radius: 50%;
  font-size: 17px;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  transition: transform 0.15s cubic-bezier(0.34,1.56,0.64,1);
}
.qty-btn:active { transform: scale(0.82); }
.qty-btn.minus {
  background: #ffffff;
  color: #c96b7e;
  border: 1.5px solid #c96b7e;
}
.qty-btn.plus {
  background: #c96b7e;
  color: #fff;
  border: none;
  box-shadow: 0 2px 8px rgba(201,107,126,0.30);
}

/* ── 购物车栏 ── */
.cart-bar {
  position: fixed;
  bottom: 50px;
  left: 0; right: 0;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  padding: 10px 16px;
  box-shadow: 0 -1px 0 rgba(229,229,234,0.5), 0 -6px 20px rgba(0,0,0,0.05);
  display: flex;
  align-items: center;
  z-index: 50;
}
/* cart-slide 入场动画 */
.cart-slide-enter-active { transition: transform 0.32s cubic-bezier(0.34,1.56,0.64,1), opacity 0.2s; }
.cart-slide-leave-active { transition: transform 0.2s ease-in, opacity 0.15s; }
.cart-slide-enter-from  { transform: translateY(100%); opacity: 0; }
.cart-slide-leave-to    { transform: translateY(100%); opacity: 0; }

.cart-icon-wrap {
  position: relative;
  width: 48px; height: 48px;
  background: #e5e5ea;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  margin-right: 12px;
  cursor: pointer;
  transition: background 0.22s cubic-bezier(0.34,1.56,0.64,1), transform 0.18s cubic-bezier(0.34,1.56,0.64,1);
}
.cart-icon-wrap.has-items {
  background: #c96b7e;
}
.cart-icon-wrap:active { transform: scale(0.88); }
.cart-emoji {
  transition: transform 0.22s cubic-bezier(0.34,1.56,0.64,1);
  display: inline-block;
}
.cart-icon-wrap.has-items .cart-emoji {
  animation: cartBounce 0.4s cubic-bezier(0.34,1.56,0.64,1);
}
@keyframes cartBounce {
  0%   { transform: scale(1); }
  40%  { transform: scale(1.3) rotate(-8deg); }
  70%  { transform: scale(0.92) rotate(4deg); }
  100% { transform: scale(1) rotate(0); }
}

.cart-badge {
  position: absolute;
  top: -3px; right: -3px;
  background: #ff3b30;
  color: #fff;
  border-radius: 10px;
  padding: 0 5px;
  font-size: 11px;
  font-weight: 700;
  min-width: 18px;
  text-align: center;
  line-height: 18px;
  height: 18px;
  border: 2px solid #fff;
}
/* badge 弹出动画 */
.badge-pop-enter-active { transition: transform 0.28s cubic-bezier(0.34,1.56,0.64,1), opacity 0.15s; }
.badge-pop-leave-active { transition: transform 0.15s, opacity 0.15s; }
.badge-pop-enter-from  { transform: scale(0); opacity: 0; }
.badge-pop-leave-to    { transform: scale(0); opacity: 0; }

/* 文字切换 */
.fade-slide-enter-active, .fade-slide-leave-active { transition: all 0.18s; }
.fade-slide-enter-from  { opacity: 0; transform: translateY(4px); }
.fade-slide-leave-to    { opacity: 0; transform: translateY(-4px); }

/* 结算按钮弹出 */
.btn-pop-enter-active { transition: transform 0.28s cubic-bezier(0.34,1.56,0.64,1), opacity 0.18s; }
.btn-pop-leave-active { transition: transform 0.16s, opacity 0.14s; }
.btn-pop-enter-from  { transform: scale(0.7) translateX(10px); opacity: 0; }
.btn-pop-leave-to    { transform: scale(0.7) translateX(10px); opacity: 0; }

/* ── 通用主按钮 ── */
.btn-primary {
  background: #c96b7e;
  color: #fff;
  border: none;
  border-radius: 22px;
  padding: 10px 28px;
  font-size: 15px;
  font-weight: 700;
  letter-spacing: 0.3px;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(201,107,126,0.28);
  transition: transform 0.15s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.15s;
  position: relative;
  overflow: hidden;
}
.btn-primary::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(255,255,255,0.12) 0%, transparent 60%);
  border-radius: inherit;
}
.btn-primary:active { transform: scale(0.95); box-shadow: 0 2px 6px rgba(201,107,126,0.18); }
.btn-primary:disabled { opacity: 0.55; cursor: not-allowed; }

/* ── 结算面板 ── */
.checkout-sheet {
  padding: 10px 16px 20px;
}
.cart-item-row {
  padding: 8px 0;
  border-bottom: 1px solid #f2f2f7;
}
.total-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 12px;
  padding-top: 10px;
  border-top: 1px solid #f2f2f7;
}

/* ── 备注输入 ── */
.remark-input {
  width: 100%;
  margin-top: 5px;
  padding: 8px 11px;
  border-radius: 10px;
  border: 1px solid #e5e5ea;
  font-size: 13px;
  outline: none;
  box-sizing: border-box;
  color: #1c1c1e;
  background: #f7f7f9;
  font-family: inherit;
  transition: border-color 0.18s, box-shadow 0.18s;
}
.remark-input:focus {
  border-color: #c96b7e;
  background: #fff;
  box-shadow: 0 0 0 3px rgba(201,107,126,0.1);
}

/* ── AI 区 ── */
.ai-section {
  margin-top: 14px;
  background: #f7f7f9;
  border-radius: 12px;
  padding: 10px 12px;
}

/* ── Tag ── */
.tag-badge {
  display: inline-block;
  background: #fef4f5;
  color: #c96b7e;
  border-radius: 20px;
  font-size: 11px;
  padding: 2px 9px;
  font-weight: 700;
}

/* ── shake 动画（暗语错误） ── */
@keyframes shake {
  10%,90%  { transform: translateX(-2px); }
  20%,80%  { transform: translateX(3px); }
  30%,50%,70% { transform: translateX(-4px); }
  40%,60%  { transform: translateX(4px); }
}
</style>
