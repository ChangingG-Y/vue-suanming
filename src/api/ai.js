const API_BASE_URL = (import.meta.env.VITE_AI_API_BASE_URL || import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '')
const API_PREFIX = '/api'
const TOKEN_KEY = 'suanming_ai_token'

export function getAiToken() {
  return localStorage.getItem(TOKEN_KEY) || ''
}

export function setAiToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token)
}

export function clearAiToken() {
  localStorage.removeItem(TOKEN_KEY)
}

export async function loginAi(username, password) {
  const result = await request('/auth/login', {
    method: 'POST',
    body: { username, password },
    skipAuth: true
  })
  setAiToken(result.token)
  return result
}

export async function checkAiSession() {
  return request('/auth/session', { method: 'GET' })
}

export async function sendAiChat({ question, baziContext, history, provider, model, thinkingEnabled, reasoningEffort, systemPrompt, signal }) {
  return request('/ai/chat', {
    method: 'POST',
    body: { question, baziContext, history, provider, model, thinkingEnabled, reasoningEffort, systemPrompt },
    signal
  })
}

async function request(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  }

  const token = getAiToken()
  if (!options.skipAuth && token) {
    headers.Authorization = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE_URL}${API_PREFIX}${path}`, {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
    signal: options.signal
  })

  let payload
  try {
    payload = await response.json()
  } catch (error) {
    throw new Error(`接口响应异常：HTTP ${response.status}`)
  }

  if (!response.ok || payload.code !== 0) {
    if (payload.code === 11301) clearAiToken()
    throw new Error(payload.msg || `接口请求失败：HTTP ${response.status}`)
  }

  return payload.data
}
