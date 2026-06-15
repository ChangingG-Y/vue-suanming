import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useOrderAuthStore = defineStore('orderAuth', () => {
  const token = ref(localStorage.getItem('order_token') || '')
  const role = ref(parseInt(localStorage.getItem('order_role') || '0'))
  const nickname = ref(localStorage.getItem('order_nickname') || '')
  const isAdmin = () => role.value === 1

  function setAuth(loginResp) {
    token.value = loginResp.token
    role.value = loginResp.role
    nickname.value = loginResp.nickname || ''
    localStorage.setItem('order_token', loginResp.token)
    localStorage.setItem('order_role', String(loginResp.role))
    localStorage.setItem('order_nickname', loginResp.nickname || '')
  }

  function clearAuth() {
    token.value = ''
    role.value = 0
    nickname.value = ''
    localStorage.removeItem('order_token')
    localStorage.removeItem('order_role')
    localStorage.removeItem('order_nickname')
  }

  return { token, role, nickname, isAdmin, setAuth, clearAuth }
})
