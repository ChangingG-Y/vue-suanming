import req from './orderRequest.js'

export const uploadFile = (file, mode = 'review') => {
  const form = new FormData()
  form.append('file', file)
  form.append('mode', mode)
  return req.post('/order/file/upload', form, { headers: { 'Content-Type': 'multipart/form-data' } })
}

export const fileUrl = (id) =>
  `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8093/api'}/order/file/${id}`

export const thumbUrl = (id) =>
  `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8093/api'}/order/file/${id}/thumbnail`

const _apiOrigin = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8093/api').replace(/\/api\/?$/, '')

/** Convert a relative path like "/api/order/file/17/thumbnail" to a full absolute URL */
export const absImgUrl = (path) => {
  if (!path) return ''
  if (path.startsWith('http')) return path
  return _apiOrigin + path
}
