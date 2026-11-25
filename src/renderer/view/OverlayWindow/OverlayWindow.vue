<template>
  <div v-show="overlayWindowShow" class="bg-opacity-30 absolute top-0 left-0 m-0 h-screen w-screen bg-gray-400" @click.self="closeOverlay">
    <button
      class="absolute top-10 left-10 rounded-xl bg-blue-600 px-1 py-0.5 hover:bg-gray-900"
      @click="(_) => (settingWindowShow = !settingWindowShow)"
      title="設定"
    >
      <div class="i-material-symbols:settings text-4xl text-red-600" />
    </button>
    <button class="absolute top-28 left-10 rounded-xl bg-red-600 px-1 py-0.5 hover:bg-gray-900" @click="reloadAPIdata" title="重新載入 API 資料">
      <div class="i-material-symbols:refresh text-4xl text-blue-600" />
    </button>
    <SettingWindow v-if="settingWindowShow" @close-setting-window="closeSettingWindow" />
    <Widgets :is-setting-window-show="settingWindowShow" />
  </div>
</template>
<script setup lang="ts">
import { onMounted, onUnmounted, ref } from "vue";
import IPC from "@/ipc";
import { loadAPIData } from "@/renderer/lib/APIdata";
import SettingWindow from "@/renderer/view/SettingWindow/SettingWindow.vue";
import Widgets from "../../components/Widget/Widgets.vue";
const overlayWindowShow = ref(false);
function closeOverlay() {
  overlayWindowShow.value = false;
  closeSettingWindow();
  window.ipc.send(IPC.FORCE_POE);
}

const settingWindowShow = ref(false);
function closeSettingWindow() {
  settingWindowShow.value = false;
}

const emit = defineEmits<{
  (event: "reloadLeagues"): void;
}>();
function reloadAPIdata() {
  window.ipc
    .invoke(IPC.RELOAD_APIDATA)
    .then(({ status, error }) => {
      if (status) {
        emit("reloadLeagues");
        loadAPIData();
      } else {
        console.error(error);
      }
    })
    .catch((error) => {
      console.error(error);
    });
}

function ipcHandleOverlayShow() {
  overlayWindowShow.value = true;
}

function ipcHandlePoeActive() {
  overlayWindowShow.value = false;
  closeSettingWindow();
}
onMounted(() => {
  window.ipc.on(IPC.OVERLAY_SHOW, ipcHandleOverlayShow);
  window.ipc.on(IPC.POE_ACTIVE, ipcHandlePoeActive);
});

onUnmounted(() => {
  window.ipc.removeListener(IPC.OVERLAY_SHOW, ipcHandleOverlayShow);
  window.ipc.removeListener(IPC.POE_ACTIVE, ipcHandlePoeActive);
});
</script>
