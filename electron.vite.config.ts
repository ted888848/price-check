// import { rmSync } from 'node:fs'
import { defineConfig } from 'electron-vite'
import vue from '@vitejs/plugin-vue'
import UnoCSS from 'unocss/vite'
import ElementPlus from 'unplugin-element-plus/vite'

const baseConfig = {
  resolve: {
    alias: {
      '@': `${__dirname}/src`,
    }
  },
  publicDir: `resources`,
} satisfies import('vite').UserConfig

// https://vitejs.dev/config/
export default defineConfig(({ command }) => {
  return {
    main: {
      ...baseConfig,
      build: {
        outDir: 'dist/main',
      }
    },
    preload: {
      ...baseConfig,
      build: {
        outDir: 'dist/preload',
      }
    },
    renderer: {
      ...baseConfig,
      build: {
        outDir: 'dist/renderer',
      },
      plugins: [
        vue({
          template: {
            compilerOptions: {
              isCustomElement: (tag) => (tag === 'webview')
            }
          }
        }),
        UnoCSS(),
        ElementPlus({}),
      ]
    },
  } satisfies import('electron-vite').UserConfig
})
