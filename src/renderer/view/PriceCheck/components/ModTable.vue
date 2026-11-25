<template>
  <table v-if="props.stats.length" class="bg-gray-700 text-center mt-1 text-white text-sm">
    <thead class="bg-green-600" @click="(_event) => emit('update:expanded', !props.expanded)">
      <tr class="text-lg">
        <td
          class="w-6 text-center hover:cursor-default"
          @click="
            (e) => {
              e.stopPropagation();
              props.stats.forEach((mod) => handleModClick(mod));
            }
          "
        >
          查
        </td>
        <td class="w-14 text-center hover:cursor-default">種類</td>
        <td class="text-center hover:cursor-default">詞綴</td>
        <td class="w-11 text-center hover:cursor-default">最小</td>
        <td
          class="w-3 text-center hover:cursor-default"
          @click="
            (e) => {
              e.stopPropagation();
              const firstHaveEmptyValue = props.stats.find((mod) => !isUndefined(mod.searchWithEmptyValue));
              if (!firstHaveEmptyValue) return;
              const nextState = !firstHaveEmptyValue.searchWithEmptyValue;
              props.stats.forEach((mod) => (mod.searchWithEmptyValue = nextState));
            }
          "
        >
          <ElTooltip content="可以點擊'-'設定是否搜尋最大最小值" placement="top">
            <div class="i-material-symbols:info-outline size-4" />
          </ElTooltip>
        </td>
        <td class="w-11 text-center hover:cursor-default">最大</td>
      </tr>
    </thead>
    <tbody v-show="props.expanded" class="modsTbody" style="">
      <tr v-for="(mod, index) in props.stats" :key="mod.id + index" class="border-b-2 border-gray-400">
        <td class="text-base" @click="() => handleModClick(mod)">
          <CircleCheck :checked="!mod.disabled" />
        </td>
        <td
          class="whitespace-nowrap text-lg font-semibold hover:cursor-default"
          :style="{ color: modTextColor(mod.type) }"
          @click="() => handleModClick(mod)"
        >
          {{ mod.type }}
        </td>
        <td @click="() => handleModClick(mod)">
          <div class="text-center whitespace-pre-line">{{ mod.text }}</div>
        </td>
        <td>
          <input
            v-if="isModHasValueField(mod)"
            v-model.number="mod.value.min"
            type="number"
            class="w-8 appearance-none rounded bg-gray-400 text-center text-black font-bold"
            :class="{ 'opacity-20': mod.searchWithEmptyValue }"
            @dblclick="() => delete mod.value.min"
          />
        </td>
        <td class="cursor-pointer" @click="() => handleModValueToggleClick(mod)">
          <span v-if="isModHasValueField(mod)" class="text-white font-bold"> - </span>
        </td>
        <td>
          <input
            v-if="isModHasValueField(mod)"
            v-model.number="mod.value.max"
            type="number"
            class="w-8 appearance-none rounded bg-gray-400 text-center text-black font-bold"
            :class="{ 'opacity-20': mod.searchWithEmptyValue }"
            @dblclick="() => delete mod.value.max"
          />
        </td>
      </tr>
    </tbody>
  </table>
</template>

<script setup lang="ts">
import { isUndefined } from "lodash-es";
import { match } from "ts-pattern";
import { ElTooltip } from "element-plus";
import { NOT_MATCHED_ID } from "@/renderer/lib/const";
import CircleCheck from "../../../components/utility/CircleCheck.vue";

const props = defineProps<{
  stats: ParsedItem["stats"];
  expanded: boolean;
}>();
const emit = defineEmits<{
  "update:expanded": [value: boolean];
}>();

function modTextColor(type?: string) {
  return match(type)
    .with("固定", () => "#346beb")
    .with("附魔", () => "#41e635")
    .with("破裂", () => "#eba536")
    .with("隨機", () => "red")
    .with("偽屬性", () => "#9936eb")
    .with("穢生", () => "#8B4513")
    .with("未知", () => "gray")
    .otherwise(() => "white");
}

function isModHasValueField(mod: ParsedItem["stats"][number]): mod is ParsedItem["stats"][number] & { value: { min?: number; max?: number } } {
  return !!mod.value && !mod.value.option;
}

function handleModClick(mod: ParsedItem["stats"][number]) {
  if (mod.id === NOT_MATCHED_ID) return;
  mod.disabled = !mod.disabled;
}

function handleModValueToggleClick(mod: ParsedItem["stats"][number]) {
  if (!(mod.value && !mod.value.option)) return;
  mod.searchWithEmptyValue = !mod.searchWithEmptyValue;
}
</script>

<style scoped>
.modsTbody > tr > td {
  padding: 5px 1px;
}
</style>
