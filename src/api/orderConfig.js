import req from './orderRequest.js'

export const getLayoutConfig = () => req.get('/order/config/layout')
export const updateLayoutConfig = (data) => req.put('/order/admin/config/layout', data)
