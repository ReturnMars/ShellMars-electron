// 统一导出所有 IPC 事件名称常量
// 这个文件可以被 preload 和渲染进程使用

export { TEST_IPC_EVENTS, type TestIpcEvent } from './handlers/test'

// 后续添加其他模块的事件常量
// export { SESSION_IPC_EVENTS, type SessionIpcEvent } from './handlers/session/EventsEnum'
// export { FILE_IPC_EVENTS, type FileIpcEvent } from './handlers/file/EventsEnum'

