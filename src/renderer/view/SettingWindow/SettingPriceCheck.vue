<template>
  <div class="flex flex-col pl-2">
    <div class="mt-5 flex">
      <label for="characterName" class="mr-2 text-xl text-white hover:cursor-default">角色名字:</label>
      <input
        id="characterName"
        v-model="config.characterName"
        class="w-200px appearance-none rounded border bg-white px-2 py-1 leading-tight text-gray-700 shadow"
        type="text"
      />
    </div>
    <div class="mt-5 flex">
      <label for="POESESSID" class="mr-2 text-xl text-white hover:cursor-default">POESESSID:</label>
      <input
        id="POESESSID"
        v-model="config.POESESSID"
        class="w-310px rounded border bg-white px-2 py-1 leading-tight text-gray-700 shadow"
        type="text"
      />
    </div>
    <div class="gap-8px mt-5 flex items-center hover:cursor-pointer">
      <span class="text-xl text-white">以物易物優先使用:</span>
      <MySelect v-model="config.searchExchangePrefer" class="min-w-150px" :options="exchangeHave" label-key="label" :reducer="(i) => i.value" />
    </div>
    <div class="flex items-center py-1 select-none">
      <span class="mx-1 text-xl text-white">搜尋類型:</span>
      <MySelect
        v-model="config.searchOnlineType"
        :options="searchOnlineTypeOptions"
        label-key="label"
        :reducer="(i) => i.value"
        class="min-w-100px"
      />
    </div>
    <div class="flex items-center py-1 select-none" @click="config.autoSearchStackableItems = !config.autoSearchStackableItems">
      <span class="mx-1 text-xl text-white">自動搜尋可堆疊物品</span>
      <CircleCheck :checked="config.autoSearchStackableItems ?? true" />
    </div>
    <div class="flex items-center py-1 select-none" @click="config.enableAutoEnableUniqueMods = !config.enableAutoEnableUniqueMods">
      <span class="mx-1 text-xl text-white">自動啟用傳奇物品詞綴</span>
      <CircleCheck :checked="config.enableAutoEnableUniqueMods ?? false" />
    </div>
  </div>
</template>
<script setup lang="ts">
import { selectOptions } from "@/renderer/lib/tradeSide";
import CircleCheck from "../../components/utility/CircleCheck.vue";
import MySelect from "../../components/utility/MySelect.vue";
const { exchangeHave, searchOnlineTypeOptions } = selectOptions;
const config = defineModel<Config>("config", {
  required: true,
});
</script>
