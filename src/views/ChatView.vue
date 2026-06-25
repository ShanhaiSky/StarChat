<!-- @author ShanhaiSky -->
<template>
  <div class="chat-view">
    <!-- 消息区域 -->
    <div class="chat-messages-wrapper">
      <!-- 顶部渐变 -->
      <div class="fade-top"></div>
      <div ref="messagesRef" class="chat-messages">
      <!-- 空状态 -->
      <div v-if="messages.length === 0 && !isStreaming" class="chat-empty">
        <div class="empty-center" @mouseenter="showPlanets = true" @mouseleave="showPlanets = false">
          <!-- Logo（固定尺寸，不被行星影响） -->
          <div class="logo-ring">
            <div class="logo-icon">✦</div>
          </div>

          <!-- 行星（absolute 定位，不影响布局） -->
          <div class="planets-layer">
            <div class="orbit orbit-1"></div>
            <div class="orbit orbit-2"></div>
            <div
              v-for="(planet, i) in planets"
              :key="i"
              class="planet"
              :class="{ visible: showPlanets }"
              :style="{ '--delay': planet.delay + 'ms', '--x': planet.x + 'px', '--y': planet.y + 'px' }"
              @click="quickSend($event, planet.prompt)"
            >
              <div class="planet-body" :style="{ background: planet.color }">
                <component :is="planet.icon" :size="18" color="#fff" />
              </div>
              <span class="planet-label">{{ planet.label }}</span>
            </div>
          </div>

          <h2 class="empty-title">StarChat</h2>
          <p class="empty-desc">{{ sloganStore.slogan }}</p>
        </div>
      </div>

      <!-- 消息列表 -->
      <div v-for="(msg, idx) in messages" :key="idx" class="message-group">
        <!-- 用户消息 -->
        <div v-if="msg.role === 'user'" class="message-item message-item--user">
          <span class="user-text">{{ msg.content }}</span>
        </div>

        <!-- AI 消息 -->
        <div v-else class="message-item message-item--assistant">
          <!-- 思考过程 - 折叠卡片 -->
          <div v-if="msg.thinking" class="thinking-card" :class="{ expanded: msg.thinkingExpanded, streaming: isStreaming && idx === messages.length - 1 }">
            <div class="thinking-header" @click="msg.thinkingExpanded = !msg.thinkingExpanded">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" class="thinking-icon" :class="{ pulse: isStreaming && idx === messages.length - 1 && !msg.content }">
                <path d="M5.09375 5.09375C1.88359 8.30391 0.582418 12.2074 2.1875 13.8125C3.79257 15.4176 7.69609 14.1164 10.9063 10.9063C14.1164 7.69609 15.4176 3.79257 13.8125 2.1875C12.2074 0.582418 8.30391 1.88359 5.09375 5.09375Z" stroke="currentColor" stroke-width="1" stroke-linejoin="round" fill="none"/>
                <path d="M10.9063 5.09375C14.1164 8.30391 15.4176 12.2074 13.8125 13.8125C12.2074 15.4176 8.30391 14.1164 5.09375 10.9063C1.88359 7.69609 0.582418 3.79257 2.1875 2.1875C3.79257 0.582418 7.69609 1.88359 10.9063 5.09375Z" stroke="currentColor" stroke-width="1" stroke-linejoin="round" fill="none"/>
                <circle cx="8" cy="8" r="1.5" fill="currentColor" stroke="none"/>
              </svg>
              <span class="thinking-title">{{ isStreaming && idx === messages.length - 1 && !msg.content ? '正在思考...' : '思考已完成' }}</span>
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" class="thinking-arrow">
                <path d="M6 4L10 8L6 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <div v-show="msg.thinkingExpanded" class="thinking-content">
              <div class="md-content" v-html="renderMd(msg.thinking)"></div>
            </div>
          </div>

          <!-- 工具调用 - 简洁行 -->
          <div v-for="(tool, ti) in msg.tools" :key="ti" class="tool-item">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" class="tool-icon" :class="{ 'tool-done': tool.done }">
              <path v-if="tool.done" d="M4.5 7.7002L6.99293 10.1931C6.99683 10.197 7.00317 10.197 7.00707 10.1931L11.5 5.7002" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              <path v-if="tool.done" d="M15 8C15 11.866 11.866 15 8 15C4.13401 15 1 11.866 1 8C1 4.13401 4.13401 1 8 1C11.866 1 15 4.13401 15 8Z" stroke="currentColor" stroke-width="1" stroke-linejoin="round" fill="none"/>
              <path v-else d="M13.25 5.5C12.5 3.32491 10.75 1.75 8 1.75C4.54822 1.75 1.75 4.54822 1.75 8C1.75 11.4518 4.54822 14.25 8 14.25C11.1114 14.25 13.6918 11.9764 14.1704 9" stroke="currentColor" stroke-width="1" stroke-linecap="round" fill="none"/>
            </svg>
            <span class="tool-name">{{ tool.name }}</span>
          </div>

          <!-- 正文内容 -->
          <div v-if="msg.content" class="message-content">
            <div class="md-content" v-html="renderMd(msg.content)"></div>
          </div>

          <!-- 操作按钮 -->
          <div v-if="msg.content && !isStreaming" class="message-actions">
            <button class="action-btn" @click="copyMessage(msg.content)" title="复制">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path d="M9.5 4.5V2C9.5 1.72386 9.27614 1.5 9 1.5H2C1.72386 1.5 1.5 1.72386 1.5 2V11C1.5 11.2761 1.72386 11.5 2 11.5H6.5" stroke="currentColor" stroke-width="1" stroke-linejoin="round" fill="none"/>
                <path d="M11 4.5H7C6.72386 4.5 6.5 4.72386 6.5 5V14C6.5 14.2761 6.72386 14.5 7 14.5H14C14.2761 14.5 14.5 14.2761 14.5 14V8L11 4.5Z" stroke="currentColor" stroke-width="1" stroke-linejoin="round" fill="none"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      <!-- 流式加载指示器 -->
      <div v-if="isStreaming && !currentAssistantMsg?.content" class="message-group">
        <div class="message-item message-item--assistant">
          <div class="streaming-dots">
            <span></span><span></span><span></span>
          </div>
        </div>
      </div>
    </div>
      <!-- 底部渐变（毛玻璃） -->
      <div class="fade-bottom"></div>
    </div>

    <!-- 输入区域 -->
    <div class="input-area" :class="{ 'slide-up': appReady }">
      <div class="input-container" :class="{ focused: isFocused }">
        <!-- 输入框 -->
        <textarea
          ref="inputRef"
          v-model="inputText"
          class="input-textarea"
          placeholder="输入消息，开始对话..."
          @focus="isFocused = true"
          @blur="isFocused = false"
          @keydown="handleKeydown"
          @input="autoResize"
          :disabled="isStreaming"
        ></textarea>

        <!-- 底部工具栏 -->
        <div class="input-toolbar">
          <div class="toolbar-left">
            <!-- 模型选择 -->
            <el-select
              v-model="config.currentModel"
              class="model-select"
            >
              <el-option
                v-for="m in config.models"
                :key="m.name"
                :label="m.name"
                :value="m.name"
              />
            </el-select>
          </div>

          <div class="toolbar-right">
            <!-- 发送/停止按钮 -->
            <button
              class="toolbar-btn send-btn"
              :class="{ 'stop-btn': isStreaming }"
              :title="isStreaming ? '停止生成' : canSend ? '发送' : ''"
              @click="isStreaming ? stopGeneration() : canSend ? sendMessage() : null"
            >
              <svg v-if="isStreaming" viewBox="0 0 16 16" fill="currentColor" width="16" height="16">
                <rect x="3" y="3" width="10" height="10" rx="2"/>
              </svg>
              <svg v-else viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" width="16" height="16">
                <path d="M8 13V3"/><path d="M3.5 7.5L8 3l4.5 4.5"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, nextTick, watch, computed, onUnmounted, inject } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useChatStore } from '@/stores/chat'
