import { UniquesInterface } from './interface';
import Store from 'electron-store'
export const baseURL = 'https://web.poe.garena.tw/api/'
export const store = new Store()

export let leagues: string[] = []
interface HiestRewardInterface{
  name?: string
	type: string
	text: string
}
export let hiestReward: HiestRewardInterface[] = []

interface ItemsInterface{
  id: string
  label: string
  entries: {
    type: string
    text: string
    unique: UniquesInterface[]
  }[]
}
interface APIitemsInterface{
  accessories: ItemsInterface
  armour: ItemsInterface,
  cards: ItemsInterface,
  currency: ItemsInterface,
  flasks: ItemsInterface,
  gems: ItemsInterface,
  jewels: ItemsInterface,
  maps: ItemsInterface,
  weapons: ItemsInterface,
  watchstones: ItemsInterface,
  heistequipment: ItemsInterface,
  heistmission: ItemsInterface,
  logbook: ItemsInterface,
  hiestReward: HiestRewardInterface[]
}
export let APIitems: APIitemsInterface

interface ModsInterface{
  label: string
  entries: {
    id: string
    text: string
    type?: string
    option?: {
      options: {
        id: number
        text: string
      }[]
    }
  }[]
}
interface APIModsInterface{
  pseudo: ModsInterface,
  explicit: ModsInterface,
  implicit: ModsInterface,
  fractured: ModsInterface,
  enchant: ModsInterface,
  crafted: ModsInterface,
  veiled: ModsInterface,
  temple: {
    lebel: string
		entries: {
			id: string
			text: string
			option: {
        options: {
					id: 1 | 2,
					text: '開啟房間' | '關閉房間'
				}[]
			}
		}[]
  },
  clusterJewel: ModsInterface,
  forbiddenJewel: ModsInterface
}
export let APImods: APIModsInterface
interface StaticInterface{
  id: string
  text: string
  image: string
}
export let APIStatic: StaticInterface[]
export let currencyImageUrl: StaticInterface[]
export function loadAPIdata() {
  leagues = store.get('Leagues') as string[]
  APIitems = store.get('APIitems') as APIitemsInterface
  hiestReward = APIitems.hiestReward
  APIStatic = store.get('APIStatic') as StaticInterface[]
  APImods = store.get('APImods') as APIModsInterface
  currencyImageUrl = store.get('currencyImageUrl') as StaticInterface[]
}
