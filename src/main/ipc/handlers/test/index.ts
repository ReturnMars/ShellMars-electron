import { ipcMain, IpcMainEvent } from 'electron'

// 事件常量定义
export const TEST_IPC_EVENTS = {
  PING: 'test:ping',
  PONG: 'test:pong'
} as const

export type TestIpcEvent = (typeof TEST_IPC_EVENTS)[keyof typeof TEST_IPC_EVENTS]

// 事件处理器定义（与事件常量绑定，便于 IDE 跳转）
export const testHandlers = {
  // 点击事件名可以直接跳转到处理函数
  [TEST_IPC_EVENTS.PING]: (_event: IpcMainEvent, data: string) => {
    logger.info('🚀 ~ data:你好', data)
  },
  [TEST_IPC_EVENTS.PONG]: (event: IpcMainEvent, ...args: any[]) => {
    console.log('pong response', args)
    console.log('pong response', event)
  }
}

// 注册处理器
export function registerTestHandlers(): void {
  Object.entries(testHandlers).forEach(([channel, handler]) => {
    ipcMain.on(channel, handler)
  })
}
