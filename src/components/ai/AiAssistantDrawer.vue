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
      <div class="ai-panel" :class="{ dark: darkMode }">
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
              <span class="options-toggle-label">模型 · 角色</span>
              <svg class="options-chevron" :class="{ collapsed: optionsCollapsed }" width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M3 5l4 4 4-4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>

            <div v-show="!optionsCollapsed" class="options-body">
              <!-- 模型行：provider pills + model select -->
              <div class="opt-row">
                <div class="provider-pills">
                  <button
                    v-for="p in providerOptions" :key="p.value"
                    :class="['provider-pill', { active: aiOptions.provider === p.value }]"
                    type="button"
                    @click="aiOptions.provider = p.value"
                  >{{ p.label }}</button>
                </div>
                <el-select v-model="aiOptions.model" size="small" class="model-select">
                  <el-option v-for="m in currentModelOptions" :key="m.value" :label="m.label" :value="m.value" />
                </el-select>
              </div>
              <p v-if="currentModelDescription" class="model-desc">{{ currentModelDescription }}</p>

              <!-- 思考行：switch + reasoning pills -->
              <div class="opt-row opt-thinking-row">
                <div class="opt-label-group">
                  <span class="opt-label-text">深度思考</span>
                  <el-switch v-model="aiOptions.thinkingEnabled" size="small" />
                </div>
                <transition name="fade-slide">
                  <div v-if="aiOptions.thinkingEnabled" class="reasoning-pills">
                    <button
                      v-for="r in reasoningOptions" :key="r.value"
                      :class="['reasoning-pill', { active: aiOptions.reasoningEffort === r.value }]"
                      type="button"
                      @click="aiOptions.reasoningEffort = r.value"
                    >{{ r.label }}</button>
                  </div>
                </transition>
              </div>

              <!-- 角色行：select + icon buttons -->
              <div class="opt-row opt-role-row">
                <el-select v-model="currentRoleId" size="small" class="role-select">
                  <el-option v-for="role in roles" :key="role.id" :label="role.name" :value="role.id" />
                </el-select>
                <button class="role-icon-btn" type="button" title="配置角色" @click="openRoleEditor">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                    <circle cx="12" cy="12" r="3"/>
                    <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
                  </svg>
                </button>
                <button class="role-icon-btn" type="button" title="新建角色" @click="createRole">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round">
                    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                  </svg>
                </button>
              </div>

              <!-- 角色编辑器 -->
              <div v-if="roleEditorVisible" class="role-editor">
                <el-input v-model="roleDraft.name" placeholder="角色名称" maxlength="20" size="small" />
                <div class="role-prompt-header">
                  <span class="role-prompt-label">系统提示词</span>
                  <button class="expand-prompt-btn" type="button" @click="roleExpandVisible = true">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                      <polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/>
                      <line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/>
                    </svg>
                    展开编辑
                  </button>
                </div>
                <el-input
                  v-model="roleDraft.prompt"
                  type="textarea"
                  :rows="4"
                  resize="vertical"
                  maxlength="12000"
                  show-word-limit
                  placeholder="请输入这个角色的系统提示词"
                  size="small"
                />
                <div class="role-actions">
                  <el-button size="small" text @click="resetRolePrompt">恢复默认</el-button>
                  <el-button size="small" text type="danger" :disabled="roles.length <= 1" @click="deleteCurrentRole">删除</el-button>
                  <span class="role-action-spacer"></span>
                  <el-button size="small" @click="roleEditorVisible = false">收起</el-button>
                  <el-button size="small" type="primary" @click="saveRole">保存</el-button>
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
              <div v-if="message.role === 'user'" class="message-content">{{ message.content }}</div>
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
        <div v-if="expandVisible" class="expand-overlay" :class="{ 'expand-dark': darkMode }" @click.self="expandVisible = false">
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

    <!-- 角色提示词展开编辑弹层 -->
    <teleport to="body">
      <transition name="expand-fade">
        <div v-if="roleExpandVisible" class="expand-overlay" :class="{ 'expand-dark': darkMode }" @click.self="roleExpandVisible = false">
          <div class="expand-panel role-expand-panel">
            <div class="expand-header">
              <div class="role-expand-title-wrap">
                <span class="expand-title">编辑系统提示词</span>
                <span class="role-expand-name">{{ roleDraft.name || '角色' }}</span>
              </div>
              <div class="expand-header-actions">
                <button class="expand-action-btn" type="button" @click="roleExpandVisible = false">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  完成
                </button>
                <button class="expand-close-btn" type="button" @click="roleExpandVisible = false" aria-label="关闭">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>
            </div>
            <div class="role-expand-body">
              <textarea
                v-model="roleDraft.prompt"
                class="role-expand-textarea"
                maxlength="12000"
                placeholder="请输入这个角色的系统提示词..."
                spellcheck="false"
              ></textarea>
              <div class="role-expand-count">{{ roleDraft.prompt.length }} / 12000</div>
            </div>
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
  form: { type: Object, required: true },
  darkMode: { type: Boolean, default: false }
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
const roleExpandVisible = ref(false)
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
onBeforeUnmount(() => { window.removeEventListener('resize', updateViewportWidth) })

