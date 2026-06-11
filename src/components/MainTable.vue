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
  font-size: 13px;
}
.bazi-table th, .bazi-table td {
  border: 1px solid rgba(210, 172, 100, 0.28);
  padding: 4px 5px;
  text-align: center;
  vertical-align: top;
  min-width: 58px;
}
.bazi-table th {
  background: rgba(240, 228, 200, 0.6);
  backdrop-filter: blur(4px);
  color: #4a3c2c;
  font-weight: 700;
  font-size: 13px;
  padding: 7px 5px;
  letter-spacing: 0.02em;
}
/* 首列（行标签）圆角 */
.bazi-table thead tr th:first-child { border-radius: 8px 0 0 0; }
.bazi-table thead tr th:last-child  { border-radius: 0 8px 0 0; }

.row-label {
  background: rgba(248, 244, 236, 0.55);
  color: #8a7a66;
  font-size: 11px;
  font-weight: 700;
  white-space: nowrap;
  text-align: right;
  padding-right: 6px;
  width: 30px;
  min-width: unset;
}
/* 分区背景 — 天干/地支主区 */
.bazi-table tbody tr:nth-child(1) td { background: rgba(255, 252, 242, 0.45); }
.bazi-table tbody tr:nth-child(2) td,
.bazi-table tbody tr:nth-child(3) td { background: transparent; }
/* 藏干微区分 */
.bazi-table tbody tr:nth-child(4) td {
  background: rgba(245, 236, 216, 0.38);
  border-top: 1px solid rgba(200, 158, 80, 0.35);
  border-bottom: 1px solid rgba(200, 158, 80, 0.35);
}
/* 小字信息区 */
.bazi-table tbody tr:nth-child(5) td,
.bazi-table tbody tr:nth-child(6) td,
.bazi-table tbody tr:nth-child(7) td,
.bazi-table tbody tr:nth-child(8) td { background: rgba(250, 246, 238, 0.38); }
/* 神煞区 */
.bazi-table tbody tr:nth-child(9) td {
  background: rgba(255, 250, 236, 0.45);
  border-top: 1px solid rgba(200, 158, 80, 0.3);
}
/* 日柱高亮列 */
.day-col { background: rgba(255, 252, 230, 0.65) !important; }
.bazi-table th.day-col { background: rgba(248, 235, 180, 0.7) !important; }

.cell-gan, .cell-zhi {
  font-size: 28px;
  font-weight: bold;
  padding: 5px 4px;
  background: transparent !important;
}
.cell-center { vertical-align: middle; }
.small-text { font-size: 12px; color: #4d4438; }
.cell-hidegan { vertical-align: top; padding: 3px 4px; }
.hide-gan-row {
  display: flex;
  justify-content: center;
  gap: 2px;
  font-size: 12px;
  line-height: 1.5;
}
.hide-ss { font-size: 11px; }
.cell-shensha { vertical-align: top; padding: 3px 4px; }
.shensha-item { font-size: 12px; color: #8d6830; white-space: nowrap; line-height: 1.55; }
.bottom-info {
  display: flex;
  gap: 14px;
  padding: 8px 2px 2px;
  font-size: 11px;
  color: rgba(130, 105, 75, 0.8);
  justify-content: flex-end;
  flex-wrap: wrap;
  border-top: 1px solid rgba(210, 172, 100, 0.22);
  margin-top: 6px;
}
.bottom-info span {
  background: rgba(248, 238, 210, 0.6);
  border: 1px solid rgba(210, 172, 100, 0.25);
  border-radius: 999px;
  padding: 2px 10px;
  letter-spacing: 0.02em;
}
</style>
