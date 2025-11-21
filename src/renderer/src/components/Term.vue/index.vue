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
  console.log('🚀 ~ window.innerWidth:', window.innerWidth)
  if (window.innerWidth < 1920) {
    return 14
  }
  return 16
})
const terminal = new Terminal({
  cursorBlink: true,
  fontFamily: '"Lato",Consolas, "Courier New", monospace',
  fontSize: fontSize.value,
  cursorStyle: 'underline',
  theme: {
    background: '#010101',
    foreground: '#D4D4D4',
    cursor: '#D4D4D4'
  }
})

const fitAddon = new FitAddon()
terminal.loadAddon(fitAddon)
onMounted(() => {
  if (!terminalRef.value) return
  terminal.open(terminalRef.value)
  fitAddon.fit()
  terminal.onData((data) => {
    console.log('🚀 ~ data:', data)
    if (!linkStore.currentSessionItem) return
    window.ipc.ssh.write({ sessionId: linkStore.currentSessionItem.id, data: data })
  })
})
onUnmounted(() => {
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

watch(
  () => linkStore.currentSessionItem?.id,
  async (sessionId) => {
    terminal.reset()
    if (!sessionId) return
    const result = await window.ipc.ssh.getSessionBuffer({ sessionId })
    if (result.success && result.data) {
      terminal.write(result.data)
    }
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
  .terminal-content {
    width: 100%;
    height: 100%;
    padding: 12px;
    box-sizing: border-box;
  }
}
</style>
