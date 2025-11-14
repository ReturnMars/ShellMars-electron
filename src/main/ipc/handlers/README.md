# IPC 处理器模块

按功能模块拆分 IPC 事件处理，避免在 `main/index.ts` 中堆积所有逻辑。

## 目录结构

```
ipc/
├── index.ts              # 统一注册入口
├── events.ts             # 统一导出所有事件常量
└── handlers/
    ├── test/             # 测试模块
    │   ├── index.ts      # 事件常量 + 处理器（推荐，便于 IDE 跳转）
    │   └── types.ts      # 类型定义
    ├── session/          # 会话管理模块（未来）
    │   ├── index.ts      # 事件常量 + 处理器
    │   ├── types.ts      # 类型定义
    │   └── utils.ts      # 工具函数
    ├── file/             # 文件操作模块（未来）
    │   ├── index.ts      # 事件常量 + 处理器
    │   └── types.ts
    └── task/             # 任务编排模块（未来）
        ├── index.ts      # 事件常量 + 处理器
        └── types.ts
```

## 使用示例

### 1. 创建新的处理器模块文件夹

**推荐方式：事件常量和处理器绑定在一起（便于 IDE 跳转）**

```typescript
// handlers/session/index.ts
import { ipcMain, IpcMainEvent } from 'electron'
import type { SessionConfig, SessionInfo } from './types'

// 事件常量定义
export const SESSION_IPC_EVENTS = {
  CREATE: 'session:create',
  CLOSE: 'session:close',
  LIST: 'session:list'
} as const

export type SessionIpcEvent = typeof SESSION_IPC_EVENTS[keyof typeof SESSION_IPC_EVENTS]

// 事件处理器定义（与事件常量绑定，便于 IDE 跳转）
export const sessionHandlers = {
  // 点击事件名可以直接跳转到处理函数
  [SESSION_IPC_EVENTS.CREATE]: async (_event: IpcMainEvent, config: SessionConfig): Promise<SessionInfo> => {
    // 处理会话创建逻辑
    return { id: 'session-123', status: 'connected' }
  },
  [SESSION_IPC_EVENTS.CLOSE]: (_event: IpcMainEvent, sessionId: string) => {
    // 处理会话关闭逻辑
  },
  [SESSION_IPC_EVENTS.LIST]: (_event: IpcMainEvent): SessionInfo[] => {
    // 处理会话列表逻辑
    return []
  }
}

// 注册处理器
export function registerSessionHandlers(): void {
  // 使用 handle 注册需要返回值的处理器
  Object.entries(sessionHandlers).forEach(([channel, handler]) => {
    if (handler.constructor.name === 'AsyncFunction' || handler.length > 1) {
      ipcMain.handle(channel, handler as any)
    } else {
      ipcMain.on(channel, handler as any)
    }
  })
}
```

```typescript
// handlers/session/types.ts
// 类型定义
export interface SessionConfig {
  host: string
  port: number
  username: string
}

export interface SessionInfo {
  id: string
  status: 'connected' | 'disconnected'
}
```

### 2. 在 ipc/events.ts 中导出事件常量

```typescript
// ipc/events.ts
export { SESSION_IPC_EVENTS, type SessionIpcEvent } from './handlers/session'
```

### 3. 在 ipc/index.ts 中注册处理器

```typescript
// ipc/index.ts
import { registerSessionHandlers } from './handlers/session'

export function registerIpcHandlers(): void {
  registerTestHandlers()
  registerSessionHandlers()  // 添加新模块
}
```

### 4. 在 preload 中暴露事件常量（可选）

```typescript
// preload/index.ts
import { SESSION_IPC_EVENTS } from '../main/ipc/events'

const api = {
  events: {
    test: TEST_IPC_EVENTS,
    session: SESSION_IPC_EVENTS  // 添加新模块的事件常量
  }
}
```

### 5. 模块内部可以进一步拆分

当模块逻辑复杂时，可以在模块文件夹内继续拆分：

```
session/
├── index.ts         # 注册入口
├── EventsEnum.ts    # IPC 事件名称常量（必须）
├── types.ts         # 类型定义
├── service.ts       # 业务逻辑
├── utils.ts         # 工具函数
└── validators.ts    # 数据校验
```

## 事件常量使用规范

- ✅ **推荐**：事件常量和处理器定义在同一个文件（`index.ts`），便于 IDE 跳转
- ✅ **命名规范**：`模块名_IPC_EVENTS`（如 `SESSION_IPC_EVENTS`）
- ✅ **事件命名**：使用 `模块名:动作` 格式（如 `session:create`）
- ✅ **类型导出**：同时导出类型 `模块名IpcEvent`
- ✅ **统一导出**：在 `ipc/events.ts` 中统一导出所有事件常量
- ✅ **处理器绑定**：使用对象映射将事件名和处理函数绑定，便于跳转和维护

## 优势

- ✅ 代码模块化，易于维护
- ✅ 按功能拆分，职责清晰
- ✅ 便于团队协作
- ✅ 易于测试和调试

