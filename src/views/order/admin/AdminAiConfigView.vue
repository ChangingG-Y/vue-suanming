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
        <van-radio-group v-model="form.provider" direction="horizontal" style="margin-top:10px;gap:16px;">
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
        <div class="config-label">模型 ID</div>
        <input
          v-model="form.model"
          placeholder="如：doubao-seed-2-0-lite-260428"
          class="config-input"
          style="margin-top:10px;"
        />
        <div style="font-size:11px;color:#aeaeb2;margin-top:4px;">
          豆包推荐：doubao-seed-2-0-lite-260428 &nbsp;|&nbsp; DeepSeek推荐：deepseek-chat
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
          发送一道示例菜品测试当前配置是否正常工作
        </div>
        <button
          class="btn-test"
          :disabled="testing"
          @click="testAi"
        >
          {{ testing ? '测试中...' : '🧪 发送测试请求' }}
        </button>
        <div v-if="testResult" style="margin-top:10px;background:#f2f2f7;border-radius:10px;padding:10px 12px;font-size:13px;color:#1c1c1e;line-height:1.6;">
          {{ testResult }}
        </div>
        <div v-if="testError" style="margin-top:10px;font-size:13px;color:#e53935;">
          ❌ {{ testError }}
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { getAiConfig, updateAiConfig, getCalorieAdvice } from '../../../api/orderApi.js'
import { showToast } from 'vant'

const loading = ref(true)
const saving = ref(false)
const testing = ref(false)
const testResult = ref('')
const testError = ref('')

const form = ref({
  enabled: '1',
  provider: 'doubao',
  model: 'doubao-seed-2-0-lite-260428',
  prompt: ''
})

const aiEnabledBool = computed({
  get: () => form.value.enabled === '1',
  set: (v) => { form.value.enabled = v ? '1' : '0' }
})

function onToggleEnabled(val) {
  form.value.enabled = val ? '1' : '0'
}

onMounted(async () => {
  try {
    const config = await getAiConfig()
    if (config) {
      form.value.enabled = config.enabled ?? '1'
      form.value.provider = config.provider ?? 'doubao'
      form.value.model = config.model ?? 'doubao-seed-2-0-lite-260428'
      form.value.prompt = config.prompt ?? ''
    }
  } catch (e) {
    showToast({ message: '加载配置失败：' + e.message, type: 'fail' })
  } finally {
    loading.value = false
  }
})

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
  testing.value = true
  testResult.value = ''
  testError.value = ''
  try {
    const result = await getCalorieAdvice([
      { dishId: 0, dishName: '红烧肉', quantity: 1, remark: '' },
      { dishId: 0, dishName: '白米饭', quantity: 1, remark: '' }
    ])
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
</style>