import { useUsageStore } from '@/stores/usage'
import { useSloganStore } from '@/stores/slogan'
import { getLLMConfig, chatStream, generateTitle, generateSlogan } from '@/services/llm'
import { renderMarkdown, renderMermaidBlocks } from '@/utils/markdown'
import { IconCode, IconAnalytics, IconEdit, IconTranslate, IconIdea, IconBook } from '@/icons'

const route = useRoute()
const router = useRouter()
const chatStore = useChatStore()
const usageStore = useUsageStore()
const sloganStore = useSloganStore()
const appReady = inject('appReady', ref(false))

// ── State ──
const messagesRef = ref()
const inputRef = ref()
const inputText = ref('')
const isStreaming = ref(false)
const isFocused = ref(false)
const messages = ref([])
const config = ref(getLLMConfig())
const showPlanets = ref(false)
const currentAssistantMsg = ref(null)
const isAtBottom = ref(true) // 跟踪用户是否在底部
let abortController = null

// ── 行星（提示词）生成 ──
const PLANET_COLORS = [
  'linear-gradient(135deg, #667eea, #764ba2)',
  'linear-gradient(135deg, #f093fb, #f5576c)',
  'linear-gradient(135deg, #4facfe, #00f2fe)',
  'linear-gradient(135deg, #43e97b, #38f9d7)',
  'linear-gradient(135deg, #fa709a, #fee140)',
  'linear-gradient(135deg, #a18cd1, #fbc2eb)',
]

