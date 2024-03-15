import Store from 'electron-store'

export let leagues: string[] = []
export let APIitems: ParsedAPIitems
export let heistReward: HeistReward[] = []
export let APImods: ParsedAPIMods
export let APIStatic: Static[]
export let currencyImageUrl: Static[]

export const store = new Store({
  name: 'APIData'
})
export function loadAPIdata() {
  leagues = store.get('Leagues') as string[]
  APIitems = store.get('APIitems') as ParsedAPIitems
  heistReward = store.get('heistReward') as HeistReward[]
  APIStatic = store.get('APIStatic') as Static[]
  APImods = store.get('APImods') as ParsedAPIMods
  currencyImageUrl = store.get('currencyImageUrl') as Static[]
}
