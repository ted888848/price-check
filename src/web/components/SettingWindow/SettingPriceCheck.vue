<template>
  <div class="flex flex-col pl-2">
    <div class="flex mt-5">
      <label for="characterName" class="text-xl text-white mr-2 hover:cursor-default">角色名字:</label>
      <input id="characterName" v-model="config.characterName"
        class="shadow appearance-none w-200px border rounded py-1 px-2 text-gray-700 leading-tight" type="text">
    </div>
    <div class="flex mt-5">
      <label for="POESESSID" class="text-xl text-white mr-2 hover:cursor-default">POESESSID:</label>
      <input id="POESESSID" v-model="config.POESESSID"
        class="shadow appearance-none w-310px border rounded py-1 px-2 text-gray-700 leading-tight" type="text">
    </div>
    <div class="flex mt-5 hover:cursor-pointer items-center gap-8px">
      <span class="text-xl text-white">以物易物優先使用:</span>
      <MySelect v-model="config.searchExchangePrefer" class="min-w-150px" :options="exchangeHave" label-key="label"
        :reducer="i => i.value" />
    </div>
    <div class="flex items-center py-1 select-none">
      <span class="mx-1 text-white">搜尋類型:</span>
      <MySelect v-model="config.searchOnlineType" :options="searchOnlineTypeOptions" label-key="label"
        :reducer="i => i.value" class="min-w-100px" />
    </div>
  </div>
</template>
<script setup lang="ts">
import { selectOptions } from '@/web/lib/tradeSide'
import MySelect from '../utility/MySelect.vue'
const { exchangeHave, searchOnlineTypeOptions } = selectOptions
const config = defineModel<Config>('config', {
  required: true
})
</script>