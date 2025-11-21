import { SSHSession } from './session'
import type { SessionItem } from '@renderer/store/modules/LinkStore/type'

/**
 * SSH 会话管理器
 * 管理多个 SSH 会话的生命周期
 */
export class SSHSessionManager {
  private sessions: Map<string, SSHSession> = new Map()

  /**
   * 创建新的 SSH 会话
   */
  async createSession(sessionId: string, sessionItem: SessionItem): Promise<SSHSession> {
    if (this.sessions.has(sessionId)) {
      throw new Error(`会话 ${sessionId} 已存在`)
    }

    const normalizedSessionItem = {
      ...sessionItem,
      name: this.generateUniqueSessionName(sessionItem)
    }

    const session = new SSHSession(sessionId, normalizedSessionItem)
    this.sessions.set(sessionId, session)

    return session
  }

  /**
   * 获取会话
   */
  getSession(sessionId: string): SSHSession | undefined {
    return this.sessions.get(sessionId)
  }

  /**
   * 移除会话
   */
  removeSession(sessionId: string): void {
    const session = this.sessions.get(sessionId)
    if (session) {
      if (session.isSessionConnected()) {
        session.disconnect()
      }
      session.removeAllListeners()
      this.sessions.delete(sessionId)
    }
  }

  /**
   * 断开所有会话
   */
  disconnectAll(): void {
    for (const [sessionId] of this.sessions) {
      this.removeSession(sessionId)
    }
  }

  /**
   * 获取所有会话 ID
   */
  getAllSessionIds(): string[] {
    return Array.from(this.sessions.keys())
  }

  /**
   * 获取会话数量
   */
  getSessionCount(): number {
    return this.sessions.size
  }

  /**
   * 获取所有会话信息列表
   */
  getAllSessions(): Array<{
    sessionId: string
    host: string
    port: number
    username: string
    name?: string
    isConnected: boolean
    isConnecting: boolean
  }> {
    return Array.from(this.sessions.values()).map((session) => session.getSessionInfo())
  }

  /**
   * 生成唯一的会话名称
   */
  private generateUniqueSessionName(sessionItem: SessionItem): string {
    const baseName =
      sessionItem.name?.trim() ||
      (sessionItem.username ? `${sessionItem.username}@${sessionItem.ip}` : sessionItem.ip) ||
      `session-${this.sessions.size + 1}`

    const existingNames = new Set(
      Array.from(this.sessions.values())
        .map((session) => session.getSessionInfo().name)
        .filter((name): name is string => !!name && name.trim().length > 0)
    )

    if (!existingNames.has(baseName)) {
      return baseName
    }

    let index = 1
    let candidate = `${baseName}(${index})`
    while (existingNames.has(candidate)) {
      index += 1
      candidate = `${baseName}(${index})`
    }
    return candidate
  }

  /**
   * 断开会话连接（保留会话记录）
   */
  disconnectSession(sessionId: string): void {
    const session = this.sessions.get(sessionId)
    if (!session) {
      throw new Error(`会话 ${sessionId} 不存在`)
    }
    session.disconnect()
  }
}

// 单例实例
export const sshSessionManager = new SSHSessionManager()
