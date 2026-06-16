<template>
  <div style="padding:16px;max-width:640px;margin:0 auto;">
    <div style="font-size:16px;font-weight:700;color:#1c1c1e;margin-bottom:16px;">🤖 AI 点餐助手配置</div>

    <div v-if="loading" style="text-align:center;padding:60px;color:#aeaeb2;">
      <van-loading color="#c96b7e" size="32px" />
      <p style="margin-top:12px;font-size:14px;">加载中...</p>
    </div>

    <template v-else>
      <!-- 开启/关闭 -->
      <div class="config-card">
        <div class="config-label">AI 营养建议</div>
        <div style="display:flex;align-items:center;justify-content:space-between;margin-top:10px;">
          <span style="font-size:14px;color:#6d6d72;">
            {{ form.enabled === '1' ? '✅ 已开启，结算时自动分析热量' : '❌ 已关闭，结算不显示AI建议' }}
          </span>
          <van-switch v-model="aiEnabledBool" active-color="#c96b7e" @change="onToggleEnabled" />
        </div>
      </div>

      <!-- 提供商 -->
      <div class="config-card">
        <div class="config-label">AI 提供商</div>
        <van-radio-group v-model="form.provider" direction="horizontal" style="margin-top:10px;gap:16px;" @change="onProviderChange">
          <van-radio name="doubao" checked-color="#c96b7e">
            <span style="font-size:14px;color:#1c1c1e;">豆包（火山引擎）</span>
          </van-radio>
          <van-radio name="deepseek" checked-color="#c96b7e">
            <span style="font-size:14px;color:#1c1c1e;">DeepSeek</span>
          </van-radio>
        </van-radio-group>
      </div>

      <!-- 模型 -->
      <div class="config-card">
        <div class="config-label">模型</div>
        <select
          v-model="form.model"
          class="config-input"
          style="margin-top:10px;cursor:pointer;"
        >
          <option v-for="m in currentModelOptions" :key="m.value" :value="m.value">
            {{ m.label }}
          </option>
        </select>
        <div style="font-size:11px;color:#aeaeb2;margin-top:6px;">
          {{ form.provider === 'doubao' ? 'lite 速度最快、cost 最低；pro 效果最佳' : 'flash 速度快；pro 效果更佳' }}
        </div>
      </div>

      <!-- 提示词 -->
      <div class="config-card">
        <div class="config-label">系统提示词</div>
        <textarea
          v-model="form.prompt"
          placeholder="支持 {菜单} 占位符，会被替换为实际菜品列表"
          class="config-input"
          style="margin-top:10px;height:140px;resize:vertical;line-height:1.6;font-size:13px;"
        />
        <div style="font-size:11px;color:#aeaeb2;margin-top:4px;">
          提示：用 <code style="background:#f2f2f7;padding:1px 4px;border-radius:3px;color:#1c1c1e;">{菜单}</code> 表示菜品列表占位符，AI回复建议控制在80字以内
        </div>
      </div>

      <!-- API Keys -->
      <div class="config-card">
        <div class="config-label">API Keys</div>
        <div style="margin-top:10px;">
          <div style="font-size:12px;color:#6d6d72;font-weight:600;margin-bottom:5px;">豆包 / 火山引擎</div>
          <input
            v-model="form.doubaoApiKey"
            type="password"
            placeholder="留空则使用服务器配置文件"
            class="config-input"
            autocomplete="new-password"
          />
        </div>
        <div style="margin-top:12px;">
          <div style="font-size:12px;color:#6d6d72;font-weight:600;margin-bottom:5px;">DeepSeek</div>
          <input
            v-model="form.deepseekApiKey"
            type="password"
            placeholder="留空则使用服务器配置文件"
            class="config-input"
            autocomplete="new-password"
          />
        </div>
        <div style="font-size:11px;color:#aeaeb2;margin-top:8px;">
          数据库中的Key优先级高于服务器配置文件，每个租户可独立配置
        </div>
      </div>

      <!-- 保存 -->
      <button
        class="btn-save"
        :disabled="saving"
        @click="save"
      >
        {{ saving ? '保存中...' : '💾 保存配置' }}
      </button>

      <!-- 测试 AI -->
      <div class="config-card" style="margin-top:16px;">
        <div class="config-label">测试AI连通性</div>
        <div style="font-size:12px;color:#aeaeb2;margin-top:4px;margin-bottom:10px;">
          选好菜后发送，测试当前AI配置是否正常
        </div>

        <!-- 已选菜品预览 -->
        <div v-if="testCart.length > 0" style="margin-bottom:10px;background:#f2f2f7;border-radius:10px;padding:8px 10px;">
          <div v-for="item in testCart" :key="item.dishId" style="display:flex;justify-content:space-between;font-size:13px;color:#1c1c1e;padding:2px 0;">
            <span>{{ item.dishName }}</span>
            <span style="color:#aeaeb2;">× {{ item.quantity }}</span>
          </div>
        </div>

        <div style="display:flex;gap:8px;flex-wrap:wrap;">
          <button class="btn-test" @click="showTestPicker = true">🍽️ 选菜</button>
          <button
            class="btn-test"
            :disabled="testing || testCart.length === 0"
            @click="testAi"
          >
            {{ testing ? '测试中...' : '🧪 发送测试' }}
          </button>
          <button v-if="testCart.length > 0" class="btn-clear" @click="testCart = []">清空</button>
        </div>

        <div v-if="testResult" style="margin-top:10px;background:#f2f2f7;border-radius:10px;padding:10px 12px;font-size:13px;color:#1c1c1e;line-height:1.6;">
          {{ testResult }}
        </div>
        <div v-if="testError" style="margin-top:10px;font-size:13px;color:#e53935;">
          ❌ {{ testError }}
        </div>
      </div>

      <!-- 选菜 popup -->
      <van-popup v-model:show="showTestPicker" position="bottom" round :style="{ height: '70vh', display:'flex', flexDirection:'column' }">
        <div style="padding:14px 16px 8px;font-size:15px;font-weight:700;color:#1c1c1e;flex-shrink:0;">选菜测试</div>
        <van-tabs v-model:active="testCatIdx" color="#c96b7e" title-active-color="#c96b7e" style="flex-shrink:0;" @change="onTestCatChange">
          <van-tab v-for="cat in testCategories" :key="cat.id" :title="cat.name" />
        </van-tabs>
        <div style="flex:1;overflow-y:auto;padding:8px 12px;">
          <div v-if="testDishLoading" style="text-align:center;padding:30px;">
            <van-loading color="#c96b7e" />
          </div>
          <div v-else v-for="dish in testDishes" :key="dish.id"
            style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid #f2f2f7;"
          >
            <span style="font-size:14px;color:#1c1c1e;">{{ dish.name }}</span>
            <div style="display:flex;align-items:center;gap:8px;">
              <button v-if="getTestQty(dish.id) > 0" class="qty-btn" @click="removeTestDish(dish.id)">−</button>
              <span v-if="getTestQty(dish.id) > 0" style="font-size:14px;font-weight:600;color:#c96b7e;min-width:16px;text-align:center;">{{ getTestQty(dish.id) }}</span>
              <button class="qty-btn" @click="addTestDish(dish)">＋</button>
            </div>
          </div>
        </div>
        <div style="padding:12px 16px;flex-shrink:0;">
          <button class="btn-save" @click="showTestPicker = false" style="margin-top:0;">
            确定（已选 {{ testCart.reduce((s,i)=>s+i.quantity,0) }} 份）
          </button>
        </div>
      </van-popup>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { getAiConfig, updateAiConfig, getCalorieAdvice } from '../../../api/orderApi.js'
