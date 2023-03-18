import Store from 'electron-store'

export let leagues: string[] = []
export let APIitems: IAPIitems
export let heistReward: IHeistReward[] = []
export let APImods: IAPIMods
export let APIStatic: IStatic[]
export let currencyImageUrl: IStatic[]

export const store = new Store({
  name: 'APIData'
})
export function loadAPIdata() {
  leagues = store.get('Leagues') as string[]
  APIitems = store.get('APIitems') as IAPIitems
  heistReward = store.get('heistReward') as IHeistReward[]
  APIStatic = store.get('APIStatic') as IStatic[]
  APImods = store.get('APImods') as IAPIMods
  currencyImageUrl = store.get('currencyImageUrl') as IStatic[]
}
