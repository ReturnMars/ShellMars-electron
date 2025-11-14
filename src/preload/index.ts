import { contextBridge } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import { TEST_IPC_EVENTS } from '../main/ipc/events'

// IPC API：简洁统一的封装
const ipcEvents = {
  TEST: TEST_IPC_EVENTS
}
const ipcHandlers = {
  // 发送消息（不需要响应）
  send: (channel: string, ...args: any[]): void => {
    electronAPI.ipcRenderer.send(channel, ...args)
  },
  // 调用并等待响应
  invoke: (channel: string, ...args: any[]): Promise<any> => {
    return electronAPI.ipcRenderer.invoke(channel, ...args)
  },
  // 监听消息
  on: (channel: string, listener: (...args: any[]) => void): (() => void) => {
    return electronAPI.ipcRenderer.on(channel, listener)
  },
  // 移除所有监听
  removeAllListeners: (channel: string): void => {
    electronAPI.ipcRenderer.removeAllListeners(channel)
  }
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('ipcEvents', ipcEvents)
    contextBridge.exposeInMainWorld('ipcHandlers', ipcHandlers)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.ipcEvents = ipcEvents
  // @ts-ignore (define in dts)
  window.ipcHandlers = ipcHandlers
}