import { getAdminCategories, getAdminDishes } from '../../../api/orderAdmin.js'
import { showToast } from 'vant'

const loading = ref(true)
const saving = ref(false)
const testing = ref(false)
const testResult = ref('')
const testError = ref('')

// test dish picker
const showTestPicker = ref(false)
const testCategories = ref([])
const testDishes = ref([])
const testCatIdx = ref(0)
const testDishLoading = ref(false)
const testCart = ref([])

// 各 provider 对应的模型选项（与后端 application.yml allowed-models 保持一致）
const MODEL_OPTIONS = {
  doubao: [
    { value: 'doubao-seed-2-0-lite-260428',  label: 'Seed-2.0 Lite · 速度最快 ⚡' },
    { value: 'doubao-seed-2-0-mini-260428',  label: 'Seed-2.0 Mini · 均衡' },
    { value: 'doubao-seed-2-0-pro-260215',   label: 'Seed-2.0 Pro · 效果最佳 ✨' },
  ],
  deepseek: [
    { value: 'deepseek-v4-flash', label: 'DeepSeek V4 Flash · 速度快 ⚡' },
    { value: 'deepseek-v4-pro',   label: 'DeepSeek V4 Pro · 效果最佳 ✨' },
  ],
}

const form = ref({
  enabled: '1',
  provider: 'doubao',
  model: 'doubao-seed-2-0-lite-260428',
  prompt: '',
  doubaoApiKey: '',
  deepseekApiKey: ''
})

