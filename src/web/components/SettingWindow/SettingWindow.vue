<template>
  <div v-if="config" class="absolute left-0 right-0 mx-auto bg-gray-700 text-center w-1/2 h-1/2 flex flex-1">
    <div class="flex flex-col gap-2 w-150px mt-5 text-white">
      <button
        :class="{ 'text-amber-600 text-xl bg-slate-600 font-bold p-2': currentSettingPage === 'SettingPriceCheck' }"
        @click="() => currentSettingPage = 'SettingPriceCheck'">
        查價設定
      </button>
      <button :class="{ 'text-amber-600 text-xl bg-slate-600 font-bold p-2': currentSettingPage === 'SettingShortcut' }"
        @click="() => currentSettingPage = 'SettingShortcut'">
        快捷鍵設定
      </button>
    </div>
    <component :is="settingPage[currentSettingPage]" v-model:config="config" class="bg-slate-600 flex-1" />
    <div class=" absolute bottom-4 mx-auto left-0 right-0 flex items-center justify-center ">
      <button class="px-3 py-1 rounded bg-green-500 mr-3 disabled:opacity-70"
        :disabled="!Boolean(config.priceCheckHotkey.length && config.settingHotkey.length)" @click="save">
        確認
      </button>
      <button class="px-3 py-1 rounded bg-red-500" @click="cancel">
        取消
      </button>
    </div>
  </div>
</template>
<script setup lang="ts">
import { onMounted, ref } from 'vue'
import IPC from '@/ipc'
import SettingPriceCheck from './SettingPriceCheck.vue'
import SettingShortcut from './SettingShortcut.vue'
const config = ref<Config>()
onMounted(() => {
  config.value = window.ipc.sendSync(IPC.GET_CONFIG)
})
const emit = defineEmits(['close-setting-window'])
function save() {
  window.ipc.send(IPC.SET_CONFIG, JSON.stringify(config.value!))
  emit('close-setting-window')
}
function cancel() {
  emit('close-setting-window')
}
const settingPage = {
  'SettingPriceCheck': SettingPriceCheck,
  'SettingShortcut': SettingShortcut
}
const currentSettingPage = ref<keyof typeof settingPage>('SettingPriceCheck')
</script>