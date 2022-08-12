import axios from 'axios'
import { GGCapi, APIStatic } from './setupAPI'
import { ref } from 'vue'
import { cloneDeep, isUndefined, isNumber, countBy } from 'lodash-es'

let searchJSONSample = {
	"query": {
		"status": {
			"option": "online"
		},
		"stats": [{
			"type": "and",
			"filters": []
		}],
		"filters": {
			"trade_filters": {
				"filters": {
					"price": {
						"min": 2
					},
					"collapse": {
						"option": "true"
					}
				}
			},
			"misc_filters": {
				"filters": {}
			},
			"type_filters": {
				"filters": {}
			},
			"map_filters": {
				"filters": {}
			}
		}
	},
	"sort": {
		"price": "asc"
	}
}
let exchangeJSONSample = {
	"exchange": {
		"status": {
			"option": "online"
		},
		"have": [],
		"want": []
	},
	"sort": {
		"have": "asc"
	},
	"engine": "new"
}
let searchResult

export const selectOptions = {
	generalOption: [
		{
			label: '任何',
			value: undefined
		},
		{
			label: '是',
			value: true
		},
		{
			label: '否',
			value: false
		}
	],
	gemAltQOptions: [
		{
			label: '普通',
			value: 0
		},
		{
			label: '異常的',
			value: 1
		},
		{
			label: '相異的',
			value: 2
		},
		{
			label: '幻影的',
			value: 3
		}
	],
	influencesOptions: [
		{
			id: "pseudo.pseudo_has_shaper_influence",
			label: "塑者"
		},
		{
			id: "pseudo.pseudo_has_elder_influence",
			label: "尊師"
		},
		{
			id: "pseudo.pseudo_has_crusader_influence",
			label: "聖戰"
		},
		{
			id: "pseudo.pseudo_has_redeemer_influence",
			label: "救贖"
		},
		{
			id: "pseudo.pseudo_has_hunter_influence",
			label: "狩獵"
		},
		{
			id: "pseudo.pseudo_has_warlord_influence",
			label: "督軍"
		}
	],
	elderMapOptions: [
		{
			value: 1,
			label: "奴役(右上)"
		},
		{
			value: 2,
			label: "根除(右下)"
		},
		{
			value: 3,
			label: "干擾(左下)"
		},
		{
			value: 4,
			label: "淨化(左上)"
		}
	],
	conquerorMapOptions: [
		{
			value: 1,
			label: "巴倫"
		},
		{
			value: 2,
			label: "維羅提尼亞"
		},
		{
			value: 3,
			label: "奧赫茲明"
		},
		{
			value: 4,
			label: "圖拉克斯"
		}
	],
	rarityOptions: [
		{
			id: undefined,
			label: "任何"
		},
		{
			id: 'normal',
			label: "普通"
		},
		{
			id: 'magic',
			label: "魔法"
		},
		{
			id: 'rare',
			label: "稀有"
		},
		{
			id: 'unique',
			label: "傳奇"
		},
		{
			id: 'nonunique',
			label: "非傳奇"
		}
	],
}
export function getDefaultSearchJSON() {
	return cloneDeep(searchJSONSample)
}
export function getSearchJSON(item) {
	let searchJSON = cloneDeep(searchJSONSample)
	if (!item.type.searchByType) searchJSON.query.type = item.baseType //如果沒有要依照類別搜尋
	if (item.raritySearch.id === 'unique') searchJSON.query.name = item.name || undefined
	if (!isUndefined(item.isCorrupt)) searchJSON.query.filters.misc_filters.filters.corrupted = { option: item.isCorrupt }
	if (!isUndefined(item.isIdentify)) searchJSON.query.filters.misc_filters.filters.identified = { option: item.isIdentify }
	if (!isUndefined(item.altQType)) searchJSON.query.filters.misc_filters.filters.gem_alternate_quality = { option: item.altQType }
	if (item.itemLevel?.search) searchJSON.query.filters.misc_filters.filters.ilvl = { min: item.itemLevel.min, max: item.itemLevel.max }
	if (item.gemLevel?.search) searchJSON.query.filters.misc_filters.filters.gem_level = { min: item.gemLevel.min, max: item.gemLevel.max }
	if (item.mapTier?.search) searchJSON.query.filters.map_filters.filters.map_tier = { min: item.mapTier.min, man: item.mapTier.man }
	if (!isUndefined(item.type.option)) searchJSON.query.filters.type_filters.filters.category = item.type
	if (item.quality.search) searchJSON.query.filters.misc_filters.filters.quality = { min: item.quality.min, max: item.quality.max }
	if (item.elderMap || item.conquerorMap) searchJSON.query.stats[0].filters.push(item.elderMap || item.conquerorMap)
	if (item.search6L) searchJSON.query.filters.socket_filters = { disabled: false, filters: { links: { min: 6 } } }
	if (item.raritySearch.id) searchJSON.query.filters.type_filters.filters.rarity = { option: item.raritySearch.id }
	if (item.searchTwoWeekOffline) {
		searchJSON.query.filters.trade_filters.filters.indexed = { option: "2weeks" }
		searchJSON.query.status.option = "any"
	}

	if (!isUndefined(item.enchant)) searchJSON.query.stats[0].filters.push(...cloneDeep(item.enchant))
	if (!isUndefined(item.implicit)) searchJSON.query.stats[0].filters.push(...cloneDeep(item.implicit))
	if (!isUndefined(item.explicit)) searchJSON.query.stats[0].filters.push(...cloneDeep(item.explicit))
	if (!isUndefined(item.fractured)) searchJSON.query.stats[0].filters.push(...cloneDeep(item.fractured))
	if (!isUndefined(item.crafted)) searchJSON.query.stats[0].filters.push(...cloneDeep(item.crafted))
	if (!isUndefined(item.pseudo)) searchJSON.query.stats[0].filters.push(item.pseudo)
	if (!isUndefined(item.temple)) searchJSON.query.stats[0].filters.push(...cloneDeep(item.temple))
	if (!isUndefined(item.influences)) searchJSON.query.stats[0].filters.push(...cloneDeep(item.influences))

	if (!isUndefined(item.blightedMap)) searchJSON.query.filters.map_filters.filters.map_blighted = { option: true }
	if (!isUndefined(item.UberBlightedMap)) searchJSON.query.filters.map_filters.filters.map_uberblighted = { option: true }
	return searchJSON
}
const rateTimeLimitArr = {
	fetch: [
		{
			limit: 14,
			time: 6
		},
		{
			limit: 10,
			time: 2
		},
	],
	search: [
		{
			limit: 25,
			time: 120
		},
		{
			limit: 12,
			time: 20
		},
		{
			limit: 3,
			time: 3
		},
	],
	exchange: [
		{
			limit: 40,
			time: 200
		},
		{
			limit: 10,
			time: 60
		},
		{
			limit: 3,
			time: 8
		},
	]
}
export let rateTimeLimit = ref({ flag: false, second: 0 })
export function getIsCounting() {
	rateTimeLimit.value = { flag: false, second: 0 }
	return { rateTimeLimit }
}
let interval
function startCountdown(time) {
	if (time < rateTimeLimit.value.second) return null
	if (interval) {
		clearInterval(interval)
		interval = null
	}
	rateTimeLimit.value.flag = true
	rateTimeLimit.value.second = time
	interval = setInterval(() => {
		if ((--rateTimeLimit.value.second) < 0) {
			rateTimeLimit.value.flag = false
			clearInterval(interval)
			interval = null
		}
	}, 1000)
}

