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
            <div class="ai-title">胡桃大师</div>
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
          <!-- 可折叠设置区 -->
          <section class="ai-options">
            <button class="options-toggle" type="button" @click="optionsCollapsed = !optionsCollapsed">
              <span class="options-toggle-label">模型 · 角色设置</span>
              <svg
                class="options-chevron"
                :class="{ collapsed: optionsCollapsed }"
                width="14" height="14" viewBox="0 0 14 14" fill="none"
              >
                <path d="M3 5l4 4 4-4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>

            <div v-show="!optionsCollapsed" class="options-body">
              <el-form label-position="top" size="small">
                <el-form-item label="模型">
                  <div class="provider-model-row">
                    <el-segmented v-model="aiOptions.provider" :options="providerOptions" class="provider-control" />
                    <el-select v-model="aiOptions.model" class="option-control">
                      <el-option
                        v-for="model in currentModelOptions"
                        :key="model.value"
                        :label="model.label"
                        :value="model.value"
                      />
                    </el-select>
                  </div>
                  <div class="model-hint">{{ currentModelDescription }}</div>
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
                    <el-button @click="openRoleEditor">配置</el-button>
                    <el-button @click="createRole">新建</el-button>
                  </div>
                </el-form-item>
              </el-form>

              <div v-if="roleEditorVisible" class="role-editor">
                <el-input v-model="roleDraft.name" placeholder="角色名称" maxlength="20" />
                <el-input
                  v-model="roleDraft.prompt"
                  type="textarea"
                  :rows="6"
                  resize="vertical"
                  maxlength="12000"
                  show-word-limit
                  placeholder="请输入这个角色的系统提示词"
                />
                <div class="role-actions">
                  <el-button text @click="resetRolePrompt">恢复默认</el-button>
                  <el-button text type="danger" :disabled="roles.length <= 1" @click="deleteCurrentRole">删除</el-button>
                  <span class="role-action-spacer"></span>
                  <el-button @click="roleEditorVisible = false">收起</el-button>
                  <el-button type="primary" @click="saveRole">保存</el-button>
                </div>
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

            <article v-for="(message, index) in messages" :key="index" class="chat-message" :class="message.role">
              <div class="message-role">{{ message.role === 'user' ? '我' : 'AI' }}</div>
              <!-- 用户消息 -->
              <div v-if="message.role === 'user'" class="message-content">{{ message.content }}</div>
              <!-- AI 消息：含操作按钮 -->
              <div v-else class="message-wrap">
                <div class="message-content markdown-body" v-html="renderMarkdown(message.content)"></div>
                <div class="msg-actions">
                  <button class="msg-action-btn" type="button" @click="copyMessage(message.content)">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                      <rect x="9" y="9" width="13" height="13" rx="2"/>
                      <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
                    </svg>
                    复制
                  </button>
                  <button class="msg-action-btn" type="button" @click="expandMessage(message.content)">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                      <polyline points="15 3 21 3 21 9"/>
                      <polyline points="9 21 3 21 3 15"/>
                      <line x1="21" y1="3" x2="14" y2="10"/>
                      <line x1="3" y1="21" x2="10" y2="14"/>
                    </svg>
                    展开
                  </button>
                </div>
              </div>
            </article>

            <article v-if="chatLoading" class="chat-message assistant">
              <div class="message-role">AI</div>
              <div class="message-content loading-dots">
                <span></span><span></span><span></span>
              </div>
            </article>
          </section>

          <footer class="chat-input">
            <el-input
              v-model="question"
              type="textarea"
              :rows="isMobile ? 2 : 3"
              resize="none"
              maxlength="1000"
              show-word-limit
              placeholder="比如：帮我看今年事业和财运重点"
              @keydown.enter.exact.prevent="handleSend"
            />
            <div class="chat-actions">
              <el-button text @click="logout">退出</el-button>
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

    <!-- 放大阅读弹层 -->
    <teleport to="body">
      <transition name="expand-fade">
        <div v-if="expandVisible" class="expand-overlay" @click.self="expandVisible = false">
          <div class="expand-panel">
            <div class="expand-header">
              <span class="expand-title">AI 回答</span>
              <div class="expand-header-actions">
                <button class="expand-action-btn" type="button" @click="copyMessage(expandContent)">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="9" y="9" width="13" height="13" rx="2"/>
                    <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
                  </svg>
                  复制全文
                </button>
                <button class="expand-close-btn" type="button" @click="expandVisible = false" aria-label="关闭">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>
            </div>
            <div class="expand-body markdown-body" v-html="renderMarkdown(expandContent)"></div>
          </div>
        </div>
      </transition>
    </teleport>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { ChatDotRound, Close, Lock, Promotion } from '@element-plus/icons-vue'
