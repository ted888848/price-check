<template>
  <div v-if="props.checked === true" class="i-material-symbols:check-circle-rounded text-xl text-green-600" />
  <div v-else-if="props.checked === 'indeterminate'" class="i-material-symbols:check-circle-rounded text-xl text-yellow-500" />
  <div v-else class="i-material-symbols:add-circle-rounded rotate-45 text-xl text-red-600" />
</template>

<script setup lang="ts">
interface IProps {
  checked: boolean | "indeterminate";
}
const props = defineProps<IProps>();
</script>
