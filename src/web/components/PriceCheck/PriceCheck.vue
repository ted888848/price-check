<template>
  <div v-if="windowShowHide"
    class="absolute top-0 left-0 w-screen h-screen priceCheckRoot bg-gray-400 bg-opacity-25 flex"
    @click.self="closePriceCheck">
    <webview v-if="isWebViewOpen" ref="webView" class=" flex-1" src="" />
    <div ref="priceCheckDiv" class="bg-gray-900 priceCheck h-full flex flex-col" :style="priceCheckPos"
      :class="{ 'absolute': !isWebViewOpen }">
      <div class="bg-gray-800 flex justify-between max-h-9 items-center">
        <div class="flex justify-start mr-auto ml-1 flex-1">
          <MySelect v-model="currentPriceCheck" :options="priceCheckOptions" label-key="label" :reducer="i => i.value"
            class="w-100px" />
        </div>
        <div class="flex justify-center flex-1">
          <div class="relative exaltedImg ">
            <img :src="divineImage" class=" w-8 h-8 ">
            <ul v-if="divineToChaosOrEx"
              class="exaltedImgTooltip invisible bg-gray-700 z-10 text-center absolute text-white rounded">
              <li v-for="line in divineToChaosDec" :key="line.e" class="flex px-2 min-w-max text-xl">
                {{ line.e }} : {{ line.c }}
              </li>
            </ul>
          </div>
          <span class=" text-white text-2xl">:{{ divineToChaosOrEx }}</span>
          <img :src="chaosOrExImage" class=" w-8 h-8 hover:cursor-pointer" @dblclick="refreshDivineToChaosOrExalted">
        </div>
        <div class="flex justify-end mr-1 ml-auto flex-1">
          <button class=" text-white hover:text-red-500" @click="closePriceCheck">
            <div class="i-material-symbols:add-circle-rounded text-3xl rotate-45" />
          </button>
        </div>
      </div>
      <div class="p-1">
        <MySelect v-model="leagueSelect" :options="leagues.map(v => ({ label: v, value: v }))" label-key="label"
          :reducer="i => i.value" class="flex-1" />
      </div>
      <KeepAlive>
        <NormalPriceCheck v-if="currentPriceCheck === 'NormalPriceCheck'" :item-prop="item!"
          :league-select="leagueSelect" :divine-to-chaos-or-exalted="divineToChaosOrEx" :is-overflow="isOverflow"
          @open-web-view="openWebView" :parse-error="parseError" />
        <HeistPriceCheck v-else-if="currentPriceCheck === 'HeistPriceCheck'" :item-prop="item!"
          :divine-to-chaos-or-exalted="divineToChaosOrEx" :league-select="leagueSelect" :is-overflow="isOverflow"
          @open-web-view="openWebView" :parse-error="parseError" />
      </KeepAlive>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onMounted, onUnmounted } from 'vue'
import { range } from 'lodash-es'
import IPC from '@/ipc'
import { itemAnalyze } from '@/web/lib/itemAnalyze'
import { getDivineToChaosOrExalted } from '@/web/lib/tradeSide'
import { leagues, currencyImageUrl } from '@/web/lib/APIdata'
import NormalPriceCheck from './NormalPriceCheck.vue'
import HeistPriceCheck from './HeistPriceCheck.vue'
import { secondCurrency, tradeUrl } from '@/web/lib'
import MySelect from '../utility/MySelect.vue'
const isWebViewOpen = ref(false)
const webView = ref<HTMLIFrameElement>()
const priceCheckPos = ref({
  right: '0px'
})
function openWebView(extendUrl: string) {
  priceCheckPos.value.right = '0px'
  isWebViewOpen.value = true
  nextTick(() => {
    webView.value!.src = encodeURI(`${import.meta.env.VITE_URL_BASE}/${tradeUrl}/${extendUrl}`)
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
  window.ipc.send(IPC.FORCE_POE)
  isWebViewOpen.value = false
}

const leagueSelectRef = ref<string>('')
const leagueSelect = computed({
  get: () => leagueSelectRef.value,
  set: (val: string) => {
    const config = window.ipc.sendSync(IPC.GET_CONFIG)
    leagueSelectRef.value = val
    window.ipc.send(IPC.SET_CONFIG, JSON.stringify({
      ...config, league: val
    }))
    refreshDivineToChaosOrExalted()
  }
})
function loadLeagues() {
  const configLeagues = window.ipc.sendSync(IPC.GET_CONFIG).league
  leagueSelect.value = leagues.includes(configLeagues) ? configLeagues : (leagues.find(ele => !ele.match('^(標準|殘暴|專家)')) ?? leagues[0])
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
const parseError = ref<string | null>(null)

const divineToChaosOrEx = ref(0)
const divineImage = import.meta.env.VITE_URL_BASE + currencyImageUrl.find(ele => ele.id === 'divine')?.image
const chaosOrExImage = import.meta.env.VITE_URL_BASE + currencyImageUrl.find(ele => ele.id === (secondCurrency))?.image
async function refreshDivineToChaosOrExalted() {
  divineToChaosOrEx.value = await getDivineToChaosOrExalted(leagueSelect.value)
}
const divToCInterval = setInterval(() => {
  refreshDivineToChaosOrExalted()
}, 10 * 60 * 1000)
const divineToChaosDec = computed(() => {
  return range(0.1, 1, 0.1).map(ele => ({
    e: ele.toFixed(1), c: (ele * divineToChaosOrEx.value).toFixed(0)
  }))
})

const priceCheckDiv = ref<HTMLDivElement>()
function isOverflow() {
  if (!priceCheckDiv.value) return false
  return priceCheckDiv.value.scrollHeight > priceCheckDiv.value.offsetHeight
}

window.ipc.on(IPC.PRICE_CHECK_SHOW, (_e, clip: string, pos: string) => {
  closeWebView()
  windowShowHide.value = true
  currentPriceCheck.value = 'NormalPriceCheck'
  priceCheckPos.value.right = pos
  try {
    parseError.value = null
    item.value = itemAnalyze(clip)
  }
  catch (e) {
    item.value = {} as ParsedItem
    parseError.value = (e as Error).message
    console.log(e)
  }
})
window.ipc.on(IPC.POE_ACTIVE, () => {
  windowShowHide.value = false
})
onMounted(() => {
  loadLeagues()
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