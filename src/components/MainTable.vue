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
            <div
              v-for="s in col.shenSha" :key="s"
              class="shensha-item"
              @click.stop="openDesc($event, s)"
            >{{ s }}</div>
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

    <!-- 神煞说明弹出框 -->
    <teleport to="body">
      <div v-if="popup.visible" class="ss-backdrop" @click="popup.visible = false"></div>
      <transition name="ss-pop">
        <div
          v-if="popup.visible"
          class="ss-popup"
          :style="{ top: popup.y + 'px', left: popup.x + 'px' }"
          @click.stop
        >
          <div class="ss-popup-header">
            <span class="ss-popup-name">{{ popup.name }}</span>
            <button class="ss-popup-close" @click="popup.visible = false">×</button>
          </div>
          <div class="ss-popup-type" :class="popup.type">{{ popup.typeLabel }}</div>
          <p class="ss-popup-desc">{{ popup.desc }}</p>
        </div>
      </transition>
    </teleport>
  </div>
</template>

<script setup>
import { computed, reactive } from 'vue'
import { ganColor, zhiColor, ssColor, getShiShen, getHideGan } from '../utils/bazi.js'

const props = defineProps({ data: Object })

const dayGan = computed(() => props.data.dayGan)
const cols = computed(() => props.data.tableColumns)

