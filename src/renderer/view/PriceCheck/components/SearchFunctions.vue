<template>
    <div v-if="!props.isSearching" class="my-2 justify-center flex text-xl">
      <button
        class="mx-2 bg-gray-500 text-white rounded px-1 hover:bg-gray-400 disabled:cursor-default disabled:opacity-60 disabled:bg-gray-500"
        :disabled="props.isActive"
        @click="() => emit('search', false)"
      >
        Search
      </button>
      <button
        class="mx-2 bg-gray-500 text-white rounded px-1 hover:bg-gray-400 disabled:cursor-default disabled:opacity-60 disabled:bg-gray-500"
        :disabled="props.isActive"
        @click="() => emit('search', true)"
      >
        Search{{ poeVersion === "2" ? "E" : "C" }}
      </button>
      <div v-if="props.showResultActions">
        <button
          class="mx-2 bg-green-400 text-black rounded px-1 hover:bg-green-300 disabled:cursor-default disabled:opacity-60 disabled:bg-green-400"
          :disabled="props.isActive || !props.hasNextPage"
          @click="emit('fetch-more')"
        >
          在20筆
        </button>
        <button
          class="mx-2 bg-blue-800 text-white rounded px-4 hover:bg-blue-700 disabled:cursor-default disabled:opacity-60 disabled:bg-blue-800"
          @click="emit('open-browser')"
        >
          B
        </button>
      </div>
      <button
        class="mx-2 bg-blue-800 text-white rounded px-4 hover:bg-blue-700 disabled:cursor-default disabled:opacity-60 disabled:bg-blue-800"
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