function updateViewportWidth() { viewportWidth.value = window.innerWidth }
function openDrawer() { drawerVisible.value = true }

async function onOpened() {
  if (!getAiToken()) { loggedIn.value = false; return }
  try { await checkAiSession(); loggedIn.value = true }
  catch { loggedIn.value = false }
}

async function handleLogin() {
  if (!loginForm.username || !loginForm.password) { ElMessage.warning('请输入账号和密码'); return }
  loginLoading.value = true
  try {
    await loginAi(loginForm.username, loginForm.password)
    loggedIn.value = true; loginForm.password = ''
    ElMessage.success('登录成功')
  } catch (error) { ElMessage.error(error.message) }
  finally { loginLoading.value = false }
}

function usePrompt(text) { question.value = text }
function renderMarkdown(content) { return markdown.render(content || '') }

async function copyMessage(content) {
  try {
    await navigator.clipboard.writeText(content)
    ElMessage({ message: '已复制到剪贴板', type: 'success', duration: 1500, grouping: true })
  } catch { ElMessage.error('复制失败，请手动选择文本') }
}

function expandMessage(content) { expandContent.value = content; expandVisible.value = true }

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
  interruptChat(); clearAiToken()
  loggedIn.value = false; messages.value = []
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
function defaultRole() { return { id: 'default-bazi-master', name: '胡桃大师', prompt: DEFAULT_ROLE_PROMPT } }
function createId() { return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}` }

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
  position: fixed; right: 22px; bottom: 22px; z-index: 20;
  width: 56px; height: 56px; border: 0; border-radius: 50%;
  display: inline-flex; align-items: center; justify-content: center;
  color: #fff; background: linear-gradient(145deg, #2a1f14, #8a5e1a);
  box-shadow: 0 10px 30px rgba(57,40,17,0.38); cursor: pointer;
  transition: transform 0.22s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.22s ease;
}
.ai-fab:hover { transform: translateY(-3px) scale(1.07); box-shadow: 0 18px 44px rgba(57,40,17,0.5), 0 0 0 7px rgba(193,124,46,0.14); }
.ai-fab:active { transform: translateY(-1px) scale(0.96); }
.ai-fab.authed { background: linear-gradient(145deg, #4a2810, #c17c2e); animation: fab-glow 3s ease-in-out infinite; }
.ai-fab.authed:hover { animation: none; box-shadow: 0 18px 44px rgba(57,40,17,0.5), 0 0 0 7px rgba(193,124,46,0.16); }
.ai-fab .el-icon { font-size: 22px; }

/* ── Panel ── */
.ai-panel {
  height: 100%; display: flex; flex-direction: column;
  background:
    radial-gradient(ellipse at 12% 12%, rgba(185,118,42,0.13) 0%, transparent 52%),
    radial-gradient(ellipse at 88% 82%, rgba(140,80,22,0.1) 0%, transparent 55%),
    #f3e9d9;
  overflow: hidden;
}
.ai-panel.dark {
  background:
    radial-gradient(ellipse at 12% 12%, rgba(140,85,25,0.18) 0%, transparent 52%),
    radial-gradient(ellipse at 88% 82%, rgba(100,55,10,0.14) 0%, transparent 55%),
    #0e0905;
}

/* ── Header ── */
.ai-header {
  padding: 16px 18px 15px;
  background: rgba(14,9,5,0.86);
  backdrop-filter: blur(36px) saturate(2);
  -webkit-backdrop-filter: blur(36px) saturate(2);
  border-bottom: 1px solid rgba(255,195,85,0.1);
  box-shadow: 0 6px 28px rgba(0,0,0,0.2);
  color: #fff; display: flex; align-items: center; justify-content: space-between; flex-shrink: 0;
}
.ai-title { font-size: 18px; font-weight: 900; color: #f2c96a; letter-spacing: 0.04em; text-shadow: 0 0 20px rgba(242,201,106,0.3); }
.ai-subtitle { font-size: 12px; color: rgba(220,200,175,0.65); margin-top: 4px; }
.icon-button {
  width: 34px; height: 34px; border: 1px solid rgba(255,255,255,0.1);
  border-radius: 50%; background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.8);
  cursor: pointer; transition: background 0.16s, transform 0.14s;
  display: inline-flex; align-items: center; justify-content: center;
}
.icon-button:hover { background: rgba(255,255,255,0.14); transform: scale(1.08); }

/* ── Login ── */
.login-box {
  padding: 26px 22px; margin: 18px 16px;
  background: rgba(255,252,240,0.72); backdrop-filter: blur(16px);
  border: 1px solid rgba(210,172,100,0.35); border-radius: 18px;
  box-shadow: 0 2px 0 rgba(255,255,255,0.9) inset, 0 8px 24px rgba(80,50,15,0.08);
}
.ai-panel.dark .login-box {
  background: rgba(22,14,6,0.85);
  border-color: rgba(140,100,40,0.35);
  box-shadow: 0 1px 0 rgba(255,255,255,0.04) inset;
}
.ai-panel.dark .login-box :deep(.el-form-item__label) { color: #c4a870; }
.ai-panel.dark .login-box :deep(.el-input__wrapper) {
  background: rgba(30,20,10,0.7);
  box-shadow: 0 0 0 1px rgba(140,100,40,0.35) inset;
}
.ai-panel.dark .login-box :deep(.el-input__inner) { color: #e0c898; }
.full-button { width: 100%; }

/* ── Options ── */
.ai-options {
  border-bottom: 1px solid rgba(210,172,100,0.28);
  background: rgba(255,252,240,0.7);
  backdrop-filter: blur(8px);
  flex-shrink: 0;
}
.ai-panel.dark .ai-options {
  background: rgba(18,12,5,0.88);
  border-bottom-color: rgba(120,85,28,0.3);
}

.options-toggle {
  width: 100%; display: flex; align-items: center; justify-content: space-between;
  padding: 10px 16px; background: none; border: none; cursor: pointer;
}
.options-toggle-label { font-size: 12px; font-weight: 700; letter-spacing: 0.04em; color: #7a5c35; }
.ai-panel.dark .options-toggle-label { color: #b08848; }
.options-chevron { transition: transform 0.22s; color: #9a7a50; }
.ai-panel.dark .options-chevron { color: #8a6838; }
.options-chevron.collapsed { transform: rotate(-90deg); }

.options-body { padding: 0 14px 12px; display: flex; flex-direction: column; gap: 7px; }

/* compact rows */
.opt-row { display: flex; align-items: center; gap: 8px; min-height: 28px; }

/* Provider pills */
.provider-pills { display: flex; gap: 4px; flex-shrink: 0; }
.provider-pill {
  padding: 4px 10px; border-radius: 999px; border: 1px solid rgba(200,160,80,0.28);
  background: transparent; color: #8a6a40; font-size: 12px; font-weight: 600;
  cursor: pointer; transition: all 0.15s; font-family: inherit;
}
.provider-pill:hover { background: rgba(200,160,60,0.08); }
.provider-pill.active {
  background: rgba(150,95,18,0.12); border-color: rgba(180,130,50,0.55);
  color: #5a3808; font-weight: 800;
}
.ai-panel.dark .provider-pill { border-color: rgba(140,100,38,0.3); color: #9a7848; }
.ai-panel.dark .provider-pill.active {
  background: rgba(160,105,25,0.22); border-color: rgba(200,148,55,0.55);
  color: #f0c870;
}

.model-select { flex: 1; min-width: 0; }
.ai-panel.dark .model-select :deep(.el-input__wrapper) {
  background: rgba(28,18,8,0.7); box-shadow: 0 0 0 1px rgba(140,100,38,0.32) inset;
}
.ai-panel.dark .model-select :deep(.el-input__inner) { color: #d4b870; }
.ai-panel.dark .model-select :deep(.el-select__caret) { color: #9a7848; }

.model-desc {
  font-size: 11px; color: #8a7358; line-height: 1.4;
  padding: 0 2px; margin-top: -3px;
}
.ai-panel.dark .model-desc { color: #7a6040; }

/* Thinking row */
.opt-thinking-row { flex-wrap: wrap; }
.opt-label-group { display: flex; align-items: center; gap: 7px; flex-shrink: 0; }
.opt-label-text { font-size: 12px; font-weight: 700; color: #6a5030; }
.ai-panel.dark .opt-label-text { color: #b08848; }

.reasoning-pills { display: flex; gap: 4px; margin-left: auto; }
.reasoning-pill {
  padding: 3px 11px; border-radius: 999px; border: 1px solid rgba(200,160,80,0.28);
  background: transparent; color: #7a5a30; font-size: 11px; font-weight: 600;
  cursor: pointer; transition: all 0.15s; font-family: inherit;
}
.reasoning-pill.active {
  background: rgba(150,95,18,0.12); border-color: rgba(180,130,50,0.55);
  color: #5a3808; font-weight: 800;
}
.ai-panel.dark .reasoning-pill { border-color: rgba(140,100,38,0.3); color: #9a7848; }
.ai-panel.dark .reasoning-pill.active {
  background: rgba(160,105,25,0.22); border-color: rgba(200,148,55,0.55);
  color: #f0c870;
}

/* fade-slide for reasoning pills */
.fade-slide-enter-active { transition: opacity 0.18s, transform 0.18s; }
.fade-slide-leave-active { transition: opacity 0.12s, transform 0.12s; }
.fade-slide-enter-from, .fade-slide-leave-to { opacity: 0; transform: translateX(8px); }

/* Role row */
.opt-role-row { }
.role-select { flex: 1; min-width: 0; }
.ai-panel.dark .role-select :deep(.el-input__wrapper) {
  background: rgba(28,18,8,0.7); box-shadow: 0 0 0 1px rgba(140,100,38,0.32) inset;
}
.ai-panel.dark .role-select :deep(.el-input__inner) { color: #d4b870; }
.ai-panel.dark .role-select :deep(.el-select__caret) { color: #9a7848; }

.role-icon-btn {
  width: 28px; height: 28px; border: 1px solid rgba(200,160,80,0.28); border-radius: 8px;
  background: rgba(255,248,228,0.5); color: #7a6038; cursor: pointer; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  transition: background 0.15s, border-color 0.15s, transform 0.13s;
}
.role-icon-btn:hover { background: rgba(255,240,200,0.85); border-color: rgba(180,130,50,0.5); transform: scale(1.08); }
.ai-panel.dark .role-icon-btn {
  background: rgba(35,23,10,0.6); border-color: rgba(140,100,38,0.3); color: #a08048;
}
.ai-panel.dark .role-icon-btn:hover { background: rgba(55,36,14,0.8); border-color: rgba(180,130,50,0.45); }

/* Role editor */
.role-editor {
  display: grid; gap: 8px; padding: 12px;
  border: 1px solid rgba(210,172,100,0.38); border-radius: 12px;
  background: rgba(255,250,234,0.65); backdrop-filter: blur(12px);
  box-shadow: 0 2px 0 rgba(255,255,255,0.85) inset;
}
.ai-panel.dark .role-editor {
  background: rgba(22,14,6,0.82); border-color: rgba(140,100,38,0.35);
  box-shadow: 0 1px 0 rgba(255,255,255,0.04) inset;
}
.ai-panel.dark .role-editor :deep(.el-input__wrapper),
.ai-panel.dark .role-editor :deep(.el-textarea__inner) {
  background: rgba(28,18,8,0.75); box-shadow: 0 0 0 1px rgba(130,92,35,0.32) inset;
  color: #d4b870;
}
.ai-panel.dark .role-editor :deep(.el-input__count),
.ai-panel.dark .role-editor :deep(.el-textarea__count) { background: transparent; color: #7a6040; }

.role-prompt-header { display: flex; align-items: center; justify-content: space-between; }
.role-prompt-label { font-size: 11px; color: #7a6040; font-weight: 700; }
.ai-panel.dark .role-prompt-label { color: #a08050; }

.expand-prompt-btn {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 3px 9px; background: rgba(255,244,220,0.8);
  border: 1px solid rgba(200,160,80,0.35); border-radius: 999px;
  color: #7a5010; font-size: 11px; font-weight: 700; cursor: pointer;
  transition: background 0.15s, transform 0.13s; font-family: inherit;
}
.expand-prompt-btn:hover { background: rgba(255,240,200,0.95); transform: translateY(-1px); }
.ai-panel.dark .expand-prompt-btn {
  background: rgba(55,36,14,0.7); border-color: rgba(160,115,40,0.4); color: #d4a050;
}

.role-actions { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.role-action-spacer { flex: 1; }

/* ── Message list ── */
.message-list {
  flex: 1; overflow-y: auto; padding: 16px;
  scroll-behavior: smooth; -webkit-overflow-scrolling: touch;
}

.empty-state {
  padding: 18px; border: 1px solid rgba(210,172,100,0.35); border-radius: 16px;
  background: rgba(255,252,238,0.7); backdrop-filter: blur(12px);
}
.ai-panel.dark .empty-state {
  background: rgba(22,14,6,0.78); border-color: rgba(130,90,30,0.32);
}
.empty-title { font-size: 16px; font-weight: 800; color: #2b2b2b; }
.ai-panel.dark .empty-title { color: #d8b878; }
.empty-text { margin-top: 6px; font-size: 13px; line-height: 1.7; color: #6f6655; }
.ai-panel.dark .empty-text { color: #8a7050; }

.quick-prompts { margin-top: 12px; display: flex; flex-wrap: wrap; gap: 7px; }
.quick-prompts button {
  border: 1px solid rgba(210,175,100,0.5); background: rgba(255,255,255,0.6); color: #6f5310;
  border-radius: 999px; padding: 6px 13px; cursor: pointer; font-size: 12px;
  backdrop-filter: blur(6px); font-family: inherit;
  transition: background 0.16s, border-color 0.16s, transform 0.15s, box-shadow 0.15s;
}
.quick-prompts button:hover {
  background: rgba(255,248,220,0.9); border-color: rgba(180,135,40,0.7);
  color: #4a330a; transform: translateY(-1px); box-shadow: 0 3px 8px rgba(120,80,20,0.14);
}
.ai-panel.dark .quick-prompts button {
  background: rgba(35,23,10,0.65); border-color: rgba(140,100,38,0.4); color: #c09858;
}
.ai-panel.dark .quick-prompts button:hover {
  background: rgba(55,36,14,0.85); color: #e4c070; border-color: rgba(180,130,50,0.55);
}

/* ── Chat messages ── */
.chat-message { margin-bottom: 16px; display: flex; gap: 10px; align-items: flex-start; }
.chat-message.user { flex-direction: row-reverse; }

.message-role {
  flex: 0 0 30px; height: 30px; border-radius: 50%;
  background: linear-gradient(145deg, #1a1510, #2e2218); color: #d4ae46;
  display: flex; align-items: center; justify-content: center;
  font-size: 11px; font-weight: 700; box-shadow: 0 3px 10px rgba(0,0,0,0.22);
  flex-shrink: 0; margin-top: 2px;
}
.chat-message.user .message-role {
  background: linear-gradient(145deg, #7a5210, #b07a1c);
  color: rgba(255,240,180,0.9); box-shadow: 0 3px 10px rgba(120,75,15,0.3);
}

.message-wrap { display: flex; flex-direction: column; gap: 5px; max-width: calc(100% - 40px); min-width: 0; }

.message-content {
  white-space: pre-wrap; word-break: break-word; line-height: 1.85; font-size: 15px;
  color: #26180e; background: rgba(255,255,255,0.76); backdrop-filter: blur(14px);
  border: 1px solid rgba(215,182,118,0.32); border-radius: 4px 16px 16px 16px;
  padding: 11px 14px; box-shadow: 0 4px 18px rgba(52,38,18,0.08), 0 1px 0 rgba(255,255,255,0.95) inset;
}
.ai-panel.dark .message-content {
  background: rgba(28,18,8,0.88); color: #e0c898;
  border-color: rgba(120,88,30,0.38);
  box-shadow: 0 4px 18px rgba(0,0,0,0.25), 0 1px 0 rgba(255,200,100,0.05) inset;
}
.chat-message.user .message-content {
  color: #fff; background: linear-gradient(145deg, #7a4f0e, #a86c1a);
  border-color: transparent; border-radius: 16px 4px 16px 16px;
  box-shadow: 0 4px 18px rgba(120,72,14,0.32); max-width: calc(100% - 40px);
}
.ai-panel.dark .chat-message.user .message-content {
  background: linear-gradient(145deg, #5a3808, #7a4c10);
  box-shadow: 0 4px 18px rgba(90,52,8,0.45);
}

/* 操作按钮行 */
.msg-actions {
  display: flex; gap: 6px; padding-left: 2px;
  opacity: 0; transform: translateY(-2px);
  transition: opacity 0.18s, transform 0.18s;
}
.message-wrap:hover .msg-actions, .message-wrap:focus-within .msg-actions { opacity: 1; transform: translateY(0); }

.msg-action-btn {
  display: inline-flex; align-items: center; gap: 4px; padding: 4px 10px;
  background: rgba(255,248,228,0.75); backdrop-filter: blur(8px);
  border: 1px solid rgba(210,172,100,0.38); border-radius: 999px;
  color: #7a5820; font-size: 11px; font-weight: 600; cursor: pointer; font-family: inherit;
  transition: background 0.15s, border-color 0.15s, transform 0.14s;
}
.msg-action-btn:hover { background: rgba(255,242,200,0.95); border-color: rgba(185,140,55,0.6); transform: translateY(-1px); }
.ai-panel.dark .msg-action-btn {
  background: rgba(38,25,10,0.75); border-color: rgba(140,100,38,0.38); color: #c09050;
}
.ai-panel.dark .msg-action-btn:hover { background: rgba(58,38,14,0.9); border-color: rgba(180,130,50,0.55); }

/* loading dots */
.loading-dots { display: flex; align-items: center; gap: 5px; padding: 14px 18px !important; min-width: 60px; }
.loading-dots span {
  width: 6px; height: 6px; border-radius: 50%; background: #b07a1c;
  animation: dot-bounce 1.4s ease-in-out infinite;
}
.ai-panel.dark .loading-dots span { background: #c89040; }
.loading-dots span:nth-child(2) { animation-delay: 0.2s; }
.loading-dots span:nth-child(3) { animation-delay: 0.4s; }
@keyframes dot-bounce {
  0%, 80%, 100% { transform: scale(0.7); opacity: 0.4; }
  40% { transform: scale(1); opacity: 1; }
}

/* ── Chat input ── */
.chat-input {
  padding: 12px 14px; border-top: 1px solid rgba(210,172,100,0.28);
  background: rgba(255,253,244,0.88); backdrop-filter: blur(16px); flex-shrink: 0;
}
.ai-panel.dark .chat-input {
  background: rgba(14,9,4,0.92); border-top-color: rgba(120,85,28,0.3);
}
.ai-panel.dark .chat-input :deep(.el-textarea__inner) {
  background: rgba(24,15,6,0.8); color: #d8b878;
  box-shadow: 0 0 0 1px rgba(130,92,35,0.32) inset;
  caret-color: #c49040;
}
.ai-panel.dark .chat-input :deep(.el-input__count) { background: transparent; color: #6a5030; }
.chat-actions { margin-top: 8px; display: flex; align-items: center; justify-content: space-between; }

/* ── Markdown body ── */
.markdown-body { white-space: normal; }
.markdown-body :deep(p) { margin: 0 0 10px; }
.markdown-body :deep(p:last-child),
.markdown-body :deep(ul:last-child),
.markdown-body :deep(ol:last-child),
.markdown-body :deep(pre:last-child) { margin-bottom: 0; }
.markdown-body :deep(h1),
.markdown-body :deep(h2),
.markdown-body :deep(h3) { margin: 14px 0 8px; color: #3a2818; line-height: 1.35; font-size: 16px; font-weight: 800; }
.markdown-body :deep(ul),
.markdown-body :deep(ol) { margin: 8px 0 12px 20px; padding: 0; }
.markdown-body :deep(li) { margin: 4px 0; }
.markdown-body :deep(strong) { color: #7c4a18; font-weight: 800; }
.markdown-body :deep(blockquote) {
  margin: 10px 0; padding: 8px 14px; color: #6d5e4b;
  background: rgba(255,248,228,0.8); border-left: 3px solid #c58a37; border-radius: 0 8px 8px 0;
}
.markdown-body :deep(code) { padding: 2px 5px; border-radius: 5px; background: #f5ead9; color: #7a3f18; font-size: 0.91em; }
.markdown-body :deep(pre) { overflow-x: auto; margin: 10px 0; padding: 14px; border-radius: 12px; background: #1e1a15; color: #f5e8d0; }
.markdown-body :deep(pre code) { padding: 0; background: transparent; color: inherit; }

/* dark markdown */
.ai-panel.dark .markdown-body :deep(h1),
.ai-panel.dark .markdown-body :deep(h2),
.ai-panel.dark .markdown-body :deep(h3) { color: #e8c880; }
.ai-panel.dark .markdown-body :deep(strong) { color: #e0a860; }
.ai-panel.dark .markdown-body :deep(blockquote) {
  background: rgba(60,40,15,0.5); color: #b09060; border-left-color: #a07030;
}
.ai-panel.dark .markdown-body :deep(code) { background: rgba(50,32,12,0.8); color: #e0a860; }

/* ── Expand overlay ── */
.expand-fade-enter-active { animation: overlay-in 0.2s ease; }
.expand-fade-leave-active { animation: overlay-in 0.16s ease reverse; }
@keyframes overlay-in { from { opacity: 0; } to { opacity: 1; } }

.expand-overlay {
  position: fixed; inset: 0; z-index: 9999;
  background: rgba(8,5,2,0.72); backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  display: flex; align-items: flex-end; justify-content: center;
}
.expand-panel {
  width: 100%; max-height: 90vh; display: flex; flex-direction: column;
  background: rgba(252,246,232,0.97); backdrop-filter: blur(24px);
  border-radius: 24px 24px 0 0;
  box-shadow: 0 -16px 60px rgba(0,0,0,0.3), 0 -1px 0 rgba(255,220,140,0.2);
  animation: panel-up 0.3s cubic-bezier(0.32, 1.2, 0.64, 1); overflow: hidden;
}
.expand-overlay.expand-dark .expand-panel {
  background: rgba(18,11,5,0.97);
  box-shadow: 0 -16px 60px rgba(0,0,0,0.6), 0 -1px 0 rgba(200,140,50,0.1);
}
@keyframes panel-up {
  from { transform: translateY(40px); opacity: 0; }
  to   { transform: translateY(0); opacity: 1; }
}

.expand-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 16px 20px 14px; border-bottom: 1px solid rgba(210,172,100,0.28);
  background: rgba(252,246,232,0.95); flex-shrink: 0;
}
.expand-overlay.expand-dark .expand-header {
  background: rgba(20,13,5,0.96); border-bottom-color: rgba(130,90,28,0.3);
}
.expand-title { font-size: 16px; font-weight: 800; color: #3a2010; letter-spacing: 0.04em; }
.expand-overlay.expand-dark .expand-title { color: #e0c070; }
.expand-header-actions { display: flex; align-items: center; gap: 8px; }

.expand-action-btn {
  display: inline-flex; align-items: center; gap: 5px; padding: 6px 14px;
  background: rgba(248,236,200,0.7); border: 1px solid rgba(210,172,100,0.4);
  border-radius: 999px; color: #7a5010; font-size: 12px; font-weight: 700;
  cursor: pointer; font-family: inherit; transition: background 0.15s, transform 0.14s;
}
.expand-action-btn:hover { background: rgba(255,244,210,0.9); transform: translateY(-1px); }
.expand-overlay.expand-dark .expand-action-btn {
  background: rgba(55,36,14,0.75); border-color: rgba(160,115,40,0.4); color: #d4a050;
}
.expand-overlay.expand-dark .expand-action-btn:hover { background: rgba(75,50,18,0.9); }

.expand-close-btn {
  width: 32px; height: 32px; border-radius: 50%;
  border: 1px solid rgba(180,140,70,0.3); background: rgba(220,195,145,0.2);
  color: #6a4820; cursor: pointer;
  display: inline-flex; align-items: center; justify-content: center;
  transition: background 0.15s, transform 0.14s;
}
.expand-close-btn:hover { background: rgba(200,155,80,0.3); transform: scale(1.08); }
.expand-overlay.expand-dark .expand-close-btn {
  border-color: rgba(140,100,38,0.3); background: rgba(40,26,10,0.5); color: #a08050;
}
.expand-overlay.expand-dark .expand-close-btn:hover { background: rgba(65,42,16,0.7); }

.expand-body {
  flex: 1; overflow-y: auto; padding: 20px 22px 30px;
  font-size: 16px; line-height: 1.9; color: #26180e; -webkit-overflow-scrolling: touch;
}
.expand-overlay.expand-dark .expand-body { color: #dfc898; }

/* ── Role expand ── */
.role-expand-panel { display: flex; flex-direction: column; height: 82vh; }
.role-expand-title-wrap { display: flex; flex-direction: column; gap: 2px; }
.role-expand-name { font-size: 11px; color: rgba(255,195,80,0.65); letter-spacing: 0.04em; }
.role-expand-body {
  flex: 1; display: flex; flex-direction: column; overflow: hidden; padding: 16px 20px 20px;
}
.role-expand-textarea {
  flex: 1; width: 100%; resize: none;
  border: 1.5px solid rgba(200,158,80,0.38); border-radius: 12px;
  padding: 14px 16px; font-family: inherit; font-size: 14px; font-weight: 500;
  line-height: 1.8; color: #2a1c10; background: rgba(255,252,242,0.92);
  outline: none; transition: border-color 0.16s; min-height: 0; caret-color: #a86c1a;
}
.role-expand-textarea:focus { border-color: rgba(180,130,40,0.65); box-shadow: 0 0 0 3px rgba(180,130,40,0.1); }
.expand-overlay.expand-dark .role-expand-textarea {
  background: rgba(22,14,6,0.9); color: #d8b878;
  border-color: rgba(140,100,38,0.38); caret-color: #c49040;
}
.expand-overlay.expand-dark .role-expand-textarea:focus {
  border-color: rgba(180,130,40,0.55); box-shadow: 0 0 0 3px rgba(160,110,30,0.15);
}
.role-expand-count { margin-top: 7px; text-align: right; font-size: 11px; color: #a09070; }
.expand-overlay.expand-dark .role-expand-count { color: #6a5030; }

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
  .msg-actions { opacity: 1; transform: none; }
  .chat-input { padding: 10px 12px; }
  .expand-panel { border-radius: 20px 20px 0 0; }
  .expand-body { font-size: 15px; padding: 16px 18px 24px; }
}

@media (min-width: 641px) {
  .expand-overlay { align-items: center; padding: 24px; }
  .expand-panel {
    width: min(720px, 100%); max-height: 84vh; border-radius: 24px;
    animation: panel-center 0.28s cubic-bezier(0.32, 1.2, 0.64, 1);
  }
  @keyframes panel-center {
    from { transform: scale(0.94) translateY(16px); opacity: 0; }
    to   { transform: scale(1) translateY(0); opacity: 1; }
  }
}
</style>
