<template>
  <FontAwesomeIcon v-if="props.checked" icon="circle-check" class="text-green-600 text-xl" />
  <FontAwesomeIcon v-else icon="circle-xmark" class="text-red-600 text-xl" />
</template>
<script setup lang="ts">
interface IProps {
  checked: boolean;
}
const props = defineProps<IProps>()

</script>