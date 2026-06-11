<template>
  <div class="input-page">
    <div class="input-card">
      <div class="card-header">
        <div class="logo-icon">☯</div>
        <h1>八字排盘</h1>
        <p>请输入出生信息进行八字排盘</p>
      </div>

      <el-form :model="form" label-width="80px" class="bazi-form">
        <el-form-item label="姓名">
          <el-input v-model="form.name" placeholder="可选" />
        </el-form-item>

        <el-form-item label="性别" required>
          <el-radio-group v-model="form.gender">
            <el-radio :value="1">男（乾造）</el-radio>
            <el-radio :value="0">女（坤造）</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="出生日期" required>
          <el-date-picker
            v-model="form.birthday"
            type="date"
            placeholder="选择出生日期"
            format="YYYY年MM月DD日"
            value-format="YYYY-MM-DD"
            style="width: 100%"
          />
        </el-form-item>

        <el-form-item label="出生时间" required>
          <el-select v-model="form.hour" placeholder="选择时辰" style="width: 100%">
            <el-option v-for="h in hourOptions" :key="h.value" :label="h.label" :value="h.value" />
          </el-select>
        </el-form-item>

        <el-form-item label="出生地点">
          <el-input v-model="form.location" placeholder="可选，仅用于记录" />
        </el-form-item>

        <el-form-item label="历法">
          <el-radio-group v-model="form.calType">
            <el-radio value="solar">阳历（公历）</el-radio>
            <el-radio value="lunar">阴历（农历）</el-radio>
          </el-radio-group>
        </el-form-item>

        <div v-if="form.calType === 'lunar'" class="lunar-hint">
          <el-alert type="info" :closable="false" show-icon>
            <template #default>农历输入：请填写对应的公历日期（已自动转换）</template>
          </el-alert>
        </div>

        <el-form-item>
          <el-button type="primary" size="large" style="width:100%;background:#8b6914;border-color:#8b6914" @click="submit">
            开始排盘
          </el-button>
        </el-form-item>
      </el-form>

      <div class="quick-examples">
        <span class="examples-label">快速示例：</span>
        <el-button size="small" text @click="loadExample(1)">1990-01-01 子时 男</el-button>
        <el-button size="small" text @click="loadExample(2)">1985-06-15 午时 女</el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { calculateBazi } from '../utils/bazi.js'

const emit = defineEmits(['submit'])

const form = ref({
  name: '',
  gender: 1,
  birthday: '',
  hour: 0,
  location: '',
  calType: 'solar'
})

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

function loadExample(n) {
  if (n === 1) { form.value.birthday = '1990-01-01'; form.value.hour = 0; form.value.gender = 1; form.value.name = '示例男命' }
  if (n === 2) { form.value.birthday = '1985-06-15'; form.value.hour = 12; form.value.gender = 0; form.value.name = '示例女命' }
}

function submit() {
  if (!form.value.birthday) { ElMessage.warning('请选择出生日期'); return }
  const [y, m, d] = form.value.birthday.split('-').map(Number)
  try {
    const data = calculateBazi(y, m, d, form.value.hour, 0, 0, form.value.gender)
    emit('submit', { data, form: { ...form.value } })
  } catch (e) {
    ElMessage.error('排盘失败：' + e.message)
  }
}
</script>

<style scoped>
.input-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #1a1a1a 0%, #2c2c2c 50%, #1a1a1a 100%);
  padding: 20px;
}
.input-card {
  background: #fff;
  border-radius: 12px;
  padding: 40px;
  width: 100%;
  max-width: 480px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.3);
}
.card-header {
  text-align: center;
  margin-bottom: 32px;
}
.logo-icon {
  font-size: 48px;
  color: #8b6914;
  margin-bottom: 8px;
}
.card-header h1 {
  font-size: 24px;
  color: #1a1a1a;
  margin-bottom: 4px;
}
.card-header p {
  color: #888;
  font-size: 14px;
}
.bazi-form { margin-top: 8px; }
.lunar-hint { margin-bottom: 16px; }
.quick-examples {
  margin-top: 16px;
  text-align: center;
  color: #888;
  font-size: 13px;
}
.examples-label { margin-right: 8px; }
</style>
