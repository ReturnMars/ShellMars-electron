import { relative } from 'path'
import { cwd } from 'process'

// 日志级别
export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR'
}

// 日志颜色（ANSI 转义码）
const colors = {
  DEBUG: '\x1b[36m', // 青色
  INFO: '\x1b[32m', // 绿色
  WARN: '\x1b[33m', // 黄色
  ERROR: '\x1b[31m', // 红色
  RESET: '\x1b[0m',
  GRAY: '\x1b[90m'
}

/**
 * 获取调用栈信息（文件路径和行号）
 * 使用 Node.js 的 CallSite API 获取更准确的调用栈信息
 */
function getCallerInfo(): { file: string; line: number } | null {
  const originalPrepareStackTrace = Error.prepareStackTrace
  let callerInfo: { file: string; line: number } | null = null

  Error.prepareStackTrace = (_, stack) => {
    const projectRoot = cwd()

    // 从索引 2 开始查找（跳过 Error、getCallerInfo）
    // 根据调试输出：索引 0=formatMessage, 1=info, 2=test:ping（实际调用位置）
    for (let i = 2; i < stack.length; i++) {
      const callSite = stack[i]
      let fileName = callSite.getFileName()
      let lineNumber = callSite.getLineNumber()
      const functionName = callSite.getFunctionName()

      // 调试：打印调用栈信息
      if (i === 2) {
        console.log(`Debug: i=${i}, fileName=${fileName}, lineNumber=${lineNumber}, functionName=${functionName}`)
      }

      if (!fileName || !lineNumber) continue

      // 跳过 node: 协议（Node.js 内部）
      if (fileName.startsWith('node:')) continue

      // 如果 source-map-support 未生效，尝试手动映射 out/ 到 src/
      if (fileName.includes('/out/') || fileName.includes('\\out\\')) {
        // 由于所有代码被打包到一个文件，优先使用函数名推断源文件
        // 如果函数名包含路径信息（如 test:ping），优先推断源文件
        // 例如：test:ping -> src/main/ipc/handlers/test/index.ts
        if (functionName && functionName.includes(':')) {
          const [module] = functionName.split(':')
          const inferredPath = `${projectRoot}/src/main/ipc/handlers/${module}/index.ts`
          fileName = inferredPath
        } else {
          // 如果无法通过函数名推断，尝试简单路径映射
          const mappedPath = fileName
            .replace(/[/\\]out[/\\]main[/\\]/, '/src/main/')
            .replace(/[/\\]out[/\\]preload[/\\]/, '/src/preload/')
            .replace(/[/\\]out[/\\]renderer[/\\]/, '/src/renderer/')
            .replace(/\.js$/, '.ts')
            .replace(/\.mjs$/, '.ts')

          // 检查映射后的路径是否在 src/ 目录下
          if (mappedPath.includes('/src/') || mappedPath.includes('\\src\\')) {
            fileName = mappedPath
          } else {
            continue
          }
        }
      }

      // 过滤掉 node_modules、logger 自身
      if (
        fileName.includes('node_modules') ||
        fileName.includes('utils/logger') ||
        fileName.includes('utils\\logger')
      ) {
        continue
      }

      // 只使用 src/ 目录下的源文件
      if (!fileName.includes('/src/') && !fileName.includes('\\src\\')) {
        continue
      }

      // 转换为相对路径
      try {
        const relativePath = relative(projectRoot, fileName).replace(/\\/g, '/')
        console.log(`Final relativePath: ${relativePath}, lineNumber: ${lineNumber}`)
        // 确保是项目内的源文件，且不是 logger 文件
        if (
          !relativePath.startsWith('..') &&
          relativePath.startsWith('src/') &&
          !relativePath.includes('utils/logger')
        ) {
          callerInfo = { file: relativePath, line: lineNumber }
          console.log(`Found callerInfo: ${callerInfo.file}:${callerInfo.line}`)
          break
        } else {
          console.log(`Skipped: relativePath=${relativePath}`)
        }
      } catch (error) {
        console.log(`Error converting path: ${error}`)
        continue
      }
    }

    return stack
  }

  // 创建 Error 对象以触发 prepareStackTrace
  const error = new Error()
  Error.captureStackTrace(error, getCallerInfo)
  // 访问 stack 属性以触发 prepareStackTrace
  void error.stack

  // 恢复原始的 prepareStackTrace
  Error.prepareStackTrace = originalPrepareStackTrace

  return callerInfo
}

/**
 * 格式化时间戳
 */
function formatTime(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const hours = String(now.getHours()).padStart(2, '0')
  const minutes = String(now.getMinutes()).padStart(2, '0')
  const seconds = String(now.getSeconds()).padStart(2, '0')
  const ms = String(now.getMilliseconds()).padStart(3, '0')
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}.${ms}`
}

/**
 * 格式化日志消息
 */
function formatMessage(level: LogLevel, args: any[]): string {
  const time = formatTime()
  const caller = getCallerInfo()
  const content = args
    .map((arg) => {
      if (typeof arg === 'object') {
        return JSON.stringify(arg, null, 2)
      }
      return String(arg)
    })
    .join(' ')

  const levelColor = colors[level]
  const reset = colors.RESET
  const gray = colors.GRAY

  let message = `${gray}[${time}]${reset} ${levelColor}[${level}]${reset}`

  if (caller) {
    message += ` ${gray}${caller.file}:${caller.line}${reset}`
  }

  message += ` ${content}`

  return message
}

/**
 * 日志工具类
 */
export const logger = {
  debug: (...args: any[]): void => {
    const message = formatMessage(LogLevel.DEBUG, args)
    console.log(message)
  },

  info: (...args: any[]): void => {
    const message = formatMessage(LogLevel.INFO, args)
    console.log(message)
  },

  warn: (...args: any[]): void => {
    const message = formatMessage(LogLevel.WARN, args)
    console.warn(message)
  },

  error: (...args: any[]): void => {
    const message = formatMessage(LogLevel.ERROR, args)
    console.error(message)
  },

  // 兼容旧接口
  log: (...args: any[]): void => {
    logger.info(...args)
  }
}

// 注册到全局
if (typeof global !== 'undefined') {
  global.logger = logger
}
