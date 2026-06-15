// 根据当前时间推算餐次（与后端逻辑保持一致）
export function getCurrentMealType() {
  const h = new Date().getHours()
  if (h >= 20 || h < 8) return 0   // 早饭
  if (h >= 8 && h < 12) return 1    // 午饭
  return 2                           // 晚饭
}

export const MEAL_NAMES = { 0: '早饭', 1: '午饭', 2: '晚饭' }
export const MEAL_EMOJIS = { 0: '🌅', 1: '☀️', 2: '🌙' }
export const STATE_NAMES = { 0: '等待接单', 1: '等待开饭', 2: '饭好了！', 3: '已完成' }
export const STATE_COLORS = { 0: '#ffa0c0', 1: '#ff6b9d', 2: '#e91e8c', 3: '#9c27b0' }
