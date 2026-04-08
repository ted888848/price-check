<template>
  <DraggableWidgetContainer :title="widget.name || 'Regex 快捷'" :x="widget.x" :y="widget.y"
    @save-position="handleSavePosition">
    <template #default="{ dragDisabled }">
      <RegexItem v-for="regex in widget.list" :key="regex.id" :regex="regex" @update:regex="handleUpdateRegex"
        @delete:regex="handleDeleteRegex" :disabled="!dragDisabled" />
      <RegexItem @update:regex="handleUpdateRegex" :empty="true" :regex="{ regex: '', id: '' }"
        :disabled="!dragDisabled" />
    </template>
  </DraggableWidgetContainer>
</template>

<script setup lang="ts">
import RegexItem from './RegexItem.vue';
import DraggableWidgetContainer from './DraggableWidgetContainer.vue';
import { toRaw } from 'vue';
const props = defineProps<{
  widget: TWidgetRegex
}>()

const emit = defineEmits<{
  (e: 'update:widget', newWidget: TWidgetRegex): void
}>()
function handleSavePosition(position: { x: number, y: number }) {
  emit('update:widget', { ...props.widget, x: position.x, y: position.y });
}

function handleUpdateRegex(newRegex: TWidgetRegex['list'][number]) {
  const index = props.widget.list.findIndex(r => r.id === newRegex.id);
  const widget = structuredClone(toRaw(props.widget))
  if (index !== -1) {
    widget.list[index] = newRegex;
  }
  else {
    widget.list.push(newRegex);
  }
  emit('update:widget', widget)
}

function handleDeleteRegex(regexId: string) {
  const index = props.widget.list.findIndex(r => r.id === regexId);
  const widget = structuredClone(toRaw(props.widget))
  if (index !== -1) {
    widget.list.splice(index, 1);
  }
  emit('update:widget', widget)
}
</script>