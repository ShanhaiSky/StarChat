/**
 * MCP 服务器配置持久化
 * @author ShanhaiSky
 */
import { defineStore } from 'pinia'

const STORAGE_KEY = 'audichat_mcp_config'

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const data = JSON.parse(raw)
      // 确保每个服务器都有 headers 和 type 字段（兼容旧数据）
      if (data.servers) {
        data.servers = data.servers.map(s => ({
          ...s,
          type: s.type || 'sse',
          headers: s.headers || {},
        }))
      }
      return data
    }
  } catch {}
  return { servers: [] }
}

function saveToStorage(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ servers: state.servers }))
}

export const useMcpStore = defineStore('mcp', {
  state: () => {
    const { servers } = loadFromStorage()
    return { servers }
  },

  getters: {
    enabledServers(state) {
      return state.servers.filter(s => s.enabled)
    },
    autoConnectServers(state) {
      return state.servers.filter(s => s.enabled && s.autoConnect)
    },
  },

  actions: {
    addServer(server) {
      const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
      const entry = {
        id,
        name: server.name || 'MCP Server',
        url: server.url || '',
        type: server.type || 'sse',           // 'sse' | 'streamableHttp'
        headers: server.headers || {},         // 自定义请求头
        enabled: true,
        autoConnect: true,
        ...server,
      }
      this.servers.push(entry)
      saveToStorage(this)
      return entry
    },

    removeServer(id) {
      this.servers = this.servers.filter(s => s.id !== id)
      saveToStorage(this)
    },

    updateServer(id, updates) {
      const server = this.servers.find(s => s.id === id)
      if (server) {
        Object.assign(server, updates)
        saveToStorage(this)
      }
    },

    toggleServer(id) {
      const server = this.servers.find(s => s.id === id)
      if (server) {
        server.enabled = !server.enabled
        saveToStorage(this)
      }
    },

    loadServers() {
      const { servers } = loadFromStorage()
      this.servers = servers
    },
  },
})
