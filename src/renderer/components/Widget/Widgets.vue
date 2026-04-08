<template>
  <template v-for="widget in (config?.widgets ?? [])" :key="widget.id">
    <RegexWidget v-if="widget.type === 'regex' && shouldDisplayWidget(widget)" :widget="widget"
      @update:widget="handleUpdateWidget" />
  </template>
</template>
<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, toRaw } from 'vue';
import IPC from '@/ipc';
import RegexWidget from './RegexWidget/Widget.vue';
const config = ref<Config>()
const previewWidgetId = ref<string | null>(null)
const props = defineProps<{
  isSettingWindowShow: boolean
}>()
onMounted(() => {
  config.value = window.ipc.sendSync(IPC.GET_CONFIG)
  window.addEventListener('widget-preview', handleWidgetPreview as EventListener)
})

onBeforeUnmount(() => {
  window.removeEventListener('widget-preview', handleWidgetPreview as EventListener)
})

function handleUpdateWidget(newWidget: TWidgetRegex) {
  const index = config.value?.widgets?.findIndex(w => w.id === newWidget.id);
  if (index !== undefined && index !== -1 && config.value?.widgets) {
    const newWidgets = structuredClone(toRaw(config.value.widgets))
    newWidgets[index] = newWidget;
    window.ipc.send(IPC.UPDATE_CONFIG, JSON.stringify({
      widgets: newWidgets
    }));
  }
}

function handleWidgetPreview(event: Event) {
  const customEvent = event as CustomEvent<{ widgetId?: string | null }>
  previewWidgetId.value = customEvent.detail?.widgetId ?? null
}

function shouldDisplayWidget(widget: TWidgetRegex) {
  if (props.isSettingWindowShow) {
    if (previewWidgetId.value === widget.id) return true
    return false
  }
  return widget.show ?? true
}

window.ipc.on(IPC.UPDATE_CONFIG, (_, newConfig) => {
  config.value = JSON.parse(newConfig)
})
</script>