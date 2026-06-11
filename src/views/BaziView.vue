<template>
  <div class="bazi-view">
    <!-- Header -->
    <div class="bazi-header">
      <div class="header-left">
        <div class="birth-block">
          <div class="name-row">
            <span v-if="form.name" class="person-name">{{ form.name }}</span>
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
        <button class="back-btn" type="button" @click="$emit('back')">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style="flex-shrink:0"><path d="M9 2L4 7l5 5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
          返回
        </button>
      </div>
    </div>

    <!-- Main content: table -->
    <div class="main-content">
      <div class="table-panel">
        <MainTable :data="data" />
      </div>
    </div>

    <!-- 起运/大运/流年 -->
    <div class="yun-section">
      <YunPanel :data="data" />
    </div>

    <!-- 智能四柱图示 -->
    <div class="zhineng-section">
      <ZhinengChart :data="data" />
    </div>

    <!-- 设置区 -->
    <div class="settings-section">
      <el-tabs v-model="settingsTab" class="settings-tabs">
        <el-tab-pane label="干支关系" name="ganzhi">
          <GanZhiRelTable :data="data" />
        </el-tab-pane>
        <el-tab-pane label="地支藏干" name="canggan">
          <CangGanTable :data="data" />
        </el-tab-pane>
        <el-tab-pane label="人元司令" name="siling">
          <SiLingTable :data="data" />
        </el-tab-pane>
        <el-tab-pane label="神煞设置" name="shensha">
          <ShenShaDetail :data="data" />
        </el-tab-pane>
        <el-tab-pane label="命宫身宫" name="minggong">
          <MingGongPanel :data="data" />
        </el-tab-pane>
        <el-tab-pane label="格局取法" name="geju">
          <GeJuPanel :data="data" />
        </el-tab-pane>
      </el-tabs>
    </div>

    <AiAssistantDrawer :data="data" :form="form" />
  </div>
</template>

<script setup>
import { ref } from 'vue'
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

defineProps({ data: Object, form: Object })
defineEmits(['back'])

const settingsTab = ref('ganzhi')

function pad(n) { return String(n).padStart(2, '0') }

function formatBirthday(birthday) {
  if (!birthday) return ''
  const [y, m, d] = birthday.split('-')
  return `${y}年${m}月${d}日`
}
</script>