const DEFAULT_PROMPTS = [
  { label: '写一首诗', prompt: '请以星空为题，写一首古风诗', icon: IconEdit },
  { label: '解释代码', prompt: '请解释以下代码的功能和逻辑', icon: IconCode },
  { label: '翻译文本', prompt: '请将以下内容翻译成英文', icon: IconTranslate },
  { label: '总结内容', prompt: '请帮我总结以下内容的要点', icon: IconBook },
  { label: '设计方案', prompt: '请帮我设计一个技术方案', icon: IconIdea },
  { label: '分析数据', prompt: '请帮我分析以下数据并给出结论', icon: IconAnalytics },
]

const planets = computed(() => {
  const prompts = generatePromptsFromUsage()
  const count = Math.min(prompts.length, 6)
  return prompts.slice(0, count).map((p, i) => {
    const angle = (i * 360 / count) * (Math.PI / 180)
    const radius = 120
    return {
      ...p,
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
      delay: i * 80,
      color: PLANET_COLORS[i % PLANET_COLORS.length],
    }
  })
})

function generatePromptsFromUsage() {
  // 从今日对话中提取关键词生成提示词
  const today = new Date().toISOString().slice(0, 10)
  const recentMsgs = []
  for (const session of chatStore.sessions.slice(0, 10)) {
    const msgs = chatStore.getMessages(session.id)
    for (const m of msgs) {
      if (m.role === 'user') recentMsgs.push(m.content)
    }
  }

  if (recentMsgs.length === 0) return DEFAULT_PROMPTS

  // 根据最近对话生成相关提示词
  const keywords = extractKeywords(recentMsgs)
  const dynamicPrompts = []

  if (keywords.has('代码') || keywords.has('code') || keywords.has('程序')) {
    dynamicPrompts.push({ label: '优化代码', prompt: '请帮我优化以下代码的性能', icon: IconCode })
  }
  if (keywords.has('分析') || keywords.has('数据') || keywords.has('报告')) {
    dynamicPrompts.push({ label: '深度分析', prompt: '请从多个维度深入分析以下内容', icon: IconAnalytics })
  }
  if (keywords.has('写') || keywords.has('文案') || keywords.has('文章')) {
    dynamicPrompts.push({ label: '润色文案', prompt: '请帮我润色以下文案，使其更优美', icon: IconEdit })
  }
  if (keywords.has('翻译') || keywords.has('translate') || keywords.has('英文')) {
    dynamicPrompts.push({ label: '中英互译', prompt: '请将以下内容进行中英互译', icon: IconTranslate })
  }
  if (keywords.has('设计') || keywords.has('架构') || keywords.has('方案')) {
    dynamicPrompts.push({ label: '设计方案', prompt: '请帮我设计一个技术方案', icon: IconIdea })
  }
  if (keywords.has('学习') || keywords.has('教程') || keywords.has('概念')) {
    dynamicPrompts.push({ label: '知识讲解', prompt: '请用通俗易懂的方式讲解以下概念', icon: IconBook })
  }

  // 补齐到 6 个
  while (dynamicPrompts.length < 6) {
    const fallback = DEFAULT_PROMPTS[dynamicPrompts.length % DEFAULT_PROMPTS.length]
    if (!dynamicPrompts.find(p => p.label === fallback.label)) {
      dynamicPrompts.push(fallback)
    } else {
      dynamicPrompts.push(DEFAULT_PROMPTS[(dynamicPrompts.length + 2) % DEFAULT_PROMPTS.length])
    }
  }

  return dynamicPrompts
}

function extractKeywords(msgs) {
  const words = new Set()
  const allText = msgs.join(' ').toLowerCase()
  const keywords = ['代码', 'code', '程序', '分析', '数据', '报告', '写', '文案', '文章',
    '翻译', 'translate', '英文', '设计', '架构', '方案', '学习', '教程', '概念',
    'bug', '测试', '部署', '数据库', '接口', '算法', '优化', '重构']
  for (const kw of keywords) {
    if (allText.includes(kw)) words.add(kw)
  }
  return words
}

function quickSend(event, prompt) {
  const planetEl = event.currentTarget
  const inputEl = inputRef.value
  if (planetEl && inputEl) {
    createMeteor(planetEl, inputEl)
  }
  showPlanets.value = false
  setTimeout(() => {
    inputText.value = prompt
    autoResize()
  }, 450)
}

