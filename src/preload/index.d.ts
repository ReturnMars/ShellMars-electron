import { ElectronAPI } from '@electron-toolkit/preload'
import { SessionItem } from '@renderer/store/modules/LinkStore/type'

type IpcBridge = {
  test: {
    ping: (payload: string) => Promise<string>
    pong: () => Promise<string>
  }
  ssh: {
    testConnection: (payload: SessionItem) => Promise<string>
    connect: (payload: { linkItem: SessionItem; sessionId?: string }) => Promise<{
      success: boolean
      sessionId: string
      error?: string
    }>
    reconnect: (payload: { sessionId: string }) => Promise<{
      success: boolean
      sessionId: string
      error?: string
    }>
    disconnect: (payload: { sessionId: string }) => Promise<{
      success: boolean
      error?: string
    }>
    deleteSession: (payload: { sessionId: string }) => Promise<{
      success: boolean
      error?: string
    }>
    write: (payload: { sessionId: string; data: string }) => Promise<{
      success: boolean
      error?: string
    }>
    resize: (payload: { sessionId: string; cols: number; rows: number }) => Promise<{
      success: boolean
      error?: string
    }>

    getListSessions: () => Promise<{
      success: boolean
      sessions: Array<{
        sessionId: string
        host: string
        port: number
        username: string
        name?: string
        isConnected: boolean
        isConnecting: boolean
      }>
      error?: string
    }>
    getSessionBuffer: (payload: { sessionId: string }) => Promise<{
      success: boolean
      sessionId: string
      data: string
      error?: string
    }>
    onSessionsUpdate: (
      callback: (payload: {
        sessions: Array<{
          sessionId: string
          host: string
          port: number
          username: string
          name?: string
          isConnected: boolean
          isConnecting: boolean
        }>
      }) => void
    ) => void
    onData: (callback: (data: { sessionId: string; data: string }) => void) => void
    onError: (callback: (data: { sessionId: string; error: string }) => void) => void
    onClose: (callback: (data: { sessionId: string }) => void) => void
    removeAllListeners: (channel: string) => void
  }
}

declare global {
  interface Window {
    electron: ElectronAPI
    ipc: IpcBridge
    versions: NodeJS.ProcessVersions
  }
}
