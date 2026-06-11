<template>
  <div class="input-page">
    <main class="input-shell">
      <section class="input-panel">
        <div class="card-header">
          <div class="brand-mark">胡</div>
          <div>
            <h1>胡桃排盘</h1>
            <p>给胡桃大师准备的命盘工具，排盘后可直接进入 AI 问答。</p>
          </div>
        </div>

        <el-form :model="form" label-position="top" class="bazi-form">
          <div class="form-grid">
            <el-form-item label="姓名">
              <el-input v-model="form.name" placeholder="可选" />
            </el-form-item>

            <el-form-item label="性别" required>
              <el-segmented v-model="form.gender" :options="genderOptions" class="full-control" />
            </el-form-item>
          </div>

          <div class="form-grid">
            <el-form-item label="出生日期" required>
              <el-date-picker
                v-model="form.birthday"
                type="date"
                placeholder="选择出生日期"
                format="YYYY年MM月DD日"
                value-format="YYYY-MM-DD"
                class="full-control"
              />
            </el-form-item>

            <el-form-item label="出生时间" required>
              <el-select v-model="form.hour" placeholder="选择时辰" class="full-control">
                <el-option v-for="h in hourOptions" :key="h.value" :label="h.label" :value="h.value" />
              </el-select>
            </el-form-item>
          </div>

          <el-form-item label="出生地点">
            <el-input v-model="form.location" placeholder="可选，仅用于记录" />
          </el-form-item>

          <el-form-item label="历法">
            <el-segmented v-model="form.calType" :options="calendarOptions" class="full-control" />
          </el-form-item>

          <div v-if="form.calType === 'lunar'" class="lunar-hint">
            <el-alert type="info" :closable="false" show-icon>
              <template #default>农历输入：请填写对应的公历日期（已自动转换）</template>
            </el-alert>
          </div>

          <el-button type="primary" size="large" class="submit-button" @click="submit">
            开始排盘
          </el-button>
        </el-form>

        <div class="quick-examples">
          <button type="button" @click="loadExample(1)">1990-01-01 子时 男</button>
          <button type="button" @click="loadExample(2)">1985-06-15 午时 女</button>
        </div>
      </section>

      <aside class="history-panel">
        <div class="history-head">
          <div>
            <div class="history-title">历史记录</div>
            <div class="history-subtitle">本地缓存，最多保留 12 条</div>
          </div>
          <el-icon><Clock /></el-icon>
        </div>

        <div v-if="historyList.length" class="history-list">
          <button
            v-for="item in historyList"
            :key="item.id"
            type="button"
            class="history-item"
            @click="loadHistory(item)"
          >
            <span class="history-main">
              <strong>{{ item.name || '未命名命盘' }}</strong>
              <em>{{ item.gender === 1 ? '乾造' : '坤造' }} · {{ item.birthday }} · {{ hourText(item.hour) }}</em>
            </span>
            <span class="history-meta">{{ formatDate(item.createdAt) }}</span>
            <span class="delete-history" @click.stop="deleteHistory(item.id)" aria-label="删除历史">
              <el-icon><Close /></el-icon>
            </span>
          </button>
        </div>

        <div v-else class="empty-history">
          <div class="empty-line"></div>
          <p>完成排盘后会自动保存到这里。</p>
        </div>
      </aside>
    </main>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { Clock, Close } from '@element-plus/icons-vue'
import { calculateBazi } from '../utils/bazi.js'

const emit = defineEmits(['submit'])
const HISTORY_KEY = 'suanming_bazi_history'
const MAX_HISTORY = 12

const form = ref({
  name: '',
  gender: 1,
  birthday: '',
  hour: 0,
  location: '',
  calType: 'solar'
})

const historyList = ref([])

const genderOptions = [
  { label: '男（乾造）', value: 1 },
  { label: '女（坤造）', value: 0 }
]

const calendarOptions = [
  { label: '阳历', value: 'solar' },
  { label: '阴历', value: 'lunar' }
]

const hourOptions = [
  { value: 0,  label: '子时（23:00-01:00）' },
  { value: 2,  label: '丑时（01:00-03:00）' },
  { value: 4,  label: '寅时（03:00-05:00）' },
  { value: 6,  label: '卯时（05:00-07:00）' },
  { value: 8,  label: '辰时（07:00-09:00）' },
  { value: 10, label: '巳时（09:00-11:00）' },
  { value: 12, label: '午时（11:00-13:00）' },
  { value: 14, label: '未时（13:00-15:00）' },
  { value: 16, label: '申时（15:00-17:00）' },
  { value: 18, label: '酉时（17:00-19:00）' },
  { value: 20, label: '戌时（19:00-21:00）' },
  { value: 22, label: '亥时（21:00-23:00）' }
]

