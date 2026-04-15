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
import { customEvent, type MyCustomEventMap } from '@/renderer/lib/customEvent';
const config = ref<Config>()
const previewWidgetId = ref<string | null>(null)
const props = defineProps<{
  isSettingWindowShow: boolean
}>()

function ipcHandleUpdateConfig(_: unknown, newConfig: string) {
  config.value = JSON.parse(newConfig)
}

onMounted(() => {
  config.value = window.ipc.sendSync(IPC.GET_CONFIG)
  // window.addEventListener('widget-preview', handleWidgetPreview as EventListener)
  customEvent.addEventListener('widget-preview', handleWidgetPreview)
  window.ipc.on(IPC.UPDATE_CONFIG, ipcHandleUpdateConfig)
})

onBeforeUnmount(() => {
  customEvent.removeEventListener('widget-preview', handleWidgetPreview)
  window.ipc.removeListener(IPC.UPDATE_CONFIG, ipcHandleUpdateConfig)
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

function handleWidgetPreview(event: MyCustomEventMap['widget-preview']) {
  previewWidgetId.value = event.detail?.widgetId ?? null
}

function shouldDisplayWidget(widget: TWidgetRegex) {
  if (props.isSettingWindowShow) {
    if (previewWidgetId.value === widget.id) return true
    return false
  }
  return widget.show ?? true
}

</script>