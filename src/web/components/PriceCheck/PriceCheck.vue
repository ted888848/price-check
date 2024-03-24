<template>
  <div v-if="windowShowHide"
    class="absolute top-0 left-0 w-screen h-screen priceCheckRoot bg-gray-400 bg-opacity-25 flex"
    @click.self="closePriceCheck">
    <webview v-if="isWebViewOpen" ref="webView" class=" flex-1" src="" />
    <div ref="priceCheckDiv" class="bg-gray-900 priceCheck h-full flex flex-col" :style="priceCheckPos"
      :class="{ 'absolute': !isWebViewOpen }">
      <div class="bg-gray-800 flex justify-between max-h-9 items-center">
        <div class="flex justify-start mr-auto ml-1 flex-1">
          <VSelect v-model="currentPriceCheck" class="text-sm style-chooser style-chooser-inf text-center"
            :options="priceCheckOptions" label="label" :searchable="false" :clearable="false"
            :reduce="(option: ArrayValueType<typeof priceCheckOptions>) => option.value" />
        </div>
        <div class="flex justify-center flex-1">
          <div class="relative exaltedImg ">
            <img :src="divineImage" class=" w-8 h-8 ">
            <ul v-if="divineToChaos"
              class="exaltedImgTooltip invisible bg-gray-700 z-10 text-center absolute text-white rounded">
              <li v-for="line in divineToChaosDec" :key="line.e" class="flex px-2 min-w-max text-xl">
                {{ line.e }} : {{ line.c }}
              </li>
            </ul>
          </div>
          <span class=" text-white text-2xl">:{{ divineToChaos }}</span>
          <img :src="chaosImage" class=" w-8 h-8 hover:cursor-pointer" @dblclick="refreshDivineToChaos">
        </div>
        <div class="flex justify-end mr-1 ml-auto flex-1">
          <button class=" text-white hover:text-red-500" @click="closePriceCheck">
            <div class="i-material-symbols:add-circle-rounded text-3xl rotate-45" />
          </button>
        </div>
      </div>
      <div class="p-1">
        <VSelect v-model="leagueSelect" class=" text-base style-chooser text-center" :options="leagues"
          :clearable="false" :searchable="false" />
      </div>
      <KeepAlive>
        <NormalPriceCheck v-if="currentPriceCheck === 'NormalPriceCheck'" :item-prop="item!"
          :league-select="leagueSelect" :divine-to-chaos="divineToChaos" :is-overflow="isOverflow"
          @open-web-view="openWebView" />
        <HeistPriceCheck v-else-if="currentPriceCheck === 'HeistPriceCheck'" :item-prop="item!"
          :divine-to-chaos="divineToChaos" :league-select="leagueSelect" :is-overflow="isOverflow"
          @open-web-view="openWebView" />
      </KeepAlive>
    </div>
  </div>
</template>

<script setup lang="ts">
// import { ipcRenderer } from 'electron'
import { ref, computed, nextTick, onMounted, onUnmounted, } from 'vue'
import { range } from 'lodash-es'
import IPC from '@/ipc/ipcChannel'
import { itemAnalyze } from '@/web/itemAnalyze'
import { getDivineToChaos } from '@/web/tradeSide'
import { leagues, currencyImageUrl } from '@/web/APIdata'
import NormalPriceCheck from './NormalPriceCheck.vue'
import HeistPriceCheck from './HeistPriceCheck.vue'
const isWebViewOpen = ref(false)
const webView = ref<HTMLIFrameElement>()
const priceCheckPos = ref({
  right: '0px'
})
function openWebView(extendUrl: string) {
  priceCheckPos.value.right = '0px'
  isWebViewOpen.value = true
  nextTick(() => {
    webView.value!.src = encodeURI(`${import.meta.env.VITE_URL_BASE}/trade/${extendUrl}`)
  })
}
function closeWebView() {
  if (webView.value) {
    webView.value.src = ''
  }
  isWebViewOpen.value = false
}

const windowShowHide = ref(false)
function closePriceCheck() {
  windowShowHide.value = false
  // ipcRenderer.send(IPC.FORCE_POE)
  window.electron.send(IPC.FORCE_POE)
  isWebViewOpen.value = false
}

const leagueSelect = ref(leagues[0])
function loadLeagues() {
  leagueSelect.value = leagues[0]
}
defineExpose({
  loadLeagues
})
type PriceCheckTabs = 'NormalPriceCheck' | 'HeistPriceCheck'
type PriceCheckOption = {
  label: string;
  value: PriceCheckTabs;
}
const priceCheckOptions: PriceCheckOption[] = [{
  label: '普通查價',
  value: 'NormalPriceCheck'
}, {
  label: '劫盜查價',
  value: 'HeistPriceCheck'
}]
const currentPriceCheck = ref<PriceCheckTabs>('NormalPriceCheck')
const item = ref<ParsedItem | null>(null)

const divineToChaos = ref(0)
let divineImage = import.meta.env.VITE_URL_BASE + currencyImageUrl.find(ele => ele.id === 'divine')?.image
let chaosImage = import.meta.env.VITE_URL_BASE + currencyImageUrl.find(ele => ele.id === 'chaos')?.image
async function refreshDivineToChaos() {
  divineToChaos.value = await getDivineToChaos(leagueSelect.value)
}
const divToCInterval = setInterval(() => {
  refreshDivineToChaos()
}, 10 * 60 * 1000)
const divineToChaosDec = computed(() => {
  return range(0.1, 1, 0.1).map(ele => ({
    e: ele.toFixed(1), c: (ele * divineToChaos.value).toFixed(0)
  }))
})

const priceCheckDiv = ref<HTMLDivElement>()
function isOverflow() {
  if (!priceCheckDiv.value) return false
  return priceCheckDiv.value.scrollHeight > priceCheckDiv.value.offsetHeight
}

// ipcRenderer.on(IPC.PRICE_CHECK_SHOW, (e, clip: string, pos: string) => {
window.electron.on(IPC.PRICE_CHECK_SHOW, (e, clip: string, pos: string) => {
  closeWebView()
  windowShowHide.value = true
  currentPriceCheck.value = 'NormalPriceCheck'
  priceCheckPos.value.right = pos
  try {
    item.value = itemAnalyze(clip)
  }
  catch (e) {
    console.log(e)
  }
})
// ipcRenderer.on(IPC.POE_ACTIVE, () => {
window.electron.on(IPC.POE_ACTIVE, () => {
  windowShowHide.value = false
})
onMounted(() => {
  refreshDivineToChaos()
})
onUnmounted(() => {
  clearInterval(divToCInterval)
})
</script>

<style>
div.priceCheckRoot {
  overflow: hidden;
}

div.priceCheck {
  width: 500px;
}

.style-chooser .vs__search::placeholder,
.style-chooser .vs__dropdown-toggle,
.style-chooser .vs__dropdown-menu {
  text-align: center;
  min-width: 0px;
  background: #dfe5fb;
  border: none;
  color: #394066;
}

.style-chooser .vs__search {
  padding: 0;
  width: 0;
  flex-grow: 0;
}

.style-chooser .vs__selected {
  flex-grow: 0;
}

.style-chooser .vs__selected-options {
  display: flex;
  justify-content: center;
}

.style-chooser-inf .vs__selected-options {
  min-width: 100px;
  justify-content: start;
}

input::-webkit-outer-spin-button,
input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  appearance: none;
  margin: 0;
}

tbody.modsTbody>tr>td {
  padding: 5px 1px;
}

.exaltedImg:hover .exaltedImgTooltip {
  visibility: visible;
}
</style>