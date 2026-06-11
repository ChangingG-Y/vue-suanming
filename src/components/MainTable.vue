<template>
  <div class="main-table-wrap">
    <table class="bazi-table">
      <thead>
        <tr>
          <th class="row-label">日期</th>
          <th v-for="col in cols" :key="col.label" :class="['col-header', col.label === '日柱' ? 'day-col' : '']">
            {{ col.label }}
          </th>
        </tr>
      </thead>
      <tbody>
        <!-- 主星 -->
        <tr>
          <td class="row-label">主星</td>
          <td v-for="col in cols" :key="col.label" class="cell-center">
            <span :style="{ color: ssColor(col.ss), fontWeight: col.label==='日柱'?'bold':'' }">
              {{ col.ss }}
            </span>
          </td>
        </tr>
        <!-- 天干 -->
        <tr>
          <td class="row-label">天干</td>
          <td v-for="col in cols" :key="col.label" class="cell-gan">
            <span :style="{ color: ganColor(col.gan) }">{{ col.gan }}</span>
          </td>
        </tr>
        <!-- 地支 -->
        <tr>
          <td class="row-label">地支</td>
          <td v-for="col in cols" :key="col.label" class="cell-zhi">
            <span :style="{ color: zhiColor(col.zhi) }">{{ col.zhi }}</span>
          </td>
        </tr>
        <!-- 藏干 -->
        <tr>
          <td class="row-label">藏干</td>
          <td v-for="col in cols" :key="col.label" class="cell-hidegan">
            <div v-for="(hg, hi) in col.hideGan" :key="hi" class="hide-gan-row">
              <span :style="{ color: ganColor(hg) }">{{ hg }}</span>
              <span class="hide-ss" :style="{ color: ssColor(col.zhiSS?.[hi] || getShiShen(dayGan, hg)) }">
                {{ col.zhiSS?.[hi] || getShiShen(dayGan, hg) }}
              </span>
            </div>
          </td>
        </tr>
        <!-- 星运 -->
        <tr>
          <td class="row-label">星运</td>
          <td v-for="col in cols" :key="col.label" class="cell-center small-text">{{ col.diShi }}</td>
        </tr>
        <!-- 自坐 -->
        <tr>
          <td class="row-label">自坐</td>
          <td v-for="col in cols" :key="col.label" class="cell-center small-text">{{ col.ziZuo }}</td>
        </tr>
        <!-- 空亡 -->
        <tr>
          <td class="row-label">空亡</td>
          <td v-for="col in cols" :key="col.label" class="cell-center small-text">{{ col.xunKong }}</td>
        </tr>
        <!-- 纳音 -->
        <tr>
          <td class="row-label">纳音</td>
          <td v-for="col in cols" :key="col.label" class="cell-center small-text">{{ col.naYin }}</td>
        </tr>
        <!-- 神煞 -->
        <tr>
          <td class="row-label">神煞</td>
          <td v-for="col in cols" :key="col.label" class="cell-shensha">
            <div v-for="s in col.shenSha" :key="s" class="shensha-item">{{ s }}</div>
          </td>
        </tr>
      </tbody>
    </table>

    <!-- 底部信息 -->
    <div class="bottom-info">
      <span>胎元：{{ data.taiYuan }}</span>
      <span>胎息：{{ data.taiXi }}</span>
      <span>命宫：{{ data.mingGong }}</span>
      <span>身宫：{{ data.shenGong }}</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { ganColor, zhiColor, ssColor, getShiShen, getHideGan } from '../utils/bazi.js'

const props = defineProps({ data: Object })

const dayGan = computed(() => props.data.dayGan)
const cols = computed(() => props.data.tableColumns)
</script>

<style scoped>
.main-table-wrap {
  overflow-x: auto;
}
.bazi-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 15px;
}
.bazi-table th, .bazi-table td {
  border: 1px solid #e8e0cc;
  padding: 7px 8px;
  text-align: center;
  vertical-align: top;
  min-width: 72px;
}
.bazi-table th {
  background: #f5f0e8;
  color: #5a4c3b;
  font-weight: 700;
  font-size: 14px;
}
.row-label {
  background: #fafaf8;
  color: #8a7a66;
  font-size: 14px;
  font-weight: 700;
  white-space: nowrap;
  text-align: right;
  padding-right: 8px;
  width: 36px;
}
.day-col { background: #fffdf5; }
.cell-gan, .cell-zhi {
  font-size: 32px;
  font-weight: bold;
  padding: 8px 4px;
}
.cell-center { vertical-align: middle; }
.small-text { font-size: 14px; color: #4d4438; }
.cell-hidegan { vertical-align: top; padding: 4px; }
.hide-gan-row {
  display: flex;
  justify-content: center;
  gap: 3px;
  font-size: 14px;
  line-height: 1.65;
}
.hide-ss { font-size: 13px; }
.cell-shensha { vertical-align: top; }
.shensha-item { font-size: 13px; color: #8d6830; white-space: nowrap; line-height: 1.75; }
.bottom-info {
  display: flex;
  gap: 20px;
  padding: 8px 0;
  font-size: 13px;
  color: #887865;
  justify-content: flex-end;
  flex-wrap: wrap;
}
</style>