onMounted(() => {
  historyList.value = readHistory()
})

function loadExample(n) {
  if (n === 1) {
    form.value = { ...form.value, birthday: '1990-01-01', hour: 0, gender: 1, name: '示例男命' }
  }
  if (n === 2) {
    form.value = { ...form.value, birthday: '1985-06-15', hour: 12, gender: 0, name: '示例女命' }
  }
}

function submit() {
  if (!form.value.birthday) {
    ElMessage.warning('请选择出生日期')
    return
  }
  const [y, m, d] = form.value.birthday.split('-').map(Number)
  try {
    const savedForm = { ...form.value }
    const data = calculateBazi(y, m, d, savedForm.hour, 0, 0, savedForm.gender)
    saveHistory(savedForm)
    emit('submit', { data, form: savedForm })
  } catch (e) {
    ElMessage.error('排盘失败：' + e.message)
  }
}

function loadHistory(item) {
  form.value = {
    name: item.name || '',
    gender: item.gender,
    birthday: item.birthday,
    hour: item.hour,
    location: item.location || '',
    calType: item.calType || 'solar'
  }
  submit()
}

function deleteHistory(id) {
  historyList.value = historyList.value.filter(item => item.id !== id)
  localStorage.setItem(HISTORY_KEY, JSON.stringify(historyList.value))
}

function saveHistory(value) {
  const nextItem = {
    ...value,
    id: createId(),
    createdAt: Date.now()
  }
  const deduped = historyList.value.filter(item => {
    return !(item.birthday === value.birthday && item.hour === value.hour && item.gender === value.gender && item.name === value.name)
  })
  historyList.value = [nextItem, ...deduped].slice(0, MAX_HISTORY)
  localStorage.setItem(HISTORY_KEY, JSON.stringify(historyList.value))
}

function readHistory() {
  try {
    const raw = localStorage.getItem(HISTORY_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed.slice(0, MAX_HISTORY) : []
  } catch (error) {
    return []
  }
}

function createId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID()
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function hourText(hour) {
  return hourOptions.find(item => item.value === hour)?.label.split('（')[0] || `${hour}:00`
}

function formatDate(timestamp) {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  return `${date.getMonth() + 1}/${date.getDate()}`
}
</script>

<style scoped>
.input-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background:
    radial-gradient(ellipse at 18% 38%, rgba(190, 118, 48, 0.32) 0%, transparent 52%),
    radial-gradient(ellipse at 80% 18%, rgba(148, 82, 28, 0.24) 0%, transparent 48%),
    radial-gradient(ellipse at 55% 84%, rgba(100, 55, 18, 0.2) 0%, transparent 55%),
    radial-gradient(ellipse at 50% 50%, rgba(60, 30, 10, 0.15) 0%, transparent 70%),
    #130e09;
  padding: 34px;
}

.input-shell {
  width: min(1080px, 100%);
  display: grid;
  grid-template-columns: minmax(0, 620px) 340px;
  gap: 20px;
  align-items: stretch;
}

.input-panel,
.history-panel {
  background: rgba(255, 252, 244, 0.84);
  backdrop-filter: blur(32px) saturate(1.6);
  -webkit-backdrop-filter: blur(32px) saturate(1.6);
  border: 1px solid rgba(244, 211, 154, 0.48);
  border-radius: 22px;
  box-shadow:
    0 2px 0 rgba(255, 255, 255, 0.95) inset,
    0 36px 88px rgba(10, 6, 2, 0.52),
    0 8px 24px rgba(10, 6, 2, 0.24);
}

.input-panel {
  padding: 38px;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 28px;
}

.brand-mark {
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffd88a;
  background: linear-gradient(145deg, #2c1b13, #8a4f21);
  border: 1px solid rgba(217, 166, 77, 0.7);
  border-radius: 16px;
  font-size: 27px;
  font-weight: 900;
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,0.18),
    0 0 28px rgba(255, 190, 70, 0.2),
    0 10px 24px rgba(91, 53, 25, 0.3);
}

.card-header h1 {
  font-size: 32px;
  color: #1e140f;
  margin-bottom: 5px;
  letter-spacing: 0;
  font-weight: 900;
}

.card-header p {
  color: #6d5e52;
  font-size: 14px;
  line-height: 1.65;
}

.bazi-form { margin-top: 8px; }
.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.bazi-form :deep(.el-form-item__label) {
  color: #4d4034;
  font-size: 14px;
  font-weight: 700;
}

