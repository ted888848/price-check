import axios from 'axios'
import _ from 'lodash'
import { toRefs, reactive } from 'vue'
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
export function getSearchJSON(item){
	let searchJSON=_.cloneDeep(searchJSONSample)
	searchResult=null
    if(!_.isUndefined(item.name))   searchJSON.query.name=item.name
    searchJSON.query.type=item.baseType
	isUnique= (item.rarity==='傳奇')
    if(!_.isUndefined(item.isCorrupt))  searchJSON.query.filters.misc_filters.filters.corrupted = { option: item.isCorrupt }
    if(!_.isUndefined(item.isIdentify))  {
		if(!(isUnique && !item.isIdentify))
			searchJSON.query.filters.misc_filters.filters.identified = { option: item.isIdentify }
	}
    if(!_.isUndefined(item.itemLevel))  searchJSON.query.filters.misc_filters.filters.ilvl = { min: item.itemLevel }
    if(!_.isUndefined(item.gemLevel))  searchJSON.query.filters.misc_filters.filters.gem_level = { min: item.gemLevel }
    if(!_.isUndefined(item.itemLevel))  searchJSON.query.filters.misc_filters.filters.ilvl = { min: item.itemLevel }
    if(!_.isUndefined(item.type.option))  searchJSON.query.filters.type_filters.filters.category=item.type
    if(!_.isUndefined(item.enchant))  searchJSON.query.stats[0].filters.push(...item.enchant)
    if(!_.isUndefined(item.implicit)) searchJSON.query.stats[0].filters.push(...item.implicit)
    if(!_.isUndefined(item.explicit)) searchJSON.query.stats[0].filters.push(...item.explicit)
    if(!_.isUndefined(item.fractured))searchJSON.query.stats[0].filters.push(...item.fractured)
    if(!_.isUndefined(item.crafted))  searchJSON.query.stats[0].filters.push(...item.crafted)
    if(!_.isUndefined(item.pseudo))   searchJSON.query.stats[0].filters.push(item.pseudo)
    if(!_.isUndefined(item.temple))   searchJSON.query.stats[0].filters.push(...item.temple)
    if(!_.isUndefined(item.influences))   searchJSON.query.stats[0].filters.push(...item.influences)
    if(!_.isUndefined(item.altQType)) searchJSON.query.filters.misc_filters.filters.gem_alternate_quality={option: item.altQType}
    if(!_.isUndefined(item.quality))  searchJSON.query.filters.misc_filters.filters.quality={min: item.quality}
    else searchJSON.query.filters.misc_filters.filters.quality={min: ''}
    if(!_.isUndefined(item.mapTier))  searchJSON.query.filters.map_filters.filters.map_tier={min: item.mapTier}
    if(!_.isUndefined(item.blightedMap))  searchJSON.query.filters.map_filters.filters.map_blighted = { option: true}
    if(!_.isUndefined(item.UberBlightedMap))  searchJSON.query.filters.map_filters.filters.map_uberblighted = { option: true}
    if(!_.isUndefined(item.elderMap))  searchJSON.query.stats[0].filters.push(item.elderMap)
	if(item.isWeaponOrArmor)	searchJSON.query.filters.socket_filters={disabled: !(item.links===6), filters: {links:{min: item.links||0}}}
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
	]
}
export let rateTimeLimit
export function getIsCounting(){
	rateTimeLimit=toRefs(reactive({flag: false, second: 0}))
	return { rateTimeLimit }
}

function startCountdown(time){
	if(time<rateTimeLimit.second.value) return null
	let f
	if(f) clearInterval(f)
	rateTimeLimit.flag.value=true
	rateTimeLimit.second.value=time
	f=setInterval(()=>{
		if((--rateTimeLimit.second.value)<0) {
			rateTimeLimit.flag.value=false
			clearInterval(f)
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


function cleanupJSON(itemSearchJson){
	// for(let [key, index] of  Object.entries(itemSearchJson.query.filters)){
	// 	if(_.isEmpty(itemSearchJson.query.filters[key].filters))  delete itemSearchJson.query.filters[key]
	// }
	if(!isUnique) delete itemSearchJson.query.name
	return itemSearchJson
} 
export async function searchItem(itemSearchJson, league){
	searchResult=null
	itemSearchJson=cleanupJSON(itemSearchJson)
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
		data: JSON.stringify(itemSearchJson),
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
	})
	.catch((err)=>{
		errData=err.response.data
		if(err.response.status===429){
			startCountdown(parseInt(err.response.headers['retry-after']))
		}
		console.log(err.response)
	})
	if(errData) return {data: errData, err: true}
	return {result: await fetchItem(),total: searchResult.total, err: false, searchID: searchID }
}
export async function fetchItem(){
	if(searchResult.nowSearched >= (searchResult.total > 100 ? 100 : searchResult.total)) return null
	let start=searchResult.nowSearched
	let end=searchResult.nowSearched + 50 > searchResult.total ? searchResult.total : searchResult.nowSearched + 50
	let fetchResult=[]
	let itemJsonUrl=[]
	for(let i=start; i< end ; i+=10){
		itemJsonUrl.push('https://web.poe.garena.tw/api/trade/fetch/'+searchResult.result.slice(i,i+10).join(',')+`?query=${searchResult.id}`)
	}
	await axios.all(itemJsonUrl.map(url => axios({
		method: 'get',
		url: encodeURI(url),
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
			if(err.response.status===429){
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
		ret=res.data.result
	})
	.catch(err=>{
		console.log(err)
	})
	return ret
}
export async function getExaltedToChaos(league){
	let exchangeJSON={"exchange":{"status":{"option":"online"},"have":["exalted"],"want":["chaos"]}}
	let chaos=0
	await axios({
		method: 'post',
		url: encodeURI(`https://web.poe.garena.tw/api/trade/exchange/${league}`),
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
		return response.data
	}).then(async(data)=>{
		let temp=await fetchExaltedToChaos(data.result.slice(0,5),data.result.id)
		chaos=temp.reduce((pre,curr) => pre+(curr.listing.price.item.amount/curr.listing.price.exchange.amount) ,chaos)
		chaos/=temp.length
	})
	.catch((err)=>{
		console.log(err)
	})
	return chaos.toFixed(0)
}