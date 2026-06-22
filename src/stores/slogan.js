/**
 * 每日 Slogan 存储
 * @author ShanhaiSky
 */
import { defineStore } from 'pinia'

const STORAGE_KEY = 'audichat_slogan'

const DEFAULT_SLOGAN = '以星辰为引，洞见万千'

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return { date: '', slogan: DEFAULT_SLOGAN, history: [] }
}

function saveToStorage(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    date: state.date,
    slogan: state.slogan,
    history: state.history,
  }))
}

function getToday() {
  return new Date().toISOString().slice(0, 10)
}

export const useSloganStore = defineStore('slogan', {
  state: () => {
    const data = loadFromStorage()
    // 跨天重置
    if (data.date !== getToday()) {
      return { date: getToday(), slogan: DEFAULT_SLOGAN, history: [] }
    }
    return data
  },

  actions: {
    /**
     * 生成新 slogan
     * @param {string} prompt - 生成提示词
     * @param {Function} chatFn - LLM 调用函数 (prompt) => Promise<string>
     */
    async generateSlogan(prompt, chatFn) {
      try {
        const slogan = await chatFn(prompt)
        if (slogan && slogan.length <= 30) {
          this.slogan = slogan.replace(/^["'"「]|["'"」]$/g, '')
          this.history.push(this.slogan)
          if (this.history.length > 10) this.history = this.history.slice(-10)
          saveToStorage(this)
        }
      } catch (e) {
        console.error('生成 slogan 失败:', e)
      }
    },

    resetToDefault() {
      this.slogan = DEFAULT_SLOGAN
      saveToStorage(this)
    },
  },
})
