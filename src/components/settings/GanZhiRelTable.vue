<template>
  <div class="ganzhi-rel-wrap">
    <!-- 天干合化 -->
    <div class="rel-section">
      <div class="rel-title">天干关系</div>
      <table class="rel-table">
        <thead>
          <tr>
            <th></th>
            <th v-for="p in allCols" :key="p.label">{{ p.label }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, ri) in ganRelMatrix" :key="ri">
            <td class="row-head">{{ allCols[ri].label }}</td>
            <td v-for="(cell, ci) in row" :key="ci" :class="['rel-cell', cell.cls]">
              {{ cell.text }}
            </td>
          </tr>
        </tbody>
      </table>
      <div class="legend-row">
        <span class="legend he">合</span> 天干五合 &nbsp;
        <span class="legend chong">冲</span> 相冲克 &nbsp;
        <span class="legend ke">克</span> 五行相克 &nbsp;
        <span class="legend sheng">生</span> 五行相生 &nbsp;
        <span class="legend tong">同</span> 同天干
      </div>
    </div>

    <!-- 地支关系 -->
    <div class="rel-section">
      <div class="rel-title">地支关系</div>
      <table class="rel-table">
        <thead>
          <tr>
            <th></th>
            <th v-for="p in allCols" :key="p.label">{{ p.label }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, ri) in zhiRelMatrix" :key="ri">
            <td class="row-head">{{ allCols[ri].label }}</td>
            <td v-for="(cell, ci) in row" :key="ci" :class="['rel-cell', cell.cls]">
              {{ cell.text }}
            </td>
          </tr>
        </tbody>
      </table>
      <div class="legend-row">
        <span class="legend he">合</span> 六合/三合 &nbsp;
        <span class="legend chong">冲</span> 六冲 &nbsp;
        <span class="legend xing">刑</span> 相刑 &nbsp;
        <span class="legend hai">害</span> 六害
      </div>
    </div>

    <!-- 三合/半合 提示 -->
    <div class="rel-section" v-if="sanheGroups.length">
      <div class="rel-title">三合局</div>
      <div class="sanhe-list">
        <el-tag v-for="g in sanheGroups" :key="g.name" type="success" size="small" style="margin:3px">
          {{ g.zhis.join('') }} → {{ g.name }}
        </el-tag>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { ganColor, zhiColor } from '../../utils/bazi.js'

const props = defineProps({ data: Object })

const allCols = computed(() => props.data.tableColumns)

// 天干五合
const GAN_HE = { 甲:'己', 己:'甲', 乙:'庚', 庚:'乙', 丙:'辛', 辛:'丙', 丁:'壬', 壬:'丁', 戊:'癸', 癸:'戊' }
const GAN_HE_WX = { 甲:'土', 乙:'金', 丙:'水', 丁:'木', 戊:'火' }
const GAN_WX = { 甲:'木',乙:'木',丙:'火',丁:'火',戊:'土',己:'土',庚:'金',辛:'金',壬:'水',癸:'水' }
const WX_KE = { 木:'土',火:'金',土:'水',金:'木',水:'火' }
const WX_SHENG = { 木:'火',火:'土',土:'金',金:'水',水:'木' }
const GAN_CHONG = { 甲:'庚',庚:'甲',乙:'辛',辛:'乙',丙:'壬',壬:'丙',丁:'癸',癸:'丁' }

function ganRel(g1, g2) {
  if (!g1 || !g2) return { text: '', cls: '' }
  if (g1 === g2) return { text: '同', cls: 'tong' }
  if (GAN_HE[g1] === g2) {
    const wx = GAN_HE_WX[g1] || GAN_HE_WX[g2] || ''
    return { text: `合${wx}`, cls: 'he' }
  }
  if (GAN_CHONG[g1] === g2) return { text: '冲', cls: 'chong' }
  const w1 = GAN_WX[g1], w2 = GAN_WX[g2]
  if (WX_KE[w1] === w2) return { text: '克', cls: 'ke' }
  if (WX_KE[w2] === w1) return { text: '被克', cls: 'chong' }
  if (WX_SHENG[w1] === w2) return { text: '生', cls: 'sheng' }
  if (WX_SHENG[w2] === w1) return { text: '被生', cls: 'sheng' }
  return { text: '', cls: '' }
}

