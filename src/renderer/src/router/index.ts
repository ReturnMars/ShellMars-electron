import { createRouter, createWebHistory } from 'vue-router'

// 基础路由配置
const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('../pages/IndexPage.vue'),
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
const router = createRouter({
  history: createWebHistory(),
  routes
})

// 导出路由实例
export { router }
