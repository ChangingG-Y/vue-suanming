<template>
  <div class="zhineng-wrap">
    <div class="chart-title">智能四柱图示</div>
    <el-tabs v-model="activeTab" class="chart-tabs">
      <!-- 干支 -->
      <el-tab-pane label="干支" name="ganzhi">
        <div class="ganzhi-layout">
          <div v-for="p in pillars" :key="p.label" class="pillar-block">
            <div class="pillar-label">{{ p.label }}</div>
            <div class="pillar-ss" :style="{ color: ssColor(p.ss) }">{{ p.ss }}</div>
            <div class="pillar-gan" :style="{ color: ganColor(p.gan) }">{{ p.gan }}</div>
            <div class="pillar-zhi" :style="{ color: zhiColor(p.zhi) }">{{ p.zhi }}</div>
            <div class="pillar-zhi-ss" :style="{ color: ssColor(getShiShen(data.dayGan, getMainHideGan(p.zhi))) }">
              {{ getShiShen(data.dayGan, getMainHideGan(p.zhi)) }}
            </div>
          </div>
        </div>
      </el-tab-pane>

      <!-- 流通 -->
      <el-tab-pane label="流通" name="liutong">
        <div class="liutong-layout">
          <div class="lt-col-labels">
            <span v-for="p in pillars" :key="p.label" class="lt-col-ss" :style="{ color: ssColor(p.ss) }">{{ p.ss }}</span>
          </div>
          <div class="lt-gan-row">
            <span v-for="(p, i) in pillars" :key="p.label" class="lt-gan" :style="{ color: ganColor(p.gan) }">
              {{ p.gan }}
              <span v-if="i < pillars.length-1" class="lt-arrow" :class="getGanRel(i).cls">
                {{ getGanRel(i).symbol }}
              </span>
            </span>
          </div>
          <div class="lt-vertical-rels">
            <div v-for="(p, i) in pillars" :key="p.label" class="lt-vert">
              <span class="lt-vert-rel" :class="getVertRel(p).cls">{{ getVertRel(p).symbol }}</span>
            </div>
          </div>
          <div class="lt-zhi-row">
            <span v-for="(p, i) in pillars" :key="p.label" class="lt-zhi" :style="{ color: zhiColor(p.zhi) }">
              {{ p.zhi }}
              <span v-if="i < pillars.length-1" class="lt-arrow" :class="getZhiRel(i).cls">
                {{ getZhiRel(i).symbol }}
              </span>
            </span>
          </div>
          <div class="lt-zhi-labels">
            <span v-for="p in pillars" :key="p.label" class="lt-zhi-ss" :style="{ color: ssColor(getShiShen(data.dayGan, getMainHideGan(p.zhi))) }">
              {{ getShiShen(data.dayGan, getMainHideGan(p.zhi)) }}
            </span>
          </div>
          <div class="lt-legend">
            <span class="legend-item liutong-color">✅ 流通：三合、五合、六合、相生、相助</span>
            <span class="legend-item block-color">❌ 阻塞：相冲、相刑、相克</span>
          </div>
        </div>
      </el-tab-pane>

      <!-- 宫位 -->
      <el-tab-pane label="宫位" name="gongwei">
        <div class="gongwei-layout">
          <div class="gongwei-top">
            <div class="gw-pillar" v-for="p in pillars" :key="p.label">
              <div class="gw-gong-name">{{ gongNames[p.label] }}</div>
              <div class="gw-col-label text-muted">{{ p.label }}</div>
              <div class="gw-gan" :style="{ color: ganColor(p.gan) }">{{ p.gan }}</div>
              <div class="gw-zhi" :style="{ color: zhiColor(p.zhi) }">{{ p.zhi }}</div>
            </div>
          </div>
          <div class="gongwei-info-grid">
            <div class="gi-block">
              <div class="gi-title">⏱ 时间类象</div>
              <div class="gi-row">
                <span>少年<br/>1~18岁</span>
                <span>青年<br/>18~36岁</span>
                <span>中年<br/>36~48岁</span>
                <span>晚年<br/>48岁往后</span>
              </div>
            </div>
            <div class="gi-block">
              <div class="gi-title">🏠 空间类象</div>
              <div class="gi-row">
                <span>远方</span>
                <span>家乡</span>
                <span>住所<br/>工作场所</span>
                <span>门户<br/>房子附近</span>
              </div>
            </div>
            <div class="gi-block">
              <div class="gi-title">🫀 身体类象</div>
              <div class="gi-row">
                <span>头部<br/>颈部</span>
                <span>胸部<br/>脊柱、肩背</span>
                <span>腹部<br/>心脑、内脏</span>
                <span>下肢<br/>泌尿系统</span>
              </div>
            </div>
            <div class="gi-block">
              <div class="gi-title">👥 人际类象</div>
              <div class="gi-row">
                <span>外人<br/>长辈</span>
                <span>同事<br/>领导</span>
                <span>至亲之人</span>
                <span>晚辈<br/>学生</span>
              </div>
            </div>
          </div>
        </div>
      </el-tab-pane>

      <!-- 六亲 -->
      <el-tab-pane label="六亲" name="liuqin">
        <div class="liuqin-layout">
          <div class="lq-section">
            <div class="lq-section-title">亲属关系</div>
            <table class="lq-table">
              <thead>
                <tr>
                  <th v-for="p in pillars" :key="p.label">{{ p.label }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(row, ri) in liuqinRows" :key="ri">
                  <td v-for="(cell, ci) in row" :key="ci" class="lq-cell">
                    <template v-if="cell.type === 'gz'">
                      <div :style="{ color: ganColor(pillars[ci].gan), fontSize: '20px', fontWeight: 'bold' }">{{ pillars[ci].gan }}</div>
                      <div :style="{ color: zhiColor(pillars[ci].zhi), fontSize: '20px', fontWeight: 'bold' }">{{ pillars[ci].zhi }}</div>
                      <div class="lq-ss-label" :style="{ color: ssColor(pillars[ci].ss) }">{{ pillars[ci].ss }}</div>
                    </template>
                    <template v-else>{{ cell }}</template>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ganColor, zhiColor, ssColor, getShiShen, getMainHideGan, getDiShi } from '../utils/bazi.js'

