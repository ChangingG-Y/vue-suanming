import req from './orderRequest.js'
export const login = (username, password) => req.post('/order/auth/login', { username, password })
export const logout = () => req.post('/order/auth/logout')
export const getSession = () => req.get('/order/auth/session')
