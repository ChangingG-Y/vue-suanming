<template>
  <div class="ai-assistant">
    <el-tooltip content="AI 助手" placement="left">
      <button class="ai-fab" :class="{ authed: loggedIn }" type="button" @click="openDrawer">
        <el-icon><ChatDotRound /></el-icon>
      </button>
    </el-tooltip>

    <el-drawer
      v-model="drawerVisible"
      :size="drawerSize"
      direction="rtl"
      class="ai-drawer"
      :with-header="false"
      @opened="onOpened"
    >
      <div class="ai-panel">
        <header class="ai-header">
          <div>
            <div class="ai-title">AI 助手</div>
            <div class="ai-subtitle">{{ loggedIn ? '已自动带入当前命盘' : '登录后可使用命盘问答' }}</div>
          </div>
          <button class="icon-button" type="button" @click="drawerVisible = false" aria-label="关闭">
            <el-icon><Close /></el-icon>
          </button>
        </header>

        <section v-if="!loggedIn" class="login-box">
          <el-form :model="loginForm" label-position="top">
            <el-form-item label="账号">
              <el-input v-model="loginForm.username" placeholder="请输入账号" autocomplete="username" />
            </el-form-item>
            <el-form-item label="密码">
              <el-input
                v-model="loginForm.password"
                placeholder="请输入密码"
                type="password"
                autocomplete="current-password"
                show-password
                @keyup.enter="handleLogin"
              />
            </el-form-item>
            <el-button type="primary" :loading="loginLoading" class="full-button" @click="handleLogin">
              <el-icon><Lock /></el-icon>
              登录 AI 助手
            </el-button>
          </el-form>
        </section>

        <template v-else>
          <section class="ai-options">
            <el-form label-position="top" size="small">
              <el-form-item label="模型">
                <el-select v-model="aiOptions.model" class="option-control">
                  <el-option label="V4 Pro" value="deepseek-v4-pro" />
                  <el-option label="V4 Flash" value="deepseek-v4-flash" />
                </el-select>
              </el-form-item>
              <div class="option-row">
                <div class="option-label">思考模式</div>
                <el-switch v-model="aiOptions.thinkingEnabled" />
              </div>
              <el-form-item label="思考强度">
                <el-segmented
                  v-model="aiOptions.reasoningEffort"
                  :options="reasoningOptions"
                  :disabled="!aiOptions.thinkingEnabled"
                  class="option-control"
                />
              </el-form-item>
              <el-form-item label="角色">
                <div class="role-row">
                  <el-select v-model="currentRoleId" class="role-select">
                    <el-option v-for="role in roles" :key="role.id" :label="role.name" :value="role.id" />
                  </el-select>
                  <el-button @click="openRoleEditor">配置角色</el-button>
                  <el-button @click="createRole">新建</el-button>
                </div>
              </el-form-item>
            </el-form>

            <div v-if="roleEditorVisible" class="role-editor">
              <el-input v-model="roleDraft.name" placeholder="角色名称" maxlength="20" />
              <el-input
                v-model="roleDraft.prompt"
                type="textarea"
                :rows="8"
                resize="vertical"
                maxlength="12000"
                show-word-limit
                placeholder="请输入这个角色的系统提示词"
              />
              <div class="role-actions">
                <el-button text @click="resetRolePrompt">恢复默认</el-button>
                <el-button text type="danger" :disabled="roles.length <= 1" @click="deleteCurrentRole">删除角色</el-button>
                <span class="role-action-spacer"></span>
                <el-button @click="roleEditorVisible = false">收起</el-button>
                <el-button type="primary" @click="saveRole">保存</el-button>
              </div>
            </div>
          </section>

          <section ref="messageListRef" class="message-list">
            <div v-if="messages.length === 0" class="empty-state">
              <div class="empty-title">可以直接提问</div>
              <div class="empty-text">当前四柱、大运、流年、神煞等信息会自动发送给 AI。</div>
              <div class="quick-prompts">
                <button v-for="item in quickPrompts" :key="item" type="button" @click="usePrompt(item)">
                  {{ item }}
                </button>
              </div>
            </div>

            <article
              v-for="(message, index) in messages"
              :key="index"
              class="chat-message"
              :class="message.role"
            >
              <div class="message-role">{{ message.role === 'user' ? '我' : 'AI' }}</div>
              <div class="message-content">{{ message.content }}</div>
            </article>

            <article v-if="chatLoading" class="chat-message assistant">
              <div class="message-role">AI</div>
              <div class="message-content loading-text">正在分析命盘...</div>
            </article>
          </section>

          <footer class="chat-input">
            <el-input
              v-model="question"
              type="textarea"
              :rows="3"
              resize="none"
              maxlength="1000"
              show-word-limit
              placeholder="比如：帮我看今年事业和财运重点"
              @keydown.enter.exact.prevent="handleSend"
            />
            <div class="chat-actions">
              <el-button text @click="logout">退出登录</el-button>
              <el-button v-if="chatLoading" type="danger" plain @click="interruptChat">
                <el-icon><Close /></el-icon>
                中断
              </el-button>
              <el-button v-else type="primary" @click="handleSend">
                <el-icon><Promotion /></el-icon>
                发送
              </el-button>
            </div>
          </footer>
        </template>
      </div>
    </el-drawer>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { ChatDotRound, Close, Lock, Promotion } from '@element-plus/icons-vue'
