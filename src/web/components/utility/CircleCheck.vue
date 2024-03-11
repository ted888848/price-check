<template>
  <div v-if="props.checked" class="i-material-symbols:check-circle-rounded text-green-600 text-xl" />
  <div v-else class="i-material-symbols:add-circle-rounded text-red-600 text-xl rotate-45" />
</template>

<script setup lang="ts">
interface IProps {
  checked: boolean;
}
const props = defineProps<IProps>()

</script>