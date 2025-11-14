# Electron IPC 通信本质与封装设计

## IPC 通信的本质

### 1. 核心概念

Electron IPC（Inter-Process Communication）是主进程和渲染进程之间的通信机制：

```
渲染进程 (Renderer)  ←→  IPC 通道  ←→  主进程 (Main)
```

### 2. 两种通信模式

#### 模式1：单向通信（send/on）
- **渲染进程**：`ipcRenderer.send(channel, ...args)` - 发送消息，不等待响应
- **主进程**：`ipcMain.on(channel, (event, ...args) => {})` - 监听消息

#### 模式2：请求-响应（invoke/handle）
- **渲染进程**：`ipcRenderer.invoke(channel, ...args)` - 发送请求，等待响应
- **主进程**：`ipcMain.handle(channel, (event, ...args) => { return result })` - 处理请求并返回

### 3. 安全机制

- **Context Isolation**：渲染进程与主进程隔离，不能直接访问 Node.js API
- **Preload Script**：作为安全桥梁，通过 `contextBridge` 暴露受控的 API
- **Sandbox**：可选的沙箱模式，进一步限制渲染进程权限

## 当前封装的问题

1. **层级过深**：`window.api.ipc.test.send(window.api.ipc.test.PING)` 太冗长
2. **重复暴露**：事件常量在多处暴露（events、test.PING、test.send）
3. **不够直观**：调用方式不够简洁明了

## 设计原则

1. **简洁性**：调用方式要直观简洁
2. **类型安全**：充分利用 TypeScript 类型系统
3. **统一管理**：事件常量统一在 EventsEnum.ts 中定义
4. **最小暴露**：preload 只暴露必要的 API

## 推荐方案

### 方案A：直接暴露事件常量 + 通用方法（推荐）

```typescript
// 渲染进程使用
window.api.ipc.send(window.api.ipc.events.test.PING)
window.api.ipc.invoke(window.api.ipc.events.test.GET_DATA, params)
```

**优点**：
- 简洁明了
- 类型安全
- 统一管理

**缺点**：
- 路径稍长，但可接受

### 方案B：模块化封装（如果模块很多）

```typescript
// 渲染进程使用
window.api.test.ping()
window.api.test.getData(params)
```

**优点**：
- 非常简洁
- 模块化清晰

**缺点**：
- 需要为每个事件创建函数，维护成本高

## 最终方案（已实现）

采用**方案A**，简洁统一的封装：

### 架构设计

```
主进程 (Main)
├── handlers/
│   └── test/
│       ├── EventsEnum.ts  # 事件常量定义
│       └── index.ts       # 事件处理器注册
└── ipc/
    ├── events.ts          # 统一导出事件常量
    └── index.ts           # 统一注册处理器

预加载 (Preload)
└── index.ts               # 暴露 IPC API

渲染进程 (Renderer)
└── 使用 window.ipc
```

### 使用方式（优化后）

```typescript
// 渲染进程调用
// 1. 发送消息（不需要响应）
window.ipc.send(window.ipc.test.PING)

// 2. 调用并等待响应
const result = await window.ipc.invoke(window.ipc.test.GET_DATA, params)

// 3. 监听消息
window.ipc.on(window.ipc.test.PONG, (data) => {
  console.log('收到响应:', data)
})
```

### 优化说明

1. **简化调用路径**：`window.api.ipc` → `window.ipc`
2. **简化事件常量**：`events.test.PING` → `test.PING`
3. **保留兼容性**：仍可通过 `window.ipc.events.test.PING` 访问（备用）

### 优势

1. **简洁统一**：所有 IPC 调用都通过 `window.ipc`，方式一致
2. **路径简短**：`window.ipc.test.PING` 比 `window.api.ipc.events.test.PING` 简洁很多
3. **类型安全**：事件常量有完整的 TypeScript 类型支持，IDE 自动补全
4. **易于维护**：事件常量统一在 EventsEnum.ts 中管理
5. **易于扩展**：添加新模块只需在 events 中导出，在 preload 中直接暴露

