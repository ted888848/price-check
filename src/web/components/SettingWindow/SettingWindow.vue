<template>
  <div class="absolute left-0 right-0 mx-auto bg-gray-700 text-center w-1/2 h-1/2">
    <div v-if="config" class="flex flex-col">
      <div class="flex items-center justify-center mt-5">
        <label for="characterName" class="text-xl text-white mr-2 hover:cursor-default">角色名字:</label>
        <input id="characterName" v-model.trim="config.characterName"
               class="shadow appearance-none w-[200px] border rounded py-1 px-2 text-gray-700 leading-tight" type="text">
      </div>
      <div class="flex items-center justify-center mt-5">
        <label for="POESESSID" class="text-xl text-white mr-2 hover:cursor-default">POESESSID:</label>
        <input id="POESESSID" v-model.trim="config.POESESSID"
               class="shadow appearance-none w-[310px] border rounded py-1 px-2 text-gray-700 leading-tight" type="text">
      </div>
      <div class="flex items-center justify-center mt-5 hover:cursor-pointer"
           @click="config.searchExchangeDivine = !config.searchExchangeDivine">
        <span class="text-xl text-white mr-2">可堆疊通貨優先使用神聖:</span>
        <CircleCheck :checked="config.searchExchangeDivine" />
      </div>
      <div class="flex items-center justify-center mt-5 hover:cursor-pointer"
           @click="config.searchTwoWeekOffline = !config.searchTwoWeekOffline">
        <span class="text-xl text-white mr-2">搜尋兩周內上架包含離線:</span>
        <CircleCheck :checked="config.searchTwoWeekOffline" />
      </div>
      <div class=" absolute bottom-4 mx-auto left-0 right-0 flex items-center justify-center ">
        <button class="px-3 py-1 rounded bg-green-500 mr-3" @click="save">
          確認
        </button>
        <button class="px-3 py-1 rounded bg-red-500" @click="cancel">
          取消
        </button>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ipcRenderer } from 'electron'
import { onMounted, ref } from 'vue'
import IPC from '@/ipc/ipcChannel'
import CircleCheck from '../utility/CircleCheck.vue'
import type { IConfig } from '@/main/config'
const config = ref<IConfig>(null)
onMounted(() => {
  config.value = ipcRenderer.sendSync(IPC.GET_CONFIG)
})
const emit = defineEmits(['close-setting-window'])
function save() {
  ipcRenderer.send(IPC.SET_CONFIG, JSON.stringify(config.value))
  emit('close-setting-window')
}
function cancel() {
  emit('close-setting-window')
}
</script>