<template>
  <ElSelect v-model="modelValue" :multiple="multiple" :disabled="disabled" :filterable="filterable"
    :clearable="clearable" placeholder="">
    <ElOption v-for="(option, index) in options" :key="index" :label="option[labelKey as keyof T]"
      :value="valueKey ? option[valueKey as keyof T] : option" />
  </ElSelect>
</template>
<script setup lang="ts" generic="T extends Record<string, any>">
import { ElSelect, ElOption } from 'element-plus'
import { defineProps } from 'vue'
const props = withDefaults(defineProps<{
  options: T[];
  labelKey: keyof T;
  valueKey?: keyof T;
  multiple?: boolean;
  disabled?: boolean;
  filterable?: boolean;
  clearable?: boolean;
}>(), {
  labelKey: 'label',
  valueKey: undefined,
  multiple: false,
  disabled: false,
  filterable: false,
  clearable: false,
})
const { labelKey, valueKey, options, clearable, disabled, filterable, multiple } = props
console.log(valueKey,)
type ModelValue = T[keyof T] | T
const modelValue = defineModel<ModelValue | ModelValue[]>({
  required: true,
})
</script>