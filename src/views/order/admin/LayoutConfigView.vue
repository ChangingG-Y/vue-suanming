<template>
  <div style="padding:16px;max-width:640px;margin:0 auto;">
    <div style="font-size:16px;font-weight:700;color:#1c1c1e;margin-bottom:16px;">🎨 布局编辑</div>

    <div v-if="loading" style="text-align:center;padding:60px;color:#aeaeb2;">
      <van-loading color="#c96b7e" size="32px" />
    </div>

    <template v-else>
      <!-- 登录页 -->
      <div class="section-title">登录页</div>
      <div class="config-card">
        <div class="field-row">
          <label>图标 Emoji</label>
          <input v-model="form.loginEmoji" class="field-input" placeholder="🍱" />
        </div>
        <div class="field-row">
          <label>标题</label>
          <input v-model="form.loginTitle" class="field-input" placeholder="小新补给站" />
        </div>
        <div class="field-row">
          <label>副标题</label>
          <input v-model="form.loginSub" class="field-input" placeholder="今天想吃点什么呀~" />
        </div>
        <div class="field-row">
          <label>按钮文字</label>
          <input v-model="form.loginBtn" class="field-input" placeholder="进入点餐系统" />
        </div>
      </div>

      <!-- 底部 Tab -->
      <div class="section-title">底部导航 Tab</div>
      <div class="config-card">
        <div v-for="(tab, i) in tabs" :key="i" class="tab-row">
          <span class="tab-index">Tab {{ i }}</span>
          <input v-model="tab.icon" class="field-icon" placeholder="🍱" />
          <input v-model="tab.label" class="field-label" placeholder="标签文字" />
        </div>
      </div>

      <!-- 管理后台 -->
      <div class="section-title">管理后台</div>
      <div class="config-card">
        <div class="field-row">
          <label>顶部标题</label>
          <input v-model="form.adminTitle" class="field-input" placeholder="管理后台" />
        </div>
      </div>

      <!-- 其他文案 -->
      <div class="section-title">其他文案</div>
      <div class="config-card">
        <div class="field-row">
          <label>下单成功</label>
          <input v-model="form.successMsg" class="field-input" placeholder="下单成功！等待接单 🍳" />
        </div>
      </div>

      <!-- 预览 -->
      <div class="section-title">预览</div>
      <div class="preview-card">
        <div style="font-size:36px;text-align:center;">{{ form.loginEmoji }}</div>
        <div style="font-size:16px;font-weight:700;text-align:center;color:#1c1c1e;margin-top:8px;">{{ form.loginTitle }}</div>
        <div style="font-size:13px;color:#6d6d72;text-align:center;margin-top:4px;">{{ form.loginSub }}</div>
        <div style="display:flex;justify-content:center;gap:24px;margin-top:16px;">
          <div v-for="(tab, i) in tabs" :key="i" style="text-align:center;font-size:12px;color:#c96b7e;">
            <div style="font-size:20px;">{{ tab.icon }}</div>
            <div>{{ tab.label }}</div>
          </div>
        </div>
      </div>

      <button class="btn-save" :disabled="saving" @click="save">
        {{ saving ? '保存中...' : '💾 保存布局' }}
      </button>
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getLayoutConfig, updateLayoutConfig } from '../../../api/orderConfig.js'
import { useLayoutConfigStore } from '../../../stores/layoutConfig.js'
import { showToast } from 'vant'

const layoutStore = useLayoutConfigStore()
const loading = ref(true)
const saving = ref(false)

const form = ref({
  loginEmoji: '🍱',
  loginTitle: '',
  loginSub: '',
  loginBtn: '',
  adminTitle: '',
  successMsg: '',
})

const tabs = ref([
  { icon: '🍱', label: '点菜' },
  { icon: '🍖', label: '订单' },
  { icon: '📖', label: '历史' },
])

onMounted(async () => {
  try {
    const cfg = await getLayoutConfig()
    if (cfg) {
      form.value.loginEmoji = cfg.loginEmoji || '🍱'
      form.value.loginTitle = cfg.loginTitle || ''
      form.value.loginSub = cfg.loginSub || ''
      form.value.loginBtn = cfg.loginBtn || ''
      form.value.adminTitle = cfg.adminTitle || ''
      form.value.successMsg = cfg.successMsg || ''
      tabs.value[0].icon = cfg.tab0Icon || '🍱'
      tabs.value[0].label = cfg.tab0Label || '点菜'
      tabs.value[1].icon = cfg.tab1Icon || '🍖'
      tabs.value[1].label = cfg.tab1Label || '订单'
      tabs.value[2].icon = cfg.tab2Icon || '📖'
      tabs.value[2].label = cfg.tab2Label || '历史'
    }
  } catch (e) {
    showToast({ message: '加载失败：' + e.message, type: 'fail' })
  } finally {
    loading.value = false
  }
})

async function save() {
  saving.value = true
  try {
    const payload = {
      ...form.value,
      tab0Icon: tabs.value[0].icon,
      tab0Label: tabs.value[0].label,
      tab1Icon: tabs.value[1].icon,
      tab1Label: tabs.value[1].label,
      tab2Icon: tabs.value[2].icon,
      tab2Label: tabs.value[2].label,
    }
    await updateLayoutConfig(payload)
    layoutStore.setConfig(payload)
    showToast({ message: '布局已保存 ✅', type: 'success' })
  } catch (e) {
    showToast({ message: '保存失败：' + e.message, type: 'fail' })
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.section-title {
  font-size: 12px;
  font-weight: 700;
  color: #aeaeb2;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin: 16px 0 6px;
}

.config-card {
  background: #ffffff;
  border-radius: 14px;
  padding: 14px 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
}

.field-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 0;
  border-bottom: 0.5px solid #f2f2f7;
}
.field-row:last-child { border-bottom: none; }

.field-row label {
  font-size: 13px;
  color: #6d6d72;
  width: 80px;
  flex-shrink: 0;
}

.field-input {
  flex: 1;
  padding: 8px 10px;
  border-radius: 8px;
  border: 1px solid #e5e5ea;
  font-size: 14px;
  outline: none;
  color: #1c1c1e;
}
.field-input:focus { border-color: #c96b7e; }

.tab-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 0;
  border-bottom: 0.5px solid #f2f2f7;
}
.tab-row:last-child { border-bottom: none; }
.tab-index {
  font-size: 12px;
  color: #aeaeb2;
  width: 36px;
  flex-shrink: 0;
}
.field-icon {
  width: 52px;
  padding: 8px 6px;
  border-radius: 8px;
  border: 1px solid #e5e5ea;
  font-size: 18px;
  text-align: center;
  outline: none;
}
.field-icon:focus { border-color: #c96b7e; }
.field-label {
  flex: 1;
  padding: 8px 10px;
  border-radius: 8px;
  border: 1px solid #e5e5ea;
  font-size: 14px;
  outline: none;
  color: #1c1c1e;
}
.field-label:focus { border-color: #c96b7e; }

.preview-card {
  background: linear-gradient(135deg, #fef4f5 0%, #fff8ed 100%);
  border-radius: 14px;
  padding: 20px 16px;
  border: 1px solid rgba(201,107,126,0.15);
}

.btn-save {
  width: 100%;
  background: #c96b7e;
  color: #fff;
  border: none;
  border-radius: 22px;
  padding: 14px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  margin-top: 16px;
}
.btn-save:disabled { opacity: 0.6; cursor: not-allowed; }
</style>