.bazi-form :deep(.el-input__wrapper),
.bazi-form :deep(.el-select__wrapper),
.bazi-form :deep(.el-date-editor.el-input__wrapper) {
  min-height: 42px;
  border-radius: 10px;
}

.full-control { width: 100%; }
.lunar-hint { margin-bottom: 16px; }

.submit-button {
  width: 100%;
  height: 48px;
  background: linear-gradient(135deg, #8d4e22, #b5621c);
  border-color: transparent;
  border-radius: 10px;
  font-size: 16px;
  font-weight: 800;
  letter-spacing: 0.04em;
  transition: transform 0.18s ease, box-shadow 0.18s ease, filter 0.18s ease;
  box-shadow: 0 6px 20px rgba(141, 78, 34, 0.35);
}

.submit-button:hover {
  background: linear-gradient(135deg, #a05828, #c97020);
  border-color: transparent;
  transform: translateY(-1px);
  box-shadow: 0 10px 28px rgba(141, 78, 34, 0.45);
  filter: brightness(1.05);
}

.submit-button:active {
  transform: translateY(0);
  box-shadow: 0 4px 12px rgba(141, 78, 34, 0.3);
}

.quick-examples {
  margin-top: 16px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.quick-examples button {
  border: 1px solid #d9b879;
  background: #fff8e9;
  color: #7c4a18;
  border-radius: 999px;
  padding: 7px 14px;
  cursor: pointer;
  font-size: 13px;
  transition: background 0.16s ease, border-color 0.16s ease, transform 0.15s ease, box-shadow 0.15s ease;
}

.quick-examples button:hover {
  background: #fff0d0;
  border-color: #c49530;
  color: #5a3210;
  transform: translateY(-1px);
  box-shadow: 0 4px 10px rgba(141, 78, 34, 0.15);
}

.quick-examples button:active {
  transform: translateY(0);
}

.history-panel {
  padding: 22px 22px;
  display: flex;
  flex-direction: column;
  min-height: 420px;
}

.history-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 14px;
  border-bottom: 1px solid rgba(200, 165, 100, 0.3);
}

.history-title {
  font-size: 19px;
  font-weight: 700;
  color: #2a1c15;
}

.history-subtitle {
  margin-top: 4px;
  font-size: 13px;
  color: #7a7468;
}

.history-list {
  margin-top: 14px;
  display: grid;
  gap: 10px;
}

.history-item {
  position: relative;
  width: 100%;
  border: 1px solid rgba(218, 184, 118, 0.45);
  border-radius: 13px;
  background: rgba(255, 253, 246, 0.65);
  backdrop-filter: blur(8px);
  padding: 11px 38px 11px 14px;
  text-align: left;
  cursor: pointer;
  transition: border-color 0.18s ease, background 0.18s ease, box-shadow 0.18s ease, transform 0.16s ease;
}

.history-item:hover {
  border-color: rgba(192, 152, 60, 0.7);
  background: rgba(255, 250, 234, 0.85);
  box-shadow: 0 6px 18px rgba(130, 72, 22, 0.14);
  transform: translateX(2px);
}

.history-main {
  display: grid;
  gap: 4px;
}

.history-main strong {
  color: #2a1c15;
  font-size: 15px;
}

.history-main em {
  color: #716b60;
  font-size: 13px;
  font-style: normal;
  line-height: 1.5;
}

.history-meta {
  display: block;
  margin-top: 8px;
  color: #9a907d;
  font-size: 12px;
}

.delete-history {
  position: absolute;
  top: 10px;
  right: 10px;
  width: 22px;
  height: 22px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #9b6b61;
  border-radius: 50%;
  transition: color 0.15s ease, background 0.15s ease, transform 0.15s ease;
}

.delete-history:hover {
  color: #fff;
  background: #c0392b;
  transform: scale(1.15);
}

.empty-history {
  flex: 1;
  display: grid;
  place-items: center;
  color: #83796b;
  text-align: center;
  font-size: 14px;
}

.empty-line {
  width: 54px;
  height: 3px;
  margin: 0 auto 10px;
  background: #d4ae46;
  border-radius: 999px;
}

@media (max-width: 920px) {
  .input-page {
    align-items: flex-start;
    padding: 16px;
  }

  .input-shell {
    grid-template-columns: 1fr;
  }

  .input-panel {
    padding: 24px 20px;
  }

  .history-panel {
    padding: 20px;
  }
}

@media (max-width: 560px) {
  .form-grid {
    grid-template-columns: 1fr;
    gap: 0;
  }

  .card-header {
    align-items: flex-start;
  }
}
</style>