const props = defineProps({ data: Object })
const activeTab = ref('ganzhi')

const pillars = computed(() => props.data.pillars)

const gongNames = { '年柱': '祖辈宫', '月柱': '兄弟宫', '日柱': '夫妻宫', '时柱': '子女宫' }

const WX_SHENG = { 木:'火',火:'土',土:'金',金:'水',水:'木' }
const WX_KE    = { 木:'土',火:'金',土:'水',金:'木',水:'火' }
const GAN_WX   = { 甲:'木',乙:'木',丙:'火',丁:'火',戊:'土',己:'土',庚:'金',辛:'金',壬:'水',癸:'水' }
const ZHI_WX   = { 子:'水',亥:'水',寅:'木',卯:'木',辰:'土',戌:'土',丑:'土',未:'土',午:'火',巳:'火',申:'金',酉:'金' }

function getGanRel(i) {
  const g1 = pillars.value[i].gan, g2 = pillars.value[i+1].gan
  const w1 = GAN_WX[g1], w2 = GAN_WX[g2]
  if (g1 === g2) return { symbol: '──助──', cls: 'rel-sheng' }
  if (WX_SHENG[w1] === w2 || WX_SHENG[w2] === w1) return { symbol: '──生──', cls: 'rel-sheng' }
  if (WX_KE[w1] === w2 || WX_KE[w2] === w1) return { symbol: '──克──', cls: 'rel-ke' }
  return { symbol: '──────', cls: 'rel-neutral' }
}

function getZhiRel(i) {
  const z1 = pillars.value[i].zhi, z2 = pillars.value[i+1].zhi
  const w1 = ZHI_WX[z1], w2 = ZHI_WX[z2]
  if (WX_SHENG[w1] === w2 || WX_SHENG[w2] === w1) return { symbol: '──生──', cls: 'rel-sheng' }
  if (WX_KE[w1] === w2 || WX_KE[w2] === w1) return { symbol: '──克──', cls: 'rel-ke' }
  return { symbol: '──────', cls: 'rel-neutral' }
}

function getVertRel(p) {
  const gw = GAN_WX[p.gan], zw = ZHI_WX[p.zhi]
  if (!gw || !zw) return { symbol: '', cls: '' }
  if (WX_SHENG[zw] === gw) return { symbol: '↑生↑', cls: 'rel-sheng' }
  if (WX_SHENG[gw] === zw) return { symbol: '↓生↓', cls: 'rel-sheng' }
  if (WX_KE[gw] === zw || WX_KE[zw] === gw) return { symbol: '克', cls: 'rel-ke' }
  return { symbol: '', cls: '' }
}

