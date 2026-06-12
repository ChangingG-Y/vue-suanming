<template>
  <div class="bazi-view" :class="{ dark: darkMode }">
    <!-- Header -->
    <div class="bazi-header">
      <div class="header-left">
        <div class="birth-block">
          <div class="name-row">
            <span class="person-name">{{ form.name || '命盘' }}</span>
            <span class="gender-badge">{{ form.gender === 1 ? '乾造' : '坤造' }}</span>
          </div>
          <div class="date-rows">
            <div class="info-row">
              <span class="info-label">阴历</span>
              <span>{{ data.lunarDesc }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">阳历</span>
              <span>{{ formatBirthday(form.birthday) }} {{ pad(form.hour) }}:00</span>
            </div>
          </div>
        </div>
      </div>
      <div class="header-right">
        <button class="header-icon-btn" type="button" :title="darkMode ? '浅色模式' : '深色模式'" @click="toggleDark()">
          <svg v-if="darkMode" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
          <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>
        </button>
        <button class="header-icon-btn" type="button" title="导出命盘" @click="exportBazi">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
        </button>
        <button class="back-btn" type="button" @click="$emit('back')">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style="flex-shrink:0"><path d="M9 2L4 7l5 5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
          返回
        </button>
      </div>
    </div>

    <!-- Main content: table -->
    <div id="section-table" class="main-content">
      <div class="table-panel">
        <MainTable :data="data" />
      </div>
    </div>

    <!-- 起运/大运/流年 -->
    <div id="section-yun" class="yun-section">
      <YunPanel :data="data" />
    </div>

    <!-- 智能四柱图示 -->
    <div id="section-zhineng" class="zhineng-section">
      <ZhinengChart :data="data" />
    </div>

    <!-- 设置区 -->
    <div id="section-settings" class="settings-section">
      <el-tabs v-model="settingsTab" class="settings-tabs">
        <el-tab-pane label="干支关系" name="ganzhi"><GanZhiRelTable :data="data" /></el-tab-pane>
        <el-tab-pane label="地支藏干" name="canggan"><CangGanTable :data="data" /></el-tab-pane>
        <el-tab-pane label="人元司令" name="siling"><SiLingTable :data="data" /></el-tab-pane>
        <el-tab-pane label="神煞设置" name="shensha"><ShenShaDetail :data="data" /></el-tab-pane>
        <el-tab-pane label="命宫身宫" name="minggong"><MingGongPanel :data="data" /></el-tab-pane>
        <el-tab-pane label="格局取法" name="geju"><GeJuPanel :data="data" /></el-tab-pane>
      </el-tabs>
    </div>

    <!-- 移动端底部导航 -->
    <nav class="mobile-bottom-nav">
      <button
        v-for="tab in mobileTabs"
        :key="tab.id"
        class="mobile-nav-btn"
        :class="{ active: activeNav === tab.id }"
        type="button"
        @click="scrollToSection(tab.id)"
      >
        <span class="nav-icon" v-html="tab.icon"></span>
        <span class="nav-label">{{ tab.label }}</span>
      </button>
    </nav>

    <AiAssistantDrawer :data="data" :form="form" :dark-mode="darkMode" />
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { ElMessage } from 'element-plus'
import MainTable from '../components/MainTable.vue'
import YunPanel from '../components/YunPanel.vue'
import ZhinengChart from '../components/ZhinengChart.vue'
import GanZhiRelTable from '../components/settings/GanZhiRelTable.vue'
import CangGanTable from '../components/settings/CangGanTable.vue'
import SiLingTable from '../components/settings/SiLingTable.vue'
import ShenShaDetail from '../components/settings/ShenShaDetail.vue'
import MingGongPanel from '../components/settings/MingGongPanel.vue'
import GeJuPanel from '../components/settings/GeJuPanel.vue'
import AiAssistantDrawer from '../components/ai/AiAssistantDrawer.vue'

const props = defineProps({ data: Object, form: Object })
defineEmits(['back'])

const settingsTab = ref('ganzhi')
const darkMode = ref(localStorage.getItem('bazi_dark') === '1')
const activeNav = ref('table')

const mobileTabs = [
  {
    id: 'table', label: '命盘',
    icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="9" x2="9" y2="21"/></svg>'
  },
  {
    id: 'yun', label: '大运',
    icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>'
  },
  {
    id: 'zhineng', label: '图示',
    icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>'
  },
  {
    id: 'settings', label: '设置',
    icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>'
  }
]

function scrollToSection(id) {
  activeNav.value = id
  const el = document.getElementById('section-' + id)
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

// IntersectionObserver 更新激活 tab
let observer = null
onMounted(() => {
  observer = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting && e.intersectionRatio >= 0.3) {
        const id = e.target.id.replace('section-', '')
        activeNav.value = id
      }
    })
  }, { threshold: 0.3 })
  mobileTabs.forEach(tab => {
    const el = document.getElementById('section-' + tab.id)
    if (el) observer.observe(el)
  })
})
onBeforeUnmount(() => { observer?.disconnect() })

