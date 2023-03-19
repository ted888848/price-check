<template>
  <input class=" text-black rounded text-center caret-transparent placeholder-black" :placeholder="inputValue"
    @keydown.prevent @keyup="handelKeydown">
</template>
<script setup lang="ts">
import { computed } from 'vue'
import { keyToElectron } from '@/web/keyToElectron'
const props = defineProps<{
  hotkey: string;
}>()
const emit = defineEmits<{
  (event: 'update:hotkey', newValue: string): void;
}>()
const inputValue = computed({
  get() {
    return props.hotkey
  },
  set(newValue) {
    emit('update:hotkey', newValue)
  }
})
function handelKeydown(event: KeyboardEvent) {
  event.preventDefault()
  event.stopPropagation()
  const { code, key, altKey, ctrlKey, shiftKey } = event
  if (['Control', 'Alt', 'Shift'].includes(key)) return
  if (code === 'Backspace' || code === 'Delete') {
    inputValue.value = ''
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
  inputValue.value = keyToElectron(keyCode, altKey, ctrlKey, shiftKey)
}
</script>