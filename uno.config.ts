import { defineConfig, presetUno } from 'unocss'
import presetIcons from '@unocss/preset-icons'
export default defineConfig({
  presets: [
    presetUno(),
    presetIcons(),
  ],
  shortcuts: {
    'center': 'flex items-center justify-center',
  }
})