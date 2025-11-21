import { defineStore } from 'pinia'
import { ref } from 'vue'
import { SessionItem, SessionStatus } from './type'
import { toPlainObject } from '@renderer/utils/serialize'

// 后端 SSH 会话返回值
interface RemoteSessionItem {
  sessionId: string
  host: string
  port: number
  username: string
  name?: string
  isConnected: boolean
  isConnecting: boolean
}

const mapRemoteSessionToSessionItem = (session: RemoteSessionItem): SessionItem => {
  const displayName =
    session.name && session.name.trim().length > 0
      ? session.name
      : session.username
        ? `${session.username}@${session.host}`
        : session.host
  return {
    id: session.sessionId,
    name: displayName,
    ip: session.host,
    username: session.username,
    port: session.port,
    status: session.isConnected
      ? SessionStatus.SUCCESS
      : session.isConnecting
        ? SessionStatus.CONNECTING
        : SessionStatus.INFO
  }
}

export const useLinkStore = defineStore('link', () => {
  const list = ref<SessionItem[]>([])
  const currentSessionItem = ref<SessionItem | undefined>()
  let hasSubscribedSessionsUpdate = false
  let hasRegisteredTerminalEvents = false
  let pendingSessionSelectionId: string | null = null

  const ensureSessionsSubscription = (): void => {
    if (hasSubscribedSessionsUpdate) return
    hasSubscribedSessionsUpdate = true
    window.ipc.ssh.onSessionsUpdate(({ sessions }) => {
      list.value = sessions.map(mapRemoteSessionToSessionItem)
      if (pendingSessionSelectionId) {
        const pending = list.value.find((item) => item.id === pendingSessionSelectionId)
        if (pending) {
          currentSessionItem.value = pending
          pendingSessionSelectionId = null
        }
      }
      if (currentSessionItem.value) {
        const matched = list.value.find((item) => item.id === currentSessionItem.value?.id)
        if (matched) {
          currentSessionItem.value = matched
        }
      }
    })
  }
  ensureSessionsSubscription()

  const ensureTerminalEvents = ({
    onData,
    onError,
    onClose
  }: {
    onData: (data: { sessionId: string; data: string }) => void
    onError: (error: { sessionId: string; error: string }) => void
    onClose: (data: { sessionId: string }) => void
  }): void => {
    if (hasRegisteredTerminalEvents) return
    hasRegisteredTerminalEvents = true
    window.ipc.ssh.onData(({ sessionId, data }) => {
      if (currentSessionItem.value?.id === sessionId) {
        // console.log('[SSH][data]', data)
        onData?.({ sessionId, data })
      }
    })
    window.ipc.ssh.onError(({ sessionId, error }) => {
      if (currentSessionItem.value?.id === sessionId) {
        // console.error('[SSH][error]', error)
        onError?.({ sessionId, error })
      }
    })
    window.ipc.ssh.onClose(({ sessionId }) => {
      if (currentSessionItem.value?.id === sessionId) {
        // console.info('[SSH][close]', sessionId)
        onClose?.({ sessionId })
      }
    })
  }
  // ensureTerminalEvents()

  const setCurrentSessionItemById = (id: string) => {
    if (!id) return
    currentSessionItem.value = list.value.find((item) => item.id === id)
    console.log(
      '🚀 ~ setCurrentSessionItemById ~ currentSessionItem.value:',
      currentSessionItem.value
    )
    if (currentSessionItem.value?.status === SessionStatus.INFO) {
      reconnectSessionItem(id)
    }
    // reconnectSessionItem(id)
    // ensureTerminalEvents({
    //   onData: (data) => {
    //     console.log(data)
    //   },
    //   onError: (error) => {
    //     console.log(error)
    //   },
    //   onClose: () => {
    //     console.log('close')
    //   }
    // })
  }

  const setCurrentSessionItem = (sessionItem: SessionItem) => {
    currentSessionItem.value = sessionItem
  }

  const clearCurrentSessionItem = () => {
    currentSessionItem.value = undefined
  }

  const addSessionItem = async (sessionItem: SessionItem) => {
    if (list.value.find((item) => item.id === sessionItem.id)) {
      throw new Error('会话已存在')
    }
    try {
      const result = await window.ipc.ssh.connect({ linkItem: toPlainObject(sessionItem) })
      console.log('🚀 ~ addSessionItem ~ result:', result)
      if (!result.success) {
        throw new Error(result.error || '连接失败，请检查连接信息')
      }
      pendingSessionSelectionId = result.sessionId
      setCurrentSessionItemById(result.sessionId)
    } catch (error: any) {
      throw new Error(error?.message || '连接失败', { cause: error })
    }
  }

  const disconnectSessionItem = async (id: string) => {
    if (!id) return
    const session = list.value.find((item) => item.id === id)
    if (!session) return
    try {
      const result = await window.ipc.ssh.disconnect({ sessionId: session.id })
      if (!result.success) {
        throw new Error(result.error || '断开连接失败，请检查连接信息')
      }
    } catch (error: any) {
      throw new Error(error?.message || '断开连接失败', { cause: error })
    }
  }

  const reconnectSessionItem = async (id: string) => {
    if (!id) return
    const session = list.value.find((item) => item.id === id)
    if (!session) return
    try {
      const result = await window.ipc.ssh.reconnect({ sessionId: session.id })
      if (!result.success) {
        throw new Error(result.error || '重连失败，请检查连接信息')
      }
      setCurrentSessionItemById(result.sessionId)
    } catch (error: any) {
      throw new Error(error?.message || '重连失败', { cause: error })
    }
  }

  const deleteSessionItem = async (id: string) => {
    if (!id) return
    const session = list.value.find((item) => item.id === id)
    if (!session) return
    try {
      const removeResult = await window.ipc.ssh.deleteSession({ sessionId: session.id })
      if (!removeResult.success) {
        throw new Error(removeResult.error || '删除会话失败，请检查连接信息')
      }
    } catch (error: any) {
      throw new Error(error?.message || '删除会话失败', { cause: error })
    }
    // list.value = list.value.filter((item) => item.id !== id)
  }

  const fetchSSHSessions = async () => {
    try {
      const getSessions = window.ipc.ssh.getListSessions
      if (!getSessions) {
        console.error('获取 SSH 会话列表失败: API 未注册')
        list.value = []
        currentSessionItem.value = undefined
        return
      }
      const result = await getSessions()
      if (result.success) {
        list.value = result.sessions.map(mapRemoteSessionToSessionItem)
      } else {
        console.error('获取 SSH 会话列表失败:', result.error)
        list.value = []
        currentSessionItem.value = undefined
      }
    } catch (error) {
      console.error('获取 SSH 会话列表异常:', error)
      list.value = []
      currentSessionItem.value = undefined
    }
  }

  // void fetchSSHSessions()

  return {
    list,
    currentSessionItem,
    setCurrentSessionItemById,
    setCurrentSessionItem,
    clearCurrentSessionItem,
    addSessionItem,
    disconnectSessionItem,
    reconnectSessionItem,
    deleteSessionItem,
    fetchSSHSessions,
    ensureTerminalEvents
  }
})
