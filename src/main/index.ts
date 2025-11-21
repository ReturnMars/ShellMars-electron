import 'source-map-support/register'
import { BrowserWindow, app, shell, Menu, MenuItem } from 'electron'
import { electronApp, is, optimizer } from '@electron-toolkit/utils'
import { join } from 'path'
import icon from '../../resources/icon.png?asset'
// 导入 logger 以触发全局注册
import './utils/logger'
import { registerIpc } from '../ipc/index'

// 全局错误处理
process.on('uncaughtException', (error) => {
  console.error('未捕获的异常:', error)
})

process.on('unhandledRejection', (reason, promise) => {
  console.error('未处理的 Promise 拒绝:', reason, promise)
})

const createWindow = (): void => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  // 添加错误处理
  mainWindow.webContents.on('did-fail-load', (_event, errorCode, errorDescription, validatedURL) => {
    console.error('页面加载失败:', {
      errorCode,
      errorDescription,
      validatedURL
    })
  })

  mainWindow.webContents.on('render-process-gone', (_event, details) => {
    console.error('渲染进程崩溃:', details)
  })
  
  // 监听控制台消息（用于调试）
  mainWindow.webContents.on('console-message', (_event, level, message) => {
    console.log(`[Renderer ${level}]`, message)
  })

  mainWindow.webContents.on('unresponsive', () => {
    console.warn('页面无响应')
  })

  mainWindow.webContents.on('responsive', () => {
    console.log('页面恢复响应')
  })

  // 开发环境下打开 DevTools
  // 生产环境也可以通过环境变量控制是否打开 DevTools（用于调试白屏问题）
  if (is.dev || process.env.OPEN_DEVTOOLS === 'true') {
    mainWindow.webContents.openDevTools()
  }
  
  // 添加快捷键打开 DevTools（F12 或 Ctrl+Shift+I 或 Ctrl+Shift+D）
  mainWindow.webContents.on('before-input-event', (_event, input) => {
    if (
      input.key === 'F12' || 
      (input.control && input.shift && (input.key === 'I' || input.key === 'D'))
    ) {
      mainWindow.webContents.toggleDevTools()
    }
  })
  
  // 添加右键菜单（包含打开 DevTools 选项）
  const contextMenu = new Menu()
  contextMenu.append(
    new MenuItem({
      label: '打开开发者工具',
      accelerator: 'F12',
      click: () => {
        mainWindow.webContents.openDevTools()
      }
    })
  )
  contextMenu.append(
    new MenuItem({
      label: '重新加载',
      accelerator: 'Ctrl+R',
      click: () => {
        mainWindow.webContents.reload()
      }
    })
  )
  
  mainWindow.webContents.on('context-menu', () => {
    contextMenu.popup()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    const htmlPath = join(__dirname, '../renderer/index.html')
    console.log('=== 加载 HTML 文件 ===')
    console.log('HTML 路径:', htmlPath)
    console.log('__dirname:', __dirname)
    console.log('文件是否存在:', require('fs').existsSync(htmlPath))
    
    // 检查文件内容
    if (require('fs').existsSync(htmlPath)) {
      const htmlContent = require('fs').readFileSync(htmlPath, 'utf-8')
      console.log('HTML 内容预览:', htmlContent.substring(0, 500))
    }
    
    mainWindow.loadFile(htmlPath)
      .then(() => {
        console.log('✓ HTML 文件加载成功')
        // 等待页面加载完成后检查
        mainWindow.webContents.once('did-finish-load', () => {
          console.log('✓ 页面加载完成')
          mainWindow.webContents.executeJavaScript(`
            console.log('页面已加载，检查 DOM...');
            console.log('app div:', document.getElementById('app'));
            console.log('Vue 是否挂载:', window.__VUE__);
          `).catch(err => console.error('执行 JS 失败:', err))
        })
      })
      .catch((err) => {
        console.error('✗ 加载 HTML 文件失败:', err)
      })
  }
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.electron')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })
  
  // 注册 IPC 处理器
  try {
    registerIpc()
    console.log('IPC 处理器注册成功')
  } catch (err) {
    console.error('IPC 处理器注册失败:', err)
  }
  
  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (!BrowserWindow.getAllWindows().length) {
      createWindow()
    }
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
