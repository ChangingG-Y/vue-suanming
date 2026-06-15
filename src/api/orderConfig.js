import req from './orderRequest.js'

export const getPublicLayoutConfig = (tenantId) => req.get('/order/config/layout/public', { params: { tenantId } })
export const getLayoutConfig = () => req.get('/order/config/layout')
export const updateLayoutConfig = (data) => req.put('/order/admin/config/layout', data)
