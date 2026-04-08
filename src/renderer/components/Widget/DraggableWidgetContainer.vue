<template>
  <div class="fixed bg-slate-600 w-300px rounded p-8px flex flex-col gap-4px"
    :class="!dragDisabled && 'cursor-move! ' + $style['drag-able']"
    :style="{ left: position.x + 'px', top: position.y + 'px' }" ref="widgetContainer">
    <div class="w-100% center justify-between text-yellow-500">
      {{ title }}
      <div v-if="dragDisabled" class="i-material-symbols:drag-pan text-lg cursor-pointer text-gray-400"
        @pointerdown="dragDisabled = false" />
      <div v-else class="i-material-symbols:check-circle text-lg cursor-pointer! text-green-600"
        @click="handleSavePosition" />
    </div>
    <slot :dragDisabled="dragDisabled" />
  </div>
</template>

<script setup lang="ts">
import { useDraggable } from '@vueuse/core'
import { ref, useTemplateRef, watch } from 'vue'

const props = defineProps<{
  title: string
  x: number
  y: number
}>()

const emit = defineEmits<{
  (e: 'save-position', position: { x: number, y: number }): void
}>()

const dragDisabled = ref(true)
const widgetContainer = useTemplateRef('widgetContainer')
const { position } = useDraggable(widgetContainer, {
  initialValue: { x: props.x, y: props.y },
  disabled: dragDisabled
})

watch(() => ({ x: props.x, y: props.y }), ({ x, y }) => {
  if (!dragDisabled.value) return
  position.value = { x, y }
})

function handleSavePosition() {
  dragDisabled.value = true
  emit('save-position', {
    x: position.value.x,
    y: position.value.y
  })
}
</script>

<style lang="css" module>
.drag-able * {
  cursor: move !important;
  user-select: none;
}
</style>