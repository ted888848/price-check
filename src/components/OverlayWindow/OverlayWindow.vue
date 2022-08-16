<template>
	<div v-if="overlayWindowShow" class="absolute top-0 left-0 m-0 w-screen h-screen bg-gray-400 bg-opacity-30"
		@click.self="closeOverlay">
		<button class="absolute top-10 left-10 bg-blue-600 hover:bg-gray-900 rounded-xl px-1 py-0.5"
			@click="settingWindowShow = !settingWindowShow">
			<FontAwesomeIcon icon="gear" class="text-red-600 text-4xl" />
		</button>
		<button class="absolute top-28 left-10 bg-red-600 hover:bg-gray-900 rounded-xl px-1 py-0.5" @click="reloadAPIdata">
			<FontAwesomeIcon icon="rotate" class="text-blue-600 text-4xl" />
		</button>
		<SettingWindow v-if="settingWindowShow" @close-settingWindow="closeSettingWindow" />
	</div>
</template>
<script setup>
import { ref } from "vue";
import { ipcRenderer } from "electron";
import IPC from "@/ipc/ipcChannel";
import { loadAPIdata, store } from "@/web/APIdata";
import SettingWindow from "@/components/SettingWindow/SettingWindow.vue";
const overlayWindowShow = ref(false);
function closeOverlay() {
	overlayWindowShow.value = false;
	closeSettingWindow();
	ipcRenderer.send(IPC.FORCE_POE, true);
}

const settingWindowShow = ref(false);
function closeSettingWindow() {
	settingWindowShow.value = false;
}

const emit = defineEmits(["reloadLeagues"]);
function reloadAPIdata() {
	let configTemp = store.get("config");
	store.clear();
	store.set("config", configTemp);
	ipcRenderer
		.invoke(IPC.RELOAD_APIDATA)
		.then(() => {
			emit("reloadLeagues");
			loadAPIdata();
			console.log('API reloaded')
		})
		.catch((error) => {
			console.error(error);
		});
}

ipcRenderer.on(IPC.OVERLAY_SHOW, () => {
	overlayWindowShow.value = true;
});
ipcRenderer.on(IPC.POE_ACTIVE, () => {
	overlayWindowShow.value = false;
	closeSettingWindow();
});
</script>
