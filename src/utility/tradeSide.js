import axios from 'axios'
import _ from 'lodash'
import { reactive } from 'vue'
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
let searchResult
let isUnique=false
export function getDefaultSearchJSON(){
	return _.cloneDeep(searchJSONSample)
}
export function getSearchJSON(item){
	let searchJSON=_.cloneDeep(searchJSONSample)
    if(!item.type.searchByType)	searchJSON.query.type=item.baseType //如果沒有要依照類別搜尋
	if(item.rarity.id==='unique') searchJSON.query.name=item.name || undefined
    if(!_.isUndefined(item.isCorrupt))  searchJSON.query.filters.misc_filters.filters.corrupted = { option: item.isCorrupt }
    if(!_.isUndefined(item.isIdentify))  searchJSON.query.filters.misc_filters.filters.identified = { option: item.isIdentify }
    if(!_.isUndefined(item.altQType)) searchJSON.query.filters.misc_filters.filters.gem_alternate_quality={option: item.altQType}
    if(item.itemLevel?.search)  searchJSON.query.filters.misc_filters.filters.ilvl = {min: item.itemLevel.min, max: item.itemLevel.max}
    if(item.gemLevel?.search)  searchJSON.query.filters.misc_filters.filters.gem_level = { min: item.gemLevel.min, max: item.gemLevel.max }
    if(item.mapTier?.search)  searchJSON.query.filters.map_filters.filters.map_tier={min: item.mapTier.min, man: item.mapTier.man}
    if(!_.isUndefined(item.type.option))  searchJSON.query.filters.type_filters.filters.category=item.type
    if(item.quality.search)  searchJSON.query.filters.misc_filters.filters.quality={min: item.quality.min, max: item.quality.max}
    if(item.elderMap || item.conquerorMap) searchJSON.query.stats[0].filters.push(item.elderMap || item.conquerorMap)
	if(item.search6L)	searchJSON.query.filters.socket_filters={disabled: false, filters: {links:{min: 6}}}
	if(item.rarity.id) searchJSON.query.filters.type_filters.filters.rarity= { option: item.rarity.id }
	if(item.searchTwoWeekOffline){
		searchJSON.query.filters.trade_filters.filters.indexed={ option: "2weeks" }
        searchJSON.query.status.option="any"
	}
	
    if(!_.isUndefined(item.enchant))  searchJSON.query.stats[0].filters.push(..._.cloneDeep(item.enchant))
    if(!_.isUndefined(item.implicit)) searchJSON.query.stats[0].filters.push(..._.cloneDeep(item.implicit))
    if(!_.isUndefined(item.explicit)) searchJSON.query.stats[0].filters.push(..._.cloneDeep(item.explicit))
    if(!_.isUndefined(item.fractured))searchJSON.query.stats[0].filters.push(..._.cloneDeep(item.fractured))
    if(!_.isUndefined(item.crafted))  searchJSON.query.stats[0].filters.push(..._.cloneDeep(item.crafted))
    if(!_.isUndefined(item.pseudo))   searchJSON.query.stats[0].filters.push(item.pseudo)
    if(!_.isUndefined(item.temple))   searchJSON.query.stats[0].filters.push(..._.cloneDeep(item.temple))
    if(!_.isUndefined(item.influences))   searchJSON.query.stats[0].filters.push(..._.cloneDeep(item.influences))

    if(!_.isUndefined(item.blightedMap))  searchJSON.query.filters.map_filters.filters.map_blighted = { option: true}
    if(!_.isUndefined(item.UberBlightedMap))  searchJSON.query.filters.map_filters.filters.map_uberblighted = { option: true}
    return searchJSON
}
let rateTimeLimitArr={
	fetch:[
		{
			limit: 14,
			time: 6
		},
		{
			limit: 10,
			time: 2
		},
	],
	search:[
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
	exchange:[
		{
			limit: 40,
			time: 200
		},
		{
			limit: 10,
			time: 60
		},
		{
			limit: 4,
			time: 10
		},
	]
}
export let rateTimeLimit
export function getIsCounting(){
	rateTimeLimit=reactive({flag: false, second: 0})
	return { rateTimeLimit }
}
let interval
function startCountdown(time){
	if(time<rateTimeLimit.second) return null
	if(interval) {
		clearInterval(interval)
		interval=null
	}
	rateTimeLimit.flag=true
	rateTimeLimit.second=time
	interval=setInterval(()=>{
		if((--rateTimeLimit.second)<0) {
			rateTimeLimit.flag=false
			clearInterval(interval)
			interval=null
		}
	},1000)
}

function parseRateTime(header){
	let type=header['x-rate-limit-policy'].split('-')[1]
	if(Object.keys(rateTimeLimitArr).includes(type)){
		let timesArr=header['x-rate-limit-ip-state'].split(',').map(ele=>parseInt(ele.substring(0,ele.indexOf(':')))).reverse()
		for(let i=0;i<timesArr.length;++i){
			if(timesArr[i]>=rateTimeLimitArr[type][i].limit){
				startCountdown(rateTimeLimitArr[type][i].time)
				break
			}
		}
	}
}


function cleanupJSON(searchJson){
	searchJson.query.stats[0].filters.forEach(ele=>{
		if(ele.value){
			if(!_.isNumber(ele.value.min)) delete ele.value.min
			if(!_.isNumber(ele.value.max)) delete ele.value.max
		}
	})
	if(searchJson.query.type?.endsWith('虛空石')){
		delete searchJson.query.type
	}
	return searchJson
} 
export async function searchItem(searchJson, league, isFromHiestPC){
	searchResult=null
	searchJson=cleanupJSON(searchJson)
	console.log(searchJson)
	let searchID=''
	let errData
	await axios({
		method: 'post',
		url: encodeURI(`https://web.poe.garena.tw/api/trade/search/${league}`),
		headers:{
			'accept': 'application/json',
			'Content-Type': 'application/json'
			//'Cookie': 'POESESSID=ed40963cf49f66e758b54da23316f274'
		},
		data: JSON.stringify(searchJson),
		timeout: 3000,
		// rejectUnauthorized: false,
		// requestCert: false,
		// agent: false,
	}).then((response)=>{
		parseRateTime(response.headers)
		return response.data
	}).then((data)=>{
		searchResult=data
		searchID=data.id
		searchResult.nowSearched = 0
		searchResult.itemCount=searchResult.result.length
	})
	.catch((err)=>{
		errData=err.response || err
		console.log(err.response)
		if(err.response?.status===429){
			startCountdown(parseInt(err.response.headers['retry-after']))
		}
	})
	if(errData) return {data: errData, err: true}
	return {result: await fetchItem(),total: searchResult.itemCount, err: false, searchID: searchID }
}
export async function fetchItem(){
	if(searchResult.nowSearched >= (searchResult.itemCount > 100 ? 100 : searchResult.itemCount)) return null
	let start=searchResult.nowSearched
	let end=searchResult.nowSearched + 20 > searchResult.itemCount ? searchResult.itemCount : searchResult.nowSearched + 20
	let fetchResult=[]
	let itemJsonUrl=[]
	for(let i=start; i< end ; i+=10){
		itemJsonUrl.push('https://web.poe.garena.tw/api/trade/fetch/'+searchResult.result.slice(i,i+10).join(',')+`?query=${searchResult.id}`)
	}
	await axios.all(itemJsonUrl.map(url => axios({
		method: 'get',
		url: encodeURI(url),
		timeout: 3000,
		headers:{
			'accept': 'application/json'
			//'Cookie': 'POESESSID=ed40963cf49f66e758b54da23316f274'
		}})))
		.then(axios.spread((...args)=>{
			args.forEach(ele=>{
				fetchResult.push(...ele.data.result)
			})
			parseRateTime(args.pop().headers)
		}))
		.catch(err=>{
			console.log(err.response)
			if(err.response?.status===429){
				startCountdown(parseInt(err.response.headers['retry-after']))
			}
		})
	searchResult.nowSearched+=fetchResult.length
	fetchResult=fetchResult.map(ele=>`${ele.listing.price.amount}|${ele.listing.price.currency}`)
	return _.countBy(fetchResult)
}
async function fetchExaltedToChaos(searchUrl,id){
	let getItemJosnUrl='https://web.poe.garena.tw/api/trade/fetch/'+searchUrl.join(',')+`?query=${id}&exchange`
	let ret
	await axios({
		method: 'get',
		url: encodeURI(getItemJosnUrl),
		headers:{
			'accept': 'application/json'
			//'Cookie': 'POESESSID=ed40963cf49f66e758b54da23316f274'
		}})
	.then((res)=>{
		parseRateTime(res.headers)
		ret=res.data.result
	})
	.catch(err=>{
		console.log(err)
		if(err.response.status===429){
			startCountdown(parseInt(err.response.headers['retry-after']))
		}
	})
	return ret
}
export async function getExaltedToChaos(league){
	let exchangeJSON={"exchange":{"status":{"option":"online"},"have":["exalted"],"want":["chaos"]},"sort": {"have": "asc"},"engine": "new"}
	let chaos=0
	await axios({
		method: 'post',
		url: encodeURI(`https://web.poe.garena.tw/api/trade/exchange/${league}`),
		timeout: 3000,
		headers:{
			'accept': 'application/json',
			'Content-Type': 'application/json'
			//'Cookie': 'POESESSID=ed40963cf49f66e758b54da23316f274'
		},
		data: exchangeJSON,
		// rejectUnauthorized: false,
		// requestCert: false,
		// agent: false,
	}).then((response)=>{
		parseRateTime(response.headers)
		return response.data
	}).then((data)=>{
		let temp=Object.keys(data.result).slice(0,5)
		chaos=temp.reduce((pre,curr) => pre+(data.result[curr].listing.offers[0].item.amount/data.result[curr].listing.offers[0].exchange.amount) ,chaos)
		chaos/=temp.length
	})
	.catch((err)=>{
		console.log(err)
		if(err.response?.status===429){
			startCountdown(parseInt(err.response.headers['retry-after']))
		}
	})
	return Math.round(chaos*0.2)*5
}