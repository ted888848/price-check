<template>
  <div
    class="grid grid-cols-[max-content_max-content_max-content] items-center content-start w-fit gap-1 pl-2 pt-5 overflow-auto">
    <div class="text-white self-center text-xl col-span-full">
      自己的角色名字使用"@char"，<br>
      最後密語的人使用"@last"並只能放在最前面或最後面。
    </div>
    <div class="text-white grid grid-cols-subgrid col-span-full ">
      <span class="text-xl mr-2">
        查價
      </span>
      <KeyInput v-model:hotkey="config.priceCheckHotkey" class="w-200px h-fit" />
      <span v-if="!config.priceCheckHotkey.length" class="ml-2 text-red-600 font-bold">
        此欄位不能為空
      </span>
    </div>
    <div class="text-white grid grid-cols-subgrid col-span-full">
      <span class="text-xl mr-2">
        上次查價結果
      </span>
      <KeyInput v-model:hotkey="config.prevPriceCheckHotkey" class="w-200px h-fit" />
    </div>
    <div class="text-white grid grid-cols-subgrid col-span-full">
      <span class="text-xl mr-2">
        設定
      </span>
      <KeyInput v-model:hotkey="config.settingHotkey" class="w-200px h-fit" />
      <span v-if="!config.settingHotkey.length" class="ml-2 text-red-600 font-bold">
        此欄位不能為空
      </span>
    </div>
    <div v-for="(shortcut, index) in config.shortcuts" :key="index"
      class="text-white grid grid-cols-subgrid col-span-full">
      <span class="text-xl mr-2">
        聊天室
      </span>
      <KeyInput v-model:hotkey="shortcut.hotkey" class="w-200px h-fit" />
      <div class="flex items-center gap-4px">
        <input v-model.trim="shortcut.outputText" type="text" class="ml-2 rounded text-black pl-1">
        <button class=" hover:text-red-600 ml-1 flex justify-center items-center"
          @click="(e) => deleteChatShortcut(e, index)">
          <div class="i-material-symbols:delete text-white text-xl" />
        </button>
      </div>
    </div>
    <button class=" bg-white rounded p-1 w-400px col-span-full" @click="createChatShortcut">
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