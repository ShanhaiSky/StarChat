/**
 * 用量统计存储
 * @author ShanhaiSky
 */
import { defineStore } from 'pinia'

const STORAGE_KEY = 'audichat_usage'

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return { records: [] }
}

function saveToStorage(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ records: state.records }))
}

export const useUsageStore = defineStore('usage', {
  state: () => {
    const { records } = loadFromStorage()
    return { records }
  },

  getters: {
    // 总计
    totalTokens(state) {
      return state.records.reduce((s, r) => s + r.totalTokens, 0)
    },
    totalPromptTokens(state) {
      return state.records.reduce((s, r) => s + r.promptTokens, 0)
    },
    totalCompletionTokens(state) {
      return state.records.reduce((s, r) => s + r.completionTokens, 0)
    },
    totalRequests(state) {
      return state.records.length
    },

    // 按模型分组
    byModel(state) {
      const map = {}
      for (const r of state.records) {
        if (!map[r.model]) {
          map[r.model] = { model: r.model, requests: 0, promptTokens: 0, completionTokens: 0, totalTokens: 0 }
        }
        const g = map[r.model]
        g.requests++
        g.promptTokens += r.promptTokens
        g.completionTokens += r.completionTokens
        g.totalTokens += r.totalTokens
      }
      return Object.values(map).sort((a, b) => b.totalTokens - a.totalTokens)
    },

    // 按天分组（最近 7 天）
    byDay(state) {
      const now = new Date()
      const days = []
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now)
        d.setDate(d.getDate() - i)
        const key = d.toISOString().slice(0, 10)
        days.push({ date: key, label: `${d.getMonth() + 1}/${d.getDate()}`, tokens: 0, requests: 0 })
      }
      for (const r of state.records) {
        const key = r.timestamp.slice(0, 10)
        const day = days.find(d => d.date === key)
        if (day) {
          day.tokens += r.totalTokens
          day.requests++
        }
      }
      return days
    },

    // 最近记录
    recentRecords(state) {
      return [...state.records].sort((a, b) => b.timestamp.localeCompare(a.timestamp)).slice(0, 20)
    },
  },

  actions: {
    addRecord({ model, promptTokens, completionTokens, totalTokens }) {
      this.records.push({
        model,
        promptTokens: promptTokens || 0,
        completionTokens: completionTokens || 0,
        totalTokens: totalTokens || 0,
        timestamp: new Date().toISOString(),
      })
      // 保留最近 500 条
      if (this.records.length > 500) {
        this.records = this.records.slice(-500)
      }
      saveToStorage(this)
    },

    clearAll() {
      this.records = []
      saveToStorage(this)
    },
  },
})