const ganRelMatrix = computed(() =>
  allCols.value.map(r => allCols.value.map(c => ganRel(r.gan, c.gan)))
)

// 地支关系
const ZHI_LIUHE = {
  子:'丑',丑:'子',寅:'亥',亥:'寅',卯:'戌',戌:'卯',辰:'酉',酉:'辰',巳:'申',申:'巳',午:'未',未:'午'
}
const ZHI_CHONG = {
  子:'午',午:'子',丑:'未',未:'丑',寅:'申',申:'寅',卯:'酉',酉:'卯',辰:'戌',戌:'辰',巳:'亥',亥:'巳'
}
const ZHI_HAI = {
  子:'未',未:'子',丑:'午',午:'丑',寅:'巳',巳:'寅',卯:'辰',辰:'卯',申:'亥',亥:'申',酉:'戌',戌:'酉'
}
const ZHI_XING = {
  寅:'巳',巳:'申',申:'寅',
  丑:'戌',戌:'未',未:'丑',
  子:'卯',卯:'子'
}
const ZHI_SANHE = [
  { zhis:['申','子','辰'], name:'水局' },
  { zhis:['寅','午','戌'], name:'火局' },
  { zhis:['巳','酉','丑'], name:'金局' },
  { zhis:['亥','卯','未'], name:'木局' },
]

function zhiRel(z1, z2) {
  if (!z1 || !z2 || z1 === z2) return { text: '', cls: '' }
  if (ZHI_LIUHE[z1] === z2) return { text: '六合', cls: 'he' }
  if (ZHI_CHONG[z1] === z2) return { text: '六冲', cls: 'chong' }
  if (ZHI_HAI[z1] === z2) return { text: '六害', cls: 'hai' }
  if (ZHI_XING[z1] === z2) return { text: '相刑', cls: 'xing' }
  // 三合半合
  for (const g of ZHI_SANHE) {
    if (g.zhis.includes(z1) && g.zhis.includes(z2)) return { text: '三合', cls: 'he' }
  }
  return { text: '', cls: '' }
}

const zhiRelMatrix = computed(() =>
  allCols.value.map(r => allCols.value.map(c => zhiRel(r.zhi, c.zhi)))
)

const sanheGroups = computed(() => {
  const zhis = allCols.value.map(c => c.zhi)
  return ZHI_SANHE.filter(g => g.zhis.filter(z => zhis.includes(z)).length >= 2)
    .map(g => ({ ...g, zhis: g.zhis.filter(z => zhis.includes(z)) }))
})
</script>

<style scoped>
.ganzhi-rel-wrap { padding: 8px; text-align: center; }
.rel-section { margin-bottom: 20px; }
.rel-title { display: inline-block; font-size: 13px; font-weight: bold; color: #555; margin-bottom: 8px; padding: 0 8px 0 10px; border-left: 3px solid #8b6914; }
.rel-table { border-collapse: collapse; font-size: 12px; width: auto; margin: 0 auto; }
.rel-table th, .rel-table td { border: 1px solid #e8e0cc; padding: 5px 10px; text-align: center; min-width: 56px; }
.rel-table th { background: #f5f0e8; font-weight: normal; color: #888; }
.row-head { background: #fafaf8; color: #888; text-align: right; padding-right: 8px; }
.rel-cell { font-size: 12px; }
.he { color: #3c8a2e; background: #f0faf0; }
.chong { color: #c0392b; background: #fff5f5; }
.ke { color: #e67e22; background: #fffaf0; }
.sheng { color: #2271b8; background: #f3f8ff; }
.tong { color: #666; background: #f7f7f7; }
.xing { color: #8b6914; background: #fffdf0; }
.hai { color: #9b59b6; background: #fdf5ff; }
.legend-row { margin-top: 6px; font-size: 11px; color: #888; }
.legend { display: inline-block; width: 18px; height: 18px; line-height: 18px; text-align: center; border-radius: 3px; font-size: 11px; }
.sanhe-list { padding: 4px 0; }
</style>
