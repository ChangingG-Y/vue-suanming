import req from './orderRequest.js'

export const uploadFile = (file) => {
  const form = new FormData()
  form.append('file', file)
  return req.post('/order/file/upload', form, { headers: { 'Content-Type': 'multipart/form-data' } })
}

export const fileUrl = (id) =>
  `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8093/api'}/order/file/${id}`

export const thumbUrl = (id) =>
  `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8093/api'}/order/file/${id}/thumbnail`
