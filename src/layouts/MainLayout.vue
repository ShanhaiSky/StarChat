<!-- @author ShanhaiSky -->
<template>
  <div class="main-layout" :class="{ 'app-ready': appReady }">
    <!-- 侧边栏 -->
    <aside class="sidebar" :class="{ collapsed: isCollapsed }">
      <!-- Logo -->
      <div class="sidebar-logo" @click="$router.push('/')">
        <div class="logo-ring">
          <div class="logo-icon">✦</div>
        </div>
        <span v-show="!isCollapsed" class="logo-text">StarChat</span>
      </div>

      <!-- 导航菜单 -->
      <nav class="sidebar-nav">
        <!-- 新建对话按钮 -->
        <button v-show="!isCollapsed" class="new-chat-btn" @click="createNewSession">
          <IconAdd :size="16" />
          <span>新建对话</span>
        </button>
        <button v-show="isCollapsed" class="new-chat-btn new-chat-btn--icon" @click="createNewSession" title="新建对话">
          <IconAdd :size="18" />
        </button>

        <!-- 对话组 -->
        <div class="nav-group" :class="{ expanded: chatExpanded }">
          <div class="nav-item group-header" :class="{ active: isChatActive }" @click="toggleChatGroup">
            <IconChat :size="20" />
            <span v-show="!isCollapsed" class="nav-text">对话</span>
            <IconArrowDown v-show="!isCollapsed" :size="14" class="expand-arrow" />
          </div>

          <!-- 会话列表子菜单 -->
          <div v-show="!isCollapsed && chatExpanded" class="sub-menu">
            <div class="session-list">
              <div
                v-for="session in chatStore.sortedSessions"
                :key="session.id"
                class="session-item"
                :class="{ active: chatStore.currentSessionId === session.id }"
                @click="goToSession(session.id)"
              >
                <span class="session-title">{{ session.title || '新对话' }}</span>
                <el-button
                  text
                  class="delete-btn"
                  @click.stop="deleteSession(session.id)"
                >
                  <IconDelete :size="12" />
                </el-button>
              </div>
              <div v-if="chatStore.sessions.length === 0" class="session-empty">
                暂无对话
              </div>
            </div>
          </div>
        </div>

      </nav>

      <!-- 底部 -->
      <div class="sidebar-footer" :class="{ 'sidebar-footer--collapsed': isCollapsed }">
        <!-- 设置 -->
        <router-link to="/settings" class="footer-item" :class="{ active: isSettingsActive }" title="设置">
          <IconSettings :size="18" />
          <span v-show="!isCollapsed" class="footer-text">设置</span>
        </router-link>
        <!-- 折叠/展开按钮 -->
        <el-button text class="collapse-btn" @click="isCollapsed = !isCollapsed">
          <IconSidebarLeft v-if="!isCollapsed" :size="18" />
          <IconSidebarRight v-else :size="18" />
        </el-button>
      </div>
    </aside>

    <!-- 主内容区 -->
    <main class="main-content">
      <router-view v-slot="{ Component }">
        <transition name="page-slide" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, inject } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessageBox } from 'element-plus'
import { useChatStore } from '@/stores/chat'
import { useMcpStore } from '@/stores/mcp'
import { autoConnectAll } from '@/services/mcp'
import {
  IconChat, IconSettings, IconAdd, IconDelete,
  IconSidebarLeft, IconSidebarRight, IconArrowDown,
} from '@/icons'

const route = useRoute()
const router = useRouter()
const chatStore = useChatStore()
const mcpStore = useMcpStore()
const isCollapsed = ref(false)
const chatExpanded = ref(true)
const appReady = inject('appReady', ref(false))

const isChatActive = computed(() => {
  return route.path === '/' || route.path === '/chat' || route.path.startsWith('/chat/')
})

const isSettingsActive = computed(() => {
  return route.path === '/settings'
})

onMounted(async () => {
  chatStore.loadSessions()

  // 自动连接标记为 autoConnect 的 MCP 服务器
  if (mcpStore.servers.length > 0) {
    console.log('[MCP] 自动连接 MCP 服务器...')
    await autoConnectAll(mcpStore.servers)
  }
})

function toggleChatGroup() {
  if (isCollapsed.value) {
    router.push('/')
  } else {
    chatExpanded.value = !chatExpanded.value
  }
}

function createNewSession() {
  const session = chatStore.createSession('新对话')
  router.push(`/chat/${session.id}`)
}

function goToSession(id) {
  chatStore.setCurrentSession(id)
  router.push(`/chat/${id}`)
}

async function deleteSession(id) {
  try {
    await ElMessageBox.confirm('确定删除这个对话吗？', '确认')
    chatStore.deleteSession(id)
    if (chatStore.currentSessionId) {
      router.push(`/chat/${chatStore.currentSessionId}`)
    } else {
      router.push('/')
    }
  } catch {
    // 用户取消
  }
}
</script>

<style scoped lang="scss">
.main-layout {
  display: flex;
  height: 100vh;
  overflow: hidden;
}

/* ── 侧边栏 ── */
.sidebar {
  width: var(--sidebar-width);
  background: var(--sidebar-bg);
  display: flex;
  flex-direction: column;
  transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
  flex-shrink: 0;
  opacity: 0;
  transform: translateX(-100%);

  &.collapsed {
    width: var(--sidebar-collapsed-width);
  }
}