function parseRateTime(header) {
	let type = header['x-rate-limit-policy'].split('-')[1]
	if (Object.keys(rateTimeLimitArr).includes(type)) {
		let timesArr = header['x-rate-limit-ip-state'].split(',').map(ele => parseInt(ele.substring(0, ele.indexOf(':')))).reverse()
		for (let i = 0; i < timesArr.length; ++i) {
			if (timesArr[i] >= rateTimeLimitArr[type][i].limit) {
				startCountdown(rateTimeLimitArr[type][i].time)
				break
			}
		}
	}
}

function cleanupJSON(searchJson) {
	searchJson.query.stats[0].filters.forEach(ele => {
		if (ele.value) {
			if (!isNumber(ele.value.min)) delete ele.value.min
			if (!isNumber(ele.value.max)) delete ele.value.max
		}
	})
	if (searchJson.query.type?.endsWith('虛空石')) {
		delete searchJson.query.type
	}
	return searchJson
}
export async function searchItem(searchJson, league) {
	searchResult = null
	searchJson = cleanupJSON(searchJson)
	if (process.env.NODE_ENV === 'development') console.log(searchJson)
	let searchID = { ID: '', type: 'search' }
	let errData
	await GGCapi.post(encodeURI(`trade/search/${league}`), JSON.stringify(searchJson))
		.then((response) => {
			parseRateTime(response.headers)
			return response.data
		})
		.then((data) => {
			searchResult = data
			searchID.ID = data.id
			searchResult.nowSearched = 0
			searchResult.itemCount = searchResult.result.length
		})
		.catch((err) => {
			if (err.response?.status === 400) {
				errData = err.response.data?.error?.message
			}
			errData = errData || err.message || err
			console.log(err)
			if (err.response?.status === 429) {
				startCountdown(parseInt(err.response.headers['retry-after']))
			}
		})
	if (errData) return { data: errData, err: true }
	return { result: await fetchItem(), total: searchResult.itemCount, err: false, searchID: searchID }
}
export async function fetchItem() {
	if (searchResult.nowSearched >= (searchResult.itemCount > 100 ? 100 : searchResult.itemCount)) return null
	let start = searchResult.nowSearched
	let end = searchResult.nowSearched + 20 > searchResult.itemCount ? searchResult.itemCount : searchResult.nowSearched + 20
	let fetchResult = []
	let itemJsonUrl = []
	for (let i = start; i < end; i += 10) {
		itemJsonUrl.push('trade/fetch/' + searchResult.result.slice(i, i + 10).join(',') + `?query=${searchResult.id}`)
	}
	await axios.all(itemJsonUrl.map((url) => GGCapi.get(encodeURI(url))))
		.then(axios.spread((...args) => {
			args.forEach(ele => {
				fetchResult.push(...ele.data.result)
			})
			parseRateTime(args.pop().headers)
		}))
		.catch(err => {
			console.log(err)
			if (err.response?.status === 429) {
				startCountdown(parseInt(err.response.headers['retry-after']))
			}
		})
	searchResult.nowSearched += fetchResult.length
	fetchResult = fetchResult.map(ele => `${ele.listing.price.amount}|${ele.listing.price.currency}`)
	return countBy(fetchResult)
}
export async function getExaltedToChaos(league) {
	let exchangeJSON = cloneDeep(exchangeJSONSample)
	exchangeJSON.exchange.have = ["exalted"]
	exchangeJSON.exchange.want = ["chaos"]
	let chaos = 0
	await GGCapi.post(encodeURI(`trade/exchange/${league}`), JSON.stringify(exchangeJSON))
		.then((response) => {
			parseRateTime(response.headers)
			return response.data
		}).then((data) => {
			let temp = Object.keys(data.result).slice(0, 5)
			chaos = temp.reduce((pre, curr) => pre + (data.result[curr].listing.offers[0].item.amount / data.result[curr].listing.offers[0].exchange.amount), chaos)
			chaos /= temp.length
		})
		.catch((err) => {
			console.log(err)
			if (err.response?.status === 429) {
				startCountdown(parseInt(err.response.headers['retry-after']))
			}
		})
	return Math.round(chaos * 0.2) * 5
}
export async function searchExchange(item, league) {
	searchResult = {}
	let errData = undefined
	let searchID = { ID: '', type: 'exchange' }
	let exchangeJSON = cloneDeep(exchangeJSONSample)
	exchangeJSON.exchange.have = [item.searchExchange.have]
	exchangeJSON.exchange.want = [APIStatic.find(e => e.text === item.baseType).id]
	await GGCapi.post(encodeURI(`trade/exchange/${league}`), JSON.stringify(exchangeJSON))
		.then((response) => {
			parseRateTime(response.headers)
			return response.data
		}).then((data) => {
			searchID.ID = data.id
			searchResult.itemCount = data.total
			searchResult.result = []
			for (let key in data.result) {
				searchResult.result.push(data.result[key].listing.offers[0].exchange.amount + '：' + data.result[key].listing.offers[0].item.amount + '|' + item.searchExchange.have)
			}
		})
		.catch((err) => {
			console.log(err)
			if (err.response?.status === 429) {
				startCountdown(parseInt(err.response.headers['retry-after']))
			}
		})
	if (errData) return { data: errData, err: true }
	return { result: countBy(searchResult.result), total: searchResult.itemCount, err: false, searchID: searchID, currency2: exchangeJSON.exchange.want[0] }
}