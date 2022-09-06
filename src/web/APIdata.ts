import { IItemUniques } from './interface';
import Store from 'electron-store'
export const baseURL = 'https://web.poe.garena.tw/api/'
export const store = new Store()

export let leagues: string[] = []
export interface IHiestReward{
  name?: string
	type: string
	text: string
}
export let hiestReward: IHiestReward[] = []

interface IAPIItemsItem{
  id: string
  label: string
  entries: {
    type: string
    text: string
    unique: IItemUniques[]
  }[]
}
export interface IAPIitems{
  accessories: IAPIItemsItem
  armour: IAPIItemsItem,
  cards: IAPIItemsItem,
  currency: IAPIItemsItem,
  flasks: IAPIItemsItem,
  gems: IAPIItemsItem,
  jewels: IAPIItemsItem,
  maps: IAPIItemsItem,
  weapons: IAPIItemsItem,
  watchstones: IAPIItemsItem,
  heistequipment: IAPIItemsItem,
  heistmission: IAPIItemsItem,
  logbook: IAPIItemsItem
}
export let APIitems: IAPIitems

interface IAPIModsMod{
  label: string
  type: string
  entries: {
    id: string
    text: string
    option?: {
      options: {
        id: number
        text: string
      }[]
    }
  }[]
  mutiLines?: {
    id: string
    text: string[]
    option?: {
      options: {
        id: number
        text: string
      }[]
    }
  }[]
}
export interface IAPIMods{
  pseudo: IAPIModsMod
  explicit: IAPIModsMod
  implicit: IAPIModsMod
  fractured: IAPIModsMod
  enchant: IAPIModsMod
  crafted: IAPIModsMod
  temple: IAPIModsMod
  clusterJewel: IAPIModsMod
  forbiddenJewel: IAPIModsMod
}
export let APImods: IAPIMods
export interface IStatic{
  id: string
  text: string
  image: string
}
export let APIStatic: IStatic[]
export let currencyImageUrl: IStatic[]

export function loadAPIdata() {
  leagues = store.get('Leagues') as string[]
  APIitems = store.get('APIitems') as IAPIitems
  hiestReward = store.get('hiestReward') as IHiestReward[]
  APIStatic = store.get('APIStatic') as IStatic[]
  APImods = store.get('APImods') as IAPIMods
  currencyImageUrl = store.get('currencyImageUrl') as IStatic[]
}
