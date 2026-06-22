/**
 * Markdown 渲染工具
 * 使用 markdown-it + highlight.js + mermaid
 * 支持代码块复制、HTML 预览、语法高亮、Mermaid 图表
 * @author ShanhaiSky
 */

import MarkdownIt from 'markdown-it'
import hljs from 'highlight.js'
import mermaid from 'mermaid'

// mermaid 初始化
let mermaidInited = false
let mermaidCounter = 0
function ensureMermaid() {
  if (!mermaidInited) {
    mermaid.initialize({
      startOnLoad: false,
      theme: 'default',
      securityLevel: 'loose',
      fontFamily: '-apple-system, BlinkMacSystemFont, "PingFang SC", sans-serif',
    })
    mermaidInited = true
  }
}

const md = new MarkdownIt({
  html: false,
  breaks: true,
  linkify: true,
  typographer: true,
  highlight(str, lang) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return hljs.highlight(str, { language: lang }).value
      } catch {}
    }
    return md.utils.escapeHtml(str)
  },
})

// 重写 fence 渲染器
const defaultFence = md.renderer.rules.fence.bind(md.renderer.rules)

md.renderer.rules.fence = (tokens, idx, options, env, self) => {
  const token = tokens[idx]
  const info = token.info.trim().toLowerCase()
  const lang = info || ''
  const langLabel = lang ? `<span class="code-lang">${lang}</span>` : ''

  // Mermaid 图表
  if (lang === 'mermaid') {
    const id = 'mermaid-' + (++mermaidCounter)
    const escapedCode = md.utils.escapeHtml(token.content)
    return `<div class="mermaid-block" data-mermaid-id="${id}" data-source="${encodeURIComponent(token.content)}">
      <div class="mermaid-body">
        <div class="mermaid-view">
          <div class="mermaid-loading">渲染中...</div>
        </div>
        <div class="mermaid-code" style="display:none">
          <pre><code>${escapedCode}</code></pre>
        </div>
      </div>
      <div class="mermaid-toolbar">
        <div class="mermaid-toolbar-left">
          <span class="code-lang">mermaid</span>
        </div>
        <div class="mermaid-toolbar-right">
          <button class="code-btn" data-action="mermaid-toggle" title="代码/图表切换">
            <svg viewBox="0 0 16 16" fill="none" width="14" height="14"><path d="M2 4h12M2 8h12M2 12h12" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>
            切换
          </button>
          <button class="code-btn" data-action="mermaid-view" title="查看大图">
            <svg viewBox="0 0 16 16" fill="none" width="14" height="14"><rect x="1" y="1" width="14" height="14" rx="2" stroke="currentColor" stroke-width="1.3"/><path d="M1 11l4-4 3 3 3-4 4 5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>
            大图
          </button>
          <button class="code-btn" data-action="copy" title="复制代码">
            <svg viewBox="0 0 16 16" fill="none" width="14" height="14"><path d="M9.5 4.5V2C9.5 1.72386 9.27614 1.5 9 1.5H2C1.72386 1.5 1.5 1.72386 1.5 2V11C1.5 11.2761 1.72386 11.5 2 11.5H6.5" stroke="currentColor" stroke-width="1" stroke-linejoin="round" fill="none"/><path d="M11 4.5H7C6.72386 4.5 6.5 4.72386 6.5 5V14C6.5 14.2761 6.72386 14.5 7 14.5H14C14.2761 14.5 14.5 14.2761 14.5 14V8L11 4.5Z" stroke="currentColor" stroke-width="1" stroke-linejoin="round" fill="none"/></svg>
            复制
          </button>
        </div>
      </div>
    </div>`
  }

  // HTML 渲染按钮
  const isHtml = ['html', 'htm', 'xml', 'svg'].includes(lang)
  const htmlBtn = isHtml
    ? `<button class="code-btn code-btn-html" data-action="open-html" title="在新标签页中渲染">
        <svg viewBox="0 0 16 16" fill="none" width="14" height="14">
          <path d="M6 3H3v10h10v-3" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M8 8L14 2M14 2H10M14 2V6" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        渲染
      </button>`
    : ''

  const codeHtml = defaultFence(tokens, idx, options, env, self)

  return `<div class="code-block" data-code="${encodeURIComponent(token.content)}">
    <div class="code-body">${codeHtml}</div>
    <div class="code-toolbar">
      <div class="code-toolbar-left">${langLabel}</div>
      <div class="code-toolbar-right">
        ${htmlBtn}
        <button class="code-btn" data-action="copy" title="复制代码">
          <svg viewBox="0 0 16 16" fill="none" width="14" height="14">
            <path d="M9.5 4.5V2C9.5 1.72386 9.27614 1.5 9 1.5H2C1.72386 1.5 1.5 1.72386 1.5 2V11C1.5 11.2761 1.72386 11.5 2 11.5H6.5" stroke="currentColor" stroke-width="1" stroke-linejoin="round" fill="none"/>
            <path d="M11 4.5H7C6.72386 4.5 6.5 4.72386 6.5 5V14C6.5 14.2761 6.72386 14.5 7 14.5H14C14.2761 14.5 14.5 14.2761 14.5 14V8L11 4.5Z" stroke="currentColor" stroke-width="1" stroke-linejoin="round" fill="none"/>
          </svg>
          复制
        </button>
      </div>
    </div>
  </div>`
}