import { buildBaziPayload } from '../../utils/baziPayload.js'
import { checkAiSession, clearAiToken, getAiToken, loginAi, sendAiChat } from '../../api/ai.js'

const props = defineProps({
  data: { type: Object, required: true },
  form: { type: Object, required: true }
})

const drawerVisible = ref(false)
const loggedIn = ref(Boolean(getAiToken()))
const loginLoading = ref(false)
const chatLoading = ref(false)
const question = ref('')
const messageListRef = ref(null)
const messages = ref([])
const viewportWidth = ref(typeof window === 'undefined' ? 1024 : window.innerWidth)
const activeAbortController = ref(null)
const roles = ref([])
const currentRoleId = ref('')
const roleEditorVisible = ref(false)

const loginForm = reactive({
  username: '小新',
  password: ''
})

const aiOptions = reactive({
  model: 'deepseek-v4-flash',
  thinkingEnabled: false,
  reasoningEffort: 'high'
})

const reasoningOptions = [
  { label: 'High', value: 'high' },
  { label: 'Max', value: 'max' }
]

const ROLE_STORAGE_KEY = 'suanming_ai_roles'
const DEFAULT_ROLE_PROMPT = `你是一个专业、克制、结构清晰的八字命理分析助手。
用户已经在前端完成排盘，后端会把完整八字上下文随问题一起给你。你不要要求用户重复输入出生年月日时。

回答规则：
1. 先基于四柱、日主、月令、十神、藏干、旺衰、大运流年做命理判断。
2. 再针对用户问题给出具体分析，优先引用排盘中的字段作为依据。
3. 表达要清晰直接，但不要恐吓、绝对化或宣称必然发生。
4. 对不确定的地方要说明“倾向”“可能”“需要结合现实选择”。
5. 回答使用中文，结构建议为：整体判断、关键依据、当前阶段、大运流年、可执行建议。`

const roleDraft = reactive({
  id: '',
  name: '',
  prompt: ''
})

const quickPrompts = [
  '帮我看今年事业重点',
  '这步大运对财运怎么样',
  '感情婚姻有什么需要注意'
]

const drawerSize = computed(() => (viewportWidth.value <= 640 ? '100%' : '440px'))
const currentRole = computed(() => roles.value.find(role => role.id === currentRoleId.value) || roles.value[0])

onMounted(() => {
  window.addEventListener('resize', updateViewportWidth)
  initRoles()
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', updateViewportWidth)
})

function updateViewportWidth() {
  viewportWidth.value = window.innerWidth
}

function openDrawer() {
  drawerVisible.value = true
}