function createMeteor(fromEl, toEl) {
  const fromRect = fromEl.getBoundingClientRect()
  const toRect = toEl.getBoundingClientRect()

  const startX = fromRect.left + fromRect.width / 2
  const startY = fromRect.top + fromRect.height / 2
  const endX = toRect.left + toRect.width / 2
  const endY = toRect.top + toRect.height / 2

  const meteor = document.createElement('div')
  meteor.className = 'meteor'
  meteor.style.left = startX + 'px'
  meteor.style.top = startY + 'px'
  document.body.appendChild(meteor)

  const duration = 400
  const start = performance.now()

  function animate(now) {
    const t = Math.min((now - start) / duration, 1)
    // ease-out cubic
    const ease = 1 - Math.pow(1 - t, 3)
    const x = startX + (endX - startX) * ease
    const y = startY + (endY - startY) * ease
    meteor.style.left = x + 'px'
    meteor.style.top = y + 'px'
    meteor.style.opacity = 1 - t * 0.5
    meteor.style.transform = `scale(${1 - t * 0.6})`

    if (t < 1) {
      requestAnimationFrame(animate)
    } else {
      meteor.remove()
    }
  }
  requestAnimationFrame(animate)
}

// ── Computed ──
const canSend = computed(() => {
  return inputText.value.trim() && !isStreaming.value
})

// ── 当前会话 ID（响应式） ──
const currentSessionId = computed(() => chatStore.currentSessionId)

// ── 初始化 ──
onMounted(async () => {
  config.value = getLLMConfig()

  // 从路由恢复会话
  const routeSessionId = route.params.sessionId
  if (routeSessionId) {
    chatStore.setCurrentSession(routeSessionId)
    loadMessages()
  } else if (chatStore.currentSessionId) {
    router.replace(`/chat/${chatStore.currentSessionId}`)
  }

  // 添加滚动事件监听
  if (messagesRef.value) {
    messagesRef.value.addEventListener('scroll', handleScroll)
  }
})

onUnmounted(() => {
  abortController?.abort()
  // 移除滚动事件监听
  if (messagesRef.value) {
    messagesRef.value.removeEventListener('scroll', handleScroll)
  }
})

// 监听路由变化
watch(() => route.params.sessionId, (newId, oldId) => {
  if (newId && newId !== oldId) {
    chatStore.setCurrentSession(newId)
    loadMessages()
  } else if (!newId && chatStore.currentSessionId) {
    router.replace(`/chat/${chatStore.currentSessionId}`)
  }
})

// 监听 localStorage 变化（设置页修改后实时生效）
watch(() => route.path, () => {
  config.value = getLLMConfig()
})

// ── 加载消息 ──
function loadMessages() {
  messages.value = chatStore.currentMessages.map(m => ({
    ...m,
    thinkingExpanded: false,
  }))
  nextTick(() => renderMermaidBlocks())
}

// ── 确保会话存在 ──
function ensureSession() {
  if (chatStore.currentSessionId) return

  const title = inputText.value.slice(0, 50) || '新对话'
  const session = chatStore.createSession(title)
  router.push(`/chat/${session.id}`)
}

