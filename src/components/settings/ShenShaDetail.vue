<template>
  <div class="shensha-wrap">
    <section class="ss-section">
      <div class="section-title">四柱神煞</div>
      <div class="ss-grid">
        <div v-for="p in pillars" :key="p.label" class="ss-pillar">
          <div class="ss-pillar-header">
            <span :style="{ color: ganColor(p.gan) }">{{ p.gan }}</span>
            <span :style="{ color: zhiColor(p.zhi) }">{{ p.zhi }}</span>
            <span class="col-label">{{ p.label }}</span>
          </div>
          <template v-if="p.shenSha && p.shenSha.length">
            <div v-for="s in p.shenSha" :key="s" class="ss-tag-wrap">
              <el-tag :type="ssType(s)" size="small" class="ss-tag">{{ s }}</el-tag>
            </div>
          </template>
          <div v-else class="no-ss">无</div>
        </div>
      </div>
    </section>

    <section class="ss-section">
      <div class="section-title">大运神煞</div>
      <div class="cycle-list">
        <div v-for="item in dayunRows" :key="item.ganZhi" class="cycle-row">
          <div class="cycle-gz">
            <span :style="{ color: ganColor(item.gan) }">{{ item.gan }}</span>
            <span :style="{ color: zhiColor(item.zhi) }">{{ item.zhi }}</span>
          </div>
          <div class="cycle-tags">
            <el-tag v-for="s in item.shenSha" :key="s" :type="ssType(s)" size="small">{{ s }}</el-tag>
            <span v-if="!item.shenSha?.length" class="no-ss">无</span>
          </div>
        </div>
      </div>
    </section>

    <section class="ss-section">
      <div class="section-title">流年神煞</div>
      <div class="cycle-list compact">
        <div v-for="item in liunianRows" :key="`${item.year}-${item.ganZhi}`" class="cycle-row">
          <div class="cycle-gz year-gz">
            <span class="year-text">{{ item.year }}</span>
            <span :style="{ color: ganColor(item.gan) }">{{ item.gan }}</span>
            <span :style="{ color: zhiColor(item.zhi) }">{{ item.zhi }}</span>
          </div>
          <div class="cycle-tags">
            <el-tag v-for="s in item.shenSha" :key="s" :type="ssType(s)" size="small">{{ s }}</el-tag>
            <span v-if="!item.shenSha?.length" class="no-ss">无</span>
          </div>
        </div>
      </div>
    </section>

    <!-- 神煞释义 -->
    <div class="ss-legend">
      <div class="legend-title">神煞释义</div>
      <div class="legend-grid">
        <div v-for="item in SHENSHA_DESC" :key="item.name" class="legend-item">
          <el-tag :type="ssType(item.name)" size="small">{{ item.name }}</el-tag>
          <span class="legend-desc">{{ item.desc }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { ganColor, zhiColor } from '../../utils/bazi.js'

const props = defineProps({ data: Object })
const pillars = computed(() => props.data.pillars)
const dayunRows = computed(() => props.data.dayuns || [])
const liunianRows = computed(() => props.data.dayuns?.[props.data.currentDayunIdx]?.liunian || [])

const AUSPICIOUS = ['天乙贵人','文昌贵人','天厨贵人','太极贵人','福星贵人','国印贵人','德秀贵人','天德贵人','月德贵人','天德合','月德合','禄神','将星','金舆','学堂','词馆']
const INAUSPICIOUS = ['羊刃','飞刃','血刃','桃花','华盖','劫煞','灾煞','驿马','亡神','红艳煞','孤辰','寡宿','丧门','吊客','披麻','天罗地网','空亡','流霞','元辰']

function ssType(name) {
  if (AUSPICIOUS.includes(name)) return 'success'
  if (INAUSPICIOUS.includes(name)) return 'danger'
  return 'warning'
}

const SHENSHA_DESC = [
  { name: '天乙贵人', desc: '最吉之神，逢凶化吉，贵人相助' },
  { name: '文昌贵人', desc: '学业聪颖，考试得利，利于文职' },
  { name: '天厨贵人', desc: '食禄丰厚，饮食之禄旺盛' },
  { name: '禄神', desc: '正禄到位，财官享禄，事业顺遂' },
  { name: '福星贵人', desc: '福气较厚，遇事较容易得缓冲与助力' },
  { name: '太极贵人', desc: '主悟性、玄学、学术与思辨能力' },
  { name: '国印贵人', desc: '主权柄、资质、名誉与制度内资源' },
  { name: '德秀贵人', desc: '主品性清秀、才华与修养' },
  { name: '天德贵人', desc: '月令吉神，主化凶、仁厚与贵助' },
  { name: '月德贵人', desc: '月令吉神，主逢凶有解、贵人扶持' },
  { name: '将星', desc: '主权威，有领导力，掌握实权' },
  { name: '金舆', desc: '主福禄、车马、配偶助力与生活品质' },
  { name: '桃花', desc: '人缘好，异性缘旺，感情丰富' },
  { name: '驿马', desc: '主奔波，出行迁移，流动频繁' },
  { name: '华盖', desc: '孤高清高，有艺术才能，带孤独' },
  { name: '劫煞', desc: '主破财、意外，需防劫夺' },
  { name: '亡神', desc: '主心神不宁、计划变动，宜谨慎决策' },
  { name: '羊刃', desc: '刚强好胜，易有伤灾，需防冲动' },
  { name: '飞刃', desc: '羊刃对冲之煞，主冲动、口舌和外伤风险' },
  { name: '血刃', desc: '主血光、刀火、手术外伤之象' },
  { name: '红艳煞', desc: '主感情风流，异性缘旺但多桃花劫' },
  { name: '红鸾', desc: '主婚恋喜庆、人缘动象' },
  { name: '天喜', desc: '主喜庆、姻缘、人情往来' },
  { name: '孤辰', desc: '主孤独、自立，感情上较难依赖他人' },
  { name: '寡宿', desc: '主清冷孤独，感情缘分需主动经营' },
  { name: '丧门', desc: '主低落、耗损、家宅不宁之象' },
  { name: '吊客', desc: '主奔丧、探病、惊扰和低气压事件' },
  { name: '披麻', desc: '主孝服、家宅长辈事务和情绪牵连' },
  { name: '天罗地网', desc: '主受困、阻隔、手续压力或行动受限' },
]
</script>

<style scoped>
.shensha-wrap { padding: 8px; }
.ss-section { margin-bottom: 22px; }
.section-title { font-size: 18px; color: #b48a45; margin: 0 0 12px; }
.ss-grid { display: flex; gap: 12px; flex-wrap: wrap; }
.ss-pillar { flex: 1 1 120px; border: 1px solid #e8e0cc; border-radius: 8px; padding: 10px; background: #fafaf8; }
.ss-pillar-header { display: flex; align-items: center; gap: 4px; font-size: 18px; font-weight: bold; margin-bottom: 8px; }
.col-label { font-size: 11px; color: #aaa; margin-left: 4px; }
.ss-tag-wrap { margin-bottom: 4px; }
.ss-tag { display: block; width: fit-content; }
.no-ss { color: #ccc; font-size: 12px; }
.cycle-list { display: grid; gap: 8px; }
.cycle-list.compact { grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); align-items: start; }
.cycle-row { display: grid; grid-template-columns: 74px 1fr; gap: 10px; padding: 8px 10px; background: #fafaf8; border: 1px solid #eee6d6; border-radius: 8px; }
.cycle-gz { font-size: 18px; font-weight: 700; white-space: nowrap; }
.year-gz { display: flex; align-items: baseline; gap: 2px; }
.year-text { font-size: 12px; color: #999; margin-right: 4px; }
.cycle-tags { display: flex; gap: 6px; flex-wrap: wrap; align-items: center; }
.ss-legend { border-top: 1px solid #eee; padding-top: 12px; }
.legend-title { font-size: 12px; font-weight: bold; color: #555; margin-bottom: 10px; padding-left: 4px; border-left: 3px solid #8b6914; }
.legend-grid { display: flex; flex-direction: column; gap: 6px; }
.legend-item { display: flex; align-items: center; gap: 8px; font-size: 12px; }
.legend-desc { color: #666; }
</style>
