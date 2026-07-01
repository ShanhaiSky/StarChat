<!--
  ECharts 图表渲染组件
  接收 option 配置，自动渲染图表
  支持响应式 resize、下载 PNG
  @author ShanhaiSky
-->
<template>
  <div class="echarts-block">
    <div class="echarts-header">
      <span class="echarts-title">{{ title || 'ECharts 图表' }}</span>
      <div class="echarts-actions">
        <button class="echarts-btn" @click="toggleCode" title="查看配置">
          <svg viewBox="0 0 16 16" fill="none" width="14" height="14">
            <path d="M2 4h12M2 8h12M2 12h12" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
          </svg>
        </button>
        <button class="echarts-btn" @click="downloadPng" title="下载图片">
          <svg viewBox="0 0 16 16" fill="none" width="14" height="14">
            <path d="M8 2v8M4 7l4 4 4-4M2 12v2h12v-2" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      </div>
    </div>
    <div v-show="!showCode" ref="chartRef" class="echarts-chart"></div>
    <div v-show="showCode" class="echarts-code">
      <pre><code>{{ formattedOption }}</code></pre>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import * as echarts from 'echarts'

const props = defineProps({
  option: { type: Object, required: true },
  title: { type: String, default: '' },
})

const chartRef = ref(null)
const showCode = ref(false)
let chart = null
let resizeObserver = null

// 统一设计色系
const CHART_COLORS = [
  '#2563eb',  // 主色蓝
  '#60a5fa',  // 浅蓝
  '#16a34a',  // 绿色
  '#d97706',  // 琥珀
  '#dc2626',  // 红色
  '#7c3aed',  // 紫色
  '#0891b2',  // 青色
  '#db2777',  // 粉色
  '#65a30d',  // 青柠
  '#ea580c',  // 橙色
  '#4f46e5',  // 靛蓝
  '#0d9488',  // 绿松石
]

// 格式化后的配置（应用统一样式）
const styledOption = computed(() => {
  const opt = { ...props.option }

  // 应用统一色系
  if (!opt.color) {
    opt.color = CHART_COLORS
  }

  // 添加默认 tooltip
  if (!opt.tooltip) {
    opt.tooltip = {
      trigger: opt.series?.[0]?.type === 'pie' ? 'item' : 'axis',
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#e5e7eb',
      borderWidth: 1,
      textStyle: { color: '#374151', fontSize: 13 },
      extraCssText: 'box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1); border-radius: 8px;',
    }
  }

  // 添加默认 grid（饼图除外）
  if (!opt.grid && opt.series?.[0]?.type !== 'pie' && opt.series?.[0]?.type !== 'radar') {
    opt.grid = {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true,
    }
  }

  return opt
})

const formattedOption = computed(() => {
  return JSON.stringify(props.option, null, 2)
})

function toggleCode() {
  showCode.value = !showCode.value
  if (!showCode.value) {
    nextTick(() => resizeChart())
  }
}

function initChart() {
  if (!chartRef.value) return

  // 销毁旧实例
  if (chart) {
    chart.dispose()
    chart = null
  }

  chart = echarts.init(chartRef.value)
  chart.setOption(styledOption.value)

  // 监听容器大小变化
  resizeObserver = new ResizeObserver(() => {
    if (chart && chartRef.value?.isConnected) {
      chart.resize()
    }
  })
  resizeObserver.observe(chartRef.value)
}

function resizeChart() {
  if (chart && chartRef.value?.isConnected) {
    chart.resize()
  }
}

function downloadPng() {
  if (!chart) return

  const url = chart.getDataURL({
    type: 'png',
    pixelRatio: 2,
    backgroundColor: '#fff',
  })

  const link = document.createElement('a')
  link.download = `chart-${Date.now()}.png`
  link.href = url
  link.click()
}

// 监听 option 变化，更新图表
watch(() => props.option, () => {
  if (chart) {
    chart.setOption(styledOption.value, true)
  }
}, { deep: true })

onMounted(() => {
  nextTick(() => initChart())
})

onUnmounted(() => {
  resizeObserver?.disconnect()
  chart?.dispose()
})
</script>

<style scoped>
.echarts-block {
  margin: 12px 0;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  overflow: hidden;
  background: #fff;
}

.echarts-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  border-bottom: 1px solid #e5e7eb;
  background: #fafafa;
}

.echarts-title {
  font-size: 13px;
  font-weight: 500;
  color: #374151;
}

.echarts-actions {
  display: flex;
  gap: 4px;
}

.echarts-btn {
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: #9ca3af;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
}

.echarts-btn:hover {
  background: #f3f4f6;
  color: #4b5563;
}

.echarts-chart {
  width: 100%;
  height: 400px;
  padding: 12px;
}

.echarts-code {
  padding: 12px;
  background: #f8f9fa;
  max-height: 400px;
  overflow: auto;
}

.echarts-code pre {
  margin: 0;
  font-family: 'SF Mono', 'Fira Code', monospace;
  font-size: 12px;
  line-height: 1.6;
  color: #374151;
}
</style>
