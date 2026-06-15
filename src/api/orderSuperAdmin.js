import req from './orderRequest.js'

export const listTenants = () => req.get('/order/super/tenants')
export const createTenant = (data) => req.post('/order/super/tenants', data)
export const listTenantUsers = (tenantId) => req.get(`/order/super/tenants/${tenantId}/users`)
export const createTenantUser = (tenantId, data) => req.post(`/order/super/tenants/${tenantId}/users`, data)
export const updateUserPassword = (userId, password) => req.put(`/order/super/users/${userId}/password`, { password })
export const updateUserRole = (userId, role) => req.put(`/order/super/users/${userId}/role`, { role })
export const deleteTenantUser = (userId) => req.delete(`/order/super/users/${userId}`)
