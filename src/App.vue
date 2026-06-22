<!-- @author ShanhaiSky -->
<template>
  <div v-if="loading" class="app-loading" ref="loadingRef">
    <div class="loading-logo" ref="logoRef" :class="{ 'logo-fly': phase === 'fly' }" :style="flyStyle">
      <!-- 旋转光环 -->
      <div class="loading-orbit">
        <div class="orbit-dot dot-1"></div>
        <div class="orbit-dot dot-2"></div>
        <div class="orbit-dot dot-3"></div>
      </div>
      <!-- 渐变光环 -->
      <div class="loading-ring">
        <div class="loading-icon">✦</div>
      </div>
    </div>
    <h2 class="loading-title" :class="{ hide: phase === 'fly' }">StarChat</h2>
  </div>

  <router-view />
</template>

<script setup>
import { ref, nextTick, onMounted } from 'vue'

const MIN_DISPLAY = 800   // 最短展示时间（兜底，防闪烁）
const FLY_DURATION = 600  // 位移动画时长

const loading = ref(true)
const phase = ref('in')
const logoRef = ref(null)
const flyStyle = ref({})

onMounted(async () => {
  const start = Date.now()

  // 等待实际加载完成（路由就绪 + 数据加载）
  // 这里可以 await 任何异步初始化
  await Promise.all([
    waitForRouterReady(),
    sleep(MIN_DISPLAY),  // 兜底：至少展示 MIN_DISPLAY
  ])

  // 位移到空状态 Logo
  phase.value = 'fly'
  await nextTick()

  const targetEl = document.querySelector('.chat-empty .logo-ring')
  const logoEl = logoRef.value

  if (targetEl && logoEl) {
    const from = logoEl.getBoundingClientRect()
    const to = targetEl.getBoundingClientRect()
    const dx = to.left + to.width / 2 - from.left - from.width / 2
    const dy = to.top + to.height / 2 - from.top - from.height / 2
    flyStyle.value = { '--dx': dx + 'px', '--dy': dy + 'px' }
  }

  await sleep(FLY_DURATION)
  loading.value = false
})

/** 等待路由就绪 */
function waitForRouterReady() {
  return new Promise(resolve => {
    // router.isReady() 在 SPA 首次加载时 resolve
    // 如果不需要等路由，直接 resolve 即可
    const check = () => {
      const app = document.querySelector('#app')
      if (app && app.__vue_app__) {
        const router = app.__vue_app__.config.globalProperties.$router
        if (router?.isReady) {
          router.isReady().then(resolve)
        } else {
          resolve()
        }
      } else {
        requestAnimationFrame(check)
      }
    }
    check()
  })
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms))
}
</script>

<style>
.app-loading {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: #f7f7f5;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

/* ── Logo 容器 ── */
.loading-logo {
  position: relative;
  width: 80px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

.loading-logo.logo-fly {
  transform: translate(var(--dx, 0px), var(--dy, 0px));
}

/* ── 旋转光环 ── */
.loading-orbit {
  position: absolute;
  inset: -8px;
  animation: orbit-spin 2s linear infinite;
}

.orbit-dot {
  position: absolute;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  top: 50%;
  left: 50%;
}

.dot-1 {
  background: #E3AA4E;
  box-shadow: 0 0 8px rgba(227, 170, 78, 0.6);
  top: 0;
  left: 50%;
  transform: translate(-50%, -50%);
  animation: dot-pulse-1 2s ease-in-out infinite;
}

.dot-2 {
  background: #E76377;
  box-shadow: 0 0 8px rgba(231, 99, 119, 0.6);
  top: 50%;
  left: 100%;
  transform: translate(-50%, -50%);
  animation: dot-pulse-2 2s ease-in-out 0.3s infinite;
}

.dot-3 {
  background: #3049C6;
  box-shadow: 0 0 8px rgba(48, 73, 198, 0.6);
  top: 100%;
  left: 50%;
  transform: translate(-50%, -50%);
  animation: dot-pulse-3 2s ease-in-out 0.6s infinite;
}

/* ── 渐变光环 Logo ── */
.loading-ring {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  padding: 3px;
  background: linear-gradient(135deg, #E3AA4E, #E76377, #3049C6, #E3AA4E);
  background-size: 300% 300%;
  animation: logo-glow 3s ease infinite, logo-breathe 2s ease-in-out infinite;
  box-shadow: 0 0 24px rgba(227, 170, 78, 0.3), 0 0 40px rgba(231, 99, 119, 0.15);
  position: relative;
  z-index: 2;
}

.loading-icon {
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

/* ── 标题 ── */
.loading-title {
  font-size: 18px;
  font-weight: 600;
  color: #1a1a1a;
  margin-top: 20px;
  letter-spacing: 2px;
  transition: opacity 0.3s ease;
}

.loading-title.hide {
  opacity: 0;
}

/* ── 动画 ── */
@keyframes orbit-spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@keyframes dot-pulse-1 {
  0%, 100% { opacity: 0.3; transform: translate(-50%, -50%) scale(0.5); }
  50% { opacity: 1; transform: translate(-50%, -50%) scale(1.2); }
}

@keyframes dot-pulse-2 {
  0%, 100% { opacity: 0.3; transform: translate(-50%, -50%) scale(0.5); }
  50% { opacity: 1; transform: translate(-50%, -50%) scale(1.2); }
}

@keyframes dot-pulse-3 {
  0%, 100% { opacity: 0.3; transform: translate(-50%, -50%) scale(0.5); }
  50% { opacity: 1; transform: translate(-50%, -50%) scale(1.2); }
}

@keyframes logo-glow {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

@keyframes logo-breathe {
  0%, 100% { transform: scale(1); box-shadow: 0 0 24px rgba(227, 170, 78, 0.3), 0 0 40px rgba(231, 99, 119, 0.15); }
  50% { transform: scale(1.06); box-shadow: 0 0 32px rgba(227, 170, 78, 0.5), 0 0 56px rgba(231, 99, 119, 0.25); }
}
</style>
