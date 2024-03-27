<template>
  <input class=" text-black rounded text-center caret-transparent placeholder-black" :placeholder="hotkey"
    @keydown.prevent @keyup="handelKeydown">
</template>
<script setup lang="ts">
import { keyToElectron } from '@/web/lib/keyToElectron'

const hotkey = defineModel<string>('hotkey')

function handelKeydown(event: KeyboardEvent) {
  event.preventDefault()
  event.stopPropagation()
  const { code, key, altKey, ctrlKey, shiftKey } = event
  if (['Control', 'Alt', 'Shift'].includes(key)) return
  if (code === 'Backspace' || code === 'Delete') {
    hotkey.value = ''
    return
  }
  let keyCode = ''
  if (['Pause'].includes(code)) return
  if (!['Control', 'Alt', 'Shift'].includes(key)) {
    if (code.startsWith('Key')) {
      keyCode = code.substring(3)
    }
    else if (code.startsWith('Digit')) {
      keyCode = code.substring(5)
    }
    else {
      keyCode = code
    }
  }
  hotkey.value = keyToElectron(keyCode, altKey, ctrlKey, shiftKey)
}
</script>@/web/lib/keyToElectron