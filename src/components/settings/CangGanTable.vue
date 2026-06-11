<template>
  <div class="canggan-wrap">
    <table class="canggan-table">
      <thead>
        <tr>
          <th class="row-head">地支</th>
          <th v-for="p in pillars" :key="p.label" :class="p.label === '日柱' ? 'day-col' : ''">
            <div style="font-size:11px;color:#888">{{ p.label }}</div>
            <div :style="{ color: zhiColor(p.zhi), fontSize: '22px', fontWeight: 'bold' }">{{ p.zhi }}</div>
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="pos in [0,1,2]" :key="pos">
          <td class="row-head">{{ posLabel[pos] }}</td>
          <td v-for="p in pillars" :key="p.label" class="cg-cell" :class="p.label === '日柱' ? 'day-col' : ''">
            <template v-if="p.hideGan[pos]">
              <span :style="{ color: ganColor(p.hideGan[pos]), fontSize: '18px', fontWeight: 'bold' }">
                {{ p.hideGan[pos] }}
              </span>
              <span class="ss-label" :style="{ color: ssColor(getShiShen(data.dayGan, p.hideGan[pos])) }">
                {{ getShiShen(data.dayGan, p.hideGan[pos]) }}
              </span>
              <span class="wx-label">{{ ganWx[p.hideGan[pos]] }}</span>
            </template>
            <span v-else class="empty">—</span>
          </td>
        </tr>
        <tr>
          <td class="row-head">自坐</td>
          <td v-for="p in pillars" :key="p.label" class="cg-cell small" :class="p.label === '日柱' ? 'day-col' : ''">
            {{ p.ziZuo }}
          </td>
        </tr>
        <tr>
          <td class="row-head">旬空</td>
          <td v-for="p in pillars" :key="p.label" class="cg-cell small" :class="p.label === '日柱' ? 'day-col' : ''">
            {{ p.xunKong }}
          </td>
        </tr>
      </tbody>
    </table>

    <div class="canggan-desc">
      <div class="desc-title">地支藏干说明</div>
      <div v-for="p in pillars" :key="p.label" class="desc-row">
        <span class="desc-zhi" :style="{ color: zhiColor(p.zhi) }">{{ p.zhi }}</span>
        <span class="desc-content">
          藏：{{ p.hideGan.map(g => `${g}(${getShiShen(data.dayGan, g)})`).join('、') }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { ganColor, zhiColor, ssColor, getShiShen } from '../../utils/bazi.js'

const props = defineProps({ data: Object })
const pillars = computed(() => props.data.pillars)

const posLabel = ['本气', '中气', '余气']
const ganWx = { 甲:'木',乙:'木',丙:'火',丁:'火',戊:'土',己:'土',庚:'金',辛:'金',壬:'水',癸:'水' }

function getShiShenLocal(dayGan, g) {
  return getShiShen(dayGan, g)
}
</script>

<style scoped>
.canggan-wrap { padding: 8px; }
.canggan-table { border-collapse: collapse; font-size: 12px; width: 100%; }
.canggan-table th, .canggan-table td { border: 1px solid #e8e0cc; padding: 6px 8px; text-align: center; vertical-align: middle; }
.canggan-table th { background: #f5f0e8; font-weight: normal; }
.row-head { background: #fafaf8; color: #888; font-size: 12px; text-align: right; padding-right: 8px; white-space: nowrap; width: 36px; }
.day-col { background: #fffdf5; }
.cg-cell { min-width: 70px; }
.cg-cell.small { font-size: 12px; color: #555; }
.ss-label { font-size: 11px; display: block; color: #888; }
.wx-label { font-size: 10px; color: #aaa; display: block; }
.empty { color: #ddd; }
.canggan-desc { margin-top: 16px; padding: 10px; background: #fafaf8; border-radius: 6px; }
.desc-title { font-size: 12px; font-weight: bold; color: #888; margin-bottom: 8px; }
.desc-row { display: flex; align-items: baseline; gap: 8px; margin-bottom: 4px; font-size: 12px; }
.desc-zhi { font-size: 18px; font-weight: bold; min-width: 20px; }
.desc-content { color: #555; }
</style>
