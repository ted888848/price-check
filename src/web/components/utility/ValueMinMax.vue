<template>
  <div class="flex p-2 items-center justify-center"
       :class="{ 'opacity-30': !item.search }" @click="_event => item.search = !item.search">
    <span class="mx-1 text-white hover:cursor-default"><slot /></span>
    <input v-model.number="item.min" class="w-8 appearance-none rounded bg-gray-400 text-center mx-1 font-bold" type="number"
           :disabled="!item.search" @dblclick="_event => delete item.min" @click.stop>
    <input v-model.number="item.max" class="w-8 appearance-none rounded bg-gray-400 text-center font-bold"
           type="number" :disabled="!item.search" @dblclick="_event => delete item.max" @click.stop>
  </div>
</template>
<script lang="ts" setup>
import {computed} from 'vue'
type TProps={
  modelValue: {
    search: boolean;
    min?: number;
    max?: number;
  };
};
const props = defineProps<TProps>()
const emit = defineEmits<{
  (event: 'update:modelValue', newValue: TProps['modelValue']): void;
  
}>()
const item = computed({
  set(newValue: TProps['modelValue']){
    emit('update:modelValue', newValue)
  },
  get(){
    return props.modelValue
  }
})
</script>