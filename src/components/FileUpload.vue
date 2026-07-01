<!--
  文件上传组件
  支持点击和拖拽上传，显示上传进度
  @author ShanhaiSky
-->
<template>
  <div class="file-upload" :class="{ 'is-dragging': isDragging }">
    <!-- 触发按钮 -->
    <button class="upload-btn" @click="triggerUpload" :disabled="uploading" :title="uploading ? '上传中...' : '上传文件'">
      <svg v-if="!uploading" viewBox="0 0 16 16" fill="none" width="16" height="16">
        <path d="M14 10v2.5a1.5 1.5 0 01-1.5 1.5h-9A1.5 1.5 0 012 12.5V10" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M8 2v8M5 5l3-3 3 3" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      <svg v-else viewBox="0 0 16 16" fill="none" width="16" height="16" class="spin">
        <circle cx="8" cy="8" r="6" stroke="currentColor" stroke-width="1.3" stroke-dasharray="28" stroke-dashoffset="8" stroke-linecap="round"/>
      </svg>
    </button>

    <!-- 隐藏的文件输入 -->
    <input
      ref="fileInput"
      type="file"
      :accept="accept"
      multiple
      style="display: none"
      @change="handleFileSelect"
    />

    <!-- 拖拽区域（全局监听） -->
    <div
      v-if="showDropZone"
      class="drop-overlay"
      @dragenter.prevent="onDragEnter"
      @dragover.prevent="onDragOver"
      @dragleave.prevent="onDragLeave"
      @drop.prevent="onDrop"
    >
      <div class="drop-hint">
        <svg viewBox="0 0 16 16" fill="none" width="32" height="32">
          <path d="M14 10v2.5a1.5 1.5 0 01-1.5 1.5h-9A1.5 1.5 0 012 12.5V10" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M8 2v8M5 5l3-3 3 3" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <span>拖放文件到此处上传</span>
      </div>
    </div>

    <!-- 上传中的文件列表 -->
    <div v-if="uploadingFiles.length > 0" class="upload-list">
      <div v-for="(file, idx) in uploadingFiles" :key="idx" class="upload-item">
        <div class="upload-info">
          <span class="upload-name">{{ file.name }}</span>
          <span class="upload-size">{{ formatSize(file.size) }}</span>
        </div>
        <div class="upload-progress">
          <div class="upload-progress-bar" :style="{ width: file.progress + '%' }"></div>
        </div>
        <span class="upload-status">{{ file.progress }}%</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import { uploadFile } from '@/services/minio'

const props = defineProps({
  accept: { type: String, default: '*' },
  maxSize: { type: Number, default: 50 }, // MB
  onUpload: { type: Function, default: () => {} },
})

const emit = defineEmits(['upload'])

const fileInput = ref(null)
const isDragging = ref(false)
const showDropZone = ref(false)
const uploading = ref(false)
const uploadingFiles = ref([])
let dragCounter = 0

function triggerUpload() {
  fileInput.value?.click()
}

async function handleFileSelect(e) {
  const files = Array.from(e.target.files || [])
  if (files.length > 0) {
    await processFiles(files)
  }
  // 清空 input 以便重复选择同一文件
  e.target.value = ''
}

function onDragEnter(e) {
  dragCounter++
  isDragging.value = true
}

function onDragOver(e) {
  e.dataTransfer.dropEffect = 'copy'
}

function onDragLeave(e) {
  dragCounter--
  if (dragCounter === 0) {
    isDragging.value = false
  }
}

async function onDrop(e) {
  dragCounter = 0
  isDragging.value = false
  showDropZone.value = false

  const files = Array.from(e.dataTransfer?.files || [])
  if (files.length > 0) {
    await processFiles(files)
  }
}

// 全局拖拽监听
function handleGlobalDragEnter(e) {
  if (e.dataTransfer?.types?.includes('Files')) {
    showDropZone.value = true
  }
}

function handleGlobalDragLeave(e) {
  // 只在离开窗口时隐藏
  if (e.relatedTarget === null) {
    showDropZone.value = false
    isDragging.value = false
    dragCounter = 0
  }
}

onMounted(() => {
  document.addEventListener('dragenter', handleGlobalDragEnter)
  document.addEventListener('dragleave', handleGlobalDragLeave)
})

onUnmounted(() => {
  document.removeEventListener('dragenter', handleGlobalDragEnter)
  document.removeEventListener('dragleave', handleGlobalDragLeave)
})

async function processFiles(files) {
  // 验证文件大小
  for (const file of files) {
    if (file.size > props.maxSize * 1024 * 1024) {
      ElMessage.warning(`文件 "${file.name}" 超过 ${props.maxSize}MB 限制`)
      return
    }
  }

  uploading.value = true

  for (const file of files) {
    const fileEntry = {
      name: file.name,
      size: file.size,
      progress: 0,
    }
    uploadingFiles.value.push(fileEntry)

    try {
      const result = await uploadFile(file, (percent) => {
        fileEntry.progress = percent
      })

      emit('upload', result)
      ElMessage.success(`"${file.name}" 上传成功`)
    } catch (err) {
      ElMessage.error(`"${file.name}" 上传失败: ${err.message}`)
    } finally {
      uploadingFiles.value = uploadingFiles.value.filter(f => f !== fileEntry)
    }
  }

  uploading.value = false
}

function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}
</script>

<style scoped>
.file-upload {
  position: relative;
}

.upload-btn {
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
}

.upload-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  background: #fff;
  box-shadow: 0 10px 24px rgba(16, 24, 40, 0.10);
}

.upload-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* 拖拽覆盖层 */
.drop-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: rgba(37, 99, 235, 0.08);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
}

.drop-hint {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 40px;
  border: 2px dashed #2563eb;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.95);
  color: #2563eb;
  font-size: 14px;
  font-weight: 500;
}

/* 上传列表 */
.upload-list {
  position: absolute;
  bottom: 100%;
  left: 0;
  right: 0;
  margin-bottom: 8px;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.upload-item {
  padding: 10px 14px;
  border-bottom: 1px solid #f3f4f6;

  &:last-child { border-bottom: none; }
}

.upload-info {
  display: flex;
  justify-content: space-between;
  margin-bottom: 6px;
}

.upload-name {
  font-size: 13px;
  font-weight: 500;
  color: #374151;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 200px;
}

.upload-size {
  font-size: 12px;
  color: #9ca3af;
}

.upload-progress {
  height: 4px;
  background: #e5e7eb;
  border-radius: 2px;
  overflow: hidden;
  margin-bottom: 4px;
}

.upload-progress-bar {
  height: 100%;
  background: linear-gradient(90deg, #2563eb, #60a5fa);
  border-radius: 2px;
  transition: width 0.2s ease;
}

.upload-status {
  font-size: 11px;
  color: #6b7280;
}
</style>
