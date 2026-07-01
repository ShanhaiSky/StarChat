<!--
  消息内容渲染组件
  解析 markdown 内容，自动识别并渲染 ECharts 图表
  @author ShanhaiSky
-->
<template>
  <div class="message-content">
    <template v-for="(part, idx) in parsedParts" :key="idx">
      <!-- ECharts 图表 -->
      <EchartsBlock
        v-if="part.type === 'echarts'"
        :option="part.option"
        :title="part.title"
      />
      <!-- 普通 Markdown 内容 -->
      <div
        v-else-if="part.type === 'markdown' && part.content.trim()"
        class="md-content"
        v-html="renderMd(part.content)"
      />
    </template>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { renderMarkdown } from '@/utils/markdown'
import EchartsBlock from './EchartsBlock.vue'

const props = defineProps({
  content: { type: String, default: '' },
})

// 解析内容，分离出 ECharts 配置和普通 markdown
const parsedParts = computed(() => {
  if (!props.content) return []

  const parts = []
  // 匹配 ```echarts ... ``` 代码块
  const regex = /```echarts\s*\n([\s\S]*?)```/g
  let lastIndex = 0
  let match

  while ((match = regex.exec(props.content)) !== null) {
    // 添加前面的 markdown 内容
    if (match.index > lastIndex) {
      parts.push({
        type: 'markdown',
        content: props.content.slice(lastIndex, match.index),
      })
    }

    // 解析 ECharts 配置
    try {
      const jsonStr = match[1].trim()
      const option = JSON.parse(jsonStr)
      // 尝试从配置中提取标题
      const title = option.title?.text || option.title || ''
      parts.push({
        type: 'echarts',
        option,
        title: typeof title === 'string' ? title : '',
      })
    } catch (e) {
      // JSON 解析失败，作为普通代码块显示
      console.warn('[MessageContent] ECharts JSON 解析失败:', e)
      parts.push({
        type: 'markdown',
        content: match[0],
      })
    }

    lastIndex = match.index + match[0].length
  }

  // 添加剩余的 markdown 内容
  if (lastIndex < props.content.length) {
    parts.push({
      type: 'markdown',
      content: props.content.slice(lastIndex),
    })
  }

  return parts
})

function renderMd(text) {
  return renderMarkdown(text)
}
</script>

<style scoped>
.message-content {
  font-size: 14px;
  line-height: 1.7;
  color: #1a1a1a;
}

.message-content :deep(.md-content) {
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
</style>