// ── 发送消息 ──
async function sendMessage() {
  const text = inputText.value.trim()
  if (!text || isStreaming.value) return

  // 检查配置
  const currentModel = config.value.models?.find(m => m.name === config.value.currentModel) || config.value.models?.[0]
  if (!currentModel?.baseUrl) {
    ElMessage.warning('请先在设置中配置模型')
    router.push('/settings')
    return
  }

  ensureSession()

  // 添加用户消息
  const userMsg = { role: 'user', content: text }
  chatStore.addMessage(chatStore.currentSessionId, userMsg)
  messages.value.push({ ...userMsg })

  inputText.value = ''
  resetTextareaHeight()
  scrollToBottom()

  // 添加 assistant 消息占位
  const assistantMsg = reactive({
    role: 'assistant',
    content: '',
    thinking: null,
    thinkingExpanded: false,
    tools: [],
  })
  messages.value.push(assistantMsg)
  currentAssistantMsg.value = assistantMsg
  isStreaming.value = true

  // 构建消息历史（发送给 LLM）
  const chatMessages = buildChatMessages(text)

  abortController = new AbortController()

  try {
    const stream = chatStream(chatMessages, config.value, abortController.signal)

    for await (const chunk of stream) {
      switch (chunk.type) {
        case 'thinking':
          if (assistantMsg.thinking) {
            assistantMsg.thinking += chunk.content
          } else {
            assistantMsg.thinking = chunk.content
          }
          break
        case 'text':
          assistantMsg.content += chunk.content
          break
        case 'tool_call':
          handleToolCallDelta(assistantMsg, chunk.content)
          break
        case 'usage':
          usageStore.addRecord({
            model: config.value.currentModel,
            promptTokens: chunk.content.prompt_tokens,
            completionTokens: chunk.content.completion_tokens,
            totalTokens: chunk.content.total_tokens,
          })
          break
      }
      // 只在用户在底部时才自动滚动
      if (isAtBottom.value) {
        scrollToBottom()
      }
    }
  } catch (err) {
    if (err.name === 'AbortError') {
      assistantMsg.content += '\n\n*[已停止生成]*'
    } else {
      assistantMsg.content = `请求失败: ${err.message}`
    }
  } finally {
    isStreaming.value = false
    currentAssistantMsg.value = null
    abortController = null

    // 渲染 Mermaid 图表（延迟一帧确保 DOM 已更新）
    nextTick(() => renderMermaidBlocks())

    scrollToBottom()

    // 保存 assistant 消息到 store
    chatStore.addMessage(chatStore.currentSessionId, {
      role: 'assistant',
      content: assistantMsg.content,
      thinking: assistantMsg.thinking,
      tools: assistantMsg.tools.map(t => ({ ...t })),
    })

    // 生成标题
    try {
      const title = await generateTitle(text, config.value)
      if (title) {
        chatStore.updateSessionTitle(chatStore.currentSessionId, title)
      }
    } catch (e) {
      console.error('生成标题失败:', e)
    }

    // 生成新 slogan（异步，不阻塞）
    generateNewSlogan(text)
  }
}

/**
 * 基于今日对话生成新 slogan
 */
async function generateNewSlogan(latestUserMsg) {
  try {
    // 收集今日对话摘要
    const today = new Date().toISOString().slice(0, 10)
    const summaries = []
    for (const session of chatStore.sessions) {
      const msgs = chatStore.getMessages(session.id)
      if (!msgs.length) continue
      const userMsgs = msgs.filter(m => m.role === 'user').map(m => m.content.slice(0, 50))
      if (userMsgs.length) summaries.push(...userMsgs)
    }
    summaries.push(latestUserMsg.slice(0, 50))

    const prompt = summaries.length > 0
      ? `根据以下今日对话内容，生成一句简短 slogan（不超过15字）。\n要求：星辰/宇宙/天文主题，古风文雅，意境优美。\n\n今日对话：\n${summaries.slice(-5).join('\n')}`
      : '生成一句简短 slogan（不超过15字）。星辰/宇宙主题，古风文雅，意境优美。'

    await sloganStore.generateSlogan(prompt, (p) => generateSlogan(p, config.value))
  } catch (e) {
    console.error('生成 slogan 失败:', e)
  }
}

/**
 * 构建发送给 LLM 的消息数组
 */
function buildChatMessages(userText) {
  const systemMessage = {
    role: 'system',
    content: '你是一个有用的 AI 助手。请用中文回答用户的问题。',
  }

  // 从 store 加载历史消息
  const history = chatStore.getMessages(chatStore.currentSessionId)
    .filter(m => m.role === 'user' || (m.role === 'assistant' && m.content))
    .map(m => ({
      role: m.role,
      content: m.content,
    }))

  return [systemMessage, ...history]
}

/**
 * 处理 tool_calls 增量数据
 */
function handleToolCallDelta(msg, delta) {
  const { index, id, function: fn } = delta

  // 确保 tools 数组有足够长度
  while (msg.tools.length <= index) {
    msg.tools.push({ name: '', done: false, args: '' })
  }

  const tool = msg.tools[index]
  if (id) tool.id = id
  if (fn?.name) tool.name = fn.name
  if (fn?.arguments) tool.args = (tool.args || '') + fn.arguments
}

// ── 停止生成 ──
function stopGeneration() {
  abortController?.abort()
}

// ── 工具函数 ──
function handleKeydown(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    sendMessage()
  }
}

function autoResize() {
  const textarea = inputRef.value
  if (textarea) {
    textarea.style.height = 'auto'
    textarea.style.height = Math.min(textarea.scrollHeight, 174) + 'px'
  }
}

function resetTextareaHeight() {
  if (inputRef.value) {
    inputRef.value.style.height = 'auto'
  }
}

function scrollToBottom() {
  nextTick(() => {
    if (messagesRef.value) {
      messagesRef.value.scrollTop = messagesRef.value.scrollHeight
      isAtBottom.value = true
    }
  })
}

// 检查是否在底部（距离底部 50px 以内）
function checkIfAtBottom() {
  if (!messagesRef.value) return true
  const { scrollTop, scrollHeight, clientHeight } = messagesRef.value
  return scrollHeight - scrollTop - clientHeight < 50
}

