import axios from 'axios'

const orderRequest = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8093/api',
  timeout: 15000,
})

// 请求拦截：自动带 token
orderRequest.interceptors.request.use(config => {
  const token = localStorage.getItem('order_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

function clearAuthAndRedirect() {
  // 清 localStorage
  localStorage.removeItem('order_token')
  localStorage.removeItem('order_role')
  localStorage.removeItem('order_nickname')
  localStorage.removeItem('order_tenant_id')
  localStorage.removeItem('order_cart')
  // 跳登录（用 replace 避免返回时循环）
  if (!window.location.pathname.includes('/order/login')) {
    window.location.replace('/suanming/order/login')
  }
}

// 响应拦截：统一处理错误
// 后端返回格式：{ code, msg, data }，成功码为 0
orderRequest.interceptors.response.use(
  res => {
    const data = res.data
    if (data.code !== 0) {
      if (data.code === 11301) {
        clearAuthAndRedirect()
      }
      return Promise.reject(new Error(data.msg || '请求失败'))
    }
    return data.data
  },
  err => {
    if (err.response?.status === 401) clearAuthAndRedirect()
    return Promise.reject(new Error(err.response?.data?.msg || err.message || '网络错误'))
  }
)

export default orderRequest
