import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useOrderAuthStore = defineStore('orderAuth', () => {
  const token = ref(localStorage.getItem('order_token') || '')
  const role = ref(parseInt(localStorage.getItem('order_role') || '2'))
  const nickname = ref(localStorage.getItem('order_nickname') || '')
  const tenantId = ref(parseInt(localStorage.getItem('order_tenant_id') || '1'))

  const isAdmin = () => role.value <= 1
  const isSuperAdmin = () => role.value === 0

  function setAuth(loginResp) {
    token.value = loginResp.token
    role.value = loginResp.role
    nickname.value = loginResp.nickname || ''
    tenantId.value = loginResp.tenantId || 1
    localStorage.setItem('order_token', loginResp.token)
    localStorage.setItem('order_role', String(loginResp.role))
    localStorage.setItem('order_nickname', loginResp.nickname || '')
    localStorage.setItem('order_tenant_id', String(loginResp.tenantId || 1))
  }

  function clearAuth() {
    token.value = ''
    role.value = 2
    nickname.value = ''
    tenantId.value = 1
    localStorage.removeItem('order_token')
    localStorage.removeItem('order_role')
    localStorage.removeItem('order_nickname')
    localStorage.removeItem('order_tenant_id')
  }

  return { token, role, nickname, tenantId, isAdmin, isSuperAdmin, setAuth, clearAuth }
})
