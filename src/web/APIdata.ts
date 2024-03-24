export let leagues: string[] = []
export let APIitems: ParsedAPIitems
export let heistReward: HeistReward[] = []
export let APImods: ParsedAPIMods
export let APIStatic: Static[]
export let currencyImageUrl: Static[]
export function loadAPIdata() {
  leagues = window.apiStore.get('Leagues') as string[]
  APIitems = window.apiStore.get('APIitems') as ParsedAPIitems
  heistReward = window.apiStore.get('heistReward') as HeistReward[]
  APIStatic = window.apiStore.get('APIStatic') as Static[]
  APImods = window.apiStore.get('APImods') as ParsedAPIMods
  currencyImageUrl = window.apiStore.get('currencyImageUrl') as Static[]
}
