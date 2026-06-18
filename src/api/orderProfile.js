import req from './orderRequest.js'

export const getMyProfile = () => req.get('/order/profile/me')
export const updateMyProfile = (data) => req.put('/order/profile/me', data)
export const uploadAvatar = (formData) => req.post('/order/profile/avatar', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
})
export const uploadBanner = (formData) => req.post('/order/profile/banner', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
})

export const getWeightRecords = (days = 90) => req.get('/order/profile/weight', { params: { days } })
export const saveWeight = (data) => req.post('/order/profile/weight', data)
export const deleteWeight = (id) => req.delete(`/order/profile/weight/${id}`)

export const getCalendar = (year, month) => req.get('/order/profile/calendar', { params: { year, month } })
export const getDayDetail = (date) => req.get('/order/profile/day', { params: { date } })

// admin views partner
export const getPartnerProfile = () => req.get('/order/profile/partner')
export const getPartnerWeight = (days = 90) => req.get('/order/profile/partner/weight', { params: { days } })
export const getPartnerCalendar = (year, month) => req.get('/order/profile/partner/calendar', { params: { year, month } })
export const getPartnerDayDetail = (date) => req.get('/order/profile/partner/day', { params: { date } })