// 深色模式持久化
function toggleDark() {
  darkMode.value = !darkMode.value
  localStorage.setItem('bazi_dark', darkMode.value ? '1' : '0')
}

// 导出
function exportBazi() {
  const f = props.form
  const d = props.data
  const cols = d.tableColumns?.filter(c => c.label?.includes('柱')) || []
  const lines = [
    `命盘报告 · ${f.name || '无名命盘'}（${f.gender === 1 ? '乾造' : '坤造'}）`,
    `阴历：${d.lunarDesc}`,
    `阳历：${formatBirthday(f.birthday)} ${pad(f.hour)}:00`,
    '',
    '四柱',
    ...cols.map(c => `${c.label}：${c.gan}${c.zhi}（${c.ss}）`),
    '',
    d.dayuns?.[d.currentDayunIdx]
      ? `当前大运：${d.dayuns[d.currentDayunIdx].ganZhi}（${d.dayuns[d.currentDayunIdx].ss}）${d.dayuns[d.currentDayunIdx].startAge}岁起`
      : '',
    `胎元：${d.taiYuan}　胎息：${d.taiXi}　命宫：${d.mingGong}　身宫：${d.shenGong}`,
  ].filter(l => l !== undefined)

  navigator.clipboard.writeText(lines.join('\n'))
    .then(() => ElMessage({ message: '命盘已复制到剪贴板', type: 'success', duration: 2000 }))
    .catch(() => ElMessage.error('复制失败'))
}

function pad(n) { return String(n).padStart(2, '0') }

function formatBirthday(birthday) {
  if (!birthday) return ''
  const [y, m, d] = birthday.split('-')
  return `${y}年${m}月${d}日`
}
</script>

