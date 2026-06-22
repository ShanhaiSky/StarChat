/**
 * 会话存储
 * @author ShanhaiSky
 */
import { defineStore } from 'pinia'

const STORAGE_KEY = 'audichat_data'

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return { sessions: [], messages: {} }
}

function saveToStorage(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    sessions: state.sessions,
    messages: state.messages,
  }))
}

export const useChatStore = defineStore('chat', {
  state: () => {
    const { sessions, messages } = loadFromStorage()
    return {
      sessions,
      messages,
      currentSessionId: '',
    }
  },

  getters: {
    currentSession(state) {
      return state.sessions.find(s => s.id === state.currentSessionId) || null
    },
    currentMessages(state) {
      return state.messages[state.currentSessionId] || []
    },
    sortedSessions(state) {
      return [...state.sessions].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
    },
  },

  actions: {
    createSession(title = '新对话') {
      const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
      const session = { id, title, createdAt: Date.now() }
      this.sessions.unshift(session)
      this.messages[id] = []
      this.currentSessionId = id
      saveToStorage(this)
      return session
    },

    deleteSession(id) {
      this.sessions = this.sessions.filter(s => s.id !== id)
      delete this.messages[id]
      if (this.currentSessionId === id) {
        this.currentSessionId = this.sessions[0]?.id || ''
      }
      saveToStorage(this)
    },

    updateSessionTitle(id, title) {
      const session = this.sessions.find(s => s.id === id)
      if (session) {
        session.title = title
        saveToStorage(this)
      }
    },

    setCurrentSession(id) {
      this.currentSessionId = id
    },

    addMessage(sessionId, message) {
      if (!this.messages[sessionId]) {
        this.messages[sessionId] = []
      }
      this.messages[sessionId].push(message)
      saveToStorage(this)
    },

    updateLastAssistantMessage(sessionId, updates) {
      const msgs = this.messages[sessionId]
      if (!msgs) return
      const last = msgs[msgs.length - 1]
      if (last && last.role === 'assistant') {
        Object.assign(last, updates)
        saveToStorage(this)
      }
    },

    getMessages(sessionId) {
      return this.messages[sessionId] || []
    },

    loadSessions() {
      const { sessions, messages } = loadFromStorage()
      this.sessions = sessions
      this.messages = messages
    },
  },
})
