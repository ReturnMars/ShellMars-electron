import type { logger as LoggerType } from './src/main/utils/logger'

declare global {
  // eslint-disable-next-line no-var
  var logger: typeof LoggerType
}

// 确保这个文件被识别为模块
export {}