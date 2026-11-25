<template>
  <div class="grid w-fit grid-cols-[max-content_max-content_max-content] content-start items-center gap-1 overflow-auto pt-5 pl-2">
    <div class="col-span-full self-center text-xl text-white">
      自己的角色名字使用"@char"，<br />
      最後密語的人使用"@last"並只能放在最前面或最後面。
    </div>
    <div class="col-span-full grid grid-cols-subgrid text-white">
      <span class="mr-2 text-xl"> 查價 </span>
      <KeyInput v-model:hotkey="config.priceCheckHotkey" class="w-200px h-fit" />
      <span v-if="!config.priceCheckHotkey.length" class="ml-2 font-bold text-red-600"> 此欄位不能為空 </span>
    </div>
    <div class="col-span-full grid grid-cols-subgrid text-white">
      <span class="mr-2 text-xl"> 上次查價結果 </span>
      <KeyInput v-model:hotkey="config.prevPriceCheckHotkey" class="w-200px h-fit" />
    </div>
    <div class="col-span-full grid grid-cols-subgrid text-white">
      <span class="mr-2 text-xl"> 設定 </span>
      <KeyInput v-model:hotkey="config.settingHotkey" class="w-200px h-fit" />
      <span v-if="!config.settingHotkey.length" class="ml-2 font-bold text-red-600"> 此欄位不能為空 </span>
    </div>
    <div v-for="(shortcut, index) in config.shortcuts" :key="index" class="col-span-full grid grid-cols-subgrid text-white">
      <span class="mr-2 text-xl"> 聊天室 </span>
      <KeyInput v-model:hotkey="shortcut.hotkey" class="w-200px h-fit" />
      <div class="gap-4px flex items-center">
        <input v-model.trim="shortcut.outputText" type="text" class="ml-2 rounded bg-white pl-1 text-black" />
        <button class="ml-1 flex items-center justify-center hover:text-red-600" @click="(e) => deleteChatShortcut(e, index)">
          <div class="i-material-symbols:delete text-xl text-white" />
        </button>
      </div>
    </div>
    <button class="w-400px col-span-full rounded bg-white p-1" @click="createChatShortcut">新增聊天室快捷鍵</button>
  </div>
</template>

<script setup lang="ts">
import KeyInput from "../../components/utility/KeyInput.vue";
const config = defineModel<Config>("config", {
  required: true,
});

function createChatShortcut() {
  config.value.shortcuts.push({
    hotkey: "",
    type: "type-in-chat",
    outputText: "",
  });
}
function deleteChatShortcut(_e: MouseEvent, index: number) {
  config.value.shortcuts.splice(index, 1);
}
</script>
