import { BrowserWindow, IpcMainInvokeEvent, WebContents } from 'electron'
import { randomUUID } from 'crypto'
import { IpcSchemaEventNames } from '../type'
import type { SessionItem } from '@renderer/store/modules/LinkStore/type'
import { sshSessionManager } from './manager'
import { SSHSession } from './session'

type SessionEvents = {
  onData: (data: string) => void
  onError: (error: Error) => void
  onClose: () => void
}

export class SSHService {
  private sessionEvents: Map<string, SessionEvents> = new Map()
  private sessionBuffers: Map<string, string[]> = new Map()
  private readonly maxBufferLength = 2000

  async connect(
    event: IpcMainInvokeEvent,
    payload: { linkItem: SessionItem; sessionId?: string }
  ): Promise<{ success: boolean; sessionId: string; error?: string }> {
    const { linkItem, sessionId } = payload
    const id = sessionId || randomUUID()
    try {
      const session = await sshSessionManager.createSession(id, linkItem)
      if (!this.sessionBuffers.has(id)) {
        this.sessionBuffers.set(id, [])
      }
      this.attachSessionEvents(event, session)
      await session.connect()
      this.broadcastSessionsSnapshot(event)
      return { success: true, sessionId: id }
    } catch (error: any) {
      return {
        success: false,
        sessionId: id,
        error: error?.message || '连接失败'
      }
    }
  }

  async reconnect(
    event: IpcMainInvokeEvent,
    sessionId: string
  ): Promise<{ success: boolean; sessionId: string; error?: string }> {
    try {
      const session = sshSessionManager.getSession(sessionId)
      if (!session) {
        throw new Error('会话不存在')
      }
      if (session.isSessionConnected()) {
        return { success: true, sessionId }
      }
      if (!this.sessionBuffers.has(sessionId)) {
        this.sessionBuffers.set(sessionId, [])
      }
      this.detachSessionEvents(sessionId)
      this.attachSessionEvents(event, session)
      await session.connect()
      this.broadcastSessionsSnapshot(event)
      return { success: true, sessionId }
    } catch (error: any) {
      return {
        success: false,
        sessionId,
        error: error?.message || '重连失败'
      }
    }
  }

  disconnect(sessionId: string): { success: boolean; error?: string } {
    try {
      sshSessionManager.disconnectSession(sessionId)
      this.sessionBuffers.delete(sessionId)
      this.broadcastSessionsSnapshot()
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error?.message || '断开连接失败' }
    }
  }

  delete(sessionId: string): { success: boolean; error?: string } {
    try {
      this.detachSessionEvents(sessionId)
      sshSessionManager.removeSession(sessionId)
      this.broadcastSessionsSnapshot()
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error?.message || '删除会话失败' }
    }
  }

  write(sessionId: string, data: string): { success: boolean; error?: string } {
    try {
      const session = sshSessionManager.getSession(sessionId)
      if (!session) {
        return { success: false, error: '会话不存在' }
      }
      session.write(data)
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error?.message || '写入失败' }
    }
  }

  resize(
    sessionId: string,
    size: { cols: number; rows: number }
  ): { success: boolean; error?: string } {
    try {
      const session = sshSessionManager.getSession(sessionId)
      if (!session) {
        return { success: false, error: '会话不存在' }
      }
      session.resize(size)
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error?.message || '调整大小失败' }
    }
  }

  listSessions(): {
    success: boolean
    sessions: ReturnType<SSHSession['getSessionInfo']>[]
    error?: string
  } {
    try {
      const sessions = sshSessionManager.getAllSessions()
      return { success: true, sessions }
    } catch (error: any) {
      return { success: false, sessions: [], error: error?.message || '获取会话列表失败' }
    }
  }

  getSessionBuffer(
    sessionId: string
  ): { success: boolean; sessionId: string; data: string; error?: string } {
    const buffer = this.sessionBuffers.get(sessionId)
    if (!buffer) {
      return { success: false, sessionId, data: '', error: '会话不存在或无历史数据' }
    }
    return { success: true, sessionId, data: buffer.join('') }
  }

  private attachSessionEvents(event: IpcMainInvokeEvent, session: SSHSession): void {
    const webContents = event.sender
    const sessionId = session.getSessionId()

    const send = (channel: IpcSchemaEventNames, payload: any) => {
      if (!webContents.isDestroyed()) {
        webContents.send(channel, payload)
      }
    }

    const dataHandler = (data: string) => {
      this.appendSessionData(sessionId, data)
      send(IpcSchemaEventNames.SSH_DATA, { sessionId, data })
    }

    const errorHandler = (error: Error) => {
      send(IpcSchemaEventNames.SSH_ERROR, {
        sessionId,
        error: error?.message || '未知错误'
      })
    }

    const closeHandler = () => {
      send(IpcSchemaEventNames.SSH_CLOSE, { sessionId })
      this.detachSessionEvents(sessionId)
      this.broadcastSessionsSnapshot({ sender: webContents })
    }

    session.on('data', dataHandler)
    session.on('error', errorHandler)
    session.on('close', closeHandler)

    this.sessionEvents.set(sessionId, {
      onData: dataHandler,
      onError: errorHandler,
      onClose: closeHandler
    })
  }

  private detachSessionEvents(sessionId: string): void {
    const events = this.sessionEvents.get(sessionId)
    const session = sshSessionManager.getSession(sessionId)
    if (events && session) {
      session.removeListener('data', events.onData)
      session.removeListener('error', events.onError)
      session.removeListener('close', events.onClose)
    }
    this.sessionEvents.delete(sessionId)
  }

  private broadcastSessionsSnapshot(contextEvent?: IpcMainInvokeEvent | { sender: WebContents }): void {
    const sessions = sshSessionManager.getAllSessions()
    const payload = { sessions }

    if (contextEvent?.sender && !contextEvent.sender.isDestroyed()) {
      contextEvent.sender.send('ssh:sessions:update', payload)
    }

    BrowserWindow.getAllWindows().forEach((win) => {
      if (!contextEvent || win.webContents.id !== contextEvent.sender.id) {
        win.webContents.send('ssh:sessions:update', payload)
      }
    })
  }

  private appendSessionData(sessionId: string, data: string): void {
    const buffer = this.sessionBuffers.get(sessionId) ?? []
    buffer.push(data)
    if (buffer.length > this.maxBufferLength) {
      buffer.splice(0, buffer.length - this.maxBufferLength)
    }
    this.sessionBuffers.set(sessionId, buffer)
  }
}

export const sshService = new SSHService()

