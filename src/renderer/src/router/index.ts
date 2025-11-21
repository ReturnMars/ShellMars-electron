import { createRouter, createMemoryHistory } from 'vue-router'
import IndexPage from '../pages/IndexPage.vue'

// 基础路由配置
const routes = [
  {
    path: '/',
    name: 'Home',
    component: IndexPage,
    children: [
      {
        path: '/term',
        name: 'Term',
        component: () => import('../components/Term.vue/index.vue')
      }
    ]
  }
]

// 创建路由实例
// 在 Electron 中使用 createMemoryHistory 而不是 createWebHistory
// 因为 file:// 协议不支持 HTML5 History API
const router = createRouter({
  history: createMemoryHistory(),
  routes
})

// 导出路由实例
export { router }
