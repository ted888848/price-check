
export let leagues: string[] = []
export let APIitems: ParsedAPIitems
export let heistReward: HeistReward[] = []
export let APImods: ParsedAPIMods
export let APIStatic: Static[]
export let currencyImageUrl: Static[]


export function loadAPIdata() {
  leagues = window.store.get('Leagues') as string[]
  APIitems = window.store.get('APIitems') as ParsedAPIitems
  heistReward = window.store.get('heistReward') as HeistReward[]
  APIStatic = window.store.get('APIStatic') as Static[]
  APImods = window.store.get('APImods') as ParsedAPIMods
  currencyImageUrl = window.store.get('currencyImageUrl') as Static[]
}
