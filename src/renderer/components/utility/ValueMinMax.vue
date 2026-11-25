<template>
  <div
    class="flex items-center justify-center p-2 select-none"
    :class="{ 'opacity-30': !item.search }"
    @click="(_event) => (item.search = !item.search)"
  >
    <span class="mx-1 text-white hover:cursor-default">
      <slot />
    </span>
    <input
      v-model.number="item.min"
      class="mx-1 w-8 appearance-none rounded bg-gray-400 text-center font-bold"
      type="number"
      :disabled="!item.search"
      @dblclick="() => delete item.min"
      @click.stop
    />
    <input
      v-model.number="item.max"
      class="w-8 appearance-none rounded bg-gray-400 text-center font-bold"
      type="number"
      :disabled="!item.search"
      @dblclick="() => delete item.max"
      @click.stop
    />
  </div>
</template>
<script lang="ts" setup>
const item = defineModel<{
  search: boolean;
  min?: number;
  max?: number;
}>({
  required: true,
});
</script>
