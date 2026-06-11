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
.yun-panel { padding: 8px; }
.qiyun-info {
  font-size: 12px;
  color: #555;
  margin-bottom: 8px;
  padding: 6px 8px;
  background: #fafaf8;
  border-radius: 4px;
}
.info-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.label { color: #888; }
.age-badge {
  margin-left: auto;
  background: #8b6914;
  color: #fff;
  border-radius: 10px;
  padding: 1px 8px;
  font-size: 11px;
}
.dayun-scroll, .liunian-scroll { overflow-x: auto; }
.dayun-table, .liunian-table {
  border-collapse: collapse;
  font-size: 12px;
  white-space: nowrap;
}
.dayun-table td, .liunian-table td {
  border: 1px solid #e8e0cc;
  padding: 3px 6px;
  text-align: center;
  min-width: 44px;
}
.row-head {
  background: #f5f0e8;
  color: #888;
  font-size: 11px;
  padding: 3px 6px;
  white-space: nowrap;
}
.active { background: #fffbf0; font-weight: bold; }
.ln-year.active { background: #fffbf0; color: #8b6914; }
.dayun-year.active { color: #8b6914; font-weight: bold; }
.age-label { font-size: 11px; color: #888; }
.gan-cell, .zhi-cell { font-size: 15px; }
.ss-tag { font-size: 10px; color: #888; vertical-align: super; }
.section-title {
  font-size: 12px;
  color: #555;
  padding: 6px 0 4px;
  display: flex;
  align-items: center;
  gap: 8px;
}
.dy-label { color: #8b6914; font-weight: bold; }
.section-subtitle { color: #888; margin-left: auto; }
.liunian-section { margin-top: 8px; }
.wuxing-bar {
  display: flex;
  margin-top: 12px;
  border-radius: 4px;
  overflow: hidden;
  font-size: 12px;
}
.wx-item {
  flex: 1;
  text-align: center;
  padding: 4px 2px;
  color: #fff;
  font-size: 11px;
}
.wx-water  { background: #2271b8; }
.wx-wood   { background: #3c8a2e; }
.wx-metal  { background: #888; }
.wx-earth  { background: #a0522d; }
.wx-fire   { background: #c0392b; }
</style>
