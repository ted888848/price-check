import { rmSync } from 'node:fs'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import electron from 'vite-plugin-electron/simple'
import renderer from 'vite-plugin-electron-renderer'
import pkg from './package.json'
import UnoCSS from 'unocss/vite'
// https://vitejs.dev/config/
export default defineConfig(({ command }) => {
  rmSync('dist-electron', {
    recursive: true, force: true
  })

  const isServe = command === 'serve'
  const isBuild = command === 'build'
  const sourcemap = isServe || !!process.env.VSCODE_DEBUG

  return {
    plugins: [
      vue({
        template: {
          compilerOptions: {
            isCustomElement: (tag) => (tag === 'webview')
          }
        }
      }),
      UnoCSS(),
      electron({
        main: {
          entry: 'electron/main/index.ts',
          vite: {
            build: {
              sourcemap,
              outDir: 'dist-electron/main',
              minify: isBuild,
              rollupOptions: {
                external: ['uiohook-napi', 'electron-overlay-window'],
                output: {
                  format: 'esm',
                  entryFileNames: '[name].mjs'
                },
              },
            },
          },
        },
      }),
      renderer(),

    ],
    server: process.env.VSCODE_DEBUG && (() => {
      const url = new URL(pkg.debug.env.VITE_DEV_SERVER_URL)
      return {
        host: url.hostname,
        port: +url.port,
      }
    })(),
    clearScreen: false,
    resolve: {
      alias: {
        '@': `${__dirname}/src`,
        '@utility': `${__dirname}/utility`
      }
    }
  }
})
