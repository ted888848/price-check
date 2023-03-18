<template>
  <div class="flex flex-col pl-2">
    <div class="flex mt-5">
      <label for="characterName" class="text-xl text-white mr-2 hover:cursor-default">角色名字:</label>
      <input id="characterName" v-model="CConfig.characterName"
        class="shadow appearance-none w-[200px] border rounded py-1 px-2 text-gray-700 leading-tight" type="text">
    </div>
    <div class="flex mt-5">
      <label for="POESESSID" class="text-xl text-white mr-2 hover:cursor-default">POESESSID:</label>
      <input id="POESESSID" v-model="CConfig.POESESSID"
        class="shadow appearance-none w-[310px] border rounded py-1 px-2 text-gray-700 leading-tight" type="text">
    </div>
    <div class="flex mt-5 hover:cursor-pointer items-center"
      @click="CConfig.searchExchangeDivine = !CConfig.searchExchangeDivine">
      <span class="text-xl text-white mr-2">可堆疊通貨優先使用神聖:</span>
      <CircleCheck :checked="CConfig.searchExchangeDivine" />
    </div>
    <div class="flex mt-5 hover:cursor-pointer items-center"
      @click="CConfig.searchTwoWeekOffline = !CConfig.searchTwoWeekOffline">
      <span class="text-xl text-white mr-2">搜尋兩周內上架包含離線:</span>
      <CircleCheck :checked="CConfig.searchTwoWeekOffline" />
    </div>
  </div>
</template>
<script setup lang="ts">
import CircleCheck from '../utility/CircleCheck.vue'
import { computed } from 'vue'
const props = defineProps<{
  config: IConfig;
}>()

const emit = defineEmits<{
  (event: 'update:config', newValue: IConfig): void;
}>()
const CConfig = computed({
  get() {
    return props.config
  },
  set(newValue) {
    emit('update:config', newValue)
  }
})
</script>