/* ── 入场动画 ── */
.app-ready .sidebar {
  animation: slide-in-left 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
}

@keyframes slide-in-left {
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.sidebar-logo {
  display: flex;
  align-items: center;
  padding: 20px 16px 16px;
  cursor: pointer;
  gap: 10px;

  .logo-ring {
    width: 34px;
    height: 34px;
    border-radius: 50%;
    padding: 2px;
    background: linear-gradient(135deg, #E3AA4E, #E76377, #3049C6, #E3AA4E);
    background-size: 300% 300%;
    animation: logo-glow 4s ease infinite;
    flex-shrink: 0;
    box-shadow: 0 0 12px rgba(227, 170, 78, 0.3), 0 0 20px rgba(231, 99, 119, 0.2);
  }

  .logo-icon {
    width: 100%;
    height: 100%;
    background: #1a1a1a;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 15px;
    font-weight: 700;
    color: #fff;
  }

  .logo-text {
    font-size: 16px;
    font-weight: 600;
    color: var(--text-primary);
    white-space: nowrap;
  }
}

@keyframes logo-glow {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

.sidebar-nav {
  flex: 1;
  padding: 0 8px;
  overflow-y: auto;
}

/* ── 新建对话按钮 ── */
.new-chat-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 10px 12px;
  margin-bottom: 8px;
  border: 1px dashed var(--border);
  border-radius: 10px;
  background: transparent;
  color: var(--text-secondary);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.15s;

  &:hover {
    background: rgba(37, 99, 235, 0.06);
    border-color: var(--color-blue);
    color: var(--color-blue);
  }

  &--icon {
    width: 40px;
    height: 40px;
    padding: 0;
    margin: 0 auto 8px;
  }
}

/* ── 导航组 ── */
.nav-group {
  margin-bottom: 4px;

  &.expanded {
    .expand-arrow {
      transform: rotate(0deg);
    }
  }

  &:not(.expanded) {
    .expand-arrow {
      transform: rotate(-90deg);
    }
  }
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 10px;
  color: var(--text-primary);
  text-decoration: none;
  font-size: 14px;
  transition: background 0.15s;
  white-space: nowrap;
  cursor: pointer;
  min-height: 40px;

  &:hover {
    background: rgba(0, 0, 0, 0.04);
  }

  &.active {
    background: rgba(0, 0, 0, 0.07);
    font-weight: 500;
  }

  &.group-header {
    user-select: none;
  }

  .expand-arrow {
    margin-left: auto;
    transition: transform 0.2s;
    color: var(--text-muted);
  }
}

/* ── 子菜单 ── */
.sub-menu {
  padding: 4px 0 8px 20px;
}

.sub-menu-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 8px 8px;

  .sub-menu-title {
    font-size: 11px;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .add-session-btn {
    width: 24px;
    height: 24px;
    padding: 0;
    color: var(--text-muted);
    border-radius: 4px;

    &:hover {
      background: rgba(0, 0, 0, 0.06);
      color: var(--text-primary);
    }
  }
}

.session-list {
  max-height: 300px;
  overflow-y: auto;
}

.session-item {
  display: flex;
  align-items: center;
  padding: 8px 10px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s;
  margin-bottom: 1px;

  &:hover {
    background: rgba(0, 0, 0, 0.04);

    .delete-btn {
      opacity: 1;
    }
  }

  &.active {
    background: #fff;

    .session-title {
      color: var(--color-blue);
      font-weight: 500;
    }
  }

  .session-title {
    flex: 1;
    font-size: 13px;
    color: var(--text-secondary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .delete-btn {
    opacity: 0;
    padding: 2px;
    color: var(--text-muted);
    transition: all 0.15s;

    &:hover {
      color: var(--color-pink);
    }
  }
}

.session-empty {
  padding: 12px;
  text-align: center;
  font-size: 12px;
  color: var(--text-muted);
}

/* ── 底部 ── */
.sidebar-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  border-top: 1px solid var(--border-light);
  gap: 4px;

  &--collapsed {
    flex-direction: column;
    padding: 8px;
    gap: 4px;
  }
}

.footer-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border-radius: 8px;
  color: var(--text-secondary);
  text-decoration: none;
  font-size: 13px;
  transition: all 0.15s;
  cursor: pointer;
  flex: 1;
  min-width: 0;

  .sidebar-footer--collapsed & {
    justify-content: center;
    padding: 8px;
    width: 100%;
  }

  &:hover {
    background: rgba(0, 0, 0, 0.04);
    color: var(--text-primary);
  }

  &.active {
    background: rgba(0, 0, 0, 0.07);
    color: var(--text-primary);
    font-weight: 500;
  }
}

.footer-text {
  white-space: nowrap;
}

.collapse-btn {
  padding: 6px;
  border-radius: 8px;
  color: var(--text-muted);
  flex-shrink: 0;

  &:hover {
    background: rgba(0, 0, 0, 0.04);
  }
}

.version {
  font-size: 11px;
  color: var(--text-muted);
  white-space: nowrap;
}

/* ── 主内容 ── */
.main-content {
  flex: 1;
  overflow: hidden;
  background: var(--bg-page);
}
</style>
