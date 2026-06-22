# ✦ StarChat

> 以星辰为引，洞见万千

纯前端 AI 对话应用，直接对接 OpenAI 兼容 LLM API，无需后端服务。

![Vue 3](https://img.shields.io/badge/Vue-3-42b883?logo=vue.js) ![Vite](https://img.shields.io/badge/Vite-5-646cff?logo=vite) ![License](https://img.shields.io/badge/License-MIT-blue)

## ✨ 特性

- **流式对话** — SSE 流式响应，实时输出
- **多模型支持** — 每个模型独立配置 Base URL 和 API Key，下拉切换
- **思考过程** — 支持 reasoning_content 折叠展示
- **代码高亮** — highlight.js 语法高亮 + 一键复制 + HTML 渲染
- **Mermaid 图表** — 流程图/时序图/甘特图自动渲染，支持大图查看/缩放/全屏
- **用量看板** — Token 用量统计、7 天趋势图、模型分布
- **每日 Slogan** — 基于对话内容生成星辰古风 Slogan
- **星系交互** — 空状态 Logo 悬停展开智能提示词行星
- **无缝加载** — Logo 旋转弹入 → 位移到空状态位置

## 🚀 快速开始

```bash
# 克隆项目
git clone https://github.com/ShanhaiSky/StarChat.git
cd StarChat

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

访问 `http://localhost:13100`，进入设置页面配置模型即可开始对话。

## ⚙️ 配置

在设置页面配置模型列表：

| 配置项 | 说明 | 示例 |
|--------|------|------|
| 模型名称 | API 模型标识 | `deepseek-v4-flash` |
| Base URL | OpenAI 兼容接口地址 | `https://api.deepseek.com/v1` |
| API Key | 认证密钥（可选） | `sk-...` |

支持配置多个模型，在对话页面下拉切换。

## 📦 技术栈

| 层 | 选型 |
|---|------|
| 框架 | Vue 3 + Vite 5 |
| UI | Element Plus + Hugeicons |
| 状态管理 | Pinia + localStorage |
| 样式 | Sass（灵犀设计风格） |
| Markdown | markdown-it + highlight.js |
| 图表 | Mermaid |
| LLM | OpenAI 兼容接口（fetch + SSE） |

## 📁 项目结构

```
StarChat/
├── src/
│   ├── views/           # 页面（ChatView、SettingsView）
│   ├── layouts/         # 布局（MainLayout）
│   ├── services/        # LLM 直连服务
│   ├── stores/          # 状态管理（chat、usage、slogan）
│   ├── utils/           # 工具（Markdown 渲染）
│   ├── icons/           # 图标
│   └── styles/          # 全局样式
├── package.json
└── vite.config.js
```

## 📄 License

MIT

## 🙏 致谢

- UI 设计参照 [WPS 灵犀 AI 助手](https://linxi.wps.cn/)，感谢 WPS 灵犀团队
- 图标库 [Hugeicons](https://hugeicons.com/)
- 语法高亮 [highlight.js](https://highlightjs.org/)
- 图表渲染 [Mermaid](https://mermaid.js.org/)

---

**@ShanhaiSky**
