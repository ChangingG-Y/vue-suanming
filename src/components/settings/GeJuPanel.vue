<template>
  <div class="geju-wrap">
    <!-- 格局判断 -->
    <div class="geju-main">
      <div class="geju-card" :class="geju.type">
        <div class="geju-name">{{ geju.name }}</div>
        <div class="geju-sub">{{ geju.sub }}</div>
        <div class="geju-desc">{{ geju.desc }}</div>
      </div>
    </div>

    <!-- 用神/忌神 -->
    <div class="yongshen-section">
      <div class="section-title">用神 / 忌神</div>
      <div class="ys-grid">
        <div class="ys-block yong">
          <div class="ys-title">用神（喜用）</div>
          <div class="ys-content">
            <span v-for="g in yongShen" :key="g" class="ys-gan" :style="{ color: ganColor(g) }">{{ g }}</span>
            <span class="ys-wx">{{ yongWx.join('、') }}</span>
          </div>
          <div class="ys-hint">{{ yongDesc }}</div>
        </div>
        <div class="ys-block ji">
          <div class="ys-title">忌神（忌用）</div>
          <div class="ys-content">
            <span v-for="g in jiShen" :key="g" class="ys-gan" :style="{ color: ganColor(g) }">{{ g }}</span>
            <span class="ys-wx">{{ jiWx.join('、') }}</span>
          </div>
          <div class="ys-hint">{{ jiDesc }}</div>
        </div>
      </div>
    </div>

    <!-- 强弱分析 -->
    <div class="qiangruo-section">
      <div class="section-title">日主强弱</div>
      <div class="qr-bar-wrap">
        <div class="qr-label">弱</div>
        <div class="qr-bar-bg">
          <div class="qr-bar-fill" :style="{ width: qiangPct + '%' }"></div>
          <div class="qr-indicator" :style="{ left: qiangPct + '%' }">{{ qiangLabel }}</div>
        </div>
        <div class="qr-label">旺</div>
      </div>
      <div class="qr-detail">
        日主 <b :style="{ color: ganColor(dayGan) }">{{ dayGan }}</b>（{{ dayWx }}）
        当令为 <b>{{ monthZhi }}</b>，{{ monthDesc }}
      </div>
    </div>

    <!-- 取格说明 -->
    <div class="method-desc">
      <div class="method-title">格局取用说明</div>
      <div class="method-content">
        <p>• <b>普通格</b>：日主不太强不太弱，取最缺五行为用神。</p>
        <p>• <b>身强格</b>：日主五行旺，宜以财官泄秀为用，忌比劫印绶。</p>
        <p>• <b>身弱格</b>：日主五行衰，宜以印星比劫为用，忌财官食伤。</p>
        <p>• <b>从格</b>：日主极弱无根，从势而取，顺其所从之五行为用。</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { ganColor, getShiShen } from '../../utils/bazi.js'

const props = defineProps({ data: Object })

const GAN_WX = { 甲:'木',乙:'木',丙:'火',丁:'火',戊:'土',己:'土',庚:'金',辛:'金',壬:'水',癸:'水' }
const ZHI_WX = { 子:'水',亥:'水',寅:'木',卯:'木',辰:'土',戌:'土',丑:'土',未:'土',午:'火',巳:'火',申:'金',酉:'金' }
const WX_SHENG = { 木:'火',火:'土',土:'金',金:'水',水:'木' }
const WX_KE = { 木:'土',火:'金',土:'水',金:'木',水:'火' }

const dayGan = computed(() => props.data.dayGan)
const dayWx = computed(() => GAN_WX[dayGan.value] || '')
const monthZhi = computed(() => props.data.pillars[1].zhi)

// Calculate day master strength
const qiangPct = computed(() => {
  const wx = dayWx.value
  let score = 0
  for (const p of props.data.pillars) {
    if (GAN_WX[p.gan] === wx) score += 15
    if (GAN_WX[p.gan] && WX_SHENG[GAN_WX[p.gan]] === wx) score += 10
    if (ZHI_WX[p.zhi] === wx) score += 12
    if (ZHI_WX[p.zhi] && WX_SHENG[ZHI_WX[p.zhi]] === wx) score += 8
    for (const hg of (p.hideGan || [])) {
      if (GAN_WX[hg] === wx) score += 5
    }
  }
  return Math.min(Math.max(score, 5), 95)
})

const qiangLabel = computed(() => {
  const p = qiangPct.value
  if (p >= 75) return '身强'
  if (p >= 55) return '偏强'
  if (p >= 45) return '中和'
  if (p >= 30) return '偏弱'
  return '身弱'
})

const monthDesc = computed(() => {
  const mwx = ZHI_WX[monthZhi.value]
  const dwx = dayWx.value
  if (mwx === dwx) return '得令，日主有力'
  if (WX_SHENG[mwx] === dwx) return '月令生日主，有力'
  if (WX_KE[dwx] === mwx) return '日主克月令，力量消耗'
  if (WX_KE[mwx] === dwx) return '月令克日主，失令'
  return '中性关系'
})