const currentModelOptions = computed(() => MODEL_OPTIONS[form.value.provider] || [])

function onProviderChange(provider) {
  // 切换 provider 时自动选中该 provider 的第一个模型
  const opts = MODEL_OPTIONS[provider]
  if (opts && opts.length > 0) {
    form.value.model = opts[0].value
  }
}

const aiEnabledBool = computed({
  get: () => form.value.enabled === '1',
  set: (v) => { form.value.enabled = v ? '1' : '0' }
})

function onToggleEnabled(val) {
  form.value.enabled = val ? '1' : '0'
}

onMounted(async () => {
  try {
    const [config, cats] = await Promise.all([getAiConfig(), getAdminCategories()])
    if (config) {
      form.value.enabled = config.enabled ?? '1'
      form.value.provider = config.provider ?? 'doubao'
      form.value.model = config.model ?? 'doubao-seed-2-0-lite-260428'
      form.value.prompt = config.prompt ?? ''
      form.value.doubaoApiKey = config.doubaoApiKey ?? ''
      form.value.deepseekApiKey = config.deepseekApiKey ?? ''
    }
    testCategories.value = cats || []
    if (testCategories.value.length > 0) {
      await loadTestDishes(testCategories.value[0].id)
    }
  } catch (e) {
    showToast({ message: '加载失败：' + e.message, type: 'fail' })
  } finally {
    loading.value = false
  }
})

async function loadTestDishes(categoryId) {
  testDishLoading.value = true
  try {
    testDishes.value = (await getAdminDishes(categoryId) || []).filter(d => d.available !== false)
  } catch {
    testDishes.value = []
  } finally {
    testDishLoading.value = false
  }
}

async function onTestCatChange(idx) {
  const cat = testCategories.value[idx]
  if (cat) await loadTestDishes(cat.id)
}

function getTestQty(dishId) {
  return testCart.value.find(i => i.dishId === dishId)?.quantity || 0
}

function addTestDish(dish) {
  const exist = testCart.value.find(i => i.dishId === dish.id)
  if (exist) exist.quantity++
  else testCart.value.push({ dishId: dish.id, dishName: dish.name, quantity: 1, remark: '' })
}

function removeTestDish(dishId) {
  const idx = testCart.value.findIndex(i => i.dishId === dishId)
  if (idx === -1) return
  if (testCart.value[idx].quantity > 1) testCart.value[idx].quantity--
  else testCart.value.splice(idx, 1)
}

async function save() {
  saving.value = true
  try {
    await updateAiConfig(form.value)
    showToast({ message: '配置已保存 ✅', type: 'success' })
  } catch (e) {
    showToast({ message: '保存失败：' + e.message, type: 'fail' })
  } finally {
    saving.value = false
  }
}

async function testAi() {
  if (testCart.value.length === 0) {
    showToast('请先选择菜品')
    return
  }
  testing.value = true
  testResult.value = ''
  testError.value = ''
  try {
    const result = await getCalorieAdvice(testCart.value)
    if (result?.enabled === false) {
      testError.value = 'AI 功能当前处于关闭状态'
    } else {
      testResult.value = result?.advice || '（AI返回为空）'
    }
  } catch (e) {
    testError.value = e.message
  } finally {
    testing.value = false
  }
}
</script>

<style scoped>
.config-card {
  background: #ffffff;
  border-radius: 14px;
  padding: 14px 16px;
  margin-bottom: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
}

.config-label {
  font-size: 14px;
  font-weight: 700;
  color: #1c1c1e;
}

.config-input {
  width: 100%;
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid #e5e5ea;
  font-size: 14px;
  outline: none;
  box-sizing: border-box;
  color: #1c1c1e;
  background: #ffffff;
  font-family: inherit;
  transition: border-color 0.2s;
}

.config-input:focus {
  border-color: #c96b7e;
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
  letter-spacing: 0.3px;
  cursor: pointer;
  margin-top: 4px;
}

.btn-save:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-test {
  background: transparent;
  color: #c96b7e;
  border: 1.5px solid #c96b7e;
  border-radius: 20px;
  padding: 9px 20px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}

.btn-test:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-clear {
  background: transparent;
  color: #aeaeb2;
  border: 1.5px solid #e5e5ea;
  border-radius: 20px;
  padding: 9px 14px;
  font-size: 13px;
  cursor: pointer;
}

.qty-btn {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 1.5px solid #c96b7e;
  background: #fff;
  color: #c96b7e;
  font-size: 16px;
  line-height: 1;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
