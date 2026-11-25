<template>
  <div class="w-100% center gap-4px min-w-0">
    <input
      class="min-w-0 flex-1 text-start"
      :class="{ 'bg-white': isEditing }"
      v-if="isEditing"
      v-model="inputValue"
      :disabled="props.disabled"
      ref="inputRef"
      @keydown="handleKeydown"
    />
    <div class="relative min-w-0 flex-1 rounded hover:bg-gray-800" v-else @mouseenter="handleMouseEnter" @mouseleave="handleMouseLeave">
      <button class="w-full min-w-0 overflow-hidden text-start text-nowrap text-ellipsis text-white" @click="handleClick">
        {{ regex.regex }}
      </button>
      <div
        v-if="isTooltipVisible"
        class="left-50% pointer-events-none absolute top-full z-10 mt-1 translate-x-[-50%] rounded bg-gray-900 px-2 py-1 text-sm text-nowrap text-white shadow-lg"
      >
        {{ regex.regex }}
      </div>
    </div>
    <div class="i-material-symbols:edit cursor-pointer text-xl text-green-600" v-if="!isEditing" @click="handleEdit" />
    <div class="i-material-symbols:check-circle cursor-pointer text-xl text-green-600" v-else @click="handleSave" />
    <div class="i-material-symbols:delete-rounded cursor-pointer text-xl text-red-600" v-if="!props.empty" @click="handleDelete" />
  </div>
</template>
<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref } from "vue";
import IPC from "@/ipc";
const props = defineProps<{
  regex: TWidgetRegex["list"][number];
  disabled?: boolean;
  empty?: boolean;
}>();
const inputRef = ref<HTMLInputElement>();
const isEditing = ref(props.empty ?? false);
const inputValue = ref(props.regex.regex ?? "");
const isTooltipVisible = ref(false);
let tooltipTimer: ReturnType<typeof setTimeout> | null = null;
const emit = defineEmits<{
  (e: "update:regex", newRegex: TWidgetRegex["list"][number]): void;
  (e: "delete:regex", regexId: string): void;
}>();
function clearTooltipTimer() {
  if (!tooltipTimer) return;
  clearTimeout(tooltipTimer);
  tooltipTimer = null;
}

function handleMouseEnter() {
  clearTooltipTimer();
  tooltipTimer = setTimeout(() => {
    isTooltipVisible.value = true;
  }, 100);
}

function handleMouseLeave() {
  clearTooltipTimer();
  isTooltipVisible.value = false;
}

onBeforeUnmount(() => {
  clearTooltipTimer();
});

function handleEdit() {
  if (props.disabled) return;
  inputValue.value = props.regex.regex;
  isTooltipVisible.value = false;
  isEditing.value = true;
  nextTick(() => {
    inputRef.value?.focus();
    inputRef.value?.select();
  });
}
function handleDelete() {
  if (props.disabled) return;
  emit("delete:regex", props.regex.id);
}
function handleSave() {
  if (props.disabled) return;
  isTooltipVisible.value = false;
  isEditing.value = false;
  let newRegexItem: TWidgetRegex["list"][number] = structuredClone({
    ...props.regex,
    regex: inputValue.value,
  });
  if (props.empty) {
    newRegexItem.id = crypto.randomUUID();
    isEditing.value = true;
    inputValue.value = "";
    if (!newRegexItem.regex.trim()) return;
  }
  emit("update:regex", newRegexItem);
}

function handleClick() {
  if (props.disabled) return;
  window.ipc.send(IPC.FORCE_POE);
  window.ipc.send(IPC.SET_SEARCH_REGEX, props.regex.regex);
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === "Enter") {
    handleSave();
  }
}

window.ipc.on(IPC.POE_ACTIVE, () => {
  if (!isEditing.value) return;
  isEditing.value = false;
});
</script>
