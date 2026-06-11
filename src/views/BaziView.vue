<template>
  <div class="bazi-view">
    <!-- Header -->
    <div class="bazi-header">
      <div class="header-left">
        <div class="logo-area">
          <span class="logo-icon">☯</span>
          <span class="site-name">八字排盘</span>
        </div>
        <div class="birth-info">
          <div>阴历：{{ data.lunarDesc }} （{{ form.gender === 1 ? '乾造' : '坤造' }}）</div>
          <div>阳历：{{ form.birthday }} {{ pad(form.hour) }}:00</div>
          <div v-if="form.name" class="person-name">{{ form.name }}</div>
        </div>
      </div>
      <div class="header-right">
        <el-switch v-model="showTaiMing" active-text="胎命身" />
        <el-button size="small" @click="$emit('back')">返回</el-button>
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

const showTaiMing = ref(false)
const settingsTab = ref('ganzhi')

function pad(n) { return String(n).padStart(2, '0') }
</script>

<style scoped>
.bazi-view { background: #f4f1e8; min-height: 100vh; padding-bottom: 40px; }

.bazi-header {
  background: #1f1f1f;
  color: #fff;
  padding: 12px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px;
}
.header-left { display: flex; align-items: center; gap: 20px; flex-wrap: wrap; }
.logo-area { display: flex; align-items: center; gap: 8px; }
.logo-icon { font-size: 28px; color: #c9a227; }
.site-name { font-size: 18px; font-weight: bold; color: #c9a227; }
.birth-info { font-size: 13px; color: #ccc; line-height: 1.7; }
.person-name { color: #c9a227; font-size: 15px; }
.header-right { display: flex; align-items: center; gap: 10px; }

.main-content {
  display: flex;
  gap: 12px;
  padding: 12px;
  align-items: flex-start;
  flex-wrap: wrap;
}
.table-panel {
  flex: 1 1 100%;
  background: #fff;
  border-radius: 8px;
  padding: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  min-width: 0;
}

.yun-section {
  margin: 0 12px 12px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  overflow-x: auto;
}

.zhineng-section {
  margin: 0 12px 12px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

.settings-section {
  margin: 0 12px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  padding: 0 12px 12px;
}

@media (max-width: 860px) {
  .bazi-header {
    align-items: flex-start;
  }

  .header-left {
    width: 100%;
    align-items: flex-start;
  }

  .header-right {
    width: 100%;
    justify-content: space-between;
  }

  .main-content {
    display: block;
    padding: 10px;
  }

  .table-panel {
    width: 100%;
    margin-bottom: 10px;
    overflow-x: auto;
  }

  .yun-section,
  .zhineng-section,
  .settings-section {
    margin: 0 10px 10px;
    overflow-x: auto;
  }
}
</style>