async function onOpened() {
  if (!getAiToken()) {
    loggedIn.value = false
    return
  }
  try {
    await checkAiSession()
    loggedIn.value = true
  } catch (error) {
    loggedIn.value = false
  }
}

async function handleLogin() {
  if (!loginForm.username || !loginForm.password) {
    ElMessage.warning('请输入账号和密码')
    return
  }
  loginLoading.value = true
  try {
    await loginAi(loginForm.username, loginForm.password)
    loggedIn.value = true
    loginForm.password = ''
    ElMessage.success('登录成功')
  } catch (error) {
    ElMessage.error(error.message)
  } finally {
    loginLoading.value = false
  }
}

function usePrompt(text) {
  question.value = text
}

async function handleSend() {
  const content = question.value.trim()
  if (!content || chatLoading.value) return

  const history = messages.value.map(item => ({
    role: item.role,
    content: item.content
  }))

  messages.value.push({ role: 'user', content })
  question.value = ''
  chatLoading.value = true
  const controller = new AbortController()
  activeAbortController.value = controller
  await scrollToBottom()

  try {
    const result = await sendAiChat({
      question: content,
      baziContext: buildBaziPayload(props.form, props.data),
      history,
      model: aiOptions.model,
      thinkingEnabled: aiOptions.thinkingEnabled,
      reasoningEffort: aiOptions.reasoningEffort,
      systemPrompt: currentRole.value?.prompt || DEFAULT_ROLE_PROMPT,
      signal: controller.signal
    })
    messages.value.push({ role: 'assistant', content: result.answer })
  } catch (error) {
    if (controller.signal.aborted) {
      messages.value.push({ role: 'assistant', content: '已中断本次回答。' })
      return
    }
    if (!getAiToken()) loggedIn.value = false
    messages.value.push({ role: 'assistant', content: `请求失败：${error.message}` })
  } finally {
    if (activeAbortController.value === controller) {
      activeAbortController.value = null
    }
    chatLoading.value = false
    await scrollToBottom()
  }
}

function interruptChat() {
  if (activeAbortController.value) {
    activeAbortController.value.abort()
  }
}

function logout() {
  interruptChat()
  clearAiToken()
  loggedIn.value = false
  messages.value = []
}

function initRoles() {
  const cachedRoles = readRoles()
  roles.value = cachedRoles.length ? cachedRoles : [defaultRole()]
  currentRoleId.value = roles.value[0].id
}

function openRoleEditor() {
  const role = currentRole.value || defaultRole()
  roleDraft.id = role.id
  roleDraft.name = role.name
  roleDraft.prompt = role.prompt
  roleEditorVisible.value = true
}

function createRole() {
  const role = {
    id: createId(),
    name: '新角色',
    prompt: DEFAULT_ROLE_PROMPT
  }
  roles.value = [role, ...roles.value]
  currentRoleId.value = role.id
  persistRoles()
  openRoleEditor()
}

function saveRole() {
  const name = roleDraft.name.trim()
  const prompt = roleDraft.prompt.trim()
  if (!name) {
    ElMessage.warning('请输入角色名称')
    return
  }
  if (!prompt) {
    ElMessage.warning('请输入角色提示词')
    return
  }
  roles.value = roles.value.map(role => {
    if (role.id !== roleDraft.id) return role
    return { ...role, name, prompt }
  })
  currentRoleId.value = roleDraft.id
  persistRoles()
  roleEditorVisible.value = false
}

function deleteCurrentRole() {
  if (roles.value.length <= 1) return
  roles.value = roles.value.filter(role => role.id !== roleDraft.id)
  currentRoleId.value = roles.value[0].id
  persistRoles()
  roleEditorVisible.value = false
}

function resetRolePrompt() {
  roleDraft.prompt = DEFAULT_ROLE_PROMPT
}

function readRoles() {
  try {
    const raw = localStorage.getItem(ROLE_STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed)
      ? parsed.filter(role => role?.id && role?.name && role?.prompt)
      : []
  } catch (error) {
    return []
  }
}

function persistRoles() {
  localStorage.setItem(ROLE_STORAGE_KEY, JSON.stringify(roles.value))
}

function defaultRole() {
  return {
    id: 'default-bazi-master',
    name: '八字命理助手',
    prompt: DEFAULT_ROLE_PROMPT
  }
}

function createId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID()
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

async function scrollToBottom() {
  await nextTick()
  if (messageListRef.value) {
    messageListRef.value.scrollTop = messageListRef.value.scrollHeight
  }
}
</script>

<style scoped>
.ai-fab {
  position: fixed;
  right: 22px;
  bottom: 22px;
  z-index: 20;
  width: 52px;
  height: 52px;
  border: 0;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  background: #202124;
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.22);
  cursor: pointer;
  transition: transform 0.2s ease, background 0.2s ease;
}

.ai-fab:hover { transform: translateY(-2px); }
.ai-fab.authed { background: #8b6914; }
.ai-fab .el-icon { font-size: 24px; }

.ai-panel {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #f7f4ec;
}

.ai-header {
  height: 68px;
  padding: 14px 16px;
  background: #1f1f1f;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.ai-title { font-size: 17px; font-weight: 700; color: #d4ae46; }
.ai-subtitle { font-size: 12px; color: #cfcfcf; margin-top: 4px; }

.icon-button {
  width: 34px;
  height: 34px;
  border: 0;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.08);
  color: #fff;
  cursor: pointer;
}

.login-box { padding: 18px; }
.full-button { width: 100%; }

.ai-options {
  padding: 12px 14px 10px;
  border-bottom: 1px solid #e5dcc8;
  background: #fffdf7;
}

.ai-options :deep(.el-form-item) {
  margin-bottom: 10px;
}

.option-control {
  width: 100%;
}

.option-row {
  min-height: 32px;
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.option-label {
  font-size: 12px;
  color: #606266;
  line-height: 1;
}

.role-row {
  width: 100%;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto auto;
  gap: 8px;
}

.role-select {
  width: 100%;
}

.role-editor {
  display: grid;
  gap: 10px;
  padding: 12px;
  border: 1px solid #eadfc7;
  border-radius: 8px;
  background: #fffaf0;
}

.role-actions {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.role-action-spacer {
  flex: 1;
}

.message-list {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.empty-state {
  padding: 18px;
  border: 1px solid #e2d6ba;
  border-radius: 8px;
  background: #fffaf0;
}

.empty-title { font-weight: 700; color: #2b2b2b; }
.empty-text { margin-top: 6px; font-size: 13px; line-height: 1.6; color: #6f6655; }

.quick-prompts {
  margin-top: 12px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.quick-prompts button {
  border: 1px solid #d7c493;
  background: #fff;
  color: #6f5310;
  border-radius: 999px;
  padding: 7px 10px;
  cursor: pointer;
}

.chat-message {
  margin-bottom: 14px;
  display: flex;
  gap: 8px;
}

.chat-message.user { flex-direction: row-reverse; }

.message-role {
  flex: 0 0 30px;
  height: 30px;
  border-radius: 50%;
  background: #1f1f1f;
  color: #d4ae46;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
}

.chat-message.user .message-role {
  background: #8b6914;
  color: #fff;
}

.message-content {
  max-width: calc(100% - 48px);
  white-space: pre-wrap;
  word-break: break-word;
  line-height: 1.7;
  font-size: 14px;
  color: #2b2b2b;
  background: #fff;
  border: 1px solid #eee3ca;
  border-radius: 8px;
  padding: 10px 12px;
}

.chat-message.user .message-content {
  color: #fff;
  background: #8b6914;
  border-color: #8b6914;
}

.loading-text { color: #80642a; }

.chat-input {
  padding: 12px;
  border-top: 1px solid #e5dcc8;
  background: #fff;
}

.chat-actions {
  margin-top: 10px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

@media (max-width: 640px) {
  .ai-fab {
    right: 16px;
    bottom: 16px;
    width: 50px;
    height: 50px;
  }
}
</style>
