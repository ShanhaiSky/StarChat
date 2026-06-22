/**
 * 路由配置
 * @author ShanhaiSky
 */
import { createRouter, createWebHistory } from 'vue-router'
import MainLayout from '@/layouts/MainLayout.vue'
import ChatView from '@/views/ChatView.vue'
import SettingsView from '@/views/SettingsView.vue'

const routes = [
  {
    path: '/',
    component: MainLayout,
    children: [
      { path: '', name: 'home', component: ChatView },
      { path: 'chat', name: 'chat', component: ChatView },
      { path: 'chat/:sessionId', name: 'chat-session', component: ChatView },
      { path: 'settings', name: 'settings', component: SettingsView },
    ],
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
