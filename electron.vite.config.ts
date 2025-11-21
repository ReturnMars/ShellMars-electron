import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import vue from '@vitejs/plugin-vue'
import UnoCSS from 'unocss/vite'
import AutoImport from 'unplugin-auto-import/vite'
import { NaiveUiResolver } from 'unplugin-vue-components/resolvers'
import Components from 'unplugin-vue-components/vite'
const pubResolveAlias = {
  '@renderer': resolve('src/renderer/src')
}
export default defineConfig({
  main: {
    resolve: {
      alias: {
        ...pubResolveAlias
      }
    },
    plugins: [externalizeDepsPlugin()],
    build: {
      sourcemap: true // 启用 source map，便于调试和日志定位
    }
  },
  preload: {
    resolve: {
      alias: {
        ...pubResolveAlias
      }
    },
    plugins: [externalizeDepsPlugin()]
  },
  renderer: {
    resolve: {
      alias: {
        ...pubResolveAlias
      }
    },
    plugins: [
      vue(),
      UnoCSS(),
      AutoImport({
        resolvers: [NaiveUiResolver()]
      }),
      Components({
        resolvers: [NaiveUiResolver()]
      })
    ]
  }
})
