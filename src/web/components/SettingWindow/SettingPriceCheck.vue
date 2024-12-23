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
      <VSelect v-model="config.searchExchangePrefer" class="text-sm style-chooser min-w-150px" :options="exchangeHave"
        label="label" :reduce="(ele: ArrayValueType<typeof exchangeHave>) => ele.value" :clearable="false"
        :searchable="false" />
    </div>
    <div class="flex mt-5 hover:cursor-pointer items-center"
      @click="() => config.searchTwoWeekOffline = !config.searchTwoWeekOffline">
      <span class="text-xl text-white mr-2">搜尋兩周內上架包含離線:</span>
      <CircleCheck :checked="config.searchTwoWeekOffline" />
    </div>
    <!-- <div class="flex mt-5 gap-8px">
      <span class="text-xl text-white mr-2">
        POE 版本 (確定後需要重開)
      </span>
      <div class="flex items-center gap-4px" @click="() => config.poeVersion = '1'">
        <span class="text-lg text-white">POE1</span>
        <CircleCheck :checked="config.poeVersion === '1'" />
      </div>
      <div class="flex items-center gap-4px" @click="() => config.poeVersion = '2'">
        <span class="text-lg text-white">POE2</span>
        <CircleCheck :checked="config.poeVersion === '2'" />
      </div>
    </div> -->
  </div>
</template>
<script setup lang="ts">
import CircleCheck from '../utility/CircleCheck.vue'
import { selectOptions } from '@/web/lib/tradeSide'
const { exchangeHave } = selectOptions
const config = defineModel<Config>('config', {
  required: true
})
</script>