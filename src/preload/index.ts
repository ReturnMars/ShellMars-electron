import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import { IpcSchemaEventNames } from '../ipc/type'

const exposedVersions = electronAPI.process?.versions ?? process.versions

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('versions', exposedVersions)
    registerPreloadBridges()
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore
  window.versions = exposedVersions
}

function registerPreloadBridges(): void {
  contextBridge.exposeInMainWorld('ipc', {
    test: {
      ping: (payload: string) => ipcRenderer.invoke(IpcSchemaEventNames.TEST_PING, payload),
      pong: () => ipcRenderer.send(IpcSchemaEventNames.TEST_PONG)
    },
    ssh: {
      testConnection: (payload: any) =>
        ipcRenderer.invoke(IpcSchemaEventNames.SSH_TEST_CONNECTION, payload),
      connect: (payload: { linkItem: any; sessionId?: string }) =>
        ipcRenderer.invoke(IpcSchemaEventNames.SSH_CONNECT, payload),
      reconnect: (payload: { sessionId: string }) =>
        ipcRenderer.invoke(IpcSchemaEventNames.SSH_RECONNECT, payload),
      disconnect: (payload: { sessionId: string }) =>
        ipcRenderer.invoke(IpcSchemaEventNames.SSH_DISCONNECT, payload),
      deleteSession: (payload: { sessionId: string }) =>
        ipcRenderer.invoke(IpcSchemaEventNames.SSH_DELETE_SESSION, payload),
      write: (payload: { sessionId: string; data: string }) =>
        ipcRenderer.invoke(IpcSchemaEventNames.SSH_WRITE, payload),
      resize: (payload: { sessionId: string; cols: number; rows: number }) =>
        ipcRenderer.invoke(IpcSchemaEventNames.SSH_RESIZE, payload),
      getListSessions: () => ipcRenderer.invoke(IpcSchemaEventNames.SSH_LIST_SESSIONS),
      getSessionBuffer: (payload: { sessionId: string }) =>
        ipcRenderer.invoke(IpcSchemaEventNames.SSH_GET_SESSION_BUFFER, payload),
      onData: (callback: (data: { sessionId: string; data: string }) => void) => {
        ipcRenderer.on(IpcSchemaEventNames.SSH_DATA, (_event, data) => callback(data))
      },
      onError: (callback: (data: { sessionId: string; error: string }) => void) => {
        ipcRenderer.on(IpcSchemaEventNames.SSH_ERROR, (_event, data) => callback(data))
      },
      onClose: (callback: (data: { sessionId: string }) => void) => {
        ipcRenderer.on(IpcSchemaEventNames.SSH_CLOSE, (_event, data) => callback(data))
      },
      onSessionsUpdate: (
        callback: (payload: { sessions: Array<Record<string, any>> }) => void
      ) => {
        ipcRenderer.on('ssh:sessions:update', (_event, data) => callback(data))
      },
      removeAllListeners: (channel: string) => {
        ipcRenderer.removeAllListeners(channel)
      }
    }
  })
}
