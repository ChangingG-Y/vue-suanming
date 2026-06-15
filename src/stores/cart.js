import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'

const CART_KEY = 'order_cart'

function loadFromStorage() {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY) || '[]')
  } catch {
    return []
  }
}

export const useCartStore = defineStore('cart', () => {
  const items = ref(loadFromStorage())

  const totalCount = computed(() => items.value.reduce((s, i) => s + i.quantity, 0))
  const totalKiss = computed(() => items.value.reduce((s, i) => s + i.price * i.quantity, 0))

  // 变化时同步到 localStorage
  watch(items, val => {
    if (val.length > 0) {
      localStorage.setItem(CART_KEY, JSON.stringify(val))
    } else {
      localStorage.removeItem(CART_KEY)
    }
  }, { deep: true })

  function addDish(dish) {
    const exist = items.value.find(i => i.dishId === dish.id)
    if (exist) {
      exist.quantity++
    } else {
      items.value.push({
        dishId: dish.id,
        dishName: dish.name,
        price: dish.price || 1,
        quantity: 1,
        imageFileId: dish.imageFileId || null,
      })
    }
  }

  function removeDish(dishId) {
    const idx = items.value.findIndex(i => i.dishId === dishId)
    if (idx === -1) return
    if (items.value[idx].quantity > 1) items.value[idx].quantity--
    else items.value.splice(idx, 1)
  }

  function getQuantity(dishId) {
    return items.value.find(i => i.dishId === dishId)?.quantity || 0
  }

  function clear() {
    items.value = []
    localStorage.removeItem(CART_KEY)
  }

  // 从订单 items 恢复购物车（撤单时使用）
  function restoreFromOrderItems(orderItems) {
    clear()
    if (!orderItems) return
    for (const item of orderItems) {
      items.value.push({
        dishId: item.dishId,
        dishName: item.dishName,
        price: item.itemPrice || 0,
        quantity: item.quantity,
        imageFileId: item.imageFileId || null,
      })
    }
  }

  return { items, totalCount, totalKiss, addDish, removeDish, getQuantity, clear, restoreFromOrderItems }
})
