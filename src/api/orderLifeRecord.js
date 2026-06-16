import req from './orderRequest.js'
import { uploadFile } from './orderFile.js'

export const saveVisit = (data) => req.post('/order/life/visit', data)
export const getVisitsByDate = (date) => req.get('/order/life/visit', { params: { date } })
export const deleteVisit = (id) => req.delete(`/order/life/visit/${id}`)

export const saveDiary = (data) => req.post('/order/life/diary', data)
export const getDiaryByDate = (date) => req.get('/order/life/diary', { params: { date } })
export const deleteDiary = (id) => req.delete(`/order/life/diary/${id}`)

/** 上传生活记录图片（评价规则：缩略图1200最长边，存原图） */
export const uploadLifePhoto = (file) => uploadFile(file, 'review')