<style scoped>
/* ───── 背景 ───── */
.bazi-view {
  --page-bg:
    radial-gradient(ellipse at 8% 18%, rgba(210, 148, 55, 0.18) 0%, transparent 50%),
    radial-gradient(ellipse at 88% 10%, rgba(185, 108, 38, 0.14) 0%, transparent 46%),
    radial-gradient(ellipse at 52% 88%, rgba(160, 85, 28, 0.11) 0%, transparent 52%),
    linear-gradient(155deg, #f7ede0 0%, #f2e5d2 42%, #ede0d5 100%);
  --card-bg: rgba(255, 253, 246, 0.75);
  --card-border: rgba(228, 188, 122, 0.42);
  --card-shadow: 0 12px 40px rgba(100, 62, 18, 0.1), 0 2px 8px rgba(100, 62, 18, 0.06);
  --text-body: #2a1c10;

  background: var(--page-bg);
  min-height: 100vh;
  padding-bottom: 52px;
}

/* 深色模式 */
.bazi-view.dark {
  --page-bg:
    radial-gradient(ellipse at 8% 18%, rgba(150, 95, 30, 0.22) 0%, transparent 50%),
    radial-gradient(ellipse at 88% 10%, rgba(120, 70, 20, 0.18) 0%, transparent 46%),
    linear-gradient(155deg, #18100a 0%, #140d07 42%, #111009 100%);
  --card-bg: rgba(28, 18, 10, 0.84);
  --card-border: rgba(160, 110, 40, 0.35);
  --card-shadow: 0 12px 40px rgba(0, 0, 0, 0.45);
  --text-body: #e8d5b8;
}

/* ───── Header ───── */
.bazi-header {
  background: rgba(14, 9, 5, 0.84);
  backdrop-filter: blur(36px) saturate(1.9);
  -webkit-backdrop-filter: blur(36px) saturate(1.9);
  border-bottom: 1px solid rgba(255, 198, 90, 0.12);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.18);
  color: #fff;
  padding: 14px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px;
  position: sticky;
  top: 0;
  z-index: 10;
}
.header-left { display: flex; align-items: center; }
.birth-block { display: flex; flex-direction: column; gap: 5px; }
.name-row { display: flex; align-items: baseline; gap: 10px; margin-bottom: 2px; }
.person-name {
  font-size: 24px; font-weight: 900; color: #ffd88a;
  letter-spacing: 0.1em;
  text-shadow: 0 0 24px rgba(255, 210, 90, 0.35);
}
.gender-badge {
  font-size: 10px; padding: 2px 8px;
  background: rgba(255, 198, 78, 0.1);
  border: 1px solid rgba(255, 198, 78, 0.28);
  border-radius: 4px; color: rgba(255, 198, 78, 0.72);
  font-weight: 700; letter-spacing: 0.1em;
}
.date-rows { display: flex; flex-direction: column; gap: 3px; }
.info-row {
  display: flex; align-items: center; gap: 8px;
  font-size: 13px; color: rgba(234, 216, 192, 0.8); letter-spacing: 0.01em;
}
.info-label {
  font-size: 10px; color: rgba(255, 195, 70, 0.55); font-weight: 800;
  letter-spacing: 0.1em; width: 24px; flex-shrink: 0;
  border: 1px solid rgba(255, 195, 70, 0.18); border-radius: 3px;
  text-align: center; padding: 1px 0;
}
.header-right { display: flex; align-items: center; gap: 8px; }

.header-icon-btn {
  width: 32px; height: 32px;
  display: inline-flex; align-items: center; justify-content: center;
  background: rgba(255, 255, 255, 0.07);
  border: 1px solid rgba(255, 218, 130, 0.2);
  border-radius: 50%;
  color: rgba(241, 210, 140, 0.8);
  cursor: pointer;
  transition: background 0.16s ease, transform 0.14s ease, border-color 0.16s ease;
}
.header-icon-btn:hover {
  background: rgba(255, 255, 255, 0.13);
  border-color: rgba(255, 218, 130, 0.45);
  transform: scale(1.1);
}

.back-btn {
  display: inline-flex; align-items: center; gap: 5px;
  padding: 6px 14px;
  background: rgba(255, 255, 255, 0.07);
  border: 1px solid rgba(255, 218, 130, 0.22);
  border-radius: 999px; color: rgba(241, 216, 152, 0.9);
  font-size: 13px; font-weight: 600; cursor: pointer;
  transition: background 0.18s ease, border-color 0.18s ease, transform 0.15s ease;
  letter-spacing: 0.02em;
}
.back-btn:hover {
  background: rgba(255, 255, 255, 0.12);
  border-color: rgba(255, 218, 130, 0.5);
  transform: translateX(-2px);
}

/* ───── Glass card (shared) ───── */
.table-panel,
.yun-section,
.zhineng-section,
.settings-section {
  background: var(--card-bg);
  backdrop-filter: blur(22px) saturate(1.5);
  -webkit-backdrop-filter: blur(22px) saturate(1.5);
  border: 1px solid var(--card-border);
  border-radius: 20px;
  box-shadow: 0 2px 0 rgba(255,255,255,0.9) inset, var(--card-shadow);
}

.main-content {
  display: flex; gap: 14px; padding: 18px;
  align-items: flex-start; flex-wrap: wrap;
}
.table-panel { flex: 1 1 100%; padding: 16px; min-width: 0; }

.yun-section { margin: 0 18px 14px; overflow-x: auto; }
.zhineng-section { margin: 0 18px 14px; overflow: hidden; }
.settings-section { margin: 0 18px; padding: 0 16px 16px; }

/* 深色模式：卡片文字 */
.bazi-view.dark .table-panel,
.bazi-view.dark .yun-section,
.bazi-view.dark .zhineng-section,
.bazi-view.dark .settings-section {
  box-shadow: 0 1px 0 rgba(255,255,255,0.04) inset, var(--card-shadow);
}

/* ───── Settings tabs 深度定制 ───── */
.settings-section :deep(.el-tabs__nav-wrap::after) {
  background: rgba(210, 165, 80, 0.22);
  height: 1px;
}
.settings-section :deep(.el-tabs__item) {
  font-size: 13px;
  color: #8a7060;
  font-weight: 600;
  letter-spacing: 0.02em;
  padding: 0 14px;
  transition: color 0.18s ease;
}
.settings-section :deep(.el-tabs__item:hover) { color: #6a3a15; }
.settings-section :deep(.el-tabs__item.is-active) {
  color: #7a3a10;
  font-weight: 800;
}
.settings-section :deep(.el-tabs__active-bar) {
  background: linear-gradient(90deg, #c07030, #e09040);
  border-radius: 2px;
  height: 2px;
}

/* ── 深色模式：settings tabs ── */
.bazi-view.dark .settings-section :deep(.el-tabs__nav-wrap::after) {
  background: rgba(160, 110, 40, 0.3);
}
.bazi-view.dark .settings-section :deep(.el-tabs__item) {
  color: #907860;
}
.bazi-view.dark .settings-section :deep(.el-tabs__item:hover) {
  color: #d4a860;
}
.bazi-view.dark .settings-section :deep(.el-tabs__item.is-active) {
  color: #e8c070;
}
.bazi-view.dark .settings-section :deep(.el-tabs__active-bar) {
  background: linear-gradient(90deg, #c08030, #e8b050);
}

/* ───── 移动端底部导航 ───── */
.mobile-bottom-nav {
  display: none;
  position: fixed;
  bottom: 0; left: 0; right: 0;
  z-index: 9;
  background: rgba(14, 9, 5, 0.88);
  backdrop-filter: blur(28px) saturate(2);
  -webkit-backdrop-filter: blur(28px) saturate(2);
  border-top: 1px solid rgba(255, 195, 80, 0.12);
  padding: 6px 0 max(8px, env(safe-area-inset-bottom));
  grid-template-columns: repeat(4, 1fr);
  gap: 0;
}
.mobile-nav-btn {
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  gap: 3px; padding: 6px 4px;
  background: none; border: none; cursor: pointer;
  color: rgba(220, 195, 145, 0.45);
  transition: color 0.18s ease, transform 0.15s ease;
  min-width: 0;
}
.mobile-nav-btn.active { color: #f2c86a; }
.mobile-nav-btn:active { transform: scale(0.92); }
.nav-icon { display: flex; align-items: center; }
.nav-label { font-size: 10px; font-weight: 700; letter-spacing: 0.04em; white-space: nowrap; }

@media (max-width: 860px) {
  .bazi-view { padding-bottom: 72px; }
  .bazi-header { align-items: flex-start; padding: 12px 16px; }
  .header-left { width: 100%; }
  .header-right { width: 100%; justify-content: flex-end; margin-top: 4px; }
  .person-name { font-size: 20px; }

  .main-content { display: block; padding: 12px; }
  .table-panel { width: 100%; margin-bottom: 12px; overflow-x: auto; }
  .yun-section, .zhineng-section, .settings-section { margin: 0 12px 12px; overflow-x: auto; }

  .mobile-bottom-nav { display: grid; }
}
</style>
