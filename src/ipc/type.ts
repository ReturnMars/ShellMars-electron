export enum IpcMainType {
  HANDLE = 'handle',
  ON = 'on'
}

export enum PreloadBridgeType {
  INVOKE = 'invoke',
  SEND = 'send'
}

export type IpcSchema = {
  channel: string
  ipcMainType: IpcMainType
  preloadBridgeType: PreloadBridgeType
  handler: (event: Electron.IpcMainInvokeEvent | Electron.IpcMainEvent, ...args: any[]) => any
}

export enum IpcSchemaEventNames {
  TEST_PING = 'ping',
  TEST_PONG = 'pong',
  SSH_TEST_CONNECTION = 'test_ssh_connection',
  SSH_CONNECT = 'ssh_connect',
  SSH_RECONNECT = 'ssh_reconnect',
  SSH_DISCONNECT = 'ssh_disconnect',
  SSH_WRITE = 'ssh_write',
  SSH_RESIZE = 'ssh_resize',
  SSH_LIST_SESSIONS = 'ssh_list_sessions',
  SSH_GET_SESSION_BUFFER = 'ssh_get_session_buffer',
  SSH_DATA = 'ssh_data',
  SSH_ERROR = 'ssh_error',
  SSH_CLOSE = 'ssh_close',
  SSH_DELETE_SESSION = 'ssh_delete_session'
}
