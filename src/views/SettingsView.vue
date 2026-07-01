<!-- @author ShanhaiSky -->
<template>
  <div class="settings-view">
    <div class="settings-container">
      <div class="settings-header">
        <h1 class="settings-title">设置</h1>
        <span class="settings-version">v1.2</span>
      </div>

      <!-- 更新日志 Banner -->
      <div v-if="showUpdateBanner" class="update-banner" :class="{ expanded: bannerExpanded }">
        <div class="banner-header" @click="bannerExpanded = !bannerExpanded">
          <div class="banner-title">
            <svg viewBox="0 0 24 24" fill="none" width="18" height="18">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill="#10b981"/>
            </svg>
            <span>🎉 StarChat v1.2 更新</span>
          </div>
          <svg viewBox="0 0 16 16" fill="none" width="14" height="14" class="banner-arrow">
            <path d="M6 4L10 8L6 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <div v-show="bannerExpanded" class="banner-content">
          <div class="update-item">
            <span class="update-tag new">新功能</span>
            <span class="update-text">MCP 服务支持 — 连接外部工具，扩展 AI 能力</span>
          </div>
          <div class="update-item">
            <span class="update-tag new">新功能</span>
            <span class="update-text">ECharts 图表渲染 — AI 自动生成可视化图表</span>
          </div>
          <div class="update-item">
            <span class="update-tag new">新功能</span>
            <span class="update-text">MinIO 文件上传 — 支持拖拽上传文件到对话</span>
          </div>
          <div class="update-item">
            <span class="update-tag new">新功能</span>
            <span class="update-text">工具调用详情 — 展示工具输入输出参数</span>
          </div>
          <div class="update-item">
            <span class="update-tag improve">优化</span>
            <span class="update-text">侧边栏布局优化 — 新增新建对话按钮</span>
          </div>
          <div class="update-item">
            <span class="update-tag improve">优化</span>
            <span class="update-text">流式输出稳定性 — 修复图表渲染闪烁问题</span>
          </div>
          <button class="banner-close" @click="closeBanner">我知道了</button>
        </div>
      </div>

      <!-- Tab 切换 -->
      <div class="tab-bar">
        <button class="tab-btn" :class="{ active: tab === 'config' }" @click="tab = 'config'">模型配置</button>
        <button class="tab-btn" :class="{ active: tab === 'mcp' }" @click="tab = 'mcp'">MCP 服务</button>
        <button class="tab-btn" :class="{ active: tab === 'storage' }" @click="tab = 'storage'">存储配置</button>
        <button class="tab-btn" :class="{ active: tab === 'usage' }" @click="tab = 'usage'">用量看板</button>
      </div>

      <!-- 模型配置 -->
      <div v-show="tab === 'config'" class="settings-form">
        <div class="form-group">
          <label class="form-label">模型列表</label>
          <div class="model-list">
            <div
              v-for="(m, idx) in form.models"
              :key="idx"
              class="model-card"
              :class="{ active: m.name === form.currentModel }"
            >
              <div class="model-header">
                <div class="model-name-row">
                  <el-input v-model="m.name" placeholder="模型名称" class="model-name-input" />
                  <span v-if="m.name === form.currentModel" class="current-badge">当前</span>
                </div>
                <div class="model-actions">
                  <el-button text class="model-act-btn" :class="{ active: m.name === form.currentModel }" @click="form.currentModel = m.name" title="设为当前模型">
                    <svg viewBox="0 0 16 16" fill="none" width="14" height="14"><path d="M4.5 7.7L6.99 10.19a.5.5 0 00.71 0L11.5 5.7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><circle cx="8" cy="8" r="6.5" stroke="currentColor" stroke-width="1" fill="none"/></svg>
                  </el-button>
                  <el-button text class="model-act-btn delete" @click="removeModel(idx)" :disabled="form.models.length <= 1">
                    <svg viewBox="0 0 16 16" fill="none" width="14" height="14"><path d="M4 4L12 12M12 4L4 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
                  </el-button>
                </div>
              </div>
              <div class="model-fields">
                <div class="field-row">
                  <label class="field-label">Base URL</label>
                  <el-input v-model="m.baseUrl" placeholder="https://api.deepseek.com/v1" size="small" />
                </div>
                <div class="field-row">
                  <label class="field-label">API Key</label>
                  <el-input v-model="m.apiKey" type="password" show-password placeholder="可选" size="small" />
                </div>
                <div class="field-row">
                  <label class="field-label">认证方式</label>
                  <el-select v-model="m.authType" size="small" style="flex:1">
                    <el-option value="bearer">
                      <span class="auth-option">Bearer Token</span>
                      <span class="auth-desc">OpenAI / DeepSeek 等标准 API</span>
                    </el-option>
                    <el-option value="x-apikey">
                      <span class="auth-option">X-APIKey</span>
                      <span class="auth-desc">企业内网网关认证</span>
                    </el-option>
                    <el-option value="x-api-key">
                      <span class="auth-option">X-Api-Key</span>
                      <span class="auth-desc">AWS API Gateway 默认格式</span>
                    </el-option>
                    <el-option value="basic">
                      <span class="auth-option">Basic Auth</span>
                      <span class="auth-desc">传统 HTTP 基础认证</span>
                    </el-option>
                    <el-option value="custom">
                      <span class="auth-option">自定义 Header</span>
                      <span class="auth-desc">任意自定义请求头</span>
                    </el-option>
                  </el-select>
                </div>
                <div v-if="m.authType === 'custom'" class="field-row">
                  <label class="field-label">Header 名称</label>
                  <el-input v-model="m.authHeaderName" placeholder="例如: X-Token" size="small" />
                </div>
                <div v-if="m.authType === 'x-apikey'" class="field-row">
                  <label class="field-label">思考模式</label>
                  <el-select v-model="m.thinkingMode" size="small" style="flex:1">
                    <el-option label="关闭" value="off" />
                    <el-option label="High（标准思考）" value="high" />
                    <el-option label="Max（深度思考）" value="max" />
                  </el-select>
                </div>
              </div>
            </div>
          </div>
          <el-button text class="add-model-btn" @click="addModel">
            <svg viewBox="0 0 16 16" fill="none" width="14" height="14"><path d="M8 3V13M3 8H13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
            添加模型
          </el-button>
        </div>

        <div class="form-group">
          <label class="form-label">支持推理内容</label>
          <el-switch v-model="form.supportsReasoning" />
          <p class="form-hint">开启后将显示模型的思考过程（需模型支持 reasoning_content 字段）</p>
        </div>

        <div class="form-actions">
          <el-button type="primary" @click="handleSave" :loading="saving">保存配置</el-button>
          <el-button @click="handleTest" :loading="testing" :disabled="!currentModelConfig.baseUrl">测试当前模型</el-button>
        </div>

        <div v-if="testResult" class="test-result" :class="{ success: testResult.success }">{{ testResult.message }}</div>
      </div>

      <!-- MCP 服务配置 -->
      <div v-show="tab === 'mcp'" class="settings-form">
        <div class="form-group">
          <label class="form-label">MCP 服务器列表</label>
          <p class="form-hint" style="margin-bottom: 12px">支持 SSE 和 StreamableHTTP 两种传输方式，可配置认证头</p>
          <div class="model-list">
            <div
              v-for="s in mcpStore.servers"
              :key="s.id"
              class="model-card"
              :class="{ active: mcpStatus[s.id]?.status === 'connected' }"
            >
              <div class="model-header">
                <div class="model-name-row">
                  <el-input v-model="s.name" placeholder="服务器名称" class="model-name-input" @change="mcpStore.updateServer(s.id, { name: s.name })" />
                  <span v-if="mcpStatus[s.id]?.status === 'connected'" class="current-badge" style="background: rgba(34,197,94,0.08); color: #16a34a;">已连接</span>
                  <span v-else-if="mcpStatus[s.id]?.status === 'connecting'" class="current-badge" style="background: rgba(234,179,8,0.08); color: #ca8a04;">连接中</span>
                  <span v-else-if="mcpStatus[s.id]?.status === 'error'" class="current-badge" style="background: rgba(239,68,68,0.08); color: #dc2626;">错误</span>
                </div>
                <div class="model-actions">
                  <el-button text class="model-act-btn" :class="{ active: s.enabled }" @click="mcpStore.toggleServer(s.id)" :title="s.enabled ? '禁用' : '启用'">
                    <template v-if="s.enabled">
                      <svg viewBox="0 0 16 16" fill="none" width="14" height="14"><path d="M4.5 7.7L6.99 10.19a.5.5 0 00.71 0L11.5 5.7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><circle cx="8" cy="8" r="6.5" stroke="currentColor" stroke-width="1" fill="none"/></svg>
                    </template>
                    <template v-else>
                      <svg viewBox="0 0 16 16" fill="none" width="14" height="14"><circle cx="8" cy="8" r="6.5" stroke="currentColor" stroke-width="1" fill="none"/></svg>
                    </template>
                  </el-button>
                  <el-button text class="model-act-btn delete" @click="handleRemoveMcpServer(s.id)">
                    <svg viewBox="0 0 16 16" fill="none" width="14" height="14"><path d="M4 4L12 12M12 4L4 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
                  </el-button>
                </div>
              </div>
              <div class="model-fields">
                <div class="field-row">
                  <label class="field-label">URL</label>
                  <el-input v-model="s.url" placeholder="https://example.com/mcp" size="small" @change="mcpStore.updateServer(s.id, { url: s.url })" />
                </div>
                <div class="field-row">
                  <label class="field-label">传输方式</label>
                  <el-select v-model="s.type" size="small" style="flex:1" @change="mcpStore.updateServer(s.id, { type: s.type })">
                    <el-option label="SSE（传统）" value="sse" />
                    <el-option label="StreamableHTTP（推荐）" value="streamableHttp" />
                  </el-select>
                </div>
                <div class="field-row">
                  <label class="field-label">Authorization</label>
                  <el-input v-model="s.headers.Authorization" placeholder="Bearer your-api-key" size="small" @change="mcpStore.updateServer(s.id, { headers: s.headers })" />
                </div>
                <div class="field-row">
                  <label class="field-label">自动连接</label>
                  <el-switch v-model="s.autoConnect" size="small" @change="mcpStore.updateServer(s.id, { autoConnect: s.autoConnect })" />
                </div>
                <div class="field-row">
                  <label class="field-label">操作</label>
                  <div style="display: flex; gap: 8px; flex: 1">
                    <el-button v-if="mcpStatus[s.id]?.status !== 'connected'" size="small" type="primary" @click="handleConnectMcp(s)" :loading="mcpStatus[s.id]?.status === 'connecting'">连接</el-button>
                    <el-button v-else size="small" @click="handleDisconnectMcp(s.id)">断开</el-button>
                  </div>
                </div>
                <div v-if="mcpStatus[s.id]?.error" class="test-result" style="margin-top: 8px">
                  {{ mcpStatus[s.id].error }}
                </div>
                <!-- 已发现工具列表 -->
                <div v-if="mcpStatus[s.id]?.tools?.length" class="mcp-tools-list">
                  <div class="mcp-tools-title">已发现工具 ({{ mcpStatus[s.id].tools.length }})</div>
                  <div v-for="tool in mcpStatus[s.id].tools" :key="tool.name" class="mcp-tool-item">
                    <span class="mcp-tool-name">{{ tool.name }}</span>
                    <span class="mcp-tool-desc">{{ tool.description }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <el-button text class="add-model-btn" @click="handleAddMcpServer">
            <svg viewBox="0 0 16 16" fill="none" width="14" height="14"><path d="M8 3V13M3 8H13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
            添加 MCP 服务器
          </el-button>
        </div>
      </div>

      <!-- 存储配置 -->
      <div v-show="tab === 'storage'" class="settings-form">
        <div class="form-group">
          <label class="form-label">MinIO 对象存储</label>
          <p class="form-hint" style="margin-bottom: 16px">配置 MinIO 服务，支持文件上传到对话中</p>

          <div class="model-fields" style="gap: 12px">
            <div class="field-row">
              <label class="field-label">Endpoint</label>
              <el-input v-model="minioForm.endpoint" placeholder="http://localhost:9000" size="small" />
            </div>
            <div class="field-row">
              <label class="field-label">Access Key</label>
              <el-input v-model="minioForm.accessKey" placeholder="minioadmin" size="small" />
            </div>
            <div class="field-row">
              <label class="field-label">Secret Key</label>
              <el-input v-model="minioForm.secretKey" type="password" show-password placeholder="minioadmin" size="small" />
            </div>
            <div class="field-row">
              <label class="field-label">Bucket</label>
              <el-input v-model="minioForm.bucket" placeholder="starchat" size="small" />
            </div>
          </div>

          <div class="form-actions">
            <el-button type="primary" @click="handleSaveMinio" :loading="minioSaving">保存配置</el-button>
            <el-button @click="handleTestMinio" :loading="minioTesting">测试连接</el-button>
          </div>

          <div v-if="minioTestResult" class="test-result" :class="{ success: minioTestResult.success }">
            {{ minioTestResult.message }}
          </div>
        </div>
      </div>

      <!-- 用量看板 -->
      <div v-show="tab === 'usage'" class="usage-dashboard">
        <!-- 总览卡片 -->
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-value">{{ formatNum(usageStore.totalTokens) }}</div>
            <div class="stat-label">总 Tokens</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">{{ formatNum(usageStore.totalPromptTokens) }}</div>
            <div class="stat-label">输入 Tokens</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">{{ formatNum(usageStore.totalCompletionTokens) }}</div>
            <div class="stat-label">输出 Tokens</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">{{ usageStore.totalRequests }}</div>
            <div class="stat-label">请求次数</div>
          </div>
        </div>

        <!-- 近 7 天趋势 -->
        <div class="chart-card">
          <div class="chart-header">
            <h3>近 7 天用量</h3>
          </div>
          <div class="bar-chart">
            <div
              v-for="day in usageStore.byDay"
              :key="day.date"
              class="bar-col"
            >
              <div class="bar-value">{{ day.tokens > 0 ? formatNum(day.tokens) : '' }}</div>
              <div class="bar-track">
                <div class="bar-fill" :style="{ height: barHeight(day.tokens) }"></div>
              </div>
              <div class="bar-label">{{ day.label }}</div>
            </div>
          </div>
        </div>

        <!-- 模型分布 -->
        <div class="chart-card">
          <div class="chart-header">
            <h3>模型用量分布</h3>
          </div>
          <div v-if="usageStore.byModel.length === 0" class="empty-hint">暂无数据</div>
          <div v-else class="model-bars">
            <div v-for="m in usageStore.byModel" :key="m.model" class="model-bar-row">
              <div class="model-bar-info">
                <span class="model-bar-name">{{ m.model }}</span>
                <span class="model-bar-tokens">{{ formatNum(m.totalTokens) }} tokens</span>
              </div>
              <div class="model-bar-track">
                <div class="model-bar-fill" :style="{ width: modelBarWidth(m.totalTokens) }">
                  <div class="model-bar-input" :style="{ width: (m.promptTokens / m.totalTokens * 100) + '%' }"></div>
                </div>
              </div>
              <div class="model-bar-detail">
                <span class="detail-input">输入 {{ formatNum(m.promptTokens) }}</span>
                <span class="detail-output">输出 {{ formatNum(m.completionTokens) }}</span>
                <span class="detail-req">{{ m.requests }} 次</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 最近请求 -->
        <div class="chart-card">
          <div class="chart-header">
            <h3>最近请求</h3>
            <el-button text size="small" @click="handleClearUsage" class="clear-btn">清空记录</el-button>
          </div>
          <div v-if="usageStore.recentRecords.length === 0" class="empty-hint">暂无数据</div>
          <div v-else class="records-table">
            <div class="record-row record-header">
              <span>时间</span><span>模型</span><span>输入</span><span>输出</span><span>合计</span>
            </div>
            <div v-for="(r, i) in usageStore.recentRecords" :key="i" class="record-row">
              <span class="record-time">{{ formatTime(r.timestamp) }}</span>
              <span class="record-model">{{ r.model }}</span>
              <span>{{ formatNum(r.promptTokens) }}</span>
              <span>{{ formatNum(r.completionTokens) }}</span>
              <span class="record-total">{{ formatNum(r.totalTokens) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 致谢 -->
      <div class="settings-footer">
        <p>UI 设计参照 WPS 灵犀 AI 助手，感谢 WPS 灵犀团队</p>
        <p class="footer-author">@ShanhaiSky</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, reactive } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getLLMConfig, setLLMConfig, testConnection } from '@/services/llm'
import { useUsageStore } from '@/stores/usage'
import { useMcpStore } from '@/stores/mcp'
import { connectServer, disconnectServer, getServerStatus, onConnectionChange } from '@/services/mcp'
import { getMinioConfig, setMinioConfig, testMinioConnection } from '@/services/minio'

const usageStore = useUsageStore()
const mcpStore = useMcpStore()
const tab = ref('config')

// MCP 连接状态（响应式）
const mcpStatus = reactive({})
let unsubMcp = null

// MinIO 状态
const minioForm = ref(getMinioConfig())
const minioSaving = ref(false)
const minioTesting = ref(false)
const minioTestResult = ref(null)

// 更新日志 Banner
const BANNER_KEY = 'audichat_update_banner_v1.2'
const showUpdateBanner = ref(!localStorage.getItem(BANNER_KEY))
const bannerExpanded = ref(true)

const form = ref({
  models: [{ name: 'deepseek-v4-flash', baseUrl: 'https://api.deepseek.com/v1', apiKey: '', authType: 'bearer', authHeaderName: '', thinkingMode: 'off' }],
  currentModel: 'deepseek-v4-flash',
  supportsReasoning: false,
})

const saving = ref(false)
const testing = ref(false)
const testResult = ref(null)

const currentModelConfig = computed(() => {
  return form.value.models.find(m => m.name === form.value.currentModel) || form.value.models[0] || {}
})

onMounted(() => {
  form.value = JSON.parse(JSON.stringify(getLLMConfig()))

  // 初始化 MCP 状态
  mcpStore.servers.forEach(s => {
    mcpStatus[s.id] = getServerStatus(s.id)
  })

  // 监听 MCP 连接状态变更
  unsubMcp = onConnectionChange(snapshot => {
    for (const [id, status] of Object.entries(snapshot)) {
      mcpStatus[id] = status
    }
  })
})

function addModel() {
  form.value.models.push({ name: '', baseUrl: 'https://api.deepseek.com/v1', apiKey: '', authType: 'bearer', authHeaderName: '', thinkingMode: 'off' })
}

function removeModel(idx) {
  if (form.value.models.length <= 1) return
  const removed = form.value.models[idx]
  form.value.models.splice(idx, 1)
  if (form.value.currentModel === removed.name) {
    form.value.currentModel = form.value.models[0].name
  }
}

function handleSave() {
  form.value.models = form.value.models.filter(m => m.name.trim())
  if (form.value.models.length === 0) {
    ElMessage.warning('至少保留一个模型')
    return
  }
  if (!form.value.models.find(m => m.name === form.value.currentModel)) {
    form.value.currentModel = form.value.models[0].name
  }
  saving.value = true
  try {
    setLLMConfig(form.value)
    ElMessage.success('配置已保存')
  } finally {
    saving.value = false
  }
}

async function handleTest() {
  testing.value = true
  testResult.value = null
  try {
    testResult.value = await testConnection(form.value)
  } finally {
    testing.value = false
  }
}

// ── 用量工具函数 ──
function formatNum(n) {
  if (!n) return '0'
  if (n >= 10000) return (n / 1000).toFixed(1) + 'k'
  return n.toLocaleString()
}

function formatTime(ts) {
  const d = new Date(ts)
  return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
}

const maxDayTokens = computed(() => Math.max(...usageStore.byDay.map(d => d.tokens), 1))

function barHeight(tokens) {
  if (!tokens) return '0%'
  return Math.max((tokens / maxDayTokens.value) * 100, 4) + '%'
}

const maxModelTokens = computed(() => Math.max(...usageStore.byModel.map(m => m.totalTokens), 1))

function modelBarWidth(tokens) {
  return Math.max((tokens / maxModelTokens.value) * 100, 4) + '%'
}

async function handleClearUsage() {
  try {
    await ElMessageBox.confirm('确定清空所有用量记录？', '确认')
    usageStore.clearAll()
    ElMessage.success('已清空')
  } catch {}
}

// ── MCP 操作 ──
function handleAddMcpServer() {
  const server = mcpStore.addServer({
    name: 'MCP Server',
    url: '',
    type: 'streamableHttp',
    headers: {},
  })
  mcpStatus[server.id] = { status: 'disconnected', tools: [], error: null }
}

async function handleRemoveMcpServer(id) {
  try {
    await ElMessageBox.confirm('确定删除这个 MCP 服务器吗？', '确认')
    await disconnectServer(id)
    mcpStore.removeServer(id)
    delete mcpStatus[id]
    ElMessage.success('已删除')
  } catch {}
}

async function handleConnectMcp(server) {
  if (!server.url) {
    ElMessage.warning('请先填写服务器 URL')
    return
  }
  mcpStatus[server.id] = { status: 'connecting', tools: [], error: null }
  try {
    await connectServer(server)
    mcpStatus[server.id] = getServerStatus(server.id)
    ElMessage.success(`已连接 "${server.name}"，发现 ${mcpStatus[server.id].tools.length} 个工具`)
  } catch (err) {
    mcpStatus[server.id] = getServerStatus(server.id)
    ElMessage.error(`连接失败: ${err.message}`)
  }
}

async function handleDisconnectMcp(serverId) {
  await disconnectServer(serverId)
  mcpStatus[serverId] = { status: 'disconnected', tools: [], error: null }
  ElMessage.success('已断开')
}

// ── MinIO 操作 ──
function handleSaveMinio() {
  minioSaving.value = true
  try {
    setMinioConfig(minioForm.value)
    ElMessage.success('MinIO 配置已保存')
  } finally {
    minioSaving.value = false
  }
}

async function handleTestMinio() {
  minioTesting.value = true
  minioTestResult.value = null
  try {
    minioTestResult.value = await testMinioConnection(minioForm.value)
  } finally {
    minioTesting.value = false
  }
}

function closeBanner() {
  showUpdateBanner.value = false
  localStorage.setItem(BANNER_KEY, 'closed')
}
</script>

<style scoped lang="scss">
.settings-view {
  height: 100vh;
  overflow-y: auto;
  padding: 40px 24px;
  background: var(--bg-page);
}

.settings-container {
  max-width: 640px;
  margin: 0 auto;
}

/* ── 设置头部 ── */
.settings-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
}

