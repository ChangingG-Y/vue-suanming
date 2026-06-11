<template>
  <div class="minggong-wrap">
    <div class="mg-grid">
      <!-- 命宫 -->
      <div class="mg-block">
        <div class="mg-block-title">命宫</div>
        <div class="gz-display">
          <span :style="{ color: ganColor(mingGongGan) }">{{ mingGongGan }}</span>
          <span :style="{ color: zhiColor(mingGongZhi) }">{{ mingGongZhi }}</span>
        </div>
        <div class="ss-row">
          <span :style="{ color: ssColor(mingGongSS) }">{{ mingGongSS }}</span>
        </div>
        <div class="desc">
          命宫为安身立命之本，代表一生的命运主轴、性格特征与人生方向。
        </div>
      </div>

      <!-- 身宫 -->
      <div class="mg-block">
        <div class="mg-block-title">身宫</div>
        <div class="gz-display">
          <span :style="{ color: ganColor(shenGongGan) }">{{ shenGongGan }}</span>
          <span :style="{ color: zhiColor(shenGongZhi) }">{{ shenGongZhi }}</span>
        </div>
        <div class="ss-row">
          <span :style="{ color: ssColor(shenGongSS) }">{{ shenGongSS }}</span>
        </div>
        <div class="desc">
          身宫为后天努力方向，代表一生中最用力经营的领域与实际行动力。
        </div>
      </div>

      <!-- 胎元 -->
      <div class="mg-block">
        <div class="mg-block-title">胎元</div>
        <div class="gz-display">
          <span :style="{ color: ganColor(taiYuanGan) }">{{ taiYuanGan }}</span>
          <span :style="{ color: zhiColor(taiYuanZhi) }">{{ taiYuanZhi }}</span>
        </div>
        <div class="ss-row">
          <span :style="{ color: ssColor(taiYuanSS) }">{{ taiYuanSS }}</span>
        </div>
        <div class="desc">
          胎元为受胎之月，反映先天禀赋与遗传因素，影响身体素质。
        </div>
      </div>

      <!-- 胎息 -->
      <div class="mg-block">
        <div class="mg-block-title">胎息</div>
        <div class="gz-display">
          <span :style="{ color: ganColor(taiXiGan) }">{{ taiXiGan }}</span>
          <span :style="{ color: zhiColor(taiXiZhi) }">{{ taiXiZhi }}</span>
        </div>
        <div class="ss-row">
          <span :style="{ color: ssColor(taiXiSS) }">{{ taiXiSS }}</span>
        </div>
        <div class="desc">
          胎息为先天之气，配合胎元考察先天体质与祖宗阴德。
        </div>
      </div>
    </div>

    <!-- 命宫取法 -->
    <div class="method-desc">
      <div class="method-title">取法说明</div>
      <div class="method-content">
        <p>• <b>命宫</b>：以生月顺数至寅，从生时逆数至寅，所得地支即命宫之支，再配以年干推算天干。</p>
        <p>• <b>身宫</b>：以生年支推算，子年起身宫在午，顺数至生月，再配以日干推算。</p>
        <p>• <b>胎元</b>：在生月天干上加一位，地支上加三位，即为胎元干支。</p>
        <p>• <b>胎息</b>：以日柱纳音五行推算，与胎元相互参照。</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { ganColor, zhiColor, ssColor, getShiShen } from '../../utils/bazi.js'

const props = defineProps({ data: Object })

function parseGZ(gz) {
  if (!gz || gz.length < 2) return ['', '']
  return [gz[0], gz[1]]
}

const [mingGongGan, mingGongZhi] = parseGZ(props.data.mingGong)
const [shenGongGan, shenGongZhi] = parseGZ(props.data.shenGong)
const [taiYuanGan, taiYuanZhi] = parseGZ(props.data.taiYuan)
const [taiXiGan, taiXiZhi] = parseGZ(props.data.taiXi)

const dayGan = computed(() => props.data.dayGan)
const mingGongSS = computed(() => getShiShen(dayGan.value, mingGongGan))
const shenGongSS = computed(() => getShiShen(dayGan.value, shenGongGan))
const taiYuanSS = computed(() => getShiShen(dayGan.value, taiYuanGan))
const taiXiSS = computed(() => getShiShen(dayGan.value, taiXiGan))
</script>

<style scoped>
.minggong-wrap { padding: 8px; }
.mg-grid { display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 20px; }
.mg-block {
  flex: 1 1 160px;
  border: 1px solid #e8e0cc;
  border-radius: 8px;
  padding: 14px;
  background: #fafaf8;
  text-align: center;
}
.mg-block-title { font-size: 12px; font-weight: bold; color: #8b6914; margin-bottom: 8px; }
.gz-display { font-size: 36px; font-weight: bold; line-height: 1.2; margin-bottom: 4px; }
.ss-row { font-size: 13px; color: #888; margin-bottom: 8px; min-height: 18px; }
.desc { font-size: 11px; color: #999; line-height: 1.6; text-align: left; }
.method-desc { border-top: 1px solid #eee; padding-top: 12px; }
.method-title { font-size: 12px; font-weight: bold; color: #555; margin-bottom: 8px; padding-left: 4px; border-left: 3px solid #8b6914; }
.method-content { font-size: 12px; color: #666; line-height: 2; }
.method-content p { margin: 0; }
</style>