// 处理用户滚动事件
function handleScroll() {
  isAtBottom.value = checkIfAtBottom()
}

function copyMessage(text) {
  navigator.clipboard.writeText(text)
  ElMessage.success('已复制')
}

function renderMd(text) {
  return renderMarkdown(text)
}
</script>

<style scoped lang="scss">
.chat-view {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #f7f7f5;
}

/* ── 消息区域 ── */
/* ── 消息区域（带渐入渐出） ── */
.chat-messages-wrapper {
  flex: 1;
  position: relative;
  overflow: hidden;
}

.chat-messages {
  height: 100%;
  overflow-y: auto;
  padding: 32px 24px 24px;
}

/* 顶部渐变 */
.fade-top {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 36px;
  background: linear-gradient(to bottom, var(--bg-page) 10%, transparent);
  z-index: 2;
  pointer-events: none;
}

/* 底部渐变 */
.fade-bottom {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 36px;
  background: linear-gradient(to top, var(--bg-page) 10%, transparent);
  z-index: 2;
  pointer-events: none;
}

.chat-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
}

.empty-center {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  padding: 20px;
}

/* ── Logo ── */
.logo-ring {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  padding: 3px;
  background: linear-gradient(135deg, #E3AA4E, #E76377, #3049C6, #E3AA4E);
  background-size: 300% 300%;
  animation: logo-glow 4s ease infinite;
  box-shadow: 0 0 20px rgba(227, 170, 78, 0.3), 0 0 32px rgba(231, 99, 119, 0.2);
  position: relative;
  z-index: 10;
  transition: transform 0.3s ease;
}

.empty-center:hover .logo-ring {
  transform: scale(1.08);
}

.logo-icon {
  width: 100%;
  height: 100%;
  background: #1a1a1a;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  color: #fff;
}

/* ── 文字（紧贴 Logo） ── */
.empty-title {
  font-size: 20px;
  font-weight: 600;
  color: #1a1a1a;
  margin-top: 14px;
  margin-bottom: 0;
}

.empty-desc {
  font-size: 13px;
  color: #999;
  margin-top: 6px;
}

/* ── 行星层（absolute，不影响布局） ── */
.planets-layer {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 0;
  height: 0;
  pointer-events: none;
  z-index: 5;
}

.orbit {
  position: absolute;
  top: 50%;
  left: 50%;
  border-radius: 50%;
  border: 1px dashed rgba(0, 0, 0, 0.06);
  transform: translate(-50%, -50%);
  opacity: 0;
  transition: opacity 0.4s ease;
  pointer-events: none;
}

.empty-center:hover .orbit { opacity: 1; }

.orbit-1 { width: 220px; height: 220px; }
.orbit-2 { width: 300px; height: 300px; }

.planet {
  position: absolute;
  top: 0;
  left: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  cursor: pointer;
  opacity: 0;
  z-index: 5;
  transform: translate(-50%, -50%) scale(0);
  transition: opacity 0.4s cubic-bezier(0.34, 1.56, 0.64, 1),
              transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
  transition-delay: var(--delay, 0ms);
  pointer-events: auto;
}

.planet.visible {
  opacity: 1;
  transform: translate(
    calc(-50% + var(--x)),
    calc(-50% + var(--y))
  ) scale(1);
}

.planet-body {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.planet:hover .planet-body {
  transform: scale(1.15);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.25);
}

.planet-label {
  font-size: 11px;
  color: #666;
  font-weight: 500;
  white-space: nowrap;
  background: rgba(255, 255, 255, 0.92);
  padding: 2px 8px;
  border-radius: 10px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
  opacity: 0;
  transform: translateY(-3px);
  transition: all 0.2s ease;
}

.planet:hover .planet-label {
  opacity: 1;
  transform: translateY(0);
}

/* ── 流星效果 ── */
.meteor {
  position: fixed;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: linear-gradient(135deg, #E3AA4E, #E76377);
  box-shadow: 0 0 16px rgba(227, 170, 78, 0.8), 0 0 32px rgba(231, 99, 119, 0.5);
  z-index: 9999;
  pointer-events: none;
}

.meteor::after {
  content: '';
  position: absolute;
  top: 50%;
  right: 100%;
  width: 50px;
  height: 2px;
  transform: translateY(-50%);
  background: linear-gradient(90deg, transparent, rgba(227, 170, 78, 0.7));
  border-radius: 1px;
}

@keyframes logo-glow {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

/* ── 消息组 ── */
.message-group {
  max-width: 800px;
  margin: 0 auto 24px;
}

/* ── 消息项 ── */
.message-item {
  &--user {
    display: flex;
    justify-content: flex-end;
    margin-bottom: 8px;

    .user-text {
      display: inline-block;
      padding: 10px 14px;
      background: #3049C6;
      color: #fff;
      border-radius: 12px 12px 4px 12px;
      font-size: 14px;
      line-height: 1.6;
      max-width: 80%;
      word-break: break-word;
      white-space: pre-wrap;
    }
  }

  &--assistant {
    padding: 0;
  }
}

/* ── 思考卡片 ── */
.thinking-card {
  margin-bottom: 8px;

  .thinking-header {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 6px 12px;
    background: #fff;
    border: 1px solid #e8e8e8;
    border-radius: 8px;
    cursor: pointer;
    font-size: 12px;
    color: #999;
    transition: all 0.2s;

    &:hover {
      background: #f5f5f5;
    }
  }

  .thinking-icon {
    color: #999;

    &.pulse {
      color: #7c3aed;
      animation: thinking-pulse 1.5s ease-in-out infinite;
    }
  }

  &.streaming .thinking-header {
    border-color: rgba(124, 58, 237, 0.2);
    background: rgba(124, 58, 237, 0.03);
  }

  .thinking-arrow {
    transition: transform 0.2s;
    color: #999;
  }

  &.expanded .thinking-arrow {
    transform: rotate(90deg);
  }

  .thinking-content {
    margin-top: 8px;
    padding: 12px;
    background: #fff;
    border: 1px solid #e8e8e8;
    border-radius: 8px;
    font-size: 13px;
    color: #666;
    line-height: 1.6;
  }
}

@keyframes thinking-pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(0.95); }
}

/* ── 工具调用 ── */
.tool-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  margin-bottom: 4px;
  font-size: 12px;
  color: #666;

  .tool-icon {
    color: #999;

    &.tool-done {
      color: #20804E;
    }
  }

  .tool-name {
    color: #333;
  }
}

