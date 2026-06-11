function cloneForApi(value) {
  return JSON.parse(JSON.stringify(value || {}))
}

export function buildBaziPayload(form, data) {
  const safeForm = cloneForApi(form)
  const safeData = cloneForApi(data)

  return {
    form: {
      name: safeForm.name || '',
      gender: safeForm.gender,
      genderText: safeForm.gender === 1 ? '男（乾造）' : '女（坤造）',
      birthday: safeForm.birthday || '',
      hour: safeForm.hour,
      location: safeForm.location || '',
      calType: safeForm.calType || 'solar'
    },
    data: safeData,
    summary: {
      lunarDesc: safeData.lunarDesc || '',
      dayGan: safeData.dayGan || '',
      pillars: safeData.pillars || [],
      currentDayun: Array.isArray(safeData.dayuns) ? safeData.dayuns[safeData.currentDayunIdx] : null,
      qiYun: safeData.qiYun || null,
      taiYuan: safeData.taiYuan || '',
      mingGong: safeData.mingGong || '',
      shenGong: safeData.shenGong || '',
      todayYear: safeData.todayYear,
      currentAge: safeData.currentAge
    }
  }
}