import MarkdownIt from 'markdown-it'
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
const expandVisible = ref(false)
const expandContent = ref('')
const optionsCollapsed = ref(typeof window === 'undefined' ? false : window.innerWidth <= 640)

const loginForm = reactive({ username: '小新', password: '' })

const aiOptions = reactive({
  provider: 'deepseek',
  model: 'deepseek-v4-flash',
  thinkingEnabled: false,
  reasoningEffort: 'high'
})

const providerOptions = [
  { label: 'DeepSeek', value: 'deepseek' },
  { label: '豆包', value: 'doubao' }
]

const modelOptions = {
  deepseek: [
    { label: 'DeepSeek · V4 Flash', value: 'deepseek-v4-flash', desc: '速度优先，适合日常快速问盘。' },
    { label: 'DeepSeek · V4 Pro', value: 'deepseek-v4-pro', desc: '质量优先，适合复杂大运流年分析。' }
  ],
  doubao: [
    { label: '豆包 · Seed 2.0 Mini', value: 'doubao-seed-2-0-mini-260428', desc: '轻量低成本，适合快速问答。' },
    { label: '豆包 · Seed 2.0 Pro', value: 'doubao-seed-2-0-pro-260215', desc: '旗舰通用模型，适合复杂分析。' },
    { label: '豆包 · Seed 2.0 Lite', value: 'doubao-seed-2-0-lite-260428', desc: '均衡模型，适合稳定长文本回答。' }
  ]
}

const reasoningOptions = [
  { label: 'High', value: 'high' },
  { label: 'Max', value: 'max' }
]

const markdown = new MarkdownIt({ html: false, linkify: true, breaks: true })

const ROLE_STORAGE_KEY = 'suanming_ai_roles'
const DEFAULT_ROLE_PROMPT = `你是一个专业、克制、结构清晰的八字命理分析助手。
用户已经在前端完成排盘，后端会把完整八字上下文随问题一起给你。你不要要求用户重复输入出生年月日时。

回答规则：
1. 先基于四柱、日主、月令、十神、藏干、旺衰、大运流年做命理判断。
2. 再针对用户问题给出具体分析，优先引用排盘中的字段作为依据。
3. 表达要清晰直接，但不要恐吓、绝对化或宣称必然发生。
4. 对不确定的地方要说明"倾向""可能""需要结合现实选择"。
5. 回答使用中文，结构建议为：整体判断、关键依据、当前阶段、大运流年、可执行建议。`

const roleDraft = reactive({ id: '', name: '', prompt: '' })

const quickPrompts = ['帮我看今年事业重点', '这步大运对财运怎么样', '感情婚姻有什么需要注意']

const isMobile = computed(() => viewportWidth.value <= 640)
const drawerSize = computed(() => (isMobile.value ? '100%' : '560px'))
const currentRole = computed(() => roles.value.find(role => role.id === currentRoleId.value) || roles.value[0])
const currentModelOptions = computed(() => modelOptions[aiOptions.provider] || modelOptions.deepseek)
const currentModelDescription = computed(() => currentModelOptions.value.find(item => item.value === aiOptions.model)?.desc || '')

