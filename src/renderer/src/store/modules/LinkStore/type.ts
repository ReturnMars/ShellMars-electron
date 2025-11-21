export enum SessionStatus {
  INFO = 'info',
  SUCCESS = 'success',
  CONNECTING = 'connecting'
}
export interface SessionItem {
  id: string
  name: string
  ip: string
  username?: string
  password?: string
  port?: number
  status?: SessionStatus
}
