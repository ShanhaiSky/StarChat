# StarChat — 纯前端 AI 对话

独立的纯前端 AI 对话应用，直接对接 OpenAI 兼容 LLM API。

UI 设计参照 WPS 灵犀 AI 助手风格，感谢 WPS 灵犀团队的设计灵感。

## 技术栈

| 层 | 选型 |
|---|------|
| 前端 | Vue 3 + Element Plus + Hugeicons + Sass |
| 状态管理 | Pinia + localStorage |
| LLM | OpenAI 兼容接口（fetch + SSE） |
| 端口 | 13100 |

## 启动方式

```bash
cd Audichat
npm install
npm run dev
```

## 使用说明

1. 启动后进入设置页面，配置模型列表（Base URL、API Key）
2. 返回对话页面，开始与 AI 对话
3. 会话和消息自动保存在 localStorage 中

## 目录结构

```
Audichat/
├── src/
│   ├── main.js                    # 应用入口
│   ├── App.vue                    # 根组件（加载动画）
│   ├── router/index.js            # 路由配置
│   ├── views/
│   │   ├── ChatView.vue           # 对话主页面
│   │   └── SettingsView.vue       # 模型配置 + 用量看板
│   ├── layouts/
│   │   └── MainLayout.vue         # 侧边栏布局
│   ├── services/
│   │   └── llm.js                 # LLM 直连服务
│   ├── stores/
│   │   ├── chat.js                # 会话存储
│   │   ├── usage.js               # 用量统计
│   │   └── slogan.js              # 每日 Slogan
│   ├── utils/
│   │   └── markdown.js            # Markdown 渲染 + 代码高亮
│   ├── icons/
│   │   └── index.js               # 图标
│   └── styles/
│       └── global.scss            # 全局样式
├── package.json
├── vite.config.js
└── index.html
```

## 核心功能

- **流式对话**: fetch + ReadableStream + SSE，支持 thinking/text/tool_call/usage 事件
- **多模型配置**: 每个模型独立 Base URL 和 API Key，下拉切换
- **会话管理**: 创建/切换/删除会话，localStorage 持久化
- **思考过程**: 支持 reasoning_content 实时展示和折叠
- **停止生成**: AbortController 支持中途停止
- **自动标题**: LLM 自动生成会话标题
- **每日 Slogan**: 基于对话内容生成星辰古风 Slogan
- **用量看板**: Token 用量统计、7 天趋势图、模型分布
- **代码高亮**: highlight.js 语法高亮 + 复制按钮 + HTML 渲染
- **Markdown 渲染**: markdown-it 渲染 AI 回复

## 致谢

- UI 设计参照 [WPS 灵犀 AI 助手](https://ai.wps.cn/)，感谢 WPS 灵犀团队
- 图标库 [Hugeicons](https://hugeicons.com/)
- 语法高亮 [highlight.js](https://highlightjs.org/)
