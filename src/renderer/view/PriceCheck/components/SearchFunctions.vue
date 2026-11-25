<template>
  <div v-if="!props.isSearching" class="my-2 flex justify-center text-xl">
    <button
      class="mx-2 rounded bg-gray-500 px-1 text-white hover:bg-gray-400 disabled:cursor-default disabled:bg-gray-500 disabled:opacity-60"
      :disabled="props.isActive"
      @click="() => emit('search', false)"
    >
      Search
    </button>
    <button
      class="mx-2 rounded bg-gray-500 px-1 text-white hover:bg-gray-400 disabled:cursor-default disabled:bg-gray-500 disabled:opacity-60"
      :disabled="props.isActive"
      @click="() => emit('search', true)"
    >
      Search{{ poeVersion === "2" ? "E" : "C" }}
    </button>
    <div v-if="props.showResultActions">
      <button
        class="mx-2 rounded bg-green-400 px-1 text-black hover:bg-green-300 disabled:cursor-default disabled:bg-green-400 disabled:opacity-60"
        :disabled="props.isActive || !props.hasNextPage"
        @click="emit('fetch-more')"
      >
        在20筆
      </button>
      <button
        class="mx-2 rounded bg-blue-800 px-4 text-white hover:bg-blue-700 disabled:cursor-default disabled:bg-blue-800 disabled:opacity-60"
        @click="emit('open-browser')"
      >
        B
      </button>
    </div>
    <button
      class="mx-2 rounded bg-blue-800 px-4 text-white hover:bg-blue-700 disabled:cursor-default disabled:bg-blue-800 disabled:opacity-60"
      @click="emit('open-web-view')"
    >
      BV
    </button>
  </div>
</template>

<script setup lang="ts">
import { poeVersion } from "@/renderer/lib";

const props = defineProps<{
  isSearching: boolean;
  isActive: boolean;
  showResultActions: boolean;
  hasNextPage: boolean;
}>();
const emit = defineEmits<{
  search: [onlyChaosOrExalted: boolean];
  "fetch-more": [];
  "open-browser": [];
  "open-web-view": [];
}>();
</script>
