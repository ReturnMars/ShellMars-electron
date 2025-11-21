// 添加全局错误处理
window.addEventListener('error', (event) => {
  console.error('全局错误:', event.error, event.filename, event.lineno, event.colno);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('未处理的 Promise 拒绝:', event.reason);
});

console.log('=== 渲染进程启动 ===');
console.log('当前 URL:', window.location.href);
console.log('app div 存在:', !!document.getElementById('app'));

import { createApp } from "vue";
import { router } from "./router";
import { pinia } from "./store";

import App from "./App.vue";
// 通用字体
import "vfonts/Lato.css";
// 等宽字体
import "vfonts/FiraCode.css";
// 全局样式
import "./assets/styles/index.scss";
import "virtual:uno.css";

console.log('开始创建 Vue 应用...');

try {
  const app = createApp(App);
  console.log('Vue 应用创建成功');
  
  app.use(router);
  console.log('Router 已注册');
  
  app.use(pinia);
  console.log('Pinia 已注册');
  
  const appElement = document.getElementById('app');
  if (!appElement) {
    console.error('✗ 找不到 #app 元素！');
    throw new Error('找不到 #app 元素');
  }
  
  // 确保路由初始化
  router.push('/').then(() => {
    console.log('✓ 路由已导航到 /');
  }).catch((err) => {
    console.error('✗ 路由导航失败:', err);
  });
  
  app.mount("#app");
  console.log('✓ Vue 应用已挂载到 #app');
  
  // 检查路由状态
  setTimeout(() => {
    console.log('当前路由:', router.currentRoute.value.path);
    console.log('router-view 是否存在:', !!document.querySelector('router-view'));
  }, 100);
} catch (error) {
  console.error('✗ Vue 应用初始化失败:', error);
  // 在页面上显示错误信息
  const appElement = document.getElementById('app');
  if (appElement) {
    appElement.innerHTML = `
      <div style="padding: 20px; font-family: monospace; color: red;">
        <h1>应用初始化失败</h1>
        <pre>${error instanceof Error ? error.stack : String(error)}</pre>
      </div>
    `;
  }
}