// Determine geju
const geju = computed(() => {
  const p = qiangPct.value
  const label = qiangLabel.value
  if (p >= 75) return {
    name: '身强格', sub: label, type: 'strong',
    desc: '日主五行旺盛，需要财官食伤来平衡，宜疏通泄秀，忌印星比劫助旺。'
  }
  if (p <= 35) return {
    name: '身弱格', sub: label, type: 'weak',
    desc: '日主五行衰弱，需要印星比劫来扶持，宜生扶日主，忌财官食伤克泄。'
  }
  return {
    name: '普通格', sub: '中和', type: 'normal',
    desc: '日主强弱适中，取最缺五行为用神，注重五行均衡，用神以平衡为原则。'
  }
})

// 用神/忌神
const yongWx = computed(() => {
  const p = qiangPct.value
  const dwx = dayWx.value
  if (p >= 65) return [WX_KE[dwx], WX_SHENG[dwx]].filter(Boolean)
  if (p <= 40) return [WX_SHENG['水木火土金'.split('').find(w => WX_SHENG[w] === dwx) || ''], dwx].filter(Boolean)
  const all = ['木','火','土','金','水']
  const counts = {}
  all.forEach(w => { counts[w] = 0 })
  for (const col of props.data.tableColumns) {
    if (GAN_WX[col.gan]) counts[GAN_WX[col.gan]]++
    if (ZHI_WX[col.zhi]) counts[ZHI_WX[col.zhi]]++
  }
  return all.sort((a, b) => counts[a] - counts[b]).slice(0, 2)
})

const jiWx = computed(() => {
  const p = qiangPct.value
  const dwx = dayWx.value
  if (p >= 65) return [dwx, Object.keys(WX_SHENG).find(k => WX_SHENG[k] === dwx) || ''].filter(Boolean)
  if (p <= 40) return [WX_KE[dwx]].filter(Boolean)
  return [dayWx.value]
})

const GAN_BY_WX = {
  木: ['甲','乙'], 火: ['丙','丁'], 土: ['戊','己'], 金: ['庚','辛'], 水: ['壬','癸']
}
const yongShen = computed(() => yongWx.value.flatMap(w => GAN_BY_WX[w] || []))
const jiShen = computed(() => jiWx.value.flatMap(w => GAN_BY_WX[w] || []))
const yongDesc = computed(() => `运行${yongWx.value.join('、')}五行大运流年为顺运，事业财运较顺`)
const jiDesc = computed(() => `运行${jiWx.value.join('、')}五行大运流年需谨慎，易有阻碍`)
</script>

<style scoped>
.geju-wrap { padding: 8px; }
.geju-main { margin-bottom: 16px; }
.geju-card {
  border-radius: 8px;
  padding: 16px 20px;
  border: 1px solid #e8e0cc;
}
.geju-card.strong { background: linear-gradient(135deg, #fff5f5, #fff); border-color: #f5c6c6; }
.geju-card.weak { background: linear-gradient(135deg, #f0f7ff, #fff); border-color: #c6d8f5; }
.geju-card.normal { background: linear-gradient(135deg, #f5fff0, #fff); border-color: #c6e8c6; }
.geju-name { font-size: 20px; font-weight: bold; color: #333; margin-bottom: 4px; }
.geju-sub { font-size: 13px; color: #8b6914; margin-bottom: 8px; }
.geju-desc { font-size: 12px; color: #666; line-height: 1.7; }
.yongshen-section, .qiangruo-section { margin-bottom: 16px; }
.section-title { font-size: 12px; font-weight: bold; color: #555; margin-bottom: 10px; padding-left: 4px; border-left: 3px solid #8b6914; }
.ys-grid { display: flex; gap: 12px; flex-wrap: wrap; }
.ys-block { flex: 1 1 200px; border-radius: 8px; padding: 12px; }
.ys-block.yong { background: #f0faf0; border: 1px solid #c8e6c9; }
.ys-block.ji { background: #fff5f5; border: 1px solid #ffcdd2; }
.ys-title { font-size: 12px; font-weight: bold; margin-bottom: 6px; color: #555; }
.ys-content { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; margin-bottom: 6px; }
.ys-gan { font-size: 18px; font-weight: bold; }
.ys-wx { font-size: 12px; color: #888; }
.ys-hint { font-size: 11px; color: #999; line-height: 1.5; }
.qr-bar-wrap { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
.qr-label { font-size: 12px; color: #888; white-space: nowrap; }
.qr-bar-bg { flex: 1; background: #f0f0f0; border-radius: 10px; height: 18px; position: relative; }
.qr-bar-fill { height: 100%; border-radius: 10px; background: linear-gradient(90deg, #2271b8, #3c8a2e, #c0392b); opacity: 0.6; }
.qr-indicator { position: absolute; top: -20px; transform: translateX(-50%); font-size: 11px; font-weight: bold; color: #8b6914; white-space: nowrap; }
.qr-detail { font-size: 12px; color: #666; margin-top: 8px; }
.method-desc { border-top: 1px solid #eee; padding-top: 12px; }
.method-title { font-size: 12px; font-weight: bold; color: #555; margin-bottom: 8px; padding-left: 4px; border-left: 3px solid #8b6914; }
.method-content { font-size: 12px; color: #666; line-height: 2; }
.method-content p { margin: 0; }
</style>
