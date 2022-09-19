<template>
  <div class="flex flex-col gap-1 pl-2 pt-5">
    <div class="text-white">
      自己的角色名字使用"@char"，<br>
      最後密語的人使用"@last"並只能放在最前面或最後面。
    </div>
    <div class="flex text-white">
      <div class="text-xl mr-2 w-[80px]">
        查價
      </div>
      <KeyInput v-model:hotkey="CConfig.priceCheckHotkey" />
      <div v-if="!CConfig.priceCheckHotkey.length" class="ml-2 text-red-600 font-bold">
        此欄位不能為空
      </div>
    </div>
    <div class="flex text-white">
      <div class="text-xl mr-2 w-[80px]">
        設定
      </div>
      <KeyInput v-model:hotkey="CConfig.settingHotkey" />
      <div v-if="!CConfig.settingHotkey.length" class="ml-2 text-red-600 font-bold">
        此欄位不能為空
      </div>
    </div>
    <div v-for="(shortcut, index) in CConfig.shortcuts" :key="index" class="flex text-white">
      <div class="text-xl mr-2 w-[80px]">
        聊天室
      </div>
      <KeyInput v-model:hotkey="shortcut.hotkey" />
      <input v-model.trim="shortcut.outputText" type="text" class="ml-2 rounded text-black pl-1">
      <button class=" hover:text-red-600 ml-1" @click="(e)=>deleteChatShortcut(e, index)">
        <FontAwesomeIcon icon="rectangle-xmark" size="2x" />
      </button>
    </div>
    <button class=" bg-white rounded p-1 " @click="createChatShortcut">
      新增聊天室快捷鍵
    </button>
  </div>
</template>
<script setup lang="ts">
import { IConfig } from '@/main/config'
import { computed } from 'vue'
import KeyInput from '../utility/KeyInput.vue'
const props = defineProps<{
  config: IConfig;
}>()
const emit = defineEmits<{
  (event: 'update:config', newValue: IConfig): void;
}>()
const CConfig = computed({
  get(){
    return props.config
  },
  set(newValue){
    emit('update:config', newValue)
  }
})

function createChatShortcut(){
  CConfig.value.shortcuts.push({
    hotkey: '',
    type: 'type-in-chat',
    outputText: ''
  })
}
function deleteChatShortcut(_e: MouseEvent, index: number){
  CConfig.value.shortcuts.splice(index, 1)
}
</script>