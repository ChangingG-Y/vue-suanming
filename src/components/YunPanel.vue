<template>
  <div class="yun-panel">
    <!-- 起运/交运 info -->
    <div class="qiyun-info">
      <div class="info-row">
        <span class="label">起运：</span>
        <span>出生后{{ data.qiYun.year }}年{{ data.qiYun.month }}月{{ data.qiYun.day }}天起运</span>
        <span class="age-badge">{{ data.currentAge }}岁</span>
      </div>
    </div>

    <!-- 大运横向表格（可点击切换） -->
    <div class="dayun-scroll">
      <table class="dayun-table">
        <tbody>
          <!-- 年份行 -->
          <tr>
            <td class="row-head">大运</td>
            <td
              v-for="(dy, i) in data.dayuns" :key="i"
              :class="['dayun-cell', 'dayun-year', cellClass(i)]"
              @click="selectedDayunIdx = i"
            >{{ dy.startYear }}</td>
          </tr>
          <!-- 岁数行 -->
          <tr>
            <td class="row-head"></td>
            <td
              v-for="(dy, i) in data.dayuns" :key="i"
              :class="['dayun-cell', cellClass(i)]"
              @click="selectedDayunIdx = i"
            ><span class="age-label">{{ dy.startAge }}岁</span></td>
          </tr>
          <!-- 大运干 -->
          <tr>
            <td class="row-head"></td>
            <td
              v-for="(dy, i) in data.dayuns" :key="i"
              :class="['dayun-cell', 'gan-cell', cellClass(i)]"
              @click="selectedDayunIdx = i"
            >
              <span :style="{ color: ganColor(dy.gan) }">{{ dy.gan }}</span>
              <span class="ss-tag" :style="{ color: ssColor(dy.ss) }">{{ ssShort(dy.ss) }}</span>
            </td>
          </tr>
          <!-- 大运支 -->
          <tr>
            <td class="row-head"></td>
            <td
              v-for="(dy, i) in data.dayuns" :key="i"
              :class="['dayun-cell', 'zhi-cell', cellClass(i)]"
              @click="selectedDayunIdx = i"
            >
              <span :style="{ color: zhiColor(dy.zhi) }">{{ dy.zhi }}</span>
              <span class="ss-tag" :style="{ color: ssColor(dy.zhiSS) }">{{ ssShort(dy.zhiSS) }}</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 流年/小运 for selected 大运 -->
    <div v-if="currentDayun" class="liunian-section">
      <div class="section-title">
        流年
        <span class="dy-label">{{ currentDayun.ganZhi }}大运</span>
        <span v-if="selectedDayunIdx !== data.currentDayunIdx" class="non-current-hint">非当前大运</span>
        <span class="section-subtitle">小运</span>
      </div>
      <div class="liunian-scroll">
        <table class="liunian-table">
          <tbody>
            <tr>
              <td class="row-head">流年</td>
              <td v-for="ln in currentDayun.liunian" :key="ln.year" :class="['ln-year', ln.year === data.todayYear ? 'active' : '']">
                {{ ln.year }}
              </td>
            </tr>
            <tr>
              <td class="row-head"></td>
              <td v-for="ln in currentDayun.liunian" :key="ln.year" :class="[ln.year === data.todayYear ? 'active' : '']">
                <span :style="{ color: ganColor(ln.gan) }">{{ ln.gan }}</span>
                <span class="ss-tag" :style="{ color: ssColor(ln.ss) }">{{ ssShort(ln.ss) }}</span>
              </td>
            </tr>
            <tr>
              <td class="row-head"></td>
              <td v-for="ln in currentDayun.liunian" :key="ln.year" :class="[ln.year === data.todayYear ? 'active' : '']">
                <span :style="{ color: zhiColor(ln.zhi) }">{{ ln.zhi }}</span>
                <span class="ss-tag" :style="{ color: ssColor(ln.zhiSS) }">{{ ssShort(ln.zhiSS) }}</span>
              </td>
            </tr>
            <tr>
              <td class="row-head">小运</td>
              <td v-for="xy in currentDayun.xiaoyun" :key="xy.year" :class="[xy.year === data.todayYear ? 'active' : '']">
                <div><span :style="{ color: ganColor(xy.gan) }">{{ xy.gan }}</span><span class="ss-tag" :style="{ color: ssColor(xy.ss) }">{{ ssShort(xy.ss) }}</span></div>
                <div><span :style="{ color: zhiColor(xy.zhi) }">{{ xy.zhi }}</span><span class="ss-tag" :style="{ color: ssColor(xy.zhiSS) }">{{ ssShort(xy.zhiSS) }}</span></div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- 五行分布进度条 -->
    <div class="wuxing-section">
      <div class="wuxing-title">五行分布</div>
      <div class="wuxing-bars">
        <div v-for="wx in wuxingData" :key="wx.name" class="wx-bar-row">
          <span class="wx-name" :class="`wx-name-${wx.cls}`">{{ wx.name }}</span>
          <div class="wx-track">
            <div class="wx-fill" :class="`wx-fill-${wx.cls}`" :style="{ width: wx.pct + '%' }">
              <span v-if="wx.pct >= 12" class="wx-fill-label">{{ wx.pct }}%</span>
            </div>
            <span v-if="wx.pct < 12" class="wx-ext-label">{{ wx.pct }}%</span>
          </div>
          <span class="wx-count">{{ wx.count.toFixed(1) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ganColor, zhiColor, ssColor, ssShort, wuXingOf, getHideGan } from '../utils/bazi.js'

const props = defineProps({ data: Object })

const selectedDayunIdx = ref(props.data.currentDayunIdx ?? 0)

const currentDayun = computed(() => props.data.dayuns?.[selectedDayunIdx.value])

function cellClass(i) {
  const isCurrent = i === props.data.currentDayunIdx
  const isSelected = i === selectedDayunIdx.value
  if (isSelected && isCurrent) return 'cell-selected cell-today'
  if (isSelected) return 'cell-selected'
  if (isCurrent) return 'cell-today'
  return ''
}

const ZHI_WX = {
  子:'水',亥:'水',寅:'木',卯:'木',辰:'土',戌:'土',丑:'土',未:'土',
  午:'火',巳:'火',申:'金',酉:'金'
}

const WX_META = [
  { name: '木', cls: 'wood' },
  { name: '火', cls: 'fire' },
  { name: '土', cls: 'earth' },
  { name: '金', cls: 'metal' },
  { name: '水', cls: 'water' }
]

const wuxingData = computed(() => {
  const counts = { 木: 0, 火: 0, 土: 0, 金: 0, 水: 0 }
  ;(props.data.pillars || []).forEach(pillar => {
    const ganWx = wuXingOf(pillar.gan)
    if (ganWx) counts[ganWx] += 1
    const zhiWx = ZHI_WX[pillar.zhi]
    if (zhiWx) counts[zhiWx] += 1
    getHideGan(pillar.zhi).forEach((hg, hi) => {
      const hgWx = wuXingOf(hg)
      if (hgWx) counts[hgWx] += hi === 0 ? 0.5 : 0.3
    })
  })
  const total = Object.values(counts).reduce((a, b) => a + b, 0)
  return WX_META.map(m => ({
    ...m,
    count: counts[m.name],
    pct: total > 0 ? Math.round(counts[m.name] / total * 100) : 0
  }))
})
</script>

<style scoped>
.yun-panel { padding: 10px 12px 12px; }

.qiyun-info {
  font-size: 13px;
  font-weight: 500;
  color: #444;
  margin-bottom: 10px;
  padding: 8px 12px;
  background: rgba(248, 240, 220, 0.55);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(210, 172, 100, 0.28);
  border-radius: 10px;
}
.info-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.label { color: #6a5a48; font-weight: 700; }
.age-badge {
  margin-left: auto;
  background: linear-gradient(135deg, #7a5a10, #a8800e);
  color: #fff;
  border-radius: 999px;
  padding: 2px 10px;
  font-size: 11px;
  box-shadow: 0 2px 6px rgba(120, 80, 10, 0.25);
}

/* ── 大运表格 ── */
.dayun-scroll, .liunian-scroll { overflow-x: auto; }
.dayun-table, .liunian-table {
  border-collapse: collapse;
  font-size: 13px;
  white-space: nowrap;
}
.dayun-table td, .liunian-table td {
  border: 1px solid rgba(210, 172, 100, 0.28);
  padding: 4px 7px;
  text-align: center;
  min-width: 46px;
}
.row-head {
  background: rgba(240, 228, 200, 0.5);
  color: #5a4a38;
  font-size: 12px;
  font-weight: 800;
  padding: 4px 7px;
  white-space: nowrap;
}

/* 可点击列 */
.dayun-cell {
  cursor: pointer;
  transition: background 0.15s;
  user-select: none;
}
.dayun-cell:hover { background: rgba(255, 248, 215, 0.6); }

/* 今日大运 */
.cell-today { background: rgba(255, 248, 220, 0.55); }
.cell-today.dayun-year { color: #8b6914; font-weight: bold; }

/* 选中大运 */
.cell-selected {
  background: rgba(200, 150, 30, 0.15) !important;
  box-shadow: inset 0 0 0 1.5px rgba(180, 130, 20, 0.45);
}
.cell-selected.dayun-year { color: #7a4f00; font-weight: bold; }

/* 选中且是今日 */
.cell-selected.cell-today {
  background: rgba(210, 160, 40, 0.22) !important;
}

.age-label { font-size: 12px; color: #6a5a48; font-weight: 600; }
.gan-cell, .zhi-cell { font-size: 17px; font-weight: 700; }
.ss-tag { font-size: 11px; color: #888; vertical-align: super; font-weight: 600; }

/* ── 流年 ── */
.liunian-section { margin-top: 8px; }
.section-title {
  font-size: 13px; font-weight: 700; color: #4a3828;
  padding: 9px 0 5px;
  display: flex; align-items: center; gap: 8px;
}
.dy-label { color: #8b6914; font-weight: bold; }
.non-current-hint {
  font-size: 10px;
  color: #b08060;
  background: rgba(200, 150, 50, 0.12);
  border: 1px solid rgba(200, 150, 50, 0.25);
  border-radius: 4px;
  padding: 1px 5px;
}
.section-subtitle { color: #9a8a78; margin-left: auto; }
.active { background: rgba(255, 248, 220, 0.7); font-weight: bold; }
.ln-year.active { background: rgba(255, 248, 220, 0.7); color: #8b6914; }

/* ── 五行进度条 ── */
.wuxing-section {
  margin-top: 14px;
  background: rgba(248, 240, 220, 0.42);
  border: 1px solid rgba(210, 172, 100, 0.22);
  border-radius: 10px;
  padding: 10px 12px 8px;
}
.wuxing-title {
  font-size: 12px;
  color: #6a5a48;
  margin-bottom: 9px;
  font-weight: 700;
  letter-spacing: 0.04em;
}
.wuxing-bars { display: flex; flex-direction: column; gap: 6px; }
.wx-bar-row {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 13px;
}
.wx-name {
  width: 16px;
  text-align: center;
  font-weight: 800;
  font-size: 14px;
  flex-shrink: 0;
}
.wx-name-wood  { color: #3c8a2e; }
.wx-name-fire  { color: #c0392b; }
.wx-name-earth { color: #a0522d; }
.wx-name-metal { color: #7a7a7a; }
.wx-name-water { color: #2271b8; }

.wx-track {
  flex: 1;
  height: 18px;
  background: rgba(0,0,0,0.06);
  border-radius: 999px;
  overflow: visible;
  position: relative;
  display: flex;
  align-items: center;
}
.wx-fill {
  height: 100%;
  border-radius: 999px;
  transition: width 0.55s cubic-bezier(0.22, 1, 0.36, 1);
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding-right: 6px;
  min-width: 4px;
  position: relative;
}
.wx-fill-label {
  font-size: 11px;
  color: rgba(255,255,255,0.95);
  font-weight: 700;
  white-space: nowrap;
}
.wx-ext-label {
  font-size: 11px;
  color: #6a5a48;
  font-weight: 600;
  padding-left: 5px;
  white-space: nowrap;
}

.wx-fill-wood  { background: linear-gradient(90deg, #2d7020, #57b840); }
.wx-fill-fire  { background: linear-gradient(90deg, #a82820, #e84030); }
.wx-fill-earth { background: linear-gradient(90deg, #8a3e20, #c06035); }
.wx-fill-metal { background: linear-gradient(90deg, #666, #aaa); }
.wx-fill-water { background: linear-gradient(90deg, #1a5fa8, #3090e8); }

.wx-count {
  width: 30px;
  text-align: right;
  font-size: 11px;
  font-weight: 600;
  color: #7a6a58;
  flex-shrink: 0;
}
</style>
