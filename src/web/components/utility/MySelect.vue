<template>
  <div>
    <ElSelect v-model="<any>selectedValue" :multiple="multiple" :disabled="disabled" :filterable="filterable"
      :clearable="clearable" placeholder="" :value-key="valueKey" @change="handleSelectChange">
      <template v-if="centerLabel" #label="{ label }">
        <div class="text-center">
          {{ label }}
        </div>
      </template>
      <ElOption v-for="(option, index) in options" :key="index" :label="option[labelKey]" :value="option">
        <div v-if="centerLabel" class="text-center">
          {{ option[labelKey] }}
        </div>
      </ElOption>
    </ElSelect>
  </div>
</template>
<script setup lang="ts"
  generic="T extends Record<string, any>, ReducerReturn ,ValueKey extends (keyof T | undefined) = undefined, Multiple extends boolean = false">
  import { ElSelect, ElOption } from 'element-plus'
  import { ref, watch } from 'vue'
  type TModelValue = ValueKey extends string ? T : ReducerReturn;
  type TModelValue2 = Multiple extends true ? TModelValue[] : TModelValue;
  type PropsBase = {
    options?: T[];
    clearable?: boolean;
    multiple?: Multiple;
    modelValue?: TModelValue2;
    centerLabel?: boolean;
    disabled?: boolean;
    filterable?: boolean;
    labelKey?: keyof T;
  };
  type UseReducer = {
    valueKey?: never;
    reducer: (item: T) => TModelValue; // Ensure reducer returns the correct type
  } & PropsBase;
  type UseValueKey = {
    valueKey: ValueKey extends string ? ValueKey : never;
    reducer?: never;
  } & PropsBase;
  type Props = UseReducer | UseValueKey;
  type SelectValue = (Multiple extends true ? T[] : T) | undefined;


  const { valueKey, options, centerLabel = true, labelKey = 'label',
    clearable = false, disabled = false, filterable = false,
    multiple = false, reducer = item => item, modelValue } = defineProps<Props>()
  function getModelValue2SelectedValue(modelValue: TModelValue2 | undefined): SelectValue {
    if (!options || (valueKey && !modelValue)) return undefined
    const hasSameValue = (item1: T, item2: TModelValue) => {
      if (valueKey) return item1[valueKey] === (item2 as T)[valueKey]
      return reducer(item1) === item2
    }

    return (multiple
      ? options.filter((item) => (modelValue as TModelValue[]).some((mValue) => hasSameValue(item, mValue)))
      : options.find((item) => hasSameValue(item, modelValue as TModelValue))) as SelectValue
  }
  const selectedValue = ref<SelectValue>(getModelValue2SelectedValue(modelValue))
  const emit = defineEmits<{
    (e: 'update:modelValue', value: any): void;
  }>()
  function handleSelectChange(newValue: any) {

    let resultValue: TModelValue2
    if (!newValue) {
      resultValue = newValue
    } else if (multiple) {
      resultValue = (newValue as T[]).map((item) => reducer(item)) as TModelValue2
    } else {
      resultValue = reducer(newValue) as TModelValue2
    }
    emit('update:modelValue', resultValue)
  }
</script>