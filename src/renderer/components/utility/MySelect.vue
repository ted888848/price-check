<template>
  <div>
    <ElSelect v-model="<any>selectedValue" :multiple="props.multiple" :disabled="props.disabled"
      :filterable="props.filterable" :clearable="props.clearable" placeholder=""
      :value-key="props.valueKey ?? (props.labelKey as string)" @change="handleSelectChange" :show-arrow="false"
      :popper-options="{
        modifiers: [
          {
            name: 'offset',
            options: {
              offset: [0, 4],
            },
          },
        ],
      }">
      <template v-if="props.centerLabel" #label="{ label }">
        <div class="text-center">
          {{ label }}
        </div>
      </template>
      <ElOption v-for="(option, index) in props.options" :key="index" :label="option[props.labelKey]" :value="option">
        <div v-if="props.centerLabel" class="text-center">
          {{ option[props.labelKey] }}
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

  const props = withDefaults(defineProps<Props>(), {
    centerLabel: true,
    labelKey: 'label' as any,
    clearable: false,
    disabled: false,
    filterable: false,
    multiple: false as any,
    reducer: (item: any) => item
  })
  function getModelValue2SelectedValue(modelValue: TModelValue2 | undefined): SelectValue {
    if (!props.options || (props.valueKey && !modelValue)) return undefined
    const hasSameValue = (item1: T, item2: TModelValue) => {
      if (props.valueKey) return item1[props.valueKey] === (item2 as T)[props.valueKey]
      return props.reducer(item1) === item2
    }

    return (props.multiple
      ? props.options.filter((item) => (modelValue as TModelValue[]).some((mValue) => hasSameValue(item, mValue)))
      : props.options.find((item) => hasSameValue(item, modelValue as TModelValue))) as SelectValue
  }
  const selectedValue = ref<SelectValue>(getModelValue2SelectedValue(props.modelValue))
  watch(() => props.modelValue, (newVal) => {
    selectedValue.value = getModelValue2SelectedValue(newVal)
  }, { deep: true })
  const emit = defineEmits<{
    (e: 'update:modelValue', value: any): void;
  }>()
  function handleSelectChange(newValue: any) {

    let resultValue: TModelValue2
    if (!newValue) {
      resultValue = newValue
    } else if (props.multiple) {
      resultValue = (newValue as T[]).map((item) => props.reducer(item)) as TModelValue2
    } else {
      resultValue = props.reducer(newValue) as TModelValue2
    }
    emit('update:modelValue', resultValue)
  }
</script>