import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  base: './',
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  server: {
    port: 13100,
    // MCP 代理：解决浏览器 CORS 限制
    // SSE 连接走 /mcp-proxy/sse，消息收发走 /messages/
    proxy: {
      '/mcp-proxy': {
        target: 'http://localhost:10011',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/mcp-proxy/, ''),
      },
      '/messages': {
        target: 'http://localhost:10011',
        changeOrigin: true,
      },
    },
  },
})