
import { defineConfig } from 'vite'
import tsconfigPaths from 'vite-tsconfig-paths'
// https://vitejs.dev/config
export default defineConfig({
  plugins: [tsconfigPaths()],
  build: {
    rollupOptions: {
      external: ['uiohook-napi', 'electron-overlay-window'],
    },
  },
})