watch(() => aiOptions.provider, provider => {
  const options = modelOptions[provider] || modelOptions.deepseek
  if (!options.some(item => item.value === aiOptions.model)) {
    aiOptions.model = options[0].value
  }
})

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

function openDrawer() { drawerVisible.value = true }

async function onOpened() {
  if (!getAiToken()) { loggedIn.value = false; return }
  try {
    await checkAiSession()
    loggedIn.value = true
  } catch {
    loggedIn.value = false
  }
}

async function handleLogin() {
  if (!loginForm.username || !loginForm.password) {
    ElMessage.warning('请输入账号和密码'); return
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

function usePrompt(text) { question.value = text }
function renderMarkdown(content) { return markdown.render(content || '') }

async function copyMessage(content) {
  try {
    await navigator.clipboard.writeText(content)
    ElMessage({ message: '已复制到剪贴板', type: 'success', duration: 1500, grouping: true })
  } catch {
    ElMessage.error('复制失败，请手动选择文本')
  }
}

function expandMessage(content) {
  expandContent.value = content
  expandVisible.value = true
}

async function handleSend() {
  const content = question.value.trim()
  if (!content || chatLoading.value) return

  const history = messages.value.map(item => ({ role: item.role, content: item.content }))
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
      provider: aiOptions.provider,
      model: aiOptions.model,
      thinkingEnabled: aiOptions.thinkingEnabled,
      reasoningEffort: aiOptions.reasoningEffort,
      systemPrompt: currentRole.value?.prompt || DEFAULT_ROLE_PROMPT,
      signal: controller.signal
    })
    messages.value.push({ role: 'assistant', content: result.answer })
  } catch (error) {
    if (controller.signal.aborted) {
      messages.value.push({ role: 'assistant', content: '已中断本次回答。' }); return
    }
    if (!getAiToken()) loggedIn.value = false
    messages.value.push({ role: 'assistant', content: `请求失败：${error.message}` })
  } finally {
    if (activeAbortController.value === controller) activeAbortController.value = null
    chatLoading.value = false
    await scrollToBottom()
  }
}

function interruptChat() { activeAbortController.value?.abort() }

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
  roleDraft.id = role.id; roleDraft.name = role.name; roleDraft.prompt = role.prompt
  roleEditorVisible.value = true
}

function createRole() {
  const role = { id: createId(), name: '新角色', prompt: DEFAULT_ROLE_PROMPT }
  roles.value = [role, ...roles.value]
  currentRoleId.value = role.id
  persistRoles(); openRoleEditor()
}

function saveRole() {
  const name = roleDraft.name.trim(); const prompt = roleDraft.prompt.trim()
  if (!name) { ElMessage.warning('请输入角色名称'); return }
  if (!prompt) { ElMessage.warning('请输入角色提示词'); return }
  roles.value = roles.value.map(role => role.id !== roleDraft.id ? role : { ...role, name, prompt })
  currentRoleId.value = roleDraft.id
  persistRoles(); roleEditorVisible.value = false
}

function deleteCurrentRole() {
  if (roles.value.length <= 1) return
  roles.value = roles.value.filter(role => role.id !== roleDraft.id)
  currentRoleId.value = roles.value[0].id
  persistRoles(); roleEditorVisible.value = false
}

function resetRolePrompt() { roleDraft.prompt = DEFAULT_ROLE_PROMPT }

