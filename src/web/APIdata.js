import Store from 'electron-store'

export const baseURL = 'https://web.poe.garena.tw/api/'
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
export let currencyImageUrl = []

export function loadAPIdata() {
	leagues = store.get('Leagues')
	APIitems = store.get('APIitems')
	hiestReward = APIitems.hiestReward
	APIStatic = store.get('APIStatic')
	APImods = store.get('APImods')
	currencyImageUrl = store.get('currencyImageUrl')
}
