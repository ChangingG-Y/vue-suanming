<template>
  <div class="input-page">
    <main class="input-shell">
      <section class="input-panel">
        <div class="card-header">
          <div class="brand-mark">八</div>
          <div>
            <h1>八字排盘</h1>
            <p>录入出生信息，生成命盘后可直接进入 AI 问答。</p>
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
    linear-gradient(135deg, rgba(17, 24, 39, 0.94), rgba(34, 34, 32, 0.9)),
    repeating-linear-gradient(90deg, rgba(255,255,255,0.03) 0 1px, transparent 1px 72px),
    #151515;
  padding: 28px;
}

.input-shell {
  width: min(1080px, 100%);
  display: grid;
  grid-template-columns: minmax(0, 620px) 340px;
  gap: 18px;
  align-items: stretch;
}

.input-panel,
.history-panel {
  background: rgba(255, 255, 255, 0.96);
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 8px;
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.28);
}

.input-panel {
  padding: 34px;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 28px;
}

.brand-mark {
  width: 52px;
  height: 52px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #f4d27a;
  background: #1f1f1f;
  border: 1px solid #4a3c1c;
  border-radius: 8px;
  font-size: 26px;
  font-weight: 700;
}

.card-header h1 {
  font-size: 26px;
  color: #171717;
  margin-bottom: 6px;
  letter-spacing: 0;
}

.card-header p {
  color: #626262;
  font-size: 13px;
}

.bazi-form { margin-top: 8px; }
.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.full-control { width: 100%; }
.lunar-hint { margin-bottom: 16px; }

.submit-button {
  width: 100%;
  height: 44px;
  background: #8b6914;
  border-color: #8b6914;
  font-weight: 700;
}

.quick-examples {
  margin-top: 16px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.quick-examples button {
  border: 1px solid #d7c493;
  background: #fffaf0;
  color: #6f5310;
  border-radius: 999px;
  padding: 7px 11px;
  cursor: pointer;
}

.history-panel {
  padding: 22px;
  display: flex;
  flex-direction: column;
  min-height: 420px;
}

.history-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 14px;
  border-bottom: 1px solid #ece4d4;
}

.history-title {
  font-size: 17px;
  font-weight: 700;
  color: #1f1f1f;
}

.history-subtitle {
  margin-top: 4px;
  font-size: 12px;
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
  border: 1px solid #eee4cf;
  border-radius: 8px;
  background: #fffdf8;
  padding: 11px 38px 11px 12px;
  text-align: left;
  cursor: pointer;
}

.history-item:hover {
  border-color: #c7a84a;
  background: #fffaf0;
}

.history-main {
  display: grid;
  gap: 4px;
}

.history-main strong {
  color: #242424;
  font-size: 14px;
}

.history-main em {
  color: #716b60;
  font-size: 12px;
  font-style: normal;
  line-height: 1.5;
}

.history-meta {
  display: block;
  margin-top: 8px;
  color: #9a907d;
  font-size: 11px;
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
}

.delete-history:hover {
  color: #fff;
  background: #c0392b;
}

.empty-history {
  flex: 1;
  display: grid;
  place-items: center;
  color: #83796b;
  text-align: center;
  font-size: 13px;
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
    padding: 14px;
  }

  .input-shell {
    grid-template-columns: 1fr;
  }

  .input-panel,
  .history-panel {
    padding: 20px 16px;
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