// 六亲 table rows
const liuqinRows = computed(() => {
  const ss = props.data.dayGan
  // Build kinship rows based on 十神
  const rows = [
    ['奶奶', '', '', '外公'].map((v, i) => v),
    ['孙女', '兄弟', '', '女婿'].map(v => v),
    ['外母', '姑父', { type:'gz' }, '孙儿'].map(v => v),
    [pillars.value[0].ss, pillars.value[1].ss, { type:'gz' }, pillars.value[3].ss].map(v => v),
    ['兄弟', '女儿', { type:'gz' }, '女儿'].map(v => v),
    ['姑父', '侄女', { type:'gz' }, '侄女'].map(v => v),
    ['', '外婆', '男外孙', '外婆'].map(v => v),
  ]
  return rows
})
</script>

<style scoped>
.zhineng-wrap { background: #fff; border-radius: 8px; padding: 0; }
.chart-title { font-size: 15px; font-weight: bold; text-align: center; padding: 12px; border-bottom: 1px solid #eee; }
.chart-tabs { padding: 0 12px; }

/* 干支 */
.ganzhi-layout { display: flex; justify-content: space-around; padding: 20px 0; gap: 8px; }
.pillar-block { text-align: center; flex: 1; }
.pillar-label { font-size: 11px; color: #888; margin-bottom: 4px; }
.pillar-ss { font-size: 12px; margin-bottom: 2px; }
.pillar-gan { font-size: 32px; font-weight: bold; }
.pillar-zhi { font-size: 32px; font-weight: bold; }
.pillar-zhi-ss { font-size: 12px; color: #888; margin-top: 4px; }

/* 流通 */
.liutong-layout { padding: 16px 8px; }
.lt-col-labels { display: flex; justify-content: space-around; font-size: 12px; color: #888; margin-bottom: 4px; }
.lt-col-ss { flex: 1; text-align: center; }
.lt-gan-row { display: flex; align-items: center; justify-content: space-around; margin-bottom: 8px; }
.lt-gan { font-size: 24px; font-weight: bold; display: flex; align-items: center; flex: 1; justify-content: center; }
.lt-arrow { font-size: 12px; margin: 0 4px; }
.rel-sheng { color: #3c8a2e; }
.rel-ke { color: #c0392b; }
.rel-neutral { color: #ccc; }
.lt-vertical-rels { display: flex; justify-content: space-around; }
.lt-vert { flex: 1; text-align: center; font-size: 11px; }
.lt-vert-rel { display: inline-block; padding: 2px 6px; border-radius: 50%; font-weight: bold; }
.lt-zhi-row { display: flex; align-items: center; justify-content: space-around; margin-top: 8px; }
.lt-zhi { font-size: 24px; font-weight: bold; display: flex; align-items: center; flex: 1; justify-content: center; }
.lt-zhi-labels { display: flex; justify-content: space-around; font-size: 12px; margin-top: 4px; }
.lt-zhi-ss { flex: 1; text-align: center; }
.lt-legend { margin-top: 20px; font-size: 12px; display: flex; flex-direction: column; gap: 4px; }
.legend-item { display: flex; align-items: center; gap: 6px; }

/* 宫位 */
.gongwei-layout { padding: 12px; }
.gongwei-top { display: flex; justify-content: center; gap: 24px; margin-bottom: 20px; }
.gw-pillar { text-align: center; width: 80px; }
.gw-gong-name { font-size: 12px; font-weight: bold; color: #333; margin-bottom: 4px; }
.gw-col-label { font-size: 11px; color: #888; margin-bottom: 2px; }
.text-muted { color: #aaa; }
.gw-gan, .gw-zhi { font-size: 28px; font-weight: bold; }
.gongwei-info-grid { display: flex; flex-direction: column; gap: 12px; }
.gi-block { border: 1px solid #e8e0cc; border-radius: 8px; padding: 10px; }
.gi-title { font-size: 12px; color: #8b6914; margin-bottom: 8px; font-weight: bold; }
.gi-row { display: flex; justify-content: space-around; font-size: 12px; color: #555; text-align: center; }
.gi-row span { flex: 1; }

/* 六亲 */
.liuqin-layout { padding: 12px; }
.lq-section-title { font-size: 13px; font-weight: bold; text-align: center; margin-bottom: 8px; }
.lq-table { width: 100%; border-collapse: collapse; font-size: 12px; }
.lq-table th { border-bottom: 1px solid #e8e0cc; padding: 6px; text-align: center; color: #888; font-weight: normal; }
.lq-cell { border: none; padding: 4px; text-align: center; color: #444; line-height: 1.6; }
.lq-ss-label { font-size: 11px; color: #888; }
</style>