const SHENSHA_INFO = {
  '天乙贵人': { type: 'ji', typeLabel: '吉星', desc: '命中最吉之贵人，主贵气逼人，遇凶化吉，遇难呈祥，一生多贵人相助。' },
  '文昌贵人': { type: 'ji', typeLabel: '吉星', desc: '主聪明好学，文思敏捷，利于考试功名，适合从事文教、学术类工作。' },
  '天厨贵人': { type: 'ji', typeLabel: '吉星', desc: '主口福旺盛，职业多与饮食烹饪相关，常有贵人相助，衣食无忧。' },
  '太极贵人': { type: 'ji', typeLabel: '吉星', desc: '为最高贵之神，主与修道、玄学、宗教、哲学有缘，思想深远。' },
  '福星贵人': { type: 'ji', typeLabel: '吉星', desc: '主福气深厚，一生多逢贵人，诸事顺遂，福禄双全。' },
  '国印贵人': { type: 'ji', typeLabel: '吉星', desc: '主掌权握印，适合从政或管理，有机会身居要职，掌一方大权。' },
  '金舆': { type: 'ji', typeLabel: '吉星', desc: '主财帛丰足，生活优裕，配偶贤良，易得配偶财帛，生活享受较佳。' },
  '禄神': { type: 'ji', typeLabel: '吉星', desc: '代表正官禄位，主稳定的职业与收入，官禄、事业有保障。' },
  '学堂': { type: 'ji', typeLabel: '吉星', desc: '主聪明好学，学业有成，适合从事文化教育行业，学习进步快。' },
  '词馆': { type: 'ji', typeLabel: '吉星', desc: '主文章出众，擅长著作写作，利于从事文学、新闻、编辑等行业。' },
  '德秀贵人': { type: 'ji', typeLabel: '吉星', desc: '主品德高尚，福厚禄重，一生受人尊敬爱戴，品行出众。' },
  '天德贵人': { type: 'ji', typeLabel: '吉星', desc: '上天庇护之星，主化解凶煞，逢凶化吉，消灾解难，贵人庇佑。' },
  '天德合': { type: 'ji', typeLabel: '吉星', desc: '与天德合局，效力稍减于天德，仍为吉神，有消灾化难之效。' },
  '月德贵人': { type: 'ji', typeLabel: '吉星', desc: '月令之德神，主化灾解厄，贵人扶助，处事顺遂，月令有庇佑。' },
  '月德合': { type: 'ji', typeLabel: '吉星', desc: '与月德合局，月令有庇佑之象，可化解部分凶煞，趋吉避凶。' },
  '红鸾': { type: 'hun', typeLabel: '婚姻', desc: '主喜庆婚嫁，异性缘好，大运流年见之多主婚姻喜事、感情进展。' },
  '天喜': { type: 'hun', typeLabel: '婚姻', desc: '主喜庆吉祥，添丁进口，流年见之多有婚嫁、生育等喜事临门。' },
  '桃花': { type: 'hun', typeLabel: '桃花', desc: '主异性缘旺，魅力十足，感情生活丰富，但也需注意感情专一。' },
  '红艳煞': { type: 'hun', typeLabel: '桃花', desc: '主风流多情，异性缘极佳，但感情关系复杂，需防桃色纠纷。' },
  '将星': { type: 'quan', typeLabel: '权威', desc: '主权威与领导力，有统帅才能，适合担任领导职务，名望较高。' },
  '驿马': { type: 'dong', typeLabel: '驿动', desc: '主奔波流动，利于出行、移居、经商贸易，主变动迁移之象。' },
  '华盖': { type: 'gu', typeLabel: '孤高', desc: '主才艺出众，有孤高清高之象，利于文艺、宗教、玄学研究。' },
  '孤辰': { type: 'gu', typeLabel: '孤独', desc: '主孤独寂寞，不利婚姻感情，晚年容易孤身一人，需多关注感情。' },
  '寡宿': { type: 'gu', typeLabel: '孤独', desc: '主孤独，女命见之婚姻不顺，易分离或晚年孤守，感情生活寡淡。' },
  '羊刃': { type: 'xiong', typeLabel: '凶煞', desc: '主性格刚烈果决，做事雷厉风行，但易有意外伤灾，也主权威刑权。' },
  '飞刃': { type: 'xiong', typeLabel: '凶煞', desc: '与羊刃相冲，主有潜在危险，需防刀伤、血光、意外事故之灾。' },
  '血刃': { type: 'xiong', typeLabel: '凶煞', desc: '主有血光之灾，需注意手术、外伤、交通意外等突发状况。' },
  '劫煞': { type: 'xiong', typeLabel: '凶煞', desc: '主意外破财，遭劫夺损失，需防小人劫财、盗窃，财物损失。' },
  '亡神': { type: 'xiong', typeLabel: '凶煞', desc: '主内耗损失，财物无故减少，需注意因贪财而损失，防止破财。' },
  '灾煞': { type: 'xiong', typeLabel: '凶煞', desc: '主外来灾祸，天灾人祸皆有，需多加防范，远离危险环境。' },
  '流霞': { type: 'xiong', typeLabel: '凶煞', desc: '主血光、手术之灾，女命见之尤需防难产、手术等血光之事。' },
  '元辰': { type: 'xiong', typeLabel: '凶煞', desc: '主口舌是非，感情困扰，婚姻不顺之象，夫妻感情多有纠纷。' },
  '丧门': { type: 'xiong', typeLabel: '凶煞', desc: '主有服丧之忧，流年见之需防亲人患病或丧事，有哀伤之象。' },
  '吊客': { type: 'xiong', typeLabel: '凶煞', desc: '主悲伤哭泣，有吊唁之事，流年见之防亲友丧事，情绪低落。' },
  '披麻': { type: 'xiong', typeLabel: '凶煞', desc: '主重孝，有服丧哭泣之事，需注意亲人健康，防止孝服加身。' },
  '天罗地网': { type: 'xiong', typeLabel: '凶煞', desc: '主困厄束缚，遇事多有阻碍，行事不顺，有被困牢笼之象。' },
  '空亡': { type: 'kong', typeLabel: '空亡', desc: '落入旬空，力量减弱落空，所代表的六亲或事物易有缺失不全。' },
}

const popup = reactive({ visible: false, name: '', desc: '', type: '', typeLabel: '', x: 0, y: 0 })

function openDesc(event, name) {
  const info = SHENSHA_INFO[name] || { type: '', typeLabel: '神煞', desc: '暂无详细说明。' }
  const rect = event.currentTarget.getBoundingClientRect()
  const scrollY = window.scrollY || document.documentElement.scrollTop
  const rawX = rect.left + rect.width / 2
  const popW = 220
  const x = Math.max(8, Math.min(rawX - popW / 2, window.innerWidth - popW - 8))
  popup.visible = true
  popup.name = name
  popup.desc = info.desc
  popup.type = info.type
  popup.typeLabel = info.typeLabel
  popup.x = x
  popup.y = rect.bottom + scrollY + 6
}
</script>