/* ── 消息内容 ── */
.message-content {
  font-size: 14px;
  line-height: 1.7;
  color: #1a1a1a;

  :deep(.md-content) {
    h1, h2, h3, h4, h5, h6 {
      margin-top: 16px;
      margin-bottom: 8px;
      font-weight: 600;
      color: #1a1a1a;
    }

    h1 { font-size: 20px; }
    h2 { font-size: 18px; }
    h3 { font-size: 16px; }

    p {
      margin-bottom: 12px;
    }

    ul, ol {
      margin-bottom: 12px;
      padding-left: 24px;
    }

    li {
      margin-bottom: 4px;
    }

    code {
      background: #f5f5f5;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 13px;
      font-family: 'SF Mono', 'Fira Code', monospace;
    }

    pre {
      margin: 0;
      padding: 14px 16px;
      background: transparent;
      border-radius: 0;
      overflow-x: auto;

      code {
        background: none;
        padding: 0;
        color: #383a42;
      }
    }

    blockquote {
      border-left: 3px solid #e8e8e8;
      padding-left: 12px;
      margin-left: 0;
      margin-bottom: 12px;
      color: #666;
    }

    hr {
      border: none;
      border-top: 1px solid #e8e8e8;
      margin: 16px 0;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 12px;

      th, td {
        border: 1px solid #e8e8e8;
        padding: 8px 12px;
        text-align: left;
        font-size: 13px;
      }

      th {
        background: #f9f9f9;
        font-weight: 600;
      }
    }

    strong {
      font-weight: 600;
    }

    a {
      color: #3049C6;
      text-decoration: none;

      &:hover {
        text-decoration: underline;
      }
    }
  }
}

/* ── 操作按钮 ── */
.message-actions {
  display: flex;
  gap: 4px;
  margin-top: 8px;
  opacity: 0;
  transition: opacity 0.2s;

  .message-item:hover & {
    opacity: 1;
  }

  .action-btn {
    width: 28px;
    height: 28px;
    border: none;
    background: transparent;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #999;
    cursor: pointer;
    transition: all 0.15s;

    &:hover {
      background: #f0f0f0;
      color: #666;
    }
  }
}

/* ── 流式加载 ── */
.streaming-dots {
  display: flex;
  gap: 6px;
  padding: 8px 12px;

  span {
    width: 6px;
    height: 6px;
    background: #999;
    border-radius: 50%;
    animation: bounce 1.4s infinite;

    &:nth-child(2) { animation-delay: 0.2s; }
    &:nth-child(3) { animation-delay: 0.4s; }
  }
}

@keyframes bounce {
  0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
  40% { transform: scale(1); opacity: 1; }
}

