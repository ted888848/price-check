import { IItemUniques } from './interface'
import Store from 'electron-store'
export const baseURL = 'https://web.poe.garena.tw/api/'

export interface IHiestReward{
  name?: string;
  type: string;
  text: string;
}
interface IAPIItemsItem{
  id: string;
  label: string;
  entries: {
    type: string;
    text: string;
    unique: IItemUniques[];
  }[];
}
export interface IAPIitems{
  accessories: IAPIItemsItem;
  armour: IAPIItemsItem;
  cards: IAPIItemsItem;
  currency: IAPIItemsItem;
  flasks: IAPIItemsItem;
  gems: IAPIItemsItem;
  jewels: IAPIItemsItem;
  maps: IAPIItemsItem;
  weapons: IAPIItemsItem;
  watchstones: IAPIItemsItem;
  heistequipment: IAPIItemsItem;
  heistmission: IAPIItemsItem;
  logbook: IAPIItemsItem;
}
interface IAPIModsMod{
  label: string;
  type: string;
  entries: {
    id: string;
    text: string;
    option?: {
      options: {
        id: number;
        text: string;
      }[];
    };
  }[];
  mutiLines?: {
    id: string;
    text: string[];
    option?: {
      options: {
        id: number;
        text: string;
      }[];
    };
  }[];
}
export interface IAPIMods{
  pseudo: IAPIModsMod;
  explicit: IAPIModsMod;
  implicit: IAPIModsMod;
  fractured: IAPIModsMod;
  enchant: IAPIModsMod;
  crafted: IAPIModsMod;
  temple: IAPIModsMod;
  clusterJewel: IAPIModsMod;
  forbiddenJewel: IAPIModsMod;
}
export interface IStatic{
  id: string;
  text: string;
  image: string;
}

export let leagues: string[] = []
export let APIitems: IAPIitems
export let hiestReward: IHiestReward[] = []
export let APImods: IAPIMods
export let APIStatic: IStatic[]
export let currencyImageUrl: IStatic[]

export const store = new Store({
  name: 'APIData'
})
export function loadAPIdata() {
  leagues = store.get('Leagues') as string[]
  APIitems = store.get('APIitems') as IAPIitems
  hiestReward = store.get('hiestReward') as IHiestReward[]
  APIStatic = store.get('APIStatic') as IStatic[]
  APImods = store.get('APImods') as IAPIMods
  currencyImageUrl = store.get('currencyImageUrl') as IStatic[]
}
