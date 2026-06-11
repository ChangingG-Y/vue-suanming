<template>
  <div class="shensha-wrap">
    <!-- 吉神 / 凶煞 分类 -->
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

const AUSPICIOUS = ['天乙贵人','文昌贵人','天厨贵人','禄神','将星']
const INAUSPICIOUS = ['羊刃','桃花','华盖','劫煞','驿马','红艳煞']

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
  { name: '将星', desc: '主权威，有领导力，掌握实权' },
  { name: '桃花', desc: '人缘好，异性缘旺，感情丰富' },
  { name: '驿马', desc: '主奔波，出行迁移，流动频繁' },
  { name: '华盖', desc: '孤高清高，有艺术才能，带孤独' },
  { name: '劫煞', desc: '主破财、意外，需防劫夺' },
  { name: '羊刃', desc: '刚强好胜，易有伤灾，需防冲动' },
  { name: '红艳煞', desc: '主感情风流，异性缘旺但多桃花劫' },
]
</script>

<style scoped>
.shensha-wrap { padding: 8px; }
.ss-grid { display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 20px; }
.ss-pillar { flex: 1 1 120px; border: 1px solid #e8e0cc; border-radius: 8px; padding: 10px; background: #fafaf8; }
.ss-pillar-header { display: flex; align-items: center; gap: 4px; font-size: 18px; font-weight: bold; margin-bottom: 8px; }
.col-label { font-size: 11px; color: #aaa; margin-left: 4px; }
.ss-tag-wrap { margin-bottom: 4px; }
.ss-tag { display: block; width: fit-content; }
.no-ss { color: #ccc; font-size: 12px; }
.ss-legend { border-top: 1px solid #eee; padding-top: 12px; }
.legend-title { font-size: 12px; font-weight: bold; color: #555; margin-bottom: 10px; padding-left: 4px; border-left: 3px solid #8b6914; }
.legend-grid { display: flex; flex-direction: column; gap: 6px; }
.legend-item { display: flex; align-items: center; gap: 8px; font-size: 12px; }
.legend-desc { color: #666; }
</style>
