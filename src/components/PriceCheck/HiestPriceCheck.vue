<template>
	<div class="flex p-2 items-center justify-center">
		<span class="mx-1 text-white hover:cursor-default">物品:</span>
		<vSelect class="text-sm style-chooser flex-grow" :options="gemReplicaOptions" v-model="gemReplicaSelect"
			label="text" />
	</div>
	<div v-show="!(gemReplicaSelect?.text.startsWith('贗品') ?? true)" class="flex p-2 items-center justify-center">
		<span class="mx-1 text-white hover:cursor-default">相異品質:</span>
		<vSelect class="text-sm style-chooser flex-grow" :options="gemAltQOptions" v-model="gemAltQSelect" label="label"
			:clearable="false" :searchable="false" />
	</div>
	<div class="flex items-center justify-center py-1 hover:cursor-pointer" @click="twoWeekOffline = !twoWeekOffline">
		<span class="mx-1 text-white">2周離線</span>
		<FontAwesomeIcon v-if="twoWeekOffline" icon="circle-check" class="text-green-600 text-xl" />
		<FontAwesomeIcon v-else icon="circle-xmark" class="text-red-600 text-xl" />
	</div>
	<div class="my-2 justify-center flex text-xl" v-if="!isSearching">
		<button @click="searchBtn"
			class="mx-2 bg-gray-500 text-white rounded px-1 hover:bg-gray-400 disabled:cursor-default disabled:opacity-60 disabled:bg-gray-500"
			:disabled="rateTimeLimit.flag">Search</button>
		<div v-if="isSearched">
			<button
				class="mx-2 bg-green-400 text-black rounded px-1 hover:bg-green-300 disabled:cursor-default disabled:opacity-60 disabled:bg-green-400"
				@click="fetchMore"
				:disabled="rateTimeLimit.flag || searchedNumber >= (searchTotal >= 100 ? 100 : searchTotal)">在20筆</button>
			<button
				class="mx-2 bg-blue-800 text-white rounded px-4 hover:bg-blue-700 disabled:cursor-default disabled:opacity-60 disabled:bg-blue-800"
				@click="openBrower" :disabled="rateTimeLimit.flag">B</button>
		</div>
		<button
			class="mx-2 bg-blue-800 text-white rounded px-4 hover:bg-blue-700 disabled:cursor-default disabled:opacity-60 disabled:bg-blue-800"
			@click="openBrowerView" :disabled="rateTimeLimit.flag">BV</button>
	</div>
	<table v-if="searchResultSorted.length"
		class="bg-blue-500 text-center text-white text-sm my-1 mx-5 w-1/2 self-center">
		<thead class="">
			<tr class=" border-b-2 border-red-500 text-base">
				<td class=" hover:cursor-default">價格</td>
				<td class=" hover:cursor-default">數量</td>
			</tr>
		</thead>
		<tbody class="">
			<tr v-for="ele in searchResultSorted" :key="ele" class=" border-b-2 border-gray-600"
				:class="{ 'text-red-500 text-xl bg-indigo-600 font-bold': ele.amount === maxAmout.amount }">
				<td class="flex justify-center items-center">{{ ele.price }}<img :src="ele.image" class=" w-7 h-7"></td>
				<td>{{ ele.amount }}</td>
			</tr>
		</tbody>
	</table>
	<span v-if="isSearchFail" class="text-red-600 text-4xl text-center hover:cursor-default">{{ errMsg || 'Fail' }}</span>
	<span v-if="isSearched" class="text-white text-2xl text-center hover:cursor-default">共{{ searchTotal }}筆,顯示{{
			searchedNumber
	}}</span>
	<div v-if="isSearching" class=" text-8xl text-white my-5 text-center flex justify-center">
		<FontAwesomeIcon icon="spinner" spin />
	</div>
	<span v-if="rateTimeLimit.flag" class="text-white bg-red-600 text-xl text-center my-2 hover:cursor-default">API次數限制
		{{ rateTimeLimit.second }} 秒後再回來 </span>