<style scoped>
.main-table-wrap { overflow-x: auto; }
.bazi-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}
.bazi-table th, .bazi-table td {
  border: 1px solid rgba(210, 172, 100, 0.28);
  padding: 4px 5px;
  text-align: center;
  vertical-align: top;
  min-width: 60px;
}
.bazi-table th {
  background: rgba(240, 228, 200, 0.6);
  backdrop-filter: blur(4px);
  color: #4a3c2c;
  font-weight: 800;
  font-size: 14px;
  padding: 8px 5px;
  letter-spacing: 0.02em;
}
.bazi-table thead tr th:first-child { border-radius: 8px 0 0 0; }
.bazi-table thead tr th:last-child  { border-radius: 0 8px 0 0; }
.row-label {
  background: rgba(248, 244, 236, 0.55);
  color: #6a5a48;
  font-size: 12px;
  font-weight: 800;
  white-space: nowrap;
  text-align: right;
  padding-right: 6px;
  width: 30px;
  min-width: unset;
}
.bazi-table tbody tr:nth-child(1) td { background: rgba(255, 252, 242, 0.45); }
.bazi-table tbody tr:nth-child(2) td,
.bazi-table tbody tr:nth-child(3) td { background: transparent; }
.bazi-table tbody tr:nth-child(4) td {
  background: rgba(245, 236, 216, 0.38);
  border-top: 1px solid rgba(200, 158, 80, 0.35);
  border-bottom: 1px solid rgba(200, 158, 80, 0.35);
}
.bazi-table tbody tr:nth-child(5) td,
.bazi-table tbody tr:nth-child(6) td,
.bazi-table tbody tr:nth-child(7) td,
.bazi-table tbody tr:nth-child(8) td { background: rgba(250, 246, 238, 0.38); }
.bazi-table tbody tr:nth-child(9) td {
  background: rgba(255, 250, 236, 0.45);
  border-top: 1px solid rgba(200, 158, 80, 0.3);
}
.day-col { background: rgba(255, 252, 230, 0.65) !important; }
.bazi-table th.day-col { background: rgba(248, 235, 180, 0.7) !important; }
.cell-gan, .cell-zhi {
  font-size: 32px;
  font-weight: 900;
  padding: 6px 4px;
  background: transparent !important;
}
.cell-center { vertical-align: middle; }
.small-text { font-size: 13px; color: #3d342b; font-weight: 500; }
.cell-hidegan { vertical-align: top; padding: 3px 4px; }
.hide-gan-row {
  display: flex;
  justify-content: center;
  gap: 2px;
  font-size: 13px;
  font-weight: 600;
  line-height: 1.6;
}
.hide-ss { font-size: 12px; }
.cell-shensha { vertical-align: top; padding: 3px 4px; }
.shensha-item {
  font-size: 13px;
  font-weight: 600;
  color: #7a5420;
  white-space: nowrap;
  line-height: 1.65;
  cursor: pointer;
  border-radius: 3px;
  padding: 0 2px;
  transition: background 0.12s, color 0.12s;
}
.shensha-item:hover {
  background: rgba(210, 160, 50, 0.18);
  color: #5a3a10;
}
.bottom-info {
  display: flex;
  gap: 14px;
  padding: 9px 2px 2px;
  font-size: 12px;
  font-weight: 600;
  color: rgba(110, 88, 60, 0.9);
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

/* ── 神煞弹窗 ── */
.ss-backdrop {
  position: fixed;
  inset: 0;
  z-index: 1800;
}
.ss-popup {
  position: absolute;
  z-index: 1801;
  width: 220px;
  background: rgba(255, 252, 242, 0.97);
  backdrop-filter: blur(20px) saturate(1.5);
  -webkit-backdrop-filter: blur(20px) saturate(1.5);
  border: 1px solid rgba(210, 172, 100, 0.38);
  border-radius: 12px;
  box-shadow: 0 12px 40px rgba(80, 50, 10, 0.22), 0 2px 8px rgba(80, 50, 10, 0.1);
  padding: 12px 14px;
  pointer-events: all;
}
.ss-popup-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
}
.ss-popup-name {
  font-size: 15px;
  font-weight: 700;
  color: #4a2e10;
  letter-spacing: 0.06em;
}
.ss-popup-close {
  width: 20px; height: 20px;
  border: none;
  background: rgba(0,0,0,0.06);
  border-radius: 50%;
  cursor: pointer;
  font-size: 14px;
  line-height: 1;
  color: #888;
  display: flex; align-items: center; justify-content: center;
  padding: 0;
}
.ss-popup-close:hover { background: rgba(0,0,0,0.12); }
.ss-popup-type {
  display: inline-block;
  font-size: 10px;
  padding: 1px 7px;
  border-radius: 4px;
  margin-bottom: 7px;
  font-weight: 600;
  letter-spacing: 0.04em;
}
.ss-popup-type.ji    { background: rgba(60, 138, 46, 0.12); color: #2d7020; border: 1px solid rgba(60, 138, 46, 0.25); }
.ss-popup-type.xiong { background: rgba(192, 57, 43, 0.1);  color: #a02818; border: 1px solid rgba(192, 57, 43, 0.22); }
.ss-popup-type.hun   { background: rgba(200, 80, 160, 0.1); color: #a03080; border: 1px solid rgba(200, 80, 160, 0.22); }
.ss-popup-type.dong  { background: rgba(40, 130, 220, 0.1); color: #1a6090; border: 1px solid rgba(40, 130, 220, 0.22); }
.ss-popup-type.gu    { background: rgba(120, 100, 60, 0.1); color: #706040; border: 1px solid rgba(120, 100, 60, 0.22); }
.ss-popup-type.kong  { background: rgba(100, 100, 100, 0.1);color: #555555; border: 1px solid rgba(100, 100, 100, 0.22); }
.ss-popup-type.quan  { background: rgba(160, 82, 45, 0.1);  color: #8a4010; border: 1px solid rgba(160, 82, 45, 0.22); }
.ss-popup-desc {
  font-size: 12px;
  color: #554030;
  line-height: 1.65;
}

/* 弹出动画 */
.ss-pop-enter-active { animation: ss-in 0.18s cubic-bezier(0.22, 1, 0.36, 1); }
.ss-pop-leave-active { animation: ss-out 0.12s ease-in; }
@keyframes ss-in  { from { opacity: 0; transform: scale(0.92) translateY(-4px); } to { opacity: 1; transform: scale(1) translateY(0); } }
@keyframes ss-out { from { opacity: 1; transform: scale(1); } to { opacity: 0; transform: scale(0.94); } }

/* ── 深色模式 ── */
:global(.bazi-view.dark) .bazi-table th,
:global(.bazi-view.dark) .bazi-table td {
  border-color: rgba(140, 100, 40, 0.3);
}
:global(.bazi-view.dark) .bazi-table th {
  background: rgba(50, 32, 10, 0.75);
  color: #dcc890;
}
:global(.bazi-view.dark) .row-label {
  background: rgba(38, 24, 8, 0.65);
  color: #b09870;
}
:global(.bazi-view.dark) .bazi-table tbody tr:nth-child(1) td {
  background: rgba(40, 25, 10, 0.3);
}
:global(.bazi-view.dark) .bazi-table tbody tr:nth-child(4) td {
  background: rgba(55, 35, 12, 0.4);
  border-top-color: rgba(160, 110, 40, 0.3);
  border-bottom-color: rgba(160, 110, 40, 0.3);
}
:global(.bazi-view.dark) .bazi-table tbody tr:nth-child(5) td,
:global(.bazi-view.dark) .bazi-table tbody tr:nth-child(6) td,
:global(.bazi-view.dark) .bazi-table tbody tr:nth-child(7) td,
:global(.bazi-view.dark) .bazi-table tbody tr:nth-child(8) td {
  background: rgba(35, 22, 8, 0.3);
}
:global(.bazi-view.dark) .bazi-table tbody tr:nth-child(9) td {
  background: rgba(45, 28, 10, 0.3);
  border-top-color: rgba(160, 110, 40, 0.25);
}
:global(.bazi-view.dark) .day-col {
  background: rgba(60, 40, 12, 0.4) !important;
}
:global(.bazi-view.dark) .bazi-table th.day-col {
  background: rgba(80, 55, 15, 0.6) !important;
}
:global(.bazi-view.dark) .small-text {
  color: #c8b090;
}
:global(.bazi-view.dark) .hide-gan-row {
  color: #c8b090;
}
:global(.bazi-view.dark) .shensha-item {
  color: #d4a860;
}
:global(.bazi-view.dark) .shensha-item:hover {
  background: rgba(200, 150, 50, 0.2);
  color: #f0c880;
}
:global(.bazi-view.dark) .bottom-info {
  color: rgba(200, 175, 135, 0.9);
  border-top-color: rgba(140, 100, 40, 0.25);
}
:global(.bazi-view.dark) .bottom-info span {
  background: rgba(50, 32, 10, 0.55);
  border-color: rgba(160, 120, 50, 0.3);
  color: #c8aa78;
}
</style>
