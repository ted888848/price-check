<template>
	<div v-if="windowShowHide" class="absolute top-0 left-0 w-screen h-screen priceCheckRoot bg-gray-400 bg-opacity-25"
		@click.self="closePriceCheck">
		<div class="bg-gray-900 priceCheck absolute h-full flex flex-col" :style="priceCheckPos" ref="priceCheckDiv">
			<div class="bg-gray-800 flex justify-between max-h-9 items-center">
				<div class="flex justify-start mr-auto ml-1 flex-1">
					<vSelect class="text-sm style-chooser style-chooser-inf text-center" :options="priceCheckOptions"
						v-model="currentPriceCheck" label="label" :searchable="false" :clearable="false"
						:reduce="option => option.value" />
				</div>
				<div class="flex justify-center flex-1">
					<div class="relative exaltedImg ">
						<img :src="exaltedChaosImage[1].image" class=" w-8 h-8 ">
						<ul v-if="exaltedToChaos"
							class="exaltedImgTooltip invisible bg-gray-700 z-10 text-center absolute text-white">
							<li v-for="line in exaltedToChaosDec" :key="line.e" class="flex px-2 min-w-max text-xl">
								{{ line.e }} : {{ line.c }}
							</li>
						</ul>
					</div>
					<span class=" text-white text-2xl">:{{ exaltedToChaos }}</span>
					<img :src="exaltedChaosImage[0].image" class=" w-8 h-8 hover:cursor-pointer" @dblclick="reflashChaos">
				</div>
				<div class="flex justify-end mr-1 ml-auto flex-1">
					<button class=" text-white hover:text-red-500" @click="closePriceCheck">
						<FontAwesomeIcon icon="rectangle-xmark" size="2x" />
					</button>
				</div>
			</div>
			<div class="p-1">
				<vSelect class=" text-base style-chooser text-center" v-model="leagueSelect" :options="leagues"
					:clearable="false" :searchable="false" />
			</div>
			<component :is="currentPriceCheck" :itemProp="item" @brower-view="openBrowerView" :leagueSelect="leagueSelect"
				:exaltedToChaos="exaltedToChaos" :isOverflow="isOverflow">
			</component>
		</div>
	</div>
</template>
<script setup>
import { ipcRenderer } from 'electron'
import IPC from '@/ipc/ipcChannel'
import { itemAnalyze } from '@/utility/itemAnalyze'
import { getExaltedToChaos } from '@/utility/tradeSide'
import NormalPriceCheck from './NormalPriceCheck.vue'
import HiestPriceCheck from './HiestPriceCheck.vue'
import { ref, computed, markRaw } from 'vue'
import { leagues, currencyImageUrl } from '@/utility/setupAPI'
import { range } from 'lodash-es'

const priceCheckPos = ref({
	right: '0px',
})
function openBrowerView() {
	priceCheckPos.value.right = '0px'
}

const windowShowHide = ref(false)
function closePriceCheck() {
	windowShowHide.value = false
	ipcRenderer.send(IPC.FORCE_POE)
}

const leagueSelect = ref(leagues[0])
function loadLeagues() {
	leagueSelect.value = leagues[0]
	exaltedChaosImage = currencyImageUrl.filter(ele => ['exalted', 'chaos'].includes(ele.id)).map(ele => ({ ...ele, image: 'https://web.poe.garena.tw' + ele.image }))
}
defineExpose({ loadLeagues })
const currentPriceCheck = ref(null)
const priceCheckOptions = [{
	label: "普通查價",
	value: markRaw(NormalPriceCheck)
}
	, {
	label: "劫盜查價",
	value: markRaw(HiestPriceCheck)
}]
const item = ref(null)

const exaltedToChaos = ref(0)
let exaltedChaosImage = currencyImageUrl.filter(ele => ['exalted', 'chaos'].includes(ele.id)).map(ele => ({ ...ele, image: 'https://web.poe.garena.tw' + ele.image }))
async function reflashChaos() {
	exaltedToChaos.value = await getExaltedToChaos(leagueSelect.value)
}
const exaltedToChaosDec = computed(() => {
	return range(0.1, 1, 0.1).map(ele => ({ e: ele.toFixed(1), c: (ele * exaltedToChaos.value).toFixed(0) }))
})

const priceCheckDiv = ref()
function isOverflow() {
	return priceCheckDiv?.value.scrollHeight > priceCheckDiv?.value.offsetHeight
}

ipcRenderer.on(IPC.PRICE_CHECK_SHOW, (e, clip, pos) => {
	windowShowHide.value = true
	currentPriceCheck.value = markRaw(NormalPriceCheck)
	priceCheckPos.value.right = pos
	item.value = itemAnalyze(clip)
})
ipcRenderer.on(IPC.POE_ACTIVE, () => {
	windowShowHide.value = false
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
	margin: 0;
}

tbody.modsTbody>tr>td {
	padding: 5px 1px;
}

.exaltedImg:hover .exaltedImgTooltip {
	visibility: visible;
}
</style>