import { registerTestHandlers } from './handlers/test'

export function registerIpcHandlers(): void {
  registerTestHandlers()
  // 后续添加其他模块的处理器
  // registerSessionHandlers()
  // registerFileHandlers()
  // registerTaskHandlers()
}

