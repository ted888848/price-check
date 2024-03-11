<template>
  <div v-if="overlayWindowShow" class="absolute top-0 left-0 m-0 w-screen h-screen bg-gray-400 bg-opacity-30"
    @click.self="closeOverlay">
    <button class="absolute top-10 left-10 bg-blue-600 hover:bg-gray-900 rounded-xl px-1 py-0.5"
      @click="_event => settingWindowShow = !settingWindowShow">
      <div class="i-material-symbols:settings text-red-600 text-4xl" />
    </button>
    <button class="absolute top-28 left-10 bg-red-600 hover:bg-gray-900 rounded-xl px-1 py-0.5" @click="reloadAPIdata">
      <div class="i-material-symbols:refresh text-blue-600 text-4xl" />
    </button>
    <SettingWindow v-if="settingWindowShow" @close-setting-window="closeSettingWindow" />
  </div>
</template>
<script setup lang="ts">
import { ref } from 'vue'
import { ipcRenderer } from 'electron'
import IPC from '@/ipc/ipcChannel'
import { loadAPIdata } from '@/web/APIdata'
import SettingWindow from '@/web/components/SettingWindow/SettingWindow.vue'
const overlayWindowShow = ref(false)
function closeOverlay() {
  overlayWindowShow.value = false
  closeSettingWindow()
  ipcRenderer.send(IPC.FORCE_POE, true)
}

const settingWindowShow = ref(false)
function closeSettingWindow() {
  settingWindowShow.value = false
}

const emit = defineEmits<{
  (event: 'reloadLeagues'): void;
}>()
function reloadAPIdata() {
  ipcRenderer.invoke(IPC.RELOAD_APIDATA)
    .then(({ status, error }) => {
      if (status) {
        emit('reloadLeagues')
        loadAPIdata()
        console.log('API reloaded')
      }
      else {
        console.error(error)
      }
    })
    .catch((error) => {
      console.error(error)
    })
}

ipcRenderer.on(IPC.OVERLAY_SHOW, () => {
  overlayWindowShow.value = true
})
ipcRenderer.on(IPC.POE_ACTIVE, () => {
  overlayWindowShow.value = false
  closeSettingWindow()
})
</script>
