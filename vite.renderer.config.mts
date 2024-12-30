import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import UnoCSS from 'unocss/vite'
import tsconfigPaths from 'vite-tsconfig-paths'
// https://vitejs.dev/config
export default defineConfig({
  plugins: [vue(), UnoCSS(), tsconfigPaths()],
})