/* ═══════════════════════════════════════════════════════
   输入区域
   ═══════════════════════════════════════════════════════ */
.input-area {
  padding: 0 24px 24px;
  display: flex;
  justify-content: center;
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
  position: relative;
  z-index: 3;
  opacity: 0;
  transform: translateY(30px);
}

/* ── 入场动画 ── */
.input-area.slide-up {
  animation: slide-up 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) 0.1s forwards;
}

@keyframes slide-up {
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.input-container {
  width: 100%;
  margin: 0 auto;
  max-width: 800px;
  background: rgba(255, 255, 255, 0.92);
  border-radius: 22px;
  overflow: visible;
  position: relative;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: none;
  transition: all 0.3s ease;
  box-shadow: 0 22px 70px rgba(16, 24, 40, 0.12);
  padding: 16px;

  &.focused {
    box-shadow: 0 0 0 3px rgba(255, 146, 92, 0.15), 0 0 30px rgba(124, 58, 237, 0.12), 0 0 60px rgba(255, 146, 92, 0.08), 0 22px 70px rgba(16, 24, 40, 0.12);
  }

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: 22px;
    padding: 1.5px;
    background: linear-gradient(90deg, rgba(255, 146, 92, 0.9), rgba(255, 195, 103, 0.55), rgba(123, 97, 255, 0.65), rgba(255, 146, 92, 0.85));
    -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.3s ease;
  }

  &.focused::before {
    opacity: 1;
  }

  &::after {
    content: '';
    position: absolute;
    inset: -20px;
    border-radius: 42px;
    background: radial-gradient(ellipse at center, rgba(124, 58, 237, 0.06) 0%, transparent 70%);
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.3s ease;
    filter: blur(20px);
  }

  &.focused::after {
    opacity: 1;
  }
}

/* ── 输入框 ── */
.input-textarea {
  width: 100%;
  padding: 0;
  border: none;
  background: transparent;
  font-family: inherit;
  font-size: 14px;
  line-height: 1.6;
  color: rgba(16, 24, 40, 0.92);
  resize: none;
  outline: none;
  min-height: 56px;
  max-height: 174px;
  overflow-y: auto;
  overflow-x: hidden;
  white-space: pre-wrap;
  word-break: break-word;
  position: relative;
  z-index: 1;

  &::placeholder {
    color: rgba(102, 112, 133, 0.92);
  }

  &:disabled {
    opacity: 0.6;
  }
}

/* ── 工具栏 ── */
.input-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 12px;
  width: 100%;
  position: relative;
  z-index: 1;
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.model-select {
  width: 180px;

  :deep(.el-select__wrapper) {
    padding: 0 12px;
    border-radius: 999px;
    border: 1px solid rgba(16, 24, 40, 0.10);
    background: rgba(255, 255, 255, 0.85);
    box-shadow: none;
    min-height: 32px;
    height: 32px;

    &:hover {
      background: #fff;
      box-shadow: 0 2px 8px rgba(16, 24, 40, 0.08);
    }

    &.is-focused {
      background: #fff;
      box-shadow: 0 2px 8px rgba(16, 24, 40, 0.08);
    }
  }

  :deep(.el-select__selected-item) {
    font-size: 13px;
    font-weight: 500;
    color: rgba(16, 24, 40, 0.78);
  }

  :deep(.el-select__suffix) {
    color: rgba(16, 24, 40, 0.45);
  }
}

.toolbar-btn {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 999px;
  border: 1px solid rgba(16, 24, 40, 0.10);
  background: rgba(255, 255, 255, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(16, 24, 40, 0.62);
  cursor: pointer;
  transition: all 0.15s ease;

  svg {
    width: 16px;
    height: 16px;
  }

  &:hover {
    transform: translateY(-1px);
    background: #fff;
    box-shadow: 0 10px 24px rgba(16, 24, 40, 0.10);
  }
}

.send-btn {
  &.send-btn:not(.stop-btn) {
    background: #2563eb;
    border-color: #2563eb;
    color: white;
    box-shadow: 0 12px 26px rgba(37, 99, 235, 0.3);

    &:hover {
      background: #1d4ed8;
      box-shadow: 0 16px 34px rgba(37, 99, 235, 0.4);
    }
  }

  &.stop-btn {
    background: rgba(16, 24, 40, 0.92);
    border-color: rgba(16, 24, 40, 0.10);
    color: white;
    box-shadow: 0 12px 26px rgba(16, 24, 40, 0.18);

    &:hover {
      background: #0b1220;
      box-shadow: 0 16px 34px rgba(16, 24, 40, 0.24);
    }
  }
}
</style>
