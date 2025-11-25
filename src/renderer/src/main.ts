// 添加全局错误处理
window.addEventListener('error', (event) => {
  console.error('全局错误:', event.error, event.filename, event.lineno, event.colno)
})

window.addEventListener('unhandledrejection', (event) => {
  console.error('未处理的 Promise 拒绝:', event.reason)
})

import { createApp } from 'vue'
import { router } from './router'
import { pinia } from './store'

import App from './App.vue'
// 通用字体
import 'vfonts/Lato.css'
// 等宽字体
import 'vfonts/FiraCode.css'
// 全局样式
import './assets/styles/index.scss'
import 'virtual:uno.css'

const bootstrap = () => {
  try {
    const app = createApp(App)
    app.use(router)
    app.use(pinia)
    const appElement = document.getElementById('app')
    if (!appElement) {
      throw new Error('找不到 #app 元素')
    }
    app.mount('#app')
  } catch (error) {
    console.error('Vue 应用初始化失败:', error)
  }
}

bootstrap()
