import { ipcMain } from 'electron'
import { IpcMainType, PreloadBridgeType, IpcSchema, IpcSchemaEventNames } from '../type'
export const testIpc: IpcSchema[] = [
  {
    channel: IpcSchemaEventNames.TEST_PING,
    ipcMainType: IpcMainType.HANDLE,
    preloadBridgeType: PreloadBridgeType.INVOKE,
    handler: async (_event, payload: string) => {
      return `pong:${payload}`
    }
  },
  {
    channel: IpcSchemaEventNames.TEST_PONG,
    ipcMainType: IpcMainType.ON,
    preloadBridgeType: PreloadBridgeType.SEND,
    handler: async () => {
      return 'pong'
    }
  }
]
let isRegistered = false
export const registerTestIpc = (): void => {
  if (isRegistered) {
    return
  }
  isRegistered = true
  try {
    testIpc.forEach(({ channel, ipcMainType, handler }) => {
      ipcMain[ipcMainType](channel, handler)
    })
  } catch (error) {
    console.error('🚀 ~ registerTestIpc ~ error:', error)
  }
}

export const testIpcSchema = testIpc.reduce(
  (acc, { channel, ipcMainType, preloadBridgeType, handler }) => {
    acc[channel] = {
      channel,
      ipcMainType,
      preloadBridgeType,
      handler
    }
    return acc
  },
  {} as Record<
    string,
    {
      channel: string
      ipcMainType: 'handle' | 'on'
      preloadBridgeType: 'invoke' | 'send'
      handler: (event: Electron.IpcMainInvokeEvent, ...args: any[]) => any
    }
  >
)