.settings-title {
  font-size: 24px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.settings-version {
  font-size: 12px;
  font-weight: 500;
  color: #6b7280;
  background: #f3f4f6;
  padding: 2px 8px;
  border-radius: 4px;
  border: 1px solid #e5e7eb;
}

/* ── 更新日志 Banner ── */
.update-banner {
  margin-bottom: 20px;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  overflow: hidden;
  background: #fff;
  transition: all 0.2s;
}

.banner-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  cursor: pointer;
  transition: background 0.15s;

  &:hover {
    background: #f9fafb;
  }
}

.banner-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  font-weight: 600;
  color: #10b981;
}

.banner-arrow {
  color: #9ca3af;
  transition: transform 0.2s;
}

.update-banner.expanded .banner-arrow {
  transform: rotate(90deg);
}

.banner-content {
  padding: 0 16px 16px;
  border-top: 1px solid #f3f4f6;
}

.update-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 0;
  border-bottom: 1px solid #f9fafb;

  &:last-of-type {
    border-bottom: none;
  }
}

.update-tag {
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 4px;
  white-space: nowrap;

  &.new {
    background: #dbeafe;
    color: #2563eb;
  }

  &.improve {
    background: #fef3c7;
    color: #d97706;
  }
}

.update-text {
  font-size: 13px;
  color: #4b5563;
}