</template>
<script setup>
import { getDefaultSearchJSON, searchItem, fetchItem, getIsCounting, selectOptions } from '@/utility/tradeSide'
import { maxBy, debounce } from 'lodash-es'
import { ipcRenderer, shell } from 'electron'
import IPC from '@/ipc/ipcChannel'
import { computed, ref, watch } from 'vue'
import { hiestReward, currencyImageUrl } from '@/utility/setupAPI'
const props = defineProps(["itemProp", "leagueSelect", "exaltedToChaos", "isOverflow"])
const { rateTimeLimit } = getIsCounting()

let gemReplicaOptions = hiestReward
const gemReplicaSelect = ref(null)
const { gemAltQOptions } = selectOptions
const gemAltQSelect = ref(gemAltQOptions[0])

let searchJSON = getDefaultSearchJSON()
const searchResult = ref([])
const isSearchFail = ref(false)
const errMsg = ref('')
const isSearched = ref(false)
const isSearching = ref(false)
const searchTotal = ref(0)
const twoWeekOffline = ref(false)
let searchID = { ID: '', type: 'search' }
watch(twoWeekOffline, (newValue) => {
	if (newValue) {
		searchJSON.query.filters.trade_filters.filters.indexed = { option: "2weeks" }
		searchJSON.query.status.option = "any"
	}
	else {
		delete searchJSON.query.filters.trade_filters.filters.indexed
		searchJSON.query.status.option = "online"
	}
})

function resetSearchData() {
	searchResult.value = []
	isSearchFail.value = false
	errMsg.value = ''
	isSearched.value = false
	searchTotal.value = 0
	isSearching.value = false
	searchID = { ID: '', type: 'search' }
}

async function fetchMore() {
	isSearching.value = true
	let temp = await fetchItem()
	if (!temp) {
		isSearching.value = false
		return
	}
	for (let key in temp) {
		let tempArr = key.split('|')
		let _price = tempArr[0]
		let _currency = tempArr[1]
		let findRes = searchResult.value.find(ele => ele.price === _price)
		if (findRes) {
			findRes.amount += temp[key]
		}
		else {
			searchResult.value.push({
				price: _price, currency: _currency, amount: temp[key],
				image: `https://web.poe.garena.tw${currencyImageUrl.find(ele => ele.id === _currency).image}`
			})
		}
	}
	isSearching.value = false
}
const searchBtn = debounce(async function () {
	resetSearchData()
	isSearching.value = true
	searchJSON.query.name = gemReplicaSelect.value.name
	searchJSON.query.type = gemReplicaSelect.value.type
	if (!gemReplicaSelect.value.name?.startsWith('贗品')) {
		searchJSON.query.filters.misc_filters.filters.gem_alternate_quality = { option: gemAltQSelect.value.value }
	}
	let temp = await searchItem(searchJSON, props.leagueSelect)
	if (temp.err) {
		isSearching.value = false
		isSearchFail.value = true
		errMsg.value = temp.data.message
		return
	}
	else if (temp.total) {
		searchTotal.value = temp.total
		for (let key in temp.result) {
			let tempArr = key.split('|')
			let _price = tempArr[0]
			let _currency = tempArr[1]
			searchResult.value.push({ price: _price, currency: _currency, amount: temp.result[key], image: `https://web.poe.garena.tw${currencyImageUrl.find(ele => ele.id === _currency).image}` })
		}
	}
	searchID = temp.searchID
	isSearched.value = true
	isSearching.value = false
}, 300)

const searchResultSorted = computed(() => {
	if (props.exaltedToChaos)
		return searchResult.value.slice().sort((a, b) => {
			let ca = a.currency === 'exalted' ? a.price * props.exaltedToChaos : a.price
			let cb = b.currency === 'exalted' ? b.price * props.exaltedToChaos : b.price
			return ca - cb
		})
	else
		return searchResult.value
})
const searchedNumber = computed(() => {
	return searchResultSorted.value.reduce((pre, curr) => pre + curr.amount, 0)
})

const maxAmout = computed(() => {
	return maxBy(searchResult.value, ele => ele.amount)
})

const emit = defineEmits(["brower-view"])
function openBrowerView() {
	ipcRenderer.send(IPC.BROWSER_VIEW, `search/${props.leagueSelect}/${searchID.ID}`)
	emit("brower-view")
}
function openBrower() {
	shell.openExternal(encodeURI(`https://web.poe.garena.tw/trade/search/${props.leagueSelect}/${searchID.ID}`))
}
</script>
<style>
</style>