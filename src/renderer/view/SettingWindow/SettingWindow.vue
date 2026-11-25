<template>
  <div v-if="config" class="absolute right-0 left-0 mx-auto flex h-1/2 w-1/2 flex-1 bg-gray-700 text-center">
    <div class="w-150px mt-5 flex flex-col gap-2 text-lg text-white">
      <button
        :class="{ 'bg-slate-600 text-amber-600': currentSettingPage === 'SettingPriceCheck' }"
        class="p-2"
        @click="() => (currentSettingPage = 'SettingPriceCheck')"
      >
        查價設定
      </button>
      <button
        :class="{ 'bg-slate-600 text-amber-600': currentSettingPage === 'SettingShortcut' }"
        class="p-2"
        @click="() => (currentSettingPage = 'SettingShortcut')"
      >
        快捷鍵設定
      </button>
      <button
        :class="{ 'bg-slate-600 text-amber-600': currentSettingPage === 'WidgetsSetting' }"
        class="p-2"
        @click="() => (currentSettingPage = 'WidgetsSetting')"
      >
        Widget 設定
      </button>
    </div>
    <div class="pb-50px flex-1 overflow-auto bg-slate-600">
      <component :is="settingPage[currentSettingPage]" v-model:config="config" />
    </div>
    <div class="absolute right-0 bottom-4 left-0 mx-auto flex items-center justify-center">
      <button
        class="mr-3 rounded bg-green-500 px-3 py-1 disabled:opacity-70"
        :disabled="!Boolean(config.priceCheckHotkey.length && config.settingHotkey.length)"
        @click="save"
      >
        確認
      </button>
      <button class="rounded bg-red-500 px-3 py-1" @click="cancel">取消</button>
    </div>
  </div>
</template>
<script setup lang="ts">
import { onMounted, ref } from "vue";
import IPC from "@/ipc";
import WidgetsSetting from "../../components/Widget/Settings/WidgetsSetting.vue";
import SettingPriceCheck from "./SettingPriceCheck.vue";
import SettingShortcut from "./SettingShortcut.vue";
const config = ref<Config>();
onMounted(() => {
  config.value = window.ipc.sendSync(IPC.GET_CONFIG);
});
const emit = defineEmits(["close-setting-window"]);
function save() {
  if (!config.value) return;
  window.ipc.send(IPC.SET_CONFIG, JSON.stringify(config.value));
  emit("close-setting-window");
}
function cancel() {
  emit("close-setting-window");
}
const settingPage = {
  SettingPriceCheck: SettingPriceCheck,
  SettingShortcut: SettingShortcut,
  WidgetsSetting: WidgetsSetting,
};
const currentSettingPage = ref<keyof typeof settingPage>("SettingPriceCheck");
</script>
