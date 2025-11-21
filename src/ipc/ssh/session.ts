import { Client } from 'ssh2'
import { EventEmitter } from 'node:events'
import type { SessionItem } from '@renderer/store/modules/LinkStore/type'

export interface SSHSessionOptions {
  host: string
  port?: number
  username: string
  password?: string
  privateKey?: string
  passphrase?: string
  readyTimeout?: number
}

export interface TerminalSize {
  cols: number
  rows: number
}

/**
 * SSH 会话管理器
 * 管理单个 SSH 连接和 PTY 终端
 */
export class SSHSession extends EventEmitter {
  private client: Client | null = null
  private stream: any = null
  private sessionId: string
  private options: SSHSessionOptions
  private displayName?: string
  private isConnected = false
  private isConnecting = false

  constructor(sessionId: string, sessionItem: SessionItem) {
    super()
    this.sessionId = sessionId
    this.displayName = sessionItem.name
    this.options = {
      host: sessionItem.ip,
      port: sessionItem.port || 22,
      username: sessionItem.username || 'root',
      password: sessionItem.password
    }
  }

  /**
   * 连接到远程服务器并创建 PTY
   */
  async connect(): Promise<void> {
    if (this.isConnecting || this.isConnected) {
      throw new Error('会话已连接或正在连接中')
    }

    this.isConnecting = true

    return new Promise((resolve, reject) => {
      const client = new Client()

      client.on('ready', () => {
        this.isConnecting = false
        this.isConnected = true
        this.client = client

        // 创建交互式 shell（自动创建 PTY）
        client.shell(
          {
            term: 'xterm-256color',
            cols: 80,
            rows: 30
          },
          (err, stream) => {
            if (err) {
              this.emit('error', err)
              reject(err)
              return
            }

            this.stream = stream
            this.setupStreamHandlers()
            this.emit('ready')
            resolve()
          }
        )
      })

      client.on('error', (err) => {
        this.isConnecting = false
        this.isConnected = false
        // 确保错误信息可序列化
        const errorMessage = err?.message || String(err) || 'SSH 连接错误'
        this.emit('error', new Error(errorMessage))
        reject(new Error(errorMessage))
      })

      // 连接配置
      const connectConfig: any = {
        host: this.options.host,
        port: this.options.port,
        username: this.options.username,
        readyTimeout: this.options.readyTimeout || 20000
      }

      if (this.options.password) {
        connectConfig.password = this.options.password
      } else if (this.options.privateKey) {
        connectConfig.privateKey = this.options.privateKey
        if (this.options.passphrase) {
          connectConfig.passphrase = this.options.passphrase
        }
      } else {
        reject(new Error('需要提供密码或私钥'))
        return
      }

      client.connect(connectConfig)
    })
  }

  /**
   * 设置流事件处理器
   */
  private setupStreamHandlers(): void {
    if (!this.stream) return

    // 接收远程终端输出
    this.stream.on('data', (data: Buffer) => {
      this.emit('data', data.toString())
    })

    // 终端关闭
    this.stream.on('close', () => {
      this.isConnected = false
      this.emit('close')
    })

    // 错误处理
    this.stream.on('error', (err: Error) => {
      // 确保错误信息可序列化
      const errorMessage = err?.message || String(err) || '流错误'
      this.emit('error', new Error(errorMessage))
    })

    // 终端退出
    this.stream.on('exit', (code: number, signal?: string) => {
      this.emit('exit', code, signal)
    })
  }

  /**
   * 发送数据到远程终端
   */
  write(data: string): void {
    if (!this.stream || !this.isConnected) {
      throw new Error('终端未连接')
    }
    this.stream.write(data)
  }

  /**
   * 调整终端大小
   */
  resize(size: TerminalSize): void {
    if (!this.stream || !this.isConnected) {
      throw new Error('终端未连接')
    }
    this.stream.setWindow(size.rows, size.cols)
  }

  /**
   * 断开连接
   */
  disconnect(): void {
    // 防止重复断开
    if (!this.isConnected && !this.isConnecting) {
      return
    }

    const wasConnected = this.isConnected

    if (this.stream) {
      // 移除流的事件监听器，避免触发事件
      this.stream.removeAllListeners()
      this.stream.end()
      this.stream = null
    }

    if (this.client) {
      // 移除客户端的事件监听器
      this.client.removeAllListeners()
      this.client.end()
      this.client = null
    }

    this.isConnected = false
    this.isConnecting = false
    
    // 只在真正连接过的情况下触发 disconnect 事件
    // 使用 setImmediate 确保在清理完成后才触发，避免循环
    if (wasConnected) {
      setImmediate(() => {
        // 检查是否还有监听器（可能已经被 manager 移除了）
        if (this.listenerCount('disconnect') > 0) {
          this.emit('disconnect')
        }
      })
    }
  }

  /**
   * 获取会话 ID
   */
  getSessionId(): string {
    return this.sessionId
  }

  /**
   * 检查是否已连接
   */
  isSessionConnected(): boolean {
    return this.isConnected
  }

  /**
   * 获取会话信息（用于列表展示）
   */
  getSessionInfo(): {
    sessionId: string
    host: string
    port: number
    username: string
    name?: string
    isConnected: boolean
    isConnecting: boolean
  } {
    return {
      sessionId: this.sessionId,
      host: this.options.host,
      port: this.options.port || 22,
      username: this.options.username,
      name: this.displayName,
      isConnected: this.isConnected,
      isConnecting: this.isConnecting
    }
  }
}

