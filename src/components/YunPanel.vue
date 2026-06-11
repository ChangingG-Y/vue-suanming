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

    <!-- 大运横向表格 -->
    <div class="dayun-scroll">
      <table class="dayun-table">
        <tbody>
          <!-- 年份行 -->
          <tr>
            <td class="row-head">大运</td>
            <td v-for="(dy, i) in data.dayuns" :key="i" :class="['dayun-year', i===data.currentDayunIdx?'active':'']">
              {{ dy.startYear }}
            </td>
          </tr>
          <!-- 岁数行 -->
          <tr>
            <td class="row-head"></td>
            <td v-for="(dy, i) in data.dayuns" :key="i" :class="[i===data.currentDayunIdx?'active':'']">
              <span class="age-label">{{ dy.startAge }}岁</span>
            </td>
          </tr>
          <!-- 大运干 -->
          <tr>
            <td class="row-head"></td>
            <td v-for="(dy, i) in data.dayuns" :key="i" :class="['gan-cell', i===data.currentDayunIdx?'active':'']">
              <span :style="{ color: ganColor(dy.gan) }">{{ dy.gan }}</span>
              <span class="ss-tag" :style="{ color: ssColor(dy.ss) }">{{ ssShort(dy.ss) }}</span>
            </td>
          </tr>
          <!-- 大运支 -->
          <tr>
            <td class="row-head"></td>
            <td v-for="(dy, i) in data.dayuns" :key="i" :class="['zhi-cell', i===data.currentDayunIdx?'active':'']">
              <span :style="{ color: zhiColor(dy.zhi) }">{{ dy.zhi }}</span>
              <span class="ss-tag" :style="{ color: ssColor(dy.zhiSS) }">{{ ssShort(dy.zhiSS) }}</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 流年/小运 for current 大运 -->
    <div v-if="currentDayun" class="liunian-section">
      <div class="section-title">
        流年 <span class="dy-label">{{ currentDayun.ganZhi }}大运</span>
        <span class="section-subtitle">小运</span>
      </div>
      <div class="liunian-scroll">
        <table class="liunian-table">
          <tbody>
            <!-- 年份 -->
            <tr>
              <td class="row-head">流年</td>
              <td v-for="ln in currentDayun.liunian" :key="ln.year" :class="['ln-year', ln.year === data.todayYear ? 'active' : '']">
                {{ ln.year }}
              </td>
            </tr>
            <!-- 流年干 -->
            <tr>
              <td class="row-head"></td>
              <td v-for="ln in currentDayun.liunian" :key="ln.year" :class="[ln.year === data.todayYear ? 'active' : '']">
                <span :style="{ color: ganColor(ln.gan) }">{{ ln.gan }}</span>
                <span class="ss-tag" :style="{ color: ssColor(ln.ss) }">{{ ssShort(ln.ss) }}</span>
              </td>
            </tr>
            <!-- 流年支 -->
            <tr>
              <td class="row-head"></td>
              <td v-for="ln in currentDayun.liunian" :key="ln.year" :class="[ln.year === data.todayYear ? 'active' : '']">
                <span :style="{ color: zhiColor(ln.zhi) }">{{ ln.zhi }}</span>
                <span class="ss-tag" :style="{ color: ssColor(ln.zhiSS) }">{{ ssShort(ln.zhiSS) }}</span>
              </td>
            </tr>
            <!-- 小运干支 -->
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

    <!-- 五行旺衰 -->
    <div class="wuxing-bar">
      <div v-for="wx in wuxingItems" :key="wx.name" :class="['wx-item', wx.cls]">
        {{ wx.name }}{{ wx.label }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { ganColor, zhiColor, ssColor, ssShort } from '../utils/bazi.js'

const props = defineProps({ data: Object })
const currentDayun = computed(() => props.data.dayuns?.[props.data.currentDayunIdx])

const wuxingItems = [
  { name: '水', label: '旺', cls: 'wx-water' },
  { name: '木', label: '相', cls: 'wx-wood' },
  { name: '金', label: '休', cls: 'wx-metal' },
  { name: '土', label: '囚', cls: 'wx-earth' },
  { name: '火', label: '死', cls: 'wx-fire' }
]
</script>

<style scoped>
.yun-panel { padding: 10px 12px 12px; }
.qiyun-info {
  font-size: 12px;
  color: #555;
  margin-bottom: 10px;
  padding: 7px 12px;
  background: rgba(248, 240, 220, 0.55);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(210, 172, 100, 0.28);
  border-radius: 10px;
}
.info-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.label { color: #8a7a66; }
.age-badge {
  margin-left: auto;
  background: linear-gradient(135deg, #7a5a10, #a8800e);
  color: #fff;
  border-radius: 999px;
  padding: 2px 10px;
  font-size: 11px;
  box-shadow: 0 2px 6px rgba(120, 80, 10, 0.25);
}
.dayun-scroll, .liunian-scroll { overflow-x: auto; }
.dayun-table, .liunian-table {
  border-collapse: collapse;
  font-size: 12px;
  white-space: nowrap;
}
.dayun-table td, .liunian-table td {
  border: 1px solid rgba(210, 172, 100, 0.28);
  padding: 3px 6px;
  text-align: center;
  min-width: 44px;
}
.row-head {
  background: rgba(240, 228, 200, 0.5);
  color: #8a7a66;
  font-size: 11px;
  padding: 3px 6px;
  white-space: nowrap;
}
.active { background: rgba(255, 248, 220, 0.7); font-weight: bold; }
.ln-year.active { background: rgba(255, 248, 220, 0.7); color: #8b6914; }
.dayun-year.active { color: #8b6914; font-weight: bold; }
.age-label { font-size: 11px; color: #8a7a66; }
.gan-cell, .zhi-cell { font-size: 15px; }
.ss-tag { font-size: 10px; color: #999; vertical-align: super; }
.section-title {
  font-size: 12px;
  color: #665544;
  padding: 8px 0 4px;
  display: flex;
  align-items: center;
  gap: 8px;
}
.dy-label { color: #8b6914; font-weight: bold; }
.section-subtitle { color: #9a8a78; margin-left: auto; }
.liunian-section { margin-top: 8px; }
.wuxing-bar {
  display: flex;
  margin-top: 14px;
  border-radius: 10px;
  overflow: hidden;
  font-size: 12px;
  gap: 2px;
  padding: 0 1px;
}
.wx-item {
  flex: 1;
  text-align: center;
  padding: 5px 2px;
  color: rgba(255,255,255,0.92);
  font-size: 11px;
  border-radius: 6px;
  font-weight: 600;
  letter-spacing: 0.02em;
}
.wx-water  { background: linear-gradient(135deg, #1a5fa8, #2b7fd6); }
.wx-wood   { background: linear-gradient(135deg, #2d7020, #48a032); }
.wx-metal  { background: linear-gradient(135deg, #6a6a6a, #909090); }
.wx-earth  { background: linear-gradient(135deg, #8a3e20, #b55a30); }
.wx-fire   { background: linear-gradient(135deg, #a82820, #d43c30); }
</style>
