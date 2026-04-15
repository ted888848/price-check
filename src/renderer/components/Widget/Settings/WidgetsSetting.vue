<template>
  <div class="flex flex-col pl-2 pt-4 gap-4 max-h-full">
    <div class="text-white text-xl">Widget 設定</div>
    <button class="w-fit px-3 py-1 rounded bg-amber-500 text-black" @click="addWidget">
      新增 Widget
    </button>
    <div v-if="widgetCount > 0" class="flex flex-col gap-2 flex-1 min-h-0 overflow-y-auto">
      <div v-for="(widget, index) in widgets" :key="widget.id"
        class="flex items-center justify-between bg-slate-700 rounded px-3 py-2 gap-2 text-white">
        <div class="flex flex-col items-start text-sm gap-1 w-50%">
          <span>類型: {{ formatWidgetType(widget.type) }}</span>
          <label class="w-100% center gap-4px">
            <span class="text-xs text-gray-300 text-nowrap">名稱</span>
            <input class="mt-1 w-100% px-2 py-1 rounded bg-slate-800 text-white border border-slate-500"
              :value="widget.name ?? ''" @input="updateWidgetName(widget.id, ($event.target as HTMLInputElement).value)"
              placeholder="Regex 快捷" />
          </label>
          <span>位置: ({{ widget.x }}, {{ widget.y }})</span>
        </div>
        <div class="flex items-center gap-2">
          <button class="px-2 py-1 rounded text-black" :class="widget.show ? 'bg-green-500' : 'bg-gray-500'"
            @click="toggleSingleWidgetVisible(widget.id)">
            {{ widget.show ? '啟用中' : '停用中' }}
          </button>
          <button class="px-2 py-1 rounded bg-violet-500 text-black" @click="togglePreview(widget.id)">
            {{ previewWidgetId === widget.id ? '隱藏位置' : '顯示位置' }}
          </button>
          <button class="px-2 py-1 rounded bg-sky-500 text-black disabled:opacity-60 disabled:cursor-not-allowed"
            @click="resetSingleWidgetPosition(widget.id, index)">
            重製位置
          </button>
          <button class="px-2 py-1 rounded bg-red-500 text-white" @click="deleteWidget(widget.id)">
            刪除
          </button>
        </div>
      </div>
    </div>
    <div v-else class="text-gray-300">目前沒有 Widget</div>
  </div>
</template>

<script setup lang="ts">
import { customEvent } from '@/renderer/lib/customEvent'
import { computed, onBeforeUnmount, ref } from 'vue'

const config = defineModel<Config>('config', {
  required: true,
})

const widgets = computed(() => config.value.widgets ?? [])
const widgetCount = computed(() => config.value.widgets?.length ?? 0)
const previewWidgetId = ref<string | null>(null)

function addWidget() {
  const widgetList = config.value.widgets ?? []
  const nextIndex = widgetList.length + 1
  const newWidget: TWidgetRegex = {
    id: new Date().getTime().toString(),
    type: 'regex',
    name: `Regex 快捷 ${nextIndex}`,
    x: 100,
    y: 50 + widgetList.length * 72,
    show: true,
    list: []
  }
  config.value.widgets = [...widgetList, newWidget]
}

function updateWidgetName(widgetId: string, newName: string) {
  const widgets = config.value.widgets
  if (!widgets?.length) return

  config.value.widgets = widgets.map(widget => {
    if (widget.id !== widgetId) return widget
    return {
      ...widget,
      name: newName
    }
  })
}

function resetSingleWidgetPosition(widgetId: string, index: number) {
  const widgets = config.value.widgets
  if (!widgets?.length) return

  config.value.widgets = widgets.map(widget => {
    if (widget.id !== widgetId) return widget
    return {
      ...widget,
      x: 100,
      y: 20 + index * 72
    }
  })
}

function toggleSingleWidgetVisible(widgetId: string) {
  const widgets = config.value.widgets
  if (!widgets?.length) return

  config.value.widgets = widgets.map(widget => {
    if (widget.id !== widgetId) return widget
    return {
      ...widget,
      show: !widget.show
    }
  })
}

function deleteWidget(widgetId: string) {
  const widgets = config.value.widgets
  if (!widgets?.length) return

  config.value.widgets = widgets.filter(widget => widget.id !== widgetId)
  if (previewWidgetId.value === widgetId) {
    clearPreview()
  }
}

function togglePreview(widgetId: string) {
  if (previewWidgetId.value === widgetId) {
    clearPreview()
    return
  }

  previewWidgetId.value = widgetId
  customEvent.dispatchEvent('widget-preview', { widgetId })
}

function clearPreview() {
  previewWidgetId.value = null
  customEvent.dispatchEvent('widget-preview', { widgetId: null })
}

onBeforeUnmount(() => {
  clearPreview()
})

function formatWidgetType(type: string) {
  if (type === 'regex') return 'Regex'
  return type
}
</script>
