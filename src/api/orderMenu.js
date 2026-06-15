import req from './orderRequest.js'
export const getCategories = () => req.get('/order/menu/categories')
export const getDishes = (categoryId) => req.get('/order/menu/dishes', { params: { categoryId } })
export const getMealTypeInfo = () => req.get('/order/meal-type')
