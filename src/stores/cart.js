import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useCartStore = defineStore('cart', () => {
  const items = ref([]) // [{ dishId, dishName, price, quantity }]

  const totalCount = computed(() => items.value.reduce((s, i) => s + i.quantity, 0))
  const totalKiss = computed(() => items.value.reduce((s, i) => s + i.price * i.quantity, 0))

  function addDish(dish) {
    const exist = items.value.find(i => i.dishId === dish.id)
    if (exist) {
      exist.quantity++
    } else {
      items.value.push({ dishId: dish.id, dishName: dish.name, price: dish.price || 1, quantity: 1 })
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
  }

  return { items, totalCount, totalKiss, addDish, removeDish, getQuantity, clear }
})