<style scoped>
.bazi-view {
  background:
    radial-gradient(ellipse at 8% 18%, rgba(210, 148, 55, 0.18) 0%, transparent 50%),
    radial-gradient(ellipse at 88% 10%, rgba(185, 108, 38, 0.14) 0%, transparent 46%),
    radial-gradient(ellipse at 52% 88%, rgba(160, 85, 28, 0.11) 0%, transparent 52%),
    radial-gradient(ellipse at 40% 50%, rgba(240, 200, 120, 0.07) 0%, transparent 60%),
    linear-gradient(155deg, #f7ede0 0%, #f2e5d2 42%, #ede0d5 100%);
  min-height: 100vh;
  padding-bottom: 52px;
}

.bazi-header {
  background: rgba(20, 14, 9, 0.78);
  backdrop-filter: blur(36px) saturate(1.9);
  -webkit-backdrop-filter: blur(36px) saturate(1.9);
  border-bottom: 1px solid rgba(255, 198, 90, 0.13);
  box-shadow: 0 1px 0 rgba(255, 198, 90, 0.08), 0 8px 32px rgba(0, 0, 0, 0.18);
  color: #fff;
  padding: 14px 24px;
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
.birth-block { display: flex; flex-direction: column; gap: 6px; }

.name-row {
  display: flex;
  align-items: baseline;
  gap: 10px;
  margin-bottom: 2px;
}
.person-name {
  font-size: 26px;
  font-weight: 900;
  color: #ffd88a;
  letter-spacing: 0.1em;
  text-shadow: 0 0 24px rgba(255, 210, 90, 0.35);
}
.gender-badge {
  font-size: 11px;
  padding: 2px 9px;
  background: rgba(255, 198, 78, 0.1);
  border: 1px solid rgba(255, 198, 78, 0.28);
  border-radius: 5px;
  color: rgba(255, 198, 78, 0.75);
  font-weight: 700;
  letter-spacing: 0.1em;
}
.date-rows { display: flex; flex-direction: column; gap: 4px; }
.info-row {
  display: flex;
  align-items: center;
  gap: 9px;
  font-size: 14px;
  color: rgba(234, 216, 192, 0.82);
  letter-spacing: 0.01em;
}
.info-label {
  font-size: 10px;
  color: rgba(255, 195, 70, 0.55);
  font-weight: 800;
  letter-spacing: 0.1em;
  width: 24px;
  flex-shrink: 0;
  border: 1px solid rgba(255, 195, 70, 0.2);
  border-radius: 3px;
  text-align: center;
  padding: 1px 0;
}
.header-right { display: flex; align-items: center; gap: 10px; }
.back-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 6px 15px;
  background: rgba(255, 255, 255, 0.07);
  border: 1px solid rgba(255, 218, 130, 0.24);
  border-radius: 999px;
  color: rgba(241, 216, 152, 0.9);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.18s ease, border-color 0.18s ease, transform 0.16s ease, box-shadow 0.18s ease;
  letter-spacing: 0.02em;
  backdrop-filter: blur(8px);
}
.back-btn:hover {
  background: rgba(255, 255, 255, 0.12);
  border-color: rgba(255, 218, 130, 0.5);
  transform: translateX(-2px);
  box-shadow: 0 0 12px rgba(255, 200, 80, 0.12);
}

/* 统一卡片 mixin */
.main-content {
  display: flex;
  gap: 14px;
  padding: 18px;
  align-items: flex-start;
  flex-wrap: wrap;
}
.table-panel {
  flex: 1 1 100%;
  background: rgba(255, 253, 246, 0.75);
  backdrop-filter: blur(22px) saturate(1.5);
  -webkit-backdrop-filter: blur(22px) saturate(1.5);
  border: 1px solid rgba(228, 188, 122, 0.42);
  border-radius: 20px;
  padding: 16px;
  box-shadow:
    0 2px 0 rgba(255, 255, 255, 0.92) inset,
    0 -1px 0 rgba(200, 148, 70, 0.12) inset,
    0 12px 40px rgba(100, 62, 18, 0.1),
    0 2px 8px rgba(100, 62, 18, 0.06);
  min-width: 0;
}

.yun-section {
  margin: 0 18px 14px;
  background: rgba(255, 253, 246, 0.75);
  backdrop-filter: blur(22px) saturate(1.5);
  -webkit-backdrop-filter: blur(22px) saturate(1.5);
  border: 1px solid rgba(228, 188, 122, 0.42);
  border-radius: 20px;
  box-shadow:
    0 2px 0 rgba(255, 255, 255, 0.92) inset,
    0 12px 40px rgba(100, 62, 18, 0.1),
    0 2px 8px rgba(100, 62, 18, 0.06);
  overflow-x: auto;
}

.zhineng-section {
  margin: 0 18px 14px;
  background: rgba(255, 253, 246, 0.75);
  backdrop-filter: blur(22px) saturate(1.5);
  -webkit-backdrop-filter: blur(22px) saturate(1.5);
  border: 1px solid rgba(228, 188, 122, 0.42);
  border-radius: 20px;
  box-shadow:
    0 2px 0 rgba(255, 255, 255, 0.92) inset,
    0 12px 40px rgba(100, 62, 18, 0.1),
    0 2px 8px rgba(100, 62, 18, 0.06);
  overflow: hidden;
}

.settings-section {
  margin: 0 18px;
  background: rgba(255, 253, 246, 0.75);
  backdrop-filter: blur(22px) saturate(1.5);
  -webkit-backdrop-filter: blur(22px) saturate(1.5);
  border: 1px solid rgba(228, 188, 122, 0.42);
  border-radius: 20px;
  box-shadow:
    0 2px 0 rgba(255, 255, 255, 0.92) inset,
    0 12px 40px rgba(100, 62, 18, 0.1),
    0 2px 8px rgba(100, 62, 18, 0.06);
  padding: 0 16px 16px;
}

/* el-tabs 内部圆角适配 */
.settings-section :deep(.el-tabs__nav-wrap::after) {
  background-color: rgba(228, 188, 122, 0.3);
}
.settings-section :deep(.el-tabs__item.is-active) {
  color: #8d4e1a;
}
.settings-section :deep(.el-tabs__active-bar) {
  background-color: #8d4e1a;
  border-radius: 2px;
}

@media (max-width: 860px) {
  .bazi-header { align-items: flex-start; }
  .header-left { width: 100%; }
  .header-right { width: 100%; justify-content: flex-end; }
  .person-name { font-size: 22px; }

  .main-content {
    display: block;
    padding: 12px;
  }

  .table-panel {
    width: 100%;
    margin-bottom: 12px;
    overflow-x: auto;
  }

  .yun-section,
  .zhineng-section,
  .settings-section {
    margin: 0 12px 12px;
    overflow-x: auto;
  }
}
</style>
