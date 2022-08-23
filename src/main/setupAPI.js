import { GGCapi } from '@/utility/api'
import Store from 'electron-store'
import { cloneDeep } from 'lodash-es'
import { app, session, dialog } from 'electron' //, shell
import { autoUpdater } from 'electron-updater'
import { setImmediate } from 'timers'
import { buildTray } from './tray'
let store = new Store()
let leagues = []
let APIitems = {
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
let APImods = {
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
let APIStatic = []

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
	let result = await Promise.allSettled([getLeagues(), getItems(), getStatic(), getStats()])
	result.forEach(e => {
		if (e.status === 'rejected') {
			throw e.reason
		}
	})
	store.set('APIVersion', app.getVersion())
}

export const updateState = {
	label: '',
	canClick: true
}

autoUpdater.on('update-available', ({ version }) => {
	updateState.label = `下載新版本 v${version}中`
	updateState.canClick = false
	buildTray()
	dialog.showMessageBox({
		title: '有新版本',
		type: 'info',
		message: `有新版本 v${version}，並已經開始在背景下載`,
	})
})
autoUpdater.on('update-downloaded', () => {
	updateState.label = `下載完成，關閉後將自動安裝`
	updateState.canClick = false
	buildTray()
	dialog.showMessageBox({
		title: '下載完成',
		type: 'info',
		message: '更新安裝擋已經下載完成，如果沒有自動重新啟動，\n請手動離開後稍等安裝完畢再打開',
		buttons: ['重新開啟並安裝更新(可能會沒用)', '稍後再安裝'],
		defaultId: 0
	})
		.then((buttonClick) => {
			if (buttonClick === 0) {
				setImmediate(() => {
					autoUpdater.quitAndInstall();
				})
			}
		})
})
autoUpdater.on('update-not-available', () => {
	updateState.label = '目前沒有新版本'
	updateState.canClick = true
	buildTray()
})
export async function checkForUpdate() {
	if ((await session.defaultSession?.getCacheSize() >>> 20) >= 30) { //大於30MB
		session.defaultSession.clearCache()
			.catch(err => console.log(err))
		session.defaultSession.clearCodeCaches({})
			.catch(err => console.log(err))
	}
	updateState.label = '檢查更新中'
	updateState.canClick = false
	buildTray()
	try {
		await autoUpdater.checkForUpdates()
	}
	catch {
		updateState.label = '檢查更新錯誤'
		updateState.canClick = true
		buildTray()
	}
	if (store.get('APIVersion', '') !== app.getVersion()) {
		await getAPIdata()
	}
}