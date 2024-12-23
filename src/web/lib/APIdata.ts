import IPC from '@/ipc'

export let leagues: string[] = []
export let APIitems: ParsedAPIitems
export let heistReward: HeistReward[] = []
export let APImods: ParsedAPIMods
export let APIStatic: Static[]
export let currencyImageUrl: Static[]
export function loadAPIData(poeVersion?: POEVersion) {
  if (!poeVersion) {
    const config = window.ipc.sendSync(IPC.GET_CONFIG)
    poeVersion = config.poeVersion
  }
  if (poeVersion === '1') loadAPIPoe1Data()
  else loadAPIPoe2Data()
}

function loadAPIPoe1Data() {
  leagues = window.store.get('Leagues') as string[] ?? []
  APIitems = window.store.get('APIitems') as ParsedAPIitems ?? []
  heistReward = window.store.get('heistReward') as HeistReward[] ?? []
  APIStatic = window.store.get('APIStatic') as Static[] ?? []
  APImods = window.store.get('APImods') as ParsedAPIMods ?? []
  currencyImageUrl = window.store.get('currencyImageUrl') as Static[] ?? []
}


function loadAPIPoe2Data() {
  leagues = window.store.get('Leagues', '2') as string[] ?? []
  APIitems = window.store.get('APIitems', '2') as ParsedAPIitems ?? []
  heistReward = window.store.get('heistReward', '2') as HeistReward[] ?? []
  APIStatic = window.store.get('APIStatic', '2') as Static[] ?? []
  APImods = window.store.get('APImods', '2') as ParsedAPIMods ?? []
  currencyImageUrl = window.store.get('currencyImageUrl', '2') as Static[] ?? []
}