# SSH 终端使用指南

## 概述

本项目使用 `ssh2` 库实现 SSH 远程连接，通过 Electron IPC 与前端 xterm.js 进行通信。

## 架构说明

### 数据流
```
xterm.js (前端) 
  ↔ IPC 通信 
  ↔ 主进程 (Electron) 
  ↔ ssh2 连接 
  ↔ 远程服务器的 PTY
```

### 关键点
- **不需要本地 PTY**：使用 `ssh2.shell()` 在远程服务器上创建 PTY
- **主进程作为桥梁**：负责管理 SSH 连接和数据转发
- **事件驱动**：通过 IPC 事件传递终端数据

## 安装依赖

```bash
pnpm add ssh2
```

## 前端使用示例（Vue + xterm.js）

```typescript
import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import '@xterm/xterm/css/xterm.css'

// 创建终端实例
const terminal = new Terminal({
  cursorBlink: true,
  fontSize: 14,
  fontFamily: 'Consolas, "Courier New", monospace'
})

const fitAddon = new FitAddon()
terminal.loadAddon(fitAddon)

// 挂载到 DOM
const terminalElement = document.getElementById('terminal')
if (terminalElement) {
  terminal.open(terminalElement)
  fitAddon.fit()
}

// 连接 SSH
async function connectSSH(linkItem: SessionItem) {
  const result = await window.ipc.ssh.connect({
    linkItem,
    sessionId: undefined // 自动生成
  })

  if (!result.success) {
    console.error('连接失败:', result.error)
    return
  }

  const sessionId = result.sessionId

  // 监听终端数据
  window.ipc.ssh.onData(({ sessionId: sid, data }) => {
    if (sid === sessionId) {
      terminal.write(data)
    }
  })

  // 监听错误
  window.ipc.ssh.onError(({ sessionId: sid, error }) => {
    if (sid === sessionId) {
      console.error('SSH 错误:', error)
      terminal.write(`\r\n[错误] ${error}\r\n`)
    }
  })

  // 监听关闭
  window.ipc.ssh.onClose(({ sessionId: sid }) => {
    if (sid === sessionId) {
      terminal.write('\r\n[连接已关闭]\r\n')
    }
  })

  // 发送用户输入
  terminal.onData((data) => {
    window.ipc.ssh.write({ sessionId, data })
  })

  // 处理终端大小变化
  const resizeObserver = new ResizeObserver(() => {
    fitAddon.fit()
    const { cols, rows } = terminal
    window.ipc.ssh.resize({ sessionId, cols, rows })
  })
  resizeObserver.observe(terminalElement!)

  // 断开连接
  return () => {
    window.ipc.ssh.disconnect({ sessionId })
    window.ipc.ssh.removeAllListeners('ssh_data')
    window.ipc.ssh.removeAllListeners('ssh_error')
    window.ipc.ssh.removeAllListeners('ssh_close')
    resizeObserver.disconnect()
  }
}
```

## API 说明

### `window.ipc.ssh.connect(payload)`
连接 SSH 服务器并创建终端会话。

**参数：**
```typescript
{
  linkItem: SessionItem,  // 连接信息（IP、端口、用户名、密码等）
  sessionId?: string   // 可选的会话 ID，不提供则自动生成
}
```

**返回：**
```typescript
Promise<{
  success: boolean
  sessionId: string
  error?: string
}>
```

### `window.ipc.ssh.disconnect(payload)`
断开 SSH 连接。

**参数：**
```typescript
{
  sessionId: string
}
```

### `window.ipc.ssh.write(payload)`
向远程终端发送数据（用户输入）。

**参数：**
```typescript
{
  sessionId: string
  data: string
}
```

### `window.ipc.ssh.resize(payload)`
调整远程终端大小。

**参数：**
```typescript
{
  sessionId: string
  cols: number
  rows: number
}
```

### `window.ipc.ssh.onData(callback)`
监听终端输出数据。

**回调参数：**
```typescript
{
  sessionId: string
  data: string
}
```

### `window.ipc.ssh.onError(callback)`
监听错误事件。

**回调参数：**
```typescript
{
  sessionId: string
  error: string
}
```

### `window.ipc.ssh.onClose(callback)`
监听连接关闭事件。

**回调参数：**
```typescript
{
  sessionId: string
}
```

## 注意事项

1. **会话管理**：每个 SSH 连接都有唯一的 `sessionId`，需要妥善管理
2. **事件清理**：组件卸载时需要移除事件监听器
3. **错误处理**：始终处理连接失败和错误情况
4. **终端大小**：窗口大小变化时需要同步调整远程终端大小
5. **编码问题**：确保终端编码设置正确（默认 UTF-8）

## 文件结构

```
src/ipc/ssh/
├── index.ts      # IPC 接口定义和注册
├── session.ts    # SSH 会话类（单个连接管理）
└── manager.ts    # SSH 会话管理器（多会话管理）
```

