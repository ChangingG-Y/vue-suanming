<template>
  <div class="siling-wrap">
    <div class="siling-desc">
      人元司令：月令（{{ monthZhi }}）当令藏干掌管时令，决定各五行旺衰程度。
    </div>
    <table class="siling-table">
      <thead>
        <tr>
          <th>月令</th>
          <th>藏干</th>
          <th>十神</th>
          <th>五行</th>
          <th>司令天数</th>
          <th>旺衰</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(row, i) in silingRows" :key="i" :class="i === 0 ? 'main-row' : ''">
          <td class="cell-center">
            <span v-if="i === 0" :style="{ color: zhiColor(monthZhi), fontSize: '20px', fontWeight: 'bold' }">{{ monthZhi }}</span>
            <span v-else class="text-muted">{{ monthZhi }}</span>
          </td>
          <td class="cell-center">
            <span :style="{ color: ganColor(row.gan), fontSize: '18px', fontWeight: 'bold' }">{{ row.gan }}</span>
          </td>
          <td class="cell-center">
            <span :style="{ color: ssColor(row.ss) }">{{ row.ss }}</span>
          </td>
          <td class="cell-center">
            <span :style="{ color: wxColor(row.wx) }">{{ row.wx }}</span>
          </td>
          <td class="cell-center">
            <div class="days-bar-wrap">
              <div class="days-bar" :style="{ width: (row.days / 30 * 100) + '%', background: wxColor(row.wx) }"></div>
              <span class="days-num">{{ row.days }}天</span>
            </div>
          </td>
          <td class="cell-center">
            <el-tag :type="i === 0 ? 'danger' : 'info'" size="small">{{ i === 0 ? '当令旺' : i === 1 ? '中气' : '余气' }}</el-tag>
          </td>
        </tr>
      </tbody>
    </table>

    <!-- 五行力量分析 -->
    <div class="wx-power">
      <div class="section-title">命局五行力量</div>
      <div class="wx-bars">
        <div v-for="wx in wuxingPower" :key="wx.name" class="wx-bar-item">
          <div class="wx-name" :style="{ color: wxColor(wx.name) }">{{ wx.name }}</div>
          <div class="wx-bar-bg">
            <div class="wx-bar-fill" :style="{ width: wx.pct + '%', background: wxColor(wx.name) }"></div>
          </div>
          <div class="wx-count">{{ wx.count }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { ganColor, zhiColor, ssColor, getShiShen, getHideGan } from '../../utils/bazi.js'

const props = defineProps({ data: Object })

const monthZhi = computed(() => props.data.pillars[1].zhi)

const GAN_WX = { 甲:'木',乙:'木',丙:'火',丁:'火',戊:'土',己:'土',庚:'金',辛:'金',壬:'水',癸:'水' }
const ZHI_WX = { 子:'水',亥:'水',寅:'木',卯:'木',辰:'土',戌:'土',丑:'土',未:'土',午:'火',巳:'火',申:'金',酉:'金' }

// 月令司令天数 (simplified approximation)
const SILING_DAYS = {
  子: [['癸',30]],
  丑: [['己',18],['癸',9],['辛',3]],
  寅: [['甲',16],['丙',7],['戊',7]],
  卯: [['乙',30]],
  辰: [['戊',18],['乙',9],['癸',3]],
  巳: [['丙',16],['庚',7],['戊',7]],
  午: [['丁',20],['己',10]],
  未: [['己',18],['丁',9],['乙',3]],
  申: [['庚',16],['壬',7],['戊',7]],
  酉: [['辛',30]],
  戌: [['戊',18],['辛',9],['丁',3]],
  亥: [['壬',20],['甲',10]],
}

const silingRows = computed(() => {
  const zhi = monthZhi.value
  const entries = SILING_DAYS[zhi] || []
  return entries.map(([gan, days]) => ({
    gan,
    days,
    ss: getShiShen(props.data.dayGan, gan),
    wx: GAN_WX[gan] || ''
  }))
})

function wxColor(wx) {
  const c = { 木:'#3c8a2e',火:'#c0392b',土:'#a0522d',金:'#888',水:'#2271b8' }
  return c[wx] || '#333'
}

const wuxingPower = computed(() => {
  const counts = { 木:0, 火:0, 土:0, 金:0, 水:0 }
  for (const p of props.data.pillars) {
    if (GAN_WX[p.gan]) counts[GAN_WX[p.gan]]++
    if (ZHI_WX[p.zhi]) counts[ZHI_WX[p.zhi]]++
    for (const hg of (p.hideGan || [])) {
      if (GAN_WX[hg]) counts[GAN_WX[hg]] += 0.5
    }
  }
  const max = Math.max(...Object.values(counts)) || 1
  return Object.entries(counts).map(([name, count]) => ({
    name, count: Math.round(count * 10) / 10, pct: Math.round(count / max * 100)
  }))
})
</script>

<style scoped>
.siling-wrap { padding: 8px; }
.siling-desc { font-size: 12px; color: #888; background: #fafaf8; padding: 8px 12px; border-radius: 4px; margin-bottom: 12px; }
.siling-table { border-collapse: collapse; font-size: 12px; width: 100%; }
.siling-table th, .siling-table td { border: 1px solid #e8e0cc; padding: 6px 10px; text-align: center; vertical-align: middle; }
.siling-table th { background: #f5f0e8; font-weight: normal; color: #888; }
.cell-center { text-align: center; }
.text-muted { color: #ccc; font-size: 12px; }
.main-row td { background: #fffdf5; }
.days-bar-wrap { position: relative; background: #f0f0f0; border-radius: 4px; height: 16px; min-width: 80px; }
.days-bar { height: 100%; border-radius: 4px; opacity: 0.7; }
.days-num { position: absolute; right: 4px; top: 0; line-height: 16px; font-size: 11px; color: #555; }
.wx-power { margin-top: 16px; }
.section-title { font-size: 12px; font-weight: bold; color: #555; margin-bottom: 10px; padding-left: 4px; border-left: 3px solid #8b6914; }
.wx-bars { display: flex; flex-direction: column; gap: 8px; }
.wx-bar-item { display: flex; align-items: center; gap: 8px; font-size: 12px; }
.wx-name { width: 20px; font-weight: bold; }
.wx-bar-bg { flex: 1; background: #f0f0f0; border-radius: 4px; height: 14px; }
.wx-bar-fill { height: 100%; border-radius: 4px; opacity: 0.75; transition: width 0.4s; }
.wx-count { width: 30px; color: #888; font-size: 11px; }
</style>
