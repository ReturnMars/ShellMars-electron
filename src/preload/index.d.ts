import { ElectronAPI } from '@electron-toolkit/preload'
import type { TestIpcEvent } from '../main/ipc/events'
import type { TEST_IPC_EVENTS } from '../main/ipc/events'

export interface IpcEvents {
  TEST: typeof TEST_IPC_EVENTS
}
export interface IpcHandlers {
  // 发送消息（不需要响应）
  send: (channel: string, ...args: any[]) => void
  // 调用并等待响应
  invoke: (channel: string, ...args: any[]) => Promise<any>
  // 监听消息
  on: (channel: string, listener: (...args: any[]) => void) => () => void
  // 移除所有监听
  removeAllListeners: (channel: string) => void
}

declare global {
  interface Window {
    electron: ElectronAPI
    ipcEvents: IpcEvents
    ipcHandlers: IpcHandlers
  }
}
