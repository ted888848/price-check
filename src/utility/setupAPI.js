import axios from 'axios'
import Store from 'electron-store'
import { cloneDeep } from 'lodash-es'
import { app, dialog, shell, session } from 'electron'
export const GGCapi = axios.create({
	baseURL: 'https://web.poe.garena.tw/api/',
	timeout: 4000,
	headers: {
		'accept': 'application/json',
		'Content-Type': 'application/json'
	}
})
//render process
export let store = new Store()
export let leagues = []
export let hiestReward = []
export let APIitems = {
	accessories: undefined,
	armour: undefined,
	cards: undefined,
	currency: undefined,
	flasks: undefined,
	gems: undefined,
	jewels: undefined,
	maps: undefined,
	weapons: undefined,
	watchstones: undefined,
	heistequipment: undefined,
	heistmission: undefined,
	logbook: undefined,
	hiestReward: []
}
export let APImods = {
	pseudo: undefined,
	explicit: undefined,
	implicit: undefined,
	fractured: undefined,
	enchant: undefined,
	crafted: undefined,
	veiled: undefined,
	temple: undefined,
	clusterJewel: undefined,
	forbiddenJewel: undefined
}
export let APIStatic = []
export let currencyImageUrl

export function loadAPIdata() {
	leagues = store.get('Leagues')
	APIitems = store.get('APIitems')
	hiestReward = APIitems.hiestReward
	APIStatic = store.get('APIStatic')
	APImods = store.get('APImods')
	currencyImageUrl = store.get('currencyImageUrl')
}