.banner-close {
  display: block;
  width: 100%;
  padding: 10px;
  margin-top: 12px;
  border: none;
  border-radius: 8px;
  background: #f3f4f6;
  color: #4b5563;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;

  &:hover {
    background: #e5e7eb;
    color: #1f2937;
  }
}

/* ── Tab ── */
.tab-bar {
  display: flex;
  gap: 4px;
  margin-bottom: 20px;
  background: rgba(0, 0, 0, 0.04);
  border-radius: 10px;
  padding: 4px;
}

.tab-btn {
  flex: 1;
  padding: 8px 16px;
  border: none;
  border-radius: 8px;
  background: transparent;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s;

  &.active {
    background: #fff;
    color: var(--text-primary);
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
  }
}

/* ── 配置表单 ── */
.settings-form {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  border: 1px solid var(--border);
}

.form-group {
  margin-bottom: 24px;
  &:last-of-type { margin-bottom: 0; }
}

.form-label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
  margin-bottom: 8px;
}

.form-hint {
  font-size: 12px;
  color: var(--text-muted);
  margin-top: 6px;
}

.model-list { display: flex; flex-direction: column; gap: 12px; margin-bottom: 12px; }

.model-card {
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 14px;
  transition: border-color 0.2s;
  &.active { border-color: #2563eb; background: rgba(37, 99, 235, 0.02); }
}

.model-header { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; }
.model-name-row { flex: 1; display: flex; align-items: center; gap: 8px; }
.model-name-input { flex: 1; }

.current-badge {
  font-size: 11px; padding: 2px 8px; border-radius: 4px;
  background: rgba(37, 99, 235, 0.08); color: #2563eb; font-weight: 500; white-space: nowrap;
}

.model-actions { display: flex; gap: 4px; }

.model-act-btn {
  padding: 4px; color: var(--text-muted); border-radius: 4px;
  &:hover { color: #2563eb; background: rgba(37, 99, 235, 0.08); }
  &.active { color: #2563eb; }
  &.delete:hover:not(:disabled) { color: #dc2626; background: rgba(239, 68, 68, 0.08); }
  &:disabled { opacity: 0.3; cursor: not-allowed; }
}

.model-fields { display: flex; flex-direction: column; gap: 8px; }
.field-row { display: flex; align-items: center; gap: 10px; }
.field-label { font-size: 12px; color: var(--text-secondary); width: 64px; flex-shrink: 0; text-align: right; }

/* ── 认证方式选项样式 ── */
.auth-option {
  font-weight: 500;
  color: var(--text-primary);
}

.auth-desc {
  font-size: 12px;
  color: var(--text-muted);
  margin-left: 8px;
}

.add-model-btn {
  display: flex; align-items: center; gap: 6px; font-size: 13px; color: var(--color-blue); padding: 6px 0;
  &:hover { opacity: 0.8; }
}

.form-actions {
  display: flex; gap: 12px; margin-top: 32px; padding-top: 24px;
  border-top: 1px solid var(--border-light);
}

.test-result {
  margin-top: 16px; padding: 12px 16px; border-radius: 8px; font-size: 13px;
  background: rgba(239, 68, 68, 0.08); color: #dc2626;
  &.success { background: rgba(34, 197, 94, 0.08); color: #16a34a; }
}

/* ── 用量看板 ── */
.usage-dashboard {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.stat-card {
  background: #fff;
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 16px;
  text-align: center;
}

.stat-value {
  font-size: 22px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 4px;
}

.stat-label {
  font-size: 12px;
  color: var(--text-muted);
}

.chart-card {
  background: #fff;
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 20px;
}

.chart-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;

  h3 {
    font-size: 14px;
    font-weight: 600;
    color: var(--text-primary);
  }
}

.clear-btn {
  font-size: 12px;
  color: var(--text-muted);
  &:hover { color: #dc2626; }
}

.empty-hint {
  text-align: center;
  padding: 24px;
  font-size: 13px;
  color: var(--text-muted);
}

/* ── 柱状图 ── */
.bar-chart {
  display: flex;
  align-items: flex-end;
  gap: 12px;
  height: 160px;
  padding-top: 20px;
}

.bar-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100%;
}

.bar-value {
  font-size: 11px;
  color: var(--text-muted);
  margin-bottom: 4px;
  min-height: 16px;
}

.bar-track {
  flex: 1;
  width: 100%;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

.bar-fill {
  width: 60%;
  max-width: 40px;
  background: linear-gradient(180deg, #3049C6, #6366f1);
  border-radius: 4px 4px 0 0;
  transition: height 0.4s ease;
  min-height: 0;
}

.bar-label {
  font-size: 11px;
  color: var(--text-muted);
  margin-top: 6px;
}

/* ── 模型分布 ── */
.model-bars {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.model-bar-row {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.model-bar-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.model-bar-name {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-primary);
}

.model-bar-tokens {
  font-size: 12px;
  color: var(--text-muted);
}

.model-bar-track {
  height: 8px;
  background: rgba(0, 0, 0, 0.04);
  border-radius: 4px;
  overflow: hidden;
}

.model-bar-fill {
  height: 100%;
  border-radius: 4px;
  overflow: hidden;
  background: #e0e7ff;
  transition: width 0.4s ease;
}

.model-bar-input {
  height: 100%;
  background: linear-gradient(90deg, #3049C6, #6366f1);
  border-radius: 4px;
}

.model-bar-detail {
  display: flex;
  gap: 12px;
  font-size: 11px;
  color: var(--text-muted);
}

.detail-input { color: #3049C6; }
.detail-output { color: #6366f1; }

/* ── 请求记录表 ── */
.records-table {
  max-height: 320px;
  overflow-y: auto;
}

.record-row {
  display: grid;
  grid-template-columns: 100px 1fr 70px 70px 70px;
  gap: 8px;
  padding: 8px 0;
  font-size: 12px;
  color: var(--text-secondary);
  border-bottom: 1px solid var(--border-light);

  &.record-header {
    font-weight: 600;
    color: var(--text-muted);
    font-size: 11px;
    border-bottom: 1px solid var(--border);
  }

  &:last-child { border-bottom: none; }
}

.record-time { color: var(--text-muted); }
.record-model { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.record-total { font-weight: 600; color: var(--text-primary); }

/* ── MCP 工具列表 ── */
.mcp-tools-list {
  margin-top: 8px;
  padding: 10px;
  background: rgba(0, 0, 0, 0.02);
  border-radius: 8px;
  border: 1px solid var(--border-light);
}

.mcp-tools-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: 8px;
}

.mcp-tool-item {
  display: flex;
  align-items: baseline;
  gap: 8px;
  padding: 4px 0;
  font-size: 12px;
  border-bottom: 1px solid var(--border-light);

  &:last-child { border-bottom: none; }
}

.mcp-tool-name {
  font-weight: 600;
  color: #3049C6;
  font-family: 'SF Mono', 'Fira Code', monospace;
  white-space: nowrap;
}

.mcp-tool-desc {
  color: var(--text-muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ── 致谢 ── */
.settings-footer {
  margin-top: 32px;
  padding: 20px;
  text-align: center;
  font-size: 12px;
  color: var(--text-muted);
  line-height: 1.8;

  .footer-author {
    font-weight: 500;
    color: var(--text-secondary);
  }
}
</style>
