<template>
  <div class="flex flex-col items-start gap-1 pl-2 pt-5">
    <div class="text-white self-center text-xl">
      自己的角色名字使用"@char"，<br>
      最後密語的人使用"@last"並只能放在最前面或最後面。
    </div>
    <div class="text-white flex items-center">
      <span class="text-xl mr-2 w-80px">
        查價
      </span>
      <KeyInput v-model:hotkey="config.priceCheckHotkey" />
      <span v-if="!config.priceCheckHotkey.length" class="ml-2 text-red-600 font-bold">
        此欄位不能為空
      </span>
    </div>
    <div class="text-white flex items-center">
      <span class="text-xl mr-2 w-80px">
        設定
      </span>
      <KeyInput v-model:hotkey="config.settingHotkey" />
      <span v-if="!config.settingHotkey.length" class="ml-2 text-red-600 font-bold">
        此欄位不能為空
      </span>
    </div>
    <div v-for="(shortcut, index) in config.shortcuts" :key="index" class="text-white flex items-center">
      <span class="text-xl mr-2 w-80px">
        聊天室
      </span>
      <KeyInput v-model:hotkey="shortcut.hotkey" />
      <input v-model.trim="shortcut.outputText" type="text" class="ml-2 rounded text-black pl-1">
      <button class=" hover:text-red-600 ml-1 flex justify-center items-center"
        @click="(e) => deleteChatShortcut(e, index)">
        <div class="i-material-symbols:delete text-white text-xl" />
      </button>
    </div>
    <button class=" bg-white rounded p-1 w-400px" @click="createChatShortcut">
      新增聊天室快捷鍵
    </button>
  </div>
</template>

<script setup lang="ts">
import KeyInput from '../utility/KeyInput.vue'
const config = defineModel<Config>('config', {
  required: true
})

function createChatShortcut() {
  config.value.shortcuts.push({
    hotkey: '',
    type: 'type-in-chat',
    outputText: ''
  })
}
function deleteChatShortcut(_e: MouseEvent, index: number) {
  config.value.shortcuts.splice(index, 1)
}
</script>