//main process
function setupItemArray(itemArray, _APIitems) {
	let itemBaseType = []
	itemArray.slice().reverse().forEach(item => {
		let index = itemBaseType.findIndex(element => element.type === item.type)
		if (index === -1) {
			itemBaseType.push({ ...item, unique: [] })
		}
		if (item.flags?.unique === true) {
			itemBaseType[index].unique.push({ name: item.name, text: item.text })
			if (item.name.startsWith('贗品')) {
				_APIitems.hiestReward.push({ name: item.name, type: item.type, text: item.text })
			}
		}
	})
	return itemBaseType
}
function setupAPIItems(itemsJson) {
	let _APIitems = cloneDeep(APIitems)
	itemsJson.result.forEach(itemGroup => {
		switch (itemGroup.id) {
			case 'accessories':
			case 'armour':
			case 'flasks':
			case 'jewels':
			case 'weapons':
			case 'watchstones':
			case 'heistequipment':
			case 'heistmission':
			case 'logbook':
				_APIitems[itemGroup.id] = { id: itemGroup.id, label: itemGroup.label, entries: setupItemArray(itemGroup.entries, _APIitems) }
				break
			case 'maps':
				_APIitems[itemGroup.id] = { id: itemGroup.id, label: itemGroup.label, entries: setupItemArray(itemGroup.entries.filter(ele => ele.disc === "warfortheatlas"), _APIitems) }
				break
			case 'cards':
			case 'currency':
			case 'gems':
				_APIitems[itemGroup.id] = itemGroup
				if (itemGroup.id === 'gems') _APIitems.hiestReward.push(...itemGroup.entries)
				break
			default:
				return

		}
	})
	return _APIitems
}
function checkNewline(statsGroup, _type) {
	let mutiLines = []
	statsGroup.entries.forEach((stat) => {
		if (stat.text.includes('\n')) {
			let lines = stat.text.split('\n')
			mutiLines.push({ id: stat.id, text: lines, type: _type })
		}
	})
	if (mutiLines.length)
		return mutiLines.slice()
	return undefined
}
function setupAPIMods(statsJson) {
	let _APImods = cloneDeep(APImods)
	statsJson.result.forEach((statsGroup) => {
		switch (statsGroup.label) {
			case '偽屬性':
				_APImods.pseudo = {
					lebel: statsGroup.label, entries: statsGroup.entries.filter(stat => stat.text.indexOf('有房間：') === -1)
						.map(stat => ({ id: stat.id, text: stat.text, option: stat.option })), type: '偽屬性'
				}
				_APImods.temple = {
					lebel: statsGroup.label, entries: statsGroup.entries.filter(stat => stat.text.indexOf('有房間：') > -1)
						.map(stat => ({ id: stat.id, text: stat.text.substring(4).replace(/（階級 [123]）/, ''), option: stat.option })), type: '神廟'
				}
				break
			case '隨機屬性':
				_APImods.forbiddenJewel = { label: statsGroup.label, entries: statsGroup.entries.filter(e => /^若你在禁忌(烈焰|血肉)上有符合的詞綴，配置 #$/.test(e.text)) }
				_APImods.explicit = {
					label: statsGroup.label, entries: statsGroup.entries.map(ele => ({ ...ele, type: '隨機' }))
						.filter(stat => !stat.text.includes('\n'))
				}
				_APImods.explicit.mutiLines = checkNewline(statsGroup, '隨機')
				break
			case '固性屬性':
				_APImods.implicit = {
					label: statsGroup.label, entries: statsGroup.entries.map(ele => ({ ...ele, type: '固定' }))
						.filter(stat => !stat.text.includes('\n'))
				}
				_APImods.implicit.mutiLines = checkNewline(statsGroup, '固定')
				break
			case '破裂':
				_APImods.fractured = {
					label: statsGroup.label, entries: statsGroup.entries.map(ele => ({ ...ele, type: '破裂' }))
						.filter(stat => !stat.text.includes('\n'))
				}
				_APImods.fractured.mutiLines = checkNewline(statsGroup, '破裂')
				break
			case '附魔':
				_APImods.clusterJewel = { label: statsGroup.label, entries: statsGroup.entries.splice(statsGroup.entries.findIndex(ele => ele.text === "附加的小型天賦給予：#"), 1)[0].option.options }
				_APImods.enchant = {
					label: statsGroup.label, entries: statsGroup.entries.map(ele => ({ ...ele, type: '附魔' }))
						.filter(stat => !stat.text.includes('\n'))
				}
				_APImods.enchant.mutiLines = checkNewline(statsGroup, '附魔')
				break
			case '已工藝':
				_APImods.crafted = {
					label: statsGroup.label, entries: statsGroup.entries.map(ele => ({ ...ele, type: '工藝' }))
						.filter(stat => !stat.text.includes('\n'))
				}
				_APImods.crafted.mutiLines = checkNewline(statsGroup, '工藝')
				break
			case '隱匿':
				_APImods.veiled = {
					label: statsGroup.label, entries: statsGroup.entries.map(ele => ({ ...ele, type: '隱匿' }))
						.filter(stat => !stat.text.includes('\n'))
				}
				_APImods.veiled.mutiLines = checkNewline(statsGroup, '隱匿')
				break
			default:
				return
		}
	})
	return _APImods
}
function setupAPIStatic(data) {
	let _APIStatic = cloneDeep(APIStatic)
	data.forEach(group => {
		if (group.label?.match(/^地圖（(階級\d+|傳奇)）|命運卡$/)) return
		_APIStatic = _APIStatic.concat(cloneDeep(group.entries))
	})
	return _APIStatic
}
async function getLeagues() {
	return GGCapi.get('trade/data/leagues')
		.then(response => response.data)
		.then((data) => {
			leagues = data.result.map(l => l.text)
			store.set('Leagues', leagues)
		})
}
async function getItems() {
	return GGCapi.get('trade/data/items')
		.then(response => response.data)
		.then((data) => {
			store.set('APIitems', setupAPIItems(data))
		})
}
async function getStats() {
	return GGCapi.get('trade/data/stats')
		.then((response) => response.data)
		.then((data) => {
			store.set('APImods', setupAPIMods(data))
		})
}
async function getStatic() {
	return GGCapi.get('trade/data/static')
		.then((response) => response.data)
		.then((data) => {
			let _currencyImageUrl = data.result[0].entries
			store.set('currencyImageUrl', _currencyImageUrl)
			store.set('APIStatic', setupAPIStatic(data.result))
		})
}
export async function getAPIdata() {
	await Promise.all([getLeagues(), getItems(), getStatic(), getStats()])
	store.set('APIVersion', app.getVersion())
}
export async function checkForUpdate() {
	if ((session.defaultSession?.getCacheSize() >>> 20) >= 30) { //大於30MB
		session.defaultSession.clearCache()
			.catch(err => console.log(err))
		session.defaultSession.clearCodeCaches({})
			.catch(err => console.log(err))
	}
	axios.get('https://api.github.com/repos/ted888848/price-check/releases/latest')
		.then(response => {
			let latestVer = response.data.tag_name.substring(1).split('.').map(Number)
			let currVer = app.getVersion().split('.').map(Number)
			let flag = true
			for (let i = 0; i < 3; ++i) {
				if (latestVer[i] > currVer[i]) {
					flag = true
					break
				}
				if (latestVer[i] < currVer[i]) {
					flag = false
					break
				}
			}
			if (flag) {
				dialog.showMessageBox({
					title: '有新版本',
					type: 'info',
					message: `目前版本: ${app.getVersion()}\n新版本: ${latestVer.join('.')}\n${response.data.body}`,
					buttons: ['打開下載網址', '好'],
					defaultId: 0
				})
					.then(result => {
						if (result.response === 0) {
							shell.openExternal('https://github.com/ted888848/price-check/releases/latest')
						}
					})
					.catch(err => console.log(err))
			}
		})
	if (store.get('APIVersion', '') !== app.getVersion()) {
		await getAPIdata()
	}
}