/**
 * 渲染 Markdown 文本为 HTML
 */
export function renderMarkdown(text) {
  if (!text) return ''
  return md.render(text)
}

/**
 * 渲染页面中所有未渲染的 Mermaid 图表
 * 在 v-html 更新后调用
 */
export async function renderMermaidBlocks() {
  ensureMermaid()
  const blocks = document.querySelectorAll('.mermaid-block:not(.mermaid-rendered)')

  for (const block of blocks) {
    const source = decodeURIComponent(block.dataset.source || '')
    const id = block.dataset.mermaidId
    const viewEl = block.querySelector('.mermaid-view')
    if (!source.trim() || !viewEl) continue

    block.classList.add('mermaid-rendered')

    try {
      const { svg } = await mermaid.render(id, source.trim())
      viewEl.innerHTML = svg
    } catch (e) {
      const errSvg = document.getElementById(id)
      if (errSvg) errSvg.remove()

      viewEl.innerHTML = `<div class="mermaid-error">
        <span class="mermaid-error-label">图表渲染失败</span>
        <pre>${md.utils.escapeHtml(source)}</pre>
      </div>`
      block.classList.add('mermaid-error-wrap')
    }
  }
}

/**
 * 初始化代码块事件委托
 */
export function initCodeBlockHandlers() {
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action]')
    if (!btn) return

    const action = btn.dataset.action

    // Mermaid 切换（代码/图表）
    if (action === 'mermaid-toggle') {
      const block = btn.closest('.mermaid-block')
      if (!block) return
      const view = block.querySelector('.mermaid-view')
      const code = block.querySelector('.mermaid-code')
      if (!view || !code) return
      const isCodeVisible = code.style.display !== 'none'
      view.style.display = isCodeVisible ? '' : 'none'
      code.style.display = isCodeVisible ? 'none' : ''
      return
    }

    // Mermaid 查看大图
    if (action === 'mermaid-view') {
      const block = btn.closest('.mermaid-block')
      if (!block) return
      const svgEl = block.querySelector('.mermaid-view svg')
      if (!svgEl) return
      openMermaidModal(svgEl.outerHTML, decodeURIComponent(block.dataset.source || ''))
      return
    }

    // 代码块复制
    const codeBlock = btn.closest('.code-block')
    if (!codeBlock) return
    const code = decodeURIComponent(codeBlock.dataset.code || '')

    if (action === 'copy') {
      navigator.clipboard.writeText(code).then(() => {
        const orig = btn.innerHTML
        btn.innerHTML = `<svg viewBox="0 0 16 16" fill="none" width="14" height="14"><path d="M4.5 7.7L6.99 10.19a.5.5 0 00.71 0L11.5 5.7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg> 已复制`
        btn.classList.add('copied')
        setTimeout(() => {
          btn.innerHTML = orig
          btn.classList.remove('copied')
        }, 1500)
      })
    }

    if (action === 'open-html') {
      const win = window.open('', '_blank')
      win.document.write(code)
      win.document.close()
    }
  })
}

/**
 * 打开 Mermaid 大图弹窗
 */
function openMermaidModal(svgHtml, source) {
  // 移除已有弹窗
  document.querySelector('.mermaid-modal')?.remove()

  const modal = document.createElement('div')
  modal.className = 'mermaid-modal'
  modal.innerHTML = `
    <div class="mermaid-modal-mask"></div>
    <div class="mermaid-modal-content">
      <div class="mermaid-modal-header">
        <span>Mermaid 图表</span>
        <div class="mermaid-modal-actions">
          <button class="modal-btn" data-zoom="in" title="放大">
            <svg viewBox="0 0 16 16" fill="none" width="16" height="16"><circle cx="7" cy="7" r="5.5" stroke="currentColor" stroke-width="1.3"/><path d="M11 11l3.5 3.5M5 7h4M7 5v4" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>
          </button>
          <button class="modal-btn" data-zoom="out" title="缩小">
            <svg viewBox="0 0 16 16" fill="none" width="16" height="16"><circle cx="7" cy="7" r="5.5" stroke="currentColor" stroke-width="1.3"/><path d="M11 11l3.5 3.5M5 7h4" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>
          </button>
          <button class="modal-btn" data-zoom="fit" title="适应页面">
            <svg viewBox="0 0 16 16" fill="none" width="16" height="16"><rect x="1" y="1" width="14" height="14" rx="2" stroke="currentColor" stroke-width="1.3"/><path d="M4 4h2v2M10 4h2v2M4 10h2v2M10 10h2v2" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>
          </button>
          <button class="modal-btn" data-zoom="fullscreen" title="全屏">
            <svg viewBox="0 0 16 16" fill="none" width="16" height="16"><path d="M2 6V2h4M10 2h4v4M14 10v4h-4M6 14H2v-4" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </button>
          <button class="modal-btn modal-btn-copy" title="复制代码">
            <svg viewBox="0 0 16 16" fill="none" width="16" height="16"><path d="M9.5 4.5V2C9.5 1.72386 9.27614 1.5 9 1.5H2C1.72386 1.5 1.5 1.72386 1.5 2V11C1.5 11.2761 1.72386 11.5 2 11.5H6.5" stroke="currentColor" stroke-width="1" stroke-linejoin="round" fill="none"/><path d="M11 4.5H7C6.72386 4.5 6.5 4.72386 6.5 5V14C6.5 14.2761 6.72386 14.5 7 14.5H14C14.2761 14.5 14.5 14.2761 14.5 14V8L11 4.5Z" stroke="currentColor" stroke-width="1" stroke-linejoin="round" fill="none"/></svg>
          </button>
          <button class="modal-btn modal-btn-close" title="关闭">
            <svg viewBox="0 0 16 16" fill="none" width="16" height="16"><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
          </button>
        </div>
      </div>
      <div class="mermaid-modal-body">
        <div class="mermaid-modal-svg">${svgHtml}</div>
      </div>
    </div>
  `

  document.body.appendChild(modal)

  // 动画入场
  requestAnimationFrame(() => modal.classList.add('open'))

  let scale = 1
  const svgContainer = modal.querySelector('.mermaid-modal-svg')

  function setScale(s) {
    scale = Math.max(0.1, Math.min(5, s))
    svgContainer.style.transform = `scale(${scale})`
  }

  // 按钮事件
  modal.addEventListener('click', (e) => {
    const btn = e.target.closest('.modal-btn')
    if (!btn) {
      if (e.target.classList.contains('mermaid-modal-mask')) closeModal()
      return
    }

    const zoom = btn.dataset.zoom
    if (zoom === 'in') setScale(scale + 0.25)
    if (zoom === 'out') setScale(scale - 0.25)
    if (zoom === 'fit') setScale(1)
    if (zoom === 'fullscreen') {
      if (document.fullscreenElement) {
        document.exitFullscreen()
      } else {
        modal.requestFullscreen()
      }
    }
    if (btn.classList.contains('modal-btn-copy')) {
      navigator.clipboard.writeText(source).then(() => {
        btn.innerHTML = `<svg viewBox="0 0 16 16" fill="none" width="16" height="16"><path d="M4.5 7.7L6.99 10.19a.5.5 0 00.71 0L11.5 5.7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`
        setTimeout(() => {
          btn.innerHTML = `<svg viewBox="0 0 16 16" fill="none" width="16" height="16"><path d="M9.5 4.5V2C9.5 1.72386 9.27614 1.5 9 1.5H2C1.72386 1.5 1.5 1.72386 1.5 2V11C1.5 11.2761 1.72386 11.5 2 11.5H6.5" stroke="currentColor" stroke-width="1" stroke-linejoin="round" fill="none"/><path d="M11 4.5H7C6.72386 4.5 6.5 4.72386 6.5 5V14C6.5 14.2761 6.72386 14.5 7 14.5H14C14.2761 14.5 14.5 14.2761 14.5 14V8L11 4.5Z" stroke="currentColor" stroke-width="1" stroke-linejoin="round" fill="none"/></svg>`
        }, 1500)
      })
    }
    if (btn.classList.contains('modal-btn-close')) closeModal()
  })

  // 滚轮缩放
  modal.querySelector('.mermaid-modal-body').addEventListener('wheel', (e) => {
    e.preventDefault()
    setScale(scale + (e.deltaY > 0 ? -0.1 : 0.1))
  })

  // ESC 关闭
  function onKeydown(e) {
    if (e.key === 'Escape') { closeModal(); document.removeEventListener('keydown', onKeydown) }
  }
  document.addEventListener('keydown', onKeydown)

  function closeModal() {
    modal.classList.remove('open')
    setTimeout(() => modal.remove(), 200)
  }
}

export default md
