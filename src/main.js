/**
 * StarChat 应用入口
 * @author ShanhaiSky
 */
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import zhCn from 'element-plus/es/locale/lang/zh-cn'

import App from './App.vue'
import router from './router'
import { initCodeBlockHandlers } from './utils/markdown'
import './styles/global.scss'

// 初始化代码块事件委托
initCodeBlockHandlers()

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(ElementPlus, { locale: zhCn })

app.mount('#app')