function readRoles() {
  try {
    const raw = localStorage.getItem(ROLE_STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed.filter(r => r?.id && r?.name && r?.prompt) : []
  } catch { return [] }
}

function persistRoles() { localStorage.setItem(ROLE_STORAGE_KEY, JSON.stringify(roles.value)) }

function defaultRole() {
  return { id: 'default-bazi-master', name: '八字命理助手', prompt: DEFAULT_ROLE_PROMPT }
}

function createId() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

async function scrollToBottom() {
  await nextTick()
  if (messageListRef.value) messageListRef.value.scrollTop = messageListRef.value.scrollHeight
}
</script>

<style scoped>
/* ── FAB ── */
@keyframes fab-glow {
  0%, 100% { box-shadow: 0 10px 30px rgba(57,40,17,0.4), 0 0 0 0 rgba(193,124,46,0.4); }
  50%       { box-shadow: 0 10px 30px rgba(57,40,17,0.4), 0 0 0 11px rgba(193,124,46,0); }
}

.ai-fab {
  position: fixed;
  right: 22px;
  bottom: 22px;
  z-index: 20;
  width: 56px;
  height: 56px;
  border: 0;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  background: linear-gradient(145deg, #2a1f14, #8a5e1a);
  box-shadow: 0 10px 30px rgba(57, 40, 17, 0.38);
  cursor: pointer;
  transition: transform 0.22s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.22s ease;
}
.ai-fab:hover { transform: translateY(-3px) scale(1.07); box-shadow: 0 18px 44px rgba(57,40,17,0.5), 0 0 0 7px rgba(193,124,46,0.14); }
.ai-fab:active { transform: translateY(-1px) scale(0.96); }
.ai-fab.authed { background: linear-gradient(145deg, #4a2810, #c17c2e); animation: fab-glow 3s ease-in-out infinite; }
.ai-fab.authed:hover { animation: none; box-shadow: 0 18px 44px rgba(57,40,17,0.5), 0 0 0 7px rgba(193,124,46,0.16); }
.ai-fab .el-icon { font-size: 22px; }

/* ── Panel ── */
.ai-panel {
  height: 100%;
  display: flex;
  flex-direction: column;
  background:
    radial-gradient(ellipse at 12% 12%, rgba(185, 118, 42, 0.13) 0%, transparent 52%),
    radial-gradient(ellipse at 88% 82%, rgba(140, 80, 22, 0.1) 0%, transparent 55%),
    #f3e9d9;
  overflow: hidden;
}

/* ── Header ── */
.ai-header {
  padding: 16px 18px 15px;
  background: rgba(14, 9, 5, 0.86);
  backdrop-filter: blur(36px) saturate(2);
  -webkit-backdrop-filter: blur(36px) saturate(2);
  border-bottom: 1px solid rgba(255, 195, 85, 0.1);
  box-shadow: 0 6px 28px rgba(0, 0, 0, 0.2);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
}
.ai-title { font-size: 18px; font-weight: 900; color: #f2c96a; letter-spacing: 0.04em; text-shadow: 0 0 20px rgba(242,201,106,0.3); }
.ai-subtitle { font-size: 12px; color: rgba(220,200,175,0.65); margin-top: 4px; letter-spacing: 0.01em; }

.icon-button {
  width: 34px; height: 34px;
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 50%;
  background: rgba(255,255,255,0.08);
  color: rgba(255,255,255,0.8);
  cursor: pointer;
  transition: background 0.16s ease, transform 0.14s ease;
  display: inline-flex; align-items: center; justify-content: center;
}
.icon-button:hover { background: rgba(255,255,255,0.14); transform: scale(1.08); }

/* ── Login ── */
.login-box {
  padding: 26px 22px;
  margin: 18px 16px;
  background: rgba(255,252,240,0.72);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(210,172,100,0.35);
  border-radius: 18px;
  box-shadow: 0 2px 0 rgba(255,255,255,0.9) inset, 0 8px 24px rgba(80,50,15,0.08);
}
.full-button { width: 100%; }

/* ── Options (collapsible) ── */
.ai-options {
  border-bottom: 1px solid rgba(210,172,100,0.28);
  background: rgba(255,252,240,0.7);
  backdrop-filter: blur(8px);
  flex-shrink: 0;
}

.options-toggle {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 11px 16px;
  background: none;
  border: none;
  cursor: pointer;
  color: #5a4430;
}
.options-toggle-label { font-size: 12px; font-weight: 700; letter-spacing: 0.04em; color: #7a5c35; }
.options-chevron { transition: transform 0.22s ease; color: #9a7a50; }
.options-chevron.collapsed { transform: rotate(-90deg); }

.options-body { padding: 0 16px 12px; }
.options-body :deep(.el-form-item) { margin-bottom: 10px; }

.option-control { width: 100%; }
.provider-model-row { width: 100%; display: grid; grid-template-columns: 148px minmax(0,1fr); gap: 8px; }
.provider-control { width: 100%; }
.model-hint { margin-top: 5px; color: #8a735b; font-size: 11px; line-height: 1.5; }
.option-row { min-height: 32px; margin-bottom: 10px; display: flex; align-items: center; justify-content: space-between; }
.option-label { font-size: 13px; color: #606266; }
.role-row { width: 100%; display: grid; grid-template-columns: minmax(0,1fr) auto auto; gap: 8px; }
.role-select { width: 100%; }

.role-editor {
  display: grid; gap: 10px; padding: 14px;
  border: 1px solid rgba(210,172,100,0.38);
  border-radius: 14px;
  background: rgba(255,250,234,0.65);
  backdrop-filter: blur(12px);
  box-shadow: 0 2px 0 rgba(255,255,255,0.85) inset;
  margin-bottom: 4px;
}
.role-actions { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.role-action-spacer { flex: 1; }

/* ── Message list ── */
.message-list {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  scroll-behavior: smooth;
  -webkit-overflow-scrolling: touch;
}

.empty-state {
  padding: 18px;
  border: 1px solid rgba(210,172,100,0.35);
  border-radius: 16px;
  background: rgba(255,252,238,0.7);
  backdrop-filter: blur(12px);
}
.empty-title { font-size: 16px; font-weight: 800; color: #2b2b2b; }
.empty-text { margin-top: 6px; font-size: 13px; line-height: 1.7; color: #6f6655; }

.quick-prompts { margin-top: 12px; display: flex; flex-wrap: wrap; gap: 7px; }
.quick-prompts button {
  border: 1px solid rgba(210,175,100,0.5);
  background: rgba(255,255,255,0.6);
  color: #6f5310;
  border-radius: 999px;
  padding: 6px 13px;
  cursor: pointer;
  font-size: 12px;
  backdrop-filter: blur(6px);
  transition: background 0.16s ease, border-color 0.16s ease, transform 0.15s ease, box-shadow 0.15s ease;
}
.quick-prompts button:hover {
  background: rgba(255,248,220,0.9);
  border-color: rgba(180,135,40,0.7);
  color: #4a330a;
  transform: translateY(-1px);
  box-shadow: 0 3px 8px rgba(120,80,20,0.14);
}
.quick-prompts button:active { transform: translateY(0); }

/* ── Chat messages ── */
.chat-message { margin-bottom: 16px; display: flex; gap: 10px; align-items: flex-start; }
.chat-message.user { flex-direction: row-reverse; }

.message-role {
  flex: 0 0 30px; height: 30px;
  border-radius: 50%;
  background: linear-gradient(145deg, #1a1510, #2e2218);
  color: #d4ae46;
  display: flex; align-items: center; justify-content: center;
  font-size: 11px; font-weight: 700;
  box-shadow: 0 3px 10px rgba(0,0,0,0.22);
  flex-shrink: 0;
  margin-top: 2px;
}
.chat-message.user .message-role {
  background: linear-gradient(145deg, #7a5210, #b07a1c);
  color: rgba(255,240,180,0.9);
  box-shadow: 0 3px 10px rgba(120,75,15,0.3);
}

/* AI 消息外包裹 */
.message-wrap {
  display: flex;
  flex-direction: column;
  gap: 5px;
  max-width: calc(100% - 40px);
  min-width: 0;
}

.message-content {
  white-space: pre-wrap;
  word-break: break-word;
  line-height: 1.8;
  font-size: 14px;
  color: #26180e;
  background: rgba(255,255,255,0.76);
  backdrop-filter: blur(14px);
  border: 1px solid rgba(215,182,118,0.32);
  border-radius: 4px 16px 16px 16px;
  padding: 11px 14px;
  box-shadow: 0 4px 18px rgba(52,38,18,0.08), 0 1px 0 rgba(255,255,255,0.95) inset;
}
.chat-message.user .message-content {
  color: #fff;
  background: linear-gradient(145deg, #7a4f0e, #a86c1a);
  border-color: transparent;
  border-radius: 16px 4px 16px 16px;
  box-shadow: 0 4px 18px rgba(120,72,14,0.32);
  max-width: calc(100% - 40px);
}

/* 操作按钮行 */
.msg-actions {
  display: flex;
  gap: 6px;
  padding-left: 2px;
  opacity: 0;
  transform: translateY(-2px);
  transition: opacity 0.18s ease, transform 0.18s ease;
}
.message-wrap:hover .msg-actions,
.message-wrap:focus-within .msg-actions {
  opacity: 1;
  transform: translateY(0);
}

.msg-action-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  background: rgba(255,248,228,0.75);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(210,172,100,0.38);
  border-radius: 999px;
  color: #7a5820;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s ease, border-color 0.15s ease, transform 0.14s ease;
  letter-spacing: 0.02em;
}
.msg-action-btn:hover {
  background: rgba(255,242,200,0.95);
  border-color: rgba(185,140,55,0.6);
  transform: translateY(-1px);
}
.msg-action-btn:active { transform: translateY(0); }

/* 加载动效 */
.loading-dots {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 14px 18px !important;
  min-width: 60px;
}
.loading-dots span {
  width: 6px; height: 6px;
  border-radius: 50%;
  background: #b07a1c;
  animation: dot-bounce 1.4s ease-in-out infinite;
}
.loading-dots span:nth-child(2) { animation-delay: 0.2s; }
.loading-dots span:nth-child(3) { animation-delay: 0.4s; }
@keyframes dot-bounce {
  0%, 80%, 100% { transform: scale(0.7); opacity: 0.4; }
  40% { transform: scale(1); opacity: 1; }
}

/* ── Chat input ── */
.chat-input {
  padding: 12px 14px;
  border-top: 1px solid rgba(210,172,100,0.28);
  background: rgba(255,253,244,0.88);
  backdrop-filter: blur(16px);
  flex-shrink: 0;
}
.chat-actions {
  margin-top: 8px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

/* ── Markdown body ── */
.markdown-body { white-space: normal; }
.markdown-body :deep(p) { margin: 0 0 10px; }
.markdown-body :deep(p:last-child),
.markdown-body :deep(ul:last-child),
.markdown-body :deep(ol:last-child),
.markdown-body :deep(pre:last-child) { margin-bottom: 0; }
.markdown-body :deep(h1),
.markdown-body :deep(h2),
.markdown-body :deep(h3) { margin: 14px 0 8px; color: #3a2818; line-height: 1.35; font-size: 16px; }
.markdown-body :deep(ul),
.markdown-body :deep(ol) { margin: 8px 0 12px 20px; padding: 0; }
.markdown-body :deep(li) { margin: 4px 0; }
.markdown-body :deep(strong) { color: #7c4a18; font-weight: 800; }
.markdown-body :deep(blockquote) {
  margin: 10px 0; padding: 8px 14px;
  color: #6d5e4b; background: rgba(255,248,228,0.8);
  border-left: 3px solid #c58a37; border-radius: 0 8px 8px 0;
}
.markdown-body :deep(code) { padding: 2px 5px; border-radius: 5px; background: #f5ead9; color: #7a3f18; font-size: 0.91em; }
.markdown-body :deep(pre) { overflow-x: auto; margin: 10px 0; padding: 14px; border-radius: 12px; background: #1e1a15; color: #f5e8d0; }
.markdown-body :deep(pre code) { padding: 0; background: transparent; color: inherit; }

/* ── Expand overlay ── */
.expand-fade-enter-active { animation: overlay-in 0.2s ease; }
.expand-fade-leave-active { animation: overlay-in 0.16s ease reverse; }
@keyframes overlay-in { from { opacity: 0; } to { opacity: 1; } }

.expand-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: rgba(8, 5, 2, 0.72);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

.expand-panel {
  width: 100%;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  background: rgba(252, 246, 232, 0.97);
  backdrop-filter: blur(24px);
  border-radius: 24px 24px 0 0;
  box-shadow: 0 -16px 60px rgba(0, 0, 0, 0.3), 0 -1px 0 rgba(255,220,140,0.2);
  animation: panel-up 0.3s cubic-bezier(0.32, 1.2, 0.64, 1);
  overflow: hidden;
}
@keyframes panel-up {
  from { transform: translateY(40px); opacity: 0; }
  to   { transform: translateY(0);    opacity: 1; }
}

.expand-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px 14px;
  border-bottom: 1px solid rgba(210,172,100,0.28);
  background: rgba(252,246,232,0.95);
  flex-shrink: 0;
}
.expand-title {
  font-size: 16px;
  font-weight: 800;
  color: #3a2010;
  letter-spacing: 0.04em;
}
.expand-header-actions { display: flex; align-items: center; gap: 8px; }

.expand-action-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 6px 14px;
  background: rgba(248,236,200,0.7);
  border: 1px solid rgba(210,172,100,0.4);
  border-radius: 999px;
  color: #7a5010;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.15s ease, transform 0.14s ease;
}
.expand-action-btn:hover { background: rgba(255,244,210,0.9); transform: translateY(-1px); }

.expand-close-btn {
  width: 32px; height: 32px;
  border-radius: 50%;
  border: 1px solid rgba(180,140,70,0.3);
  background: rgba(220,195,145,0.2);
  color: #6a4820;
  cursor: pointer;
  display: inline-flex; align-items: center; justify-content: center;
  transition: background 0.15s ease, transform 0.14s ease;
}
.expand-close-btn:hover { background: rgba(200,155,80,0.3); transform: scale(1.08); }

.expand-body {
  flex: 1;
  overflow-y: auto;
  padding: 20px 22px 30px;
  font-size: 16px;
  line-height: 1.9;
  color: #26180e;
  -webkit-overflow-scrolling: touch;
}

/* ── Mobile ── */
@media (max-width: 640px) {
  .ai-fab { right: 16px; bottom: 72px; width: 50px; height: 50px; }
  .ai-fab .el-icon { font-size: 20px; }

  .ai-header { padding: 14px 16px 13px; }
  .ai-title { font-size: 16px; }

  .message-list { padding: 12px; }
  .chat-message { gap: 8px; }
  .message-role { width: 28px; height: 28px; font-size: 10px; }

  .message-content { font-size: 14px; padding: 10px 12px; }
  /* 移动端始终显示操作按钮（不依赖 hover） */
  .msg-actions { opacity: 1; transform: none; }

  .chat-input { padding: 10px 12px; }

  .provider-model-row { grid-template-columns: 1fr; }

  /* 放大弹层在桌面居中 */
  .expand-panel { border-radius: 20px 20px 0 0; }
  .expand-body { font-size: 15px; padding: 16px 18px 24px; }
}

@media (min-width: 641px) {
  .expand-overlay { align-items: center; padding: 24px; }
  .expand-panel {
    width: min(720px, 100%);
    max-height: 84vh;
    border-radius: 24px;
    animation: panel-center 0.28s cubic-bezier(0.32, 1.2, 0.64, 1);
  }
  @keyframes panel-center {
    from { transform: scale(0.94) translateY(16px); opacity: 0; }
    to   { transform: scale(1)    translateY(0);    opacity: 1; }
  }
}
</style>
