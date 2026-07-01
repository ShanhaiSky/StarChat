# Electron 打包错题集

> Vue 3 + Vite + Electron 打包桌面应用的常见问题和解决方案
> @ShanhaiSky

---

## 1. require is not defined in ES module scope

**现象**: 启动报错 `ReferenceError: require is not defined in ES module scope`

**原因**: `package.json` 中有 `"type": "module"`，所有 `.js` 文件被视为 ES Module，但 Electron 主进程用 `require()` (CommonJS)

**解决**: Electron 主进程文件改后缀为 `.cjs`
```
electron/main.js  →  electron/main.cjs
```
同时更新 `package.json`: `"main": "electron/main.cjs"`

---

## 2. 白屏 — 资源路径找不到

**现象**: 加载动画正常，但应用页面白屏

**原因**: Vite 默认 `base: '/'`，打包后资源路径是 `/assets/index.js`。Electron 用 `file://` 协议加载，`/` 指向磁盘根目录而非应用目录

**解决**: `vite.config.js` 设置 `base: './'`
```js
export default defineConfig({
  base: './',  // 相对路径
  // ...
})
```

---

## 3. 白屏 — 路由不工作

**现象**: 加载动画正常，之后白屏，控制台无报错

**原因**: Vue Router 用 `createWebHistory()` (HTML5 History API)，需要服务端配合。Electron 的 `file://` 没有服务端，路由跳转失败

**解决**: 改用 `createWebHashHistory()` (Hash 模式)
```js
import { createRouter, createWebHashHistory } from 'vue-router'

const router = createRouter({
  history: createWebHashHistory(),  // file:// 兼容
  routes,
})
```

---

## 4. macOS 打包网络超时

**现象**: `connect ETIMEDOUT 20.205.243.166:443`

**原因**: Electron 需要从 GitHub 下载预编译二进制文件，国内网络不通

**解决**: 使用淘宝镜像
```bash
ELECTRON_MIRROR="https://npmmirror.com/mirrors/electron/" npx electron-builder --mac
```

---

## 5. macOS 未签名警告

**现象**: 打开 .app 提示"无法验证开发者"

**原因**: 没有 Apple Developer 证书签名

**解决**:
- 临时: 右键 → 打开 → 确认
- 正式: 购买 Apple Developer 账号，配置证书签名

---

## 6. Windows EXE 文件太大

**现象**: 安装包 100MB+

**原因**: Electron 内置完整 Chromium + Node.js 运行时 (~120MB)

**优化方向**:
- 裁剪不必要的 locale 文件
- 升级最新 Electron（更小的运行时）
- 换用 Tauri（3-5MB，基于系统 WebView）

---

## 打包检查清单

打包前逐项检查:

- [ ] `vite.config.js` 设置 `base: './'`
- [ ] `package.json` 的 `"main"` 指向 `.cjs` 文件
- [ ] Electron 主进程用 `.cjs` 后缀
- [ ] Vue Router 用 `createWebHashHistory()`
- [ ] 设置 `ELECTRON_MIRROR` 国内镜像
- [ ] `webPreferences.webSecurity: false`（如需加载本地资源）
- [ ] 先 `npm run build`（Vite 构建），再 `electron-builder`
