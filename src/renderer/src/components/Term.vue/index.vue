<template>
  <div class="terminal-container">
    <div ref="terminalRef" class="terminal-content"></div>
  </div>
</template>
<script setup lang="ts">
import { useLinkStore } from '@renderer/store/modules/LinkStore'
import { computed, onMounted, onUnmounted, useTemplateRef, watch } from 'vue'
import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import '@xterm/xterm/css/xterm.css'
const terminalRef = useTemplateRef('terminalRef')
// 创建终端实例
const fontSize = computed(() => {
  if (window.innerWidth < 1920) {
    return 16
  }
  if (window.innerWidth < 2160) {
    return 16
  }
  return 18
})
const terminal = new Terminal({
  cursorBlink: true,
  fontFamily: '"Lato", Consolas, "Courier New", monospace',
  fontSize: fontSize.value,
  cursorStyle: 'underline',
  lineHeight: 1.15,
  theme: {
    background: '#010101',
    foreground: '#D4D4D4',
    cursor: '#D4D4D4'
  }
})

const fitAddon = new FitAddon()
const toFitAddon = () => {
  fitAddon.fit()
  const dims = fitAddon.proposeDimensions()
  if (!dims || !linkStore.currentSessionItem?.id) return
  window.ipc.ssh.resize({
    sessionId: linkStore.currentSessionItem?.id,
    cols: dims.cols,
    rows: dims.rows
  })
}
terminal.loadAddon(fitAddon)
onMounted(() => {
  if (!terminalRef.value) return
  terminal.open(terminalRef.value)
  terminal.onData((data) => {
    console.log('🚀 ~ data:', data)
    if (!linkStore.currentSessionItem) return
    window.ipc.ssh.write({ sessionId: linkStore.currentSessionItem.id, data: data })
  })

  window.addEventListener('resize', toFitAddon)
})

onUnmounted(() => {
  window.removeEventListener('resize', toFitAddon)
  terminal.dispose()
})
const linkStore = useLinkStore()

linkStore.ensureTerminalEvents({
  onData: ({ data }) => {
    terminal.write(data)
  },
  onError: ({ error }) => {
    terminal.write(`\r\n[ERROR] ${error}\r\n`)
  },
  onClose: () => {
    terminal.write('\r\n[SESSION CLOSED]\r\n')
  }
})
const updateTerminal = async (sessionId?: string) => {
  terminal.reset()
  toFitAddon()
  if (!sessionId) return
  const result = await window.ipc.ssh.getSessionBuffer({ sessionId })
  console.log('🚀 ~ result:', result)
  if (result.success && result.data) {
    terminal.write(result.data)
  }
}
watch(
  () => linkStore.currentSessionItem?.id,
  async (sessionId) => {
    updateTerminal(sessionId)
  },
  { immediate: true }
)
</script>
<style scoped lang="scss">
.terminal-container {
  width: 100%;
  height: 100%;
  background-color: #010101;
  position: relative;
  overflow: auto;
  padding: 12px;
  .terminal-content {
    width: 100%;
    height: 100%;
    box-sizing: border-box;
    // overflow: auto;
  }
}
</style>
