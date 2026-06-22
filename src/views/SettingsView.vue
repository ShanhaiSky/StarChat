<!-- @author ShanhaiSky -->
<template>
  <div class="settings-view">
    <div class="settings-container">
      <h1 class="settings-title">设置</h1>

      <!-- Tab 切换 -->
      <div class="tab-bar">
        <button class="tab-btn" :class="{ active: tab === 'config' }" @click="tab = 'config'">模型配置</button>
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
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getLLMConfig, setLLMConfig, testConnection } from '@/services/llm'
import { useUsageStore } from '@/stores/usage'

const usageStore = useUsageStore()
const tab = ref('config')

const form = ref({
  models: [{ name: 'deepseek-v4-flash', baseUrl: 'https://api.deepseek.com/v1', apiKey: '' }],
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
})

function addModel() {
  form.value.models.push({ name: '', baseUrl: 'https://api.deepseek.com/v1', apiKey: '' })
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

.settings-title {
  font-size: 24px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 20px;
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
