import { ipcMain } from 'electron'
import { IpcMainType, IpcSchema, IpcSchemaEventNames, PreloadBridgeType } from '../type'
import { SessionItem } from '@renderer/store/modules/LinkStore/type'
import { sshService } from './service'

export const sshIpc: IpcSchema[] = [
  {
    channel: IpcSchemaEventNames.SSH_TEST_CONNECTION,
    ipcMainType: IpcMainType.HANDLE,
    preloadBridgeType: PreloadBridgeType.INVOKE,
    handler: async (_event, payload: SessionItem) => {
      return `pong:${payload.name}`
    }
  },
  {
    channel: IpcSchemaEventNames.SSH_CONNECT,
    ipcMainType: IpcMainType.HANDLE,
    preloadBridgeType: PreloadBridgeType.INVOKE,
    handler: async (event, payload: { linkItem: SessionItem; sessionId?: string }) =>
      sshService.connect(event, payload)
  },
  {
    channel: IpcSchemaEventNames.SSH_RECONNECT,
    ipcMainType: IpcMainType.HANDLE,
    preloadBridgeType: PreloadBridgeType.INVOKE,
    handler: async (event, payload: { sessionId: string }) =>
      sshService.reconnect(event, payload.sessionId)
  },
  // 断开
  {
    channel: IpcSchemaEventNames.SSH_DISCONNECT,
    ipcMainType: IpcMainType.HANDLE,
    preloadBridgeType: PreloadBridgeType.INVOKE,
    handler: async (_event, payload: { sessionId: string }) =>
      sshService.disconnect(payload.sessionId)
  },
  // 删除
  {
    channel: IpcSchemaEventNames.SSH_DELETE_SESSION,
    ipcMainType: IpcMainType.HANDLE,
    preloadBridgeType: PreloadBridgeType.INVOKE,
    handler: async (_event, payload: { sessionId: string }) =>
      sshService.delete(payload.sessionId)
  },
  {
    channel: IpcSchemaEventNames.SSH_WRITE,
    ipcMainType: IpcMainType.HANDLE,
    preloadBridgeType: PreloadBridgeType.INVOKE,
    handler: async (_event, payload: { sessionId: string; data: string }) =>
      sshService.write(payload.sessionId, payload.data)
  },
  {
    channel: IpcSchemaEventNames.SSH_RESIZE,
    ipcMainType: IpcMainType.HANDLE,
    preloadBridgeType: PreloadBridgeType.INVOKE,
    handler: async (_event, payload: { sessionId: string; cols: number; rows: number }) =>
      sshService.resize(payload.sessionId, { cols: payload.cols, rows: payload.rows })
  },

  {
    channel: IpcSchemaEventNames.SSH_LIST_SESSIONS,
    ipcMainType: IpcMainType.HANDLE,
    preloadBridgeType: PreloadBridgeType.INVOKE,
    handler: async () => sshService.listSessions()
  },
  {
    channel: IpcSchemaEventNames.SSH_GET_SESSION_BUFFER,
    ipcMainType: IpcMainType.HANDLE,
    preloadBridgeType: PreloadBridgeType.INVOKE,
    handler: async (_event, payload: { sessionId: string }) =>
      sshService.getSessionBuffer(payload.sessionId)
  }
]

let isRegistered = false
export const registerSshIpc = (): void => {
  if (isRegistered) {
    return
  }
  try {
    isRegistered = true
    sshIpc.forEach(({ channel, ipcMainType, handler }) => {
      ipcMain[ipcMainType](channel, handler)
    })
  } catch (error) {
    console.error('🚀 ~ registerSshIpc ~ error:', error)
  }
}

export const sshIpcSchema = sshIpc.reduce(
  (acc, { channel, ipcMainType, preloadBridgeType, handler }) => {
    acc[channel] = {
      channel,
      ipcMainType,
      preloadBridgeType,
      handler
    }
    return acc
  },
  {} as Record<string, IpcSchema>
)
