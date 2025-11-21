#!/usr/bin/env node

/**
 * 清理构建输出目录
 */

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

const distDir = path.resolve(__dirname, '..', 'dist')

function killProcess(processName) {
  try {
    // Windows 上使用 taskkill
    if (process.platform === 'win32') {
      // 先尝试正常关闭
      try {
        execSync(`taskkill /IM ${processName} 2>nul`, { stdio: 'ignore', timeout: 2000 })
        // 等待进程关闭
        const waitTime = 1000
        const start = Date.now()
        while (Date.now() - start < waitTime) {
          // 等待
        }
      } catch (err) {
        // 正常关闭失败，尝试强制关闭
      }
      // 强制关闭
      execSync(`taskkill /F /IM ${processName} 2>nul`, { stdio: 'ignore' })
      console.log(`已关闭进程: ${processName}`)
    }
  } catch (err) {
    // 进程不存在或已关闭，忽略错误
  }
}

function killAllRelatedProcesses() {
  if (process.platform === 'win32') {
    console.log('正在关闭所有相关进程...')
    const processes = ['shellmars.exe', 'electron.exe', 'app-builder.exe']
    processes.forEach(proc => killProcess(proc))
    
    // 额外等待，确保进程完全关闭
    console.log('等待进程完全关闭...')
    const waitTime = 2000
    const start = Date.now()
    while (Date.now() - start < waitTime) {
      // 等待
    }
  }
}

function removeDir(dir, retries = 3) {
  if (!fs.existsSync(dir)) {
    console.log(`目录不存在，跳过清理: ${dir}`)
    return true
  }

  console.log(`正在清理: ${dir}`)
  
  // 先尝试关闭所有相关进程
  killAllRelatedProcesses()

  for (let i = 0; i < retries; i++) {
    try {
      if (i > 0) {
        console.log(`重试清理 (${i + 1}/${retries})...`)
        // 等待一段时间后重试
        const waitTime = (i + 1) * 1000
        const start = Date.now()
        while (Date.now() - start < waitTime) {
          // 等待
        }
      }
      
      fs.rmSync(dir, { recursive: true, force: true, maxRetries: 3, retryDelay: 500 })
      console.log(`✓ 清理完成: ${dir}`)
      return true
    } catch (err) {
      if (i === retries - 1) {
        // 最后一次尝试失败
        console.warn(`⚠️  清理失败 (可能文件被占用): ${err.message}`)
        console.warn('   请尝试以下方法：')
        console.warn('   1. 关闭所有 shellmars.exe 进程')
        console.warn('   2. 关闭可能占用文件的程序（如资源管理器、杀毒软件）')
        console.warn('   3. 手动删除 dist 目录')
        console.warn('   4. 或者跳过清理步骤，直接运行构建（electron-builder 会自动处理）')
        // 不退出，让构建继续（electron-builder 可能会处理）
        return false
      }
    }
  }
  return false
}

const success = removeDir(distDir)
// 即使清理失败也不退出，让 electron-builder 自己处理
if (!success) {
  console.log('继续构建，electron-builder 会尝试处理...')
}

