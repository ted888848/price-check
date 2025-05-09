import { APIStatic, currencyImageUrl } from './APIdata'
import { ref } from 'vue'
import { isUndefined, isNumber, countBy } from 'lodash-es'
import type { AxiosResponseHeaders } from 'axios'
import axios from 'axios'
import { poeVersion, secondCurrency, tradeUrl } from './index'

const tradeApi = axios.create({
  baseURL: `http://localhost:${window.proxyServer.getPort()}/proxy`,
  timeout: 4000,
  withCredentials: true,
  headers: {
    'accept': 'application/json',
    'Content-Type': 'application/json',
  },
})
export interface ISearchJson {
  query: {
    type?: {
      discriminator: string;
      option: string;
    } | string;
    name?: string;
    filters: {
      trade_filters: {
        filters: {
          price: {
            min: number;
            option?: string;
          };
          collapse: {
            option: boolean;
          };
          indexed?: {
            option: string;
          };
        };
      };
      misc_filters: {
        filters: {
          corrupted?: { option: boolean };
          identified?: { option: boolean };
          gem_alternate_quality?: { option: number };
          ilvl?: { min?: number; max?: number };
          gem_level?: { min?: number; max?: number };
          quality?: { min?: number; max?: number };
          alternate_art?: { option: boolean };
        };
      };
      type_filters: {
        filters: {
          category?: { option: string };
          rarity?: { option: string };
        };
      };
      map_filters: {
        filters: {
          map_tier?: { min?: number; max?: number };
          map_blighted?: { option: boolean };
          map_uberblighted?: { option: boolean };
        };
      };
      socket_filters?: {
        disabled: boolean;
        filters: { links: { min?: number; max?: number } };
      };
    };
    stats: [{ type: 'and'; filters: ItemStat[] }];
    status: { option: 'any' | 'online' | 'onlineleague' };
  };
  sort: { price: 'asc' };
}

export const selectOptions = Object.freeze({
  generalOption: [
    { label: '任何', value: undefined },
    { label: '是', value: true },
    { label: '否', value: false }
  ],
  gemAltQOptions: [
    { label: '普通', value: 0 },
    { label: '異常的', value: 1 },
    { label: '相異的', value: 2 },
    { label: '幻影的', value: 3 }
  ],
  influencesOptions: [
    { id: 'pseudo.pseudo_has_shaper_influence', text: '塑者' as string | string[] },
    { id: 'pseudo.pseudo_has_elder_influence', text: '尊師' as string | string[] },
    { id: 'pseudo.pseudo_has_crusader_influence', text: '聖戰' as string | string[] },
    { id: 'pseudo.pseudo_has_redeemer_influence', text: '救贖' as string | string[] },
    { id: 'pseudo.pseudo_has_hunter_influence', text: '狩獵' as string | string[] },
    { id: 'pseudo.pseudo_has_warlord_influence', text: '督軍' as string | string[] }
  ],
  elderMapOptions: [
    { value: 1, label: '奴役(右上)' },
    { value: 2, label: '根除(右下)' },
    { value: 3, label: '干擾(左下)' },
    { value: 4, label: '淨化(左上)' }
  ],
  conquerorMapOptions: [
    { value: 1, label: '巴倫' },
    { value: 2, label: '維羅提尼亞' },
    { value: 3, label: '奧赫茲明' },
    { value: 4, label: '圖拉克斯' }
  ],
  rarityOptions: [
    { value: undefined, label: '任何' },
    { value: 'normal', label: '普通' },
    { value: 'magic', label: '魔法' },
    { value: 'rare', label: '稀有' },
    { value: 'unique', label: '傳奇' },
    { value: 'nonunique', label: '非傳奇' }
  ],
  exchangeHave: [
    { label: `D&${poeVersion === '2' ? 'Ex' : 'C'}`, value: 'divine&(C or Ex)' },
    { label: '混沌', value: 'chaos' },
    { label: '崇高', value: 'exalted' },
    { label: '神聖', value: 'divine' }
  ]
})
const defaultSearchJson: ISearchJson = {
  query: {
    filters: {
      trade_filters: {
        filters: {
          price: { min: 2 },
          collapse: { option: true }
        }
      },
      misc_filters: {
        filters: {}
      },
      type_filters: {
        filters: {}
      },
      map_filters: {
        filters: {}
      }
    },
    stats: [{ type: 'and', filters: [] }],
    status: { option: 'online' },
  },
  sort: { price: 'asc' }
}
export function getSearchJSON(item: ParsedItem) {
  const searchJSON: ISearchJson = structuredClone(defaultSearchJson)
  if (!item.type.searchByType) {//如果沒有要依照類別搜尋
    searchJSON.query.type = item.baseType
  }
  if (item.raritySearch.value === 'unique') {
    searchJSON.query.name = item.name || undefined
  }
  if (!isUndefined(item.isCorrupt)) {
    searchJSON.query.filters.misc_filters.filters.corrupted = {
      option: item.isCorrupt
    }
  }
  if (!isUndefined(item.isIdentify)) {
    searchJSON.query.filters.misc_filters.filters.identified = {
      option: item.isIdentify
    }
  }
  if (!isUndefined(item.altQType)) {
    searchJSON.query.filters.misc_filters.filters.gem_alternate_quality = {
      option: item.altQType
    }
  }
  if (item.itemLevel?.search) {
    searchJSON.query.filters.misc_filters.filters.ilvl = {
      min: item.itemLevel.min, max: item.itemLevel.max
    }
  }
  if (item.gemLevel?.search) {
    searchJSON.query.filters.misc_filters.filters.gem_level = {
      min: item.gemLevel.min, max: item.gemLevel.max
    }
  }
  if (item.mapTier?.search) {
    searchJSON.query.filters.map_filters.filters.map_tier = {
      min: item.mapTier.min, max: item.mapTier.max
    }
  }
  if (!isUndefined(item.type.option)) {
    searchJSON.query.filters.type_filters.filters.category = {
      option: item.type.option
    }
  }
  if (item.quality.search) {
    searchJSON.query.filters.misc_filters.filters.quality = {
      min: item.quality.min, max: item.quality.max
    }
  }
  if (item.elderMap || item.conquerorMap) {
    searchJSON.query.stats[0].filters.push(item.elderMap! || item.conquerorMap!)
  }
  if (item.search6L) {
    searchJSON.query.filters.socket_filters = {
      disabled: false,
      filters: {
        links: {
          min: 6
        }
      }
    }
  }

  if (item.transGem) {
    searchJSON.query.type = item.transGem
  }
  if (item.raritySearch.value) {
    searchJSON.query.filters.type_filters.filters.rarity = {
      option: item.raritySearch.value
    }
  }
  if (item.searchTwoWeekOffline) {
    searchJSON.query.filters.trade_filters.filters.indexed = {
      option: '2weeks'
    }
    searchJSON.query.status.option = 'any'
  }
  if (item.onlyChaosOrExalted) {
    searchJSON.query.filters.trade_filters.filters.price.option = secondCurrency
  }
  searchJSON.query.stats[0].filters.push(...(item.stats))
  searchJSON.query.stats[0].filters.push(...(item.influences))

  if (!isUndefined(item.blightedMap)) {
    searchJSON.query.filters.map_filters.filters.map_blighted = {
      option: true
    }
  }
  if (!isUndefined(item.UberBlightedMap)) {
    searchJSON.query.filters.map_filters.filters.map_uberblighted = {
      option: true
    }
  }
  if (!isUndefined(item.isRGB)) {
    searchJSON.query.filters.misc_filters.filters.alternate_art = {
      option: item.isRGB
    }
  }

  return searchJSON
}
const rateTimeLimitArr = {
  search: {
    ip: [
      { limit: 45, time: 60 },
      { limit: 13, time: 20 },
      { limit: 6, time: 3 }
    ],
    account: [
      { limit: 3, time: 2 }
    ]
  },
  fetch: {
    ip: [
      { limit: 14, time: 4 },
      { limit: 10, time: 1 }
    ],
    account: [
      { limit: 4, time: 2 }
    ]
  },
  exchange: {
    ip: [
      { limit: 40, time: 60 },
      { limit: 13, time: 30 },
      { limit: 5, time: 3 }
    ],
    account: [
      { limit: 3, time: 2 }
    ]
  }
} as const
const rateTimeLimit = ref({
  flag: false, second: 0
})
export function getIsCounting() {
  return {
    rateTimeLimit
  }
}
let interval: NodeJS.Timeout | undefined
function startCountdown(time: number) {
  if (time < rateTimeLimit.value.second) return
  if (interval) {
    clearInterval(interval)
    interval = undefined
  }
  rateTimeLimit.value.flag = true
  rateTimeLimit.value.second = time
  interval = setInterval(() => {
    if ((--rateTimeLimit.value.second) < 0) {
      rateTimeLimit.value.flag = false
      clearInterval(interval)
      interval = undefined
    }
  }, 1000)
}

function parseRateTimeLimit(header?: AxiosResponseHeaders) {
  if (!header) return
  const rules = header['x-rate-limit-rules'].split(',').map((ele: string) => ele.toLowerCase()) as ('ip' | 'account')[]
  const type = header['x-rate-limit-policy'].split('-')[1] as keyof typeof rateTimeLimitArr
  if (Object.keys(rateTimeLimitArr).includes(type)) {
    for (const rule of rules) {
      const timesArr = header[`x-rate-limit-${rule}-state`].split(',').map((ele: string) => parseInt(ele.split(':')?.[0])).reverse()
      for (let i = 0; i < timesArr.length; ++i) {
        if (timesArr[i] >= rateTimeLimitArr[type][rule][i].limit) {
          startCountdown(rateTimeLimitArr[type][rule][i].time)
          break
        }
      }
    }
  }
}

function cleanupJSON(searchJson: ISearchJson) {
  searchJson.query.stats[0].filters.forEach(ele => {
    if (ele.value) {
      if (!isNumber(ele.value.min)) delete ele.value.min
      if (!isNumber(ele.value.max)) delete ele.value.max
    }
  })
  if (typeof searchJson.query.type === 'string' && searchJson.query.type?.endsWith('虛空石')) {
    delete searchJson.query.type
  }
  return searchJson
}
export interface ISearchResult {
  searchID: {
    ID?: string;
    type: 'search';
  };
  result: string[];
  totalCount: number;
  nowFetched: number;
  errData?: string;
  err: boolean;
}
export async function searchItem(searchJson: ISearchJson, league: string) {
  const searchResult: ISearchResult = {
    searchID: { type: 'search' },
    result: [],
    totalCount: 0,
    nowFetched: 0,
    err: false
  }
  searchJson = cleanupJSON(searchJson)
  if (process.env.NODE_ENV === 'development') console.log(searchJson)
  await tradeApi.post('', searchJson, { params: { url: `${tradeUrl}/search/${league}` } })
    .then((response) => {
      parseRateTimeLimit(response.headers as AxiosResponseHeaders)
      return response.data
    })
    .then((data) => {
      searchResult.searchID.ID = data.id
      searchResult.result = data.result
      searchResult.totalCount = data.result.length
      searchResult.nowFetched = 0
    })
    .catch((err) => {
      console.error(err)
      if (err.response?.status === 400) {
        searchResult.errData = err.response.data?.error?.message
      }
      else {
        searchResult.errData = err.message || err
      }
      if (err.response?.status === 429) {
        startCountdown(parseInt(err.response.headers['retry-after']))
      }
    })
  if (searchResult.errData)
    return {
      ...searchResult, err: true
    }
  return {
    ...searchResult
  }
}
export interface IFetchResult {
  price: string | number;
  currency: string;
  amount: number;
  image: string;
}

export async function fetchItem(fetchList: string[], searchID: string, oldFetchResult?: IFetchResult[]) {
  if (!fetchList.length) return oldFetchResult ?? []
  let fetchPriceResult: string[] = []
  const itemJsonUrl: string[] = []
  for (let i = 0; i < fetchList.length; i += 10) {
    itemJsonUrl.push(`${tradeUrl}/fetch/` + fetchList.slice(i, i + 10).join(',') + `?query=${searchID}`)
  }
  await Promise.all(
    itemJsonUrl.map((url) => tradeApi.get('', { params: { url: url, } })))
    .then((responses) => {
      responses.forEach(res => {
        const tempResult = res.data.result.map((ele: any) => `${ele.listing.price.amount}|${ele.listing.price.currency}`) as string[]
        fetchPriceResult = fetchPriceResult.concat(tempResult)
      })
      parseRateTimeLimit(responses.pop()?.headers as AxiosResponseHeaders)
    })
    .catch(err => {
      console.error(err)
      if (err.response?.status === 429) {
        startCountdown(parseInt(err.response.headers['retry-after']))
      }
    })
  const countByFetchResult = countBy(fetchPriceResult)
  const fetchResult = oldFetchResult ?? []
  for (const key in countByFetchResult) {
    const [price, currency] = key.split('|')
    const numPrice = Number(price)
    const fetchResultFind = fetchResult.find((e) => (e.price === numPrice && e.currency === currency))
    if (fetchResultFind) {
      fetchResultFind.amount += countByFetchResult[key]
    }
    else {
      fetchResult.push({
        price: numPrice,
        currency,
        amount: countByFetchResult[key],
        image: `${import.meta.env.VITE_URL_BASE}${currencyImageUrl.find(ele => ele.id === currency)?.image}`
      })
    }
  }
  return fetchResult
}
export interface IExchangeJson {
  query: {
    status: { option: 'online' };
    have: string[];
    want: string[];
  };
  sort: { have: 'asc' };
  engine: 'new';
}
export async function getDivineToChaosOrExalted(league: string) {
  const exchangeJSON: IExchangeJson = {
    'query': {
      'status': { 'option': 'online' },
      'have': ['divine'],
      'want': [secondCurrency]
    },
    'sort': { 'have': 'asc' },
    'engine': 'new'
  }
  let chaosOrExalted = 0
  await tradeApi.post('', exchangeJSON, { params: { url: `${tradeUrl}/exchange/${league}` } })
    .then((response) => {
      parseRateTimeLimit(response.headers as AxiosResponseHeaders)
      return response.data
    }).then((data) => {
      const temp = Object.keys(data.result).slice(0, 5)
      chaosOrExalted = temp.reduce((pre, curr) =>
        pre + (data.result[curr].listing.offers[0].item.amount / data.result[curr].listing.offers[0].exchange.amount), chaosOrExalted)
      chaosOrExalted /= temp.length
    })
    .catch((err) => {
      console.error(err)
      if (err.response?.status === 429) {
        startCountdown(parseInt(err.response.headers['retry-after']))
      }
    })
  return Math.round(chaosOrExalted / 5) * 5
}
export interface IExchangeResult {
  searchID: {
    ID?: string;
    type: 'exchange';
  };
  result: IFetchResult[];
  totalCount: number;
  nowFetched: number;
  err: boolean;
  errData?: string;
  currency2?: string;
}
export async function searchExchange(item: ParsedItem, league: string): Promise<IExchangeResult> {
  const exchangeResult: IExchangeResult = {
    searchID: { type: 'exchange' },
    result: [],
    totalCount: 0,
    nowFetched: 0,
    err: false
  }
  const tempResult: string[] = []
  const exchangeJSON: IExchangeJson = {
    'query': {
      'status': {
        'option': 'online'
      },
      'have': item.onlyChaosOrExalted ? [secondCurrency] : item.searchExchange.have,
      'want': (item.searchExchange.want?.length ?? 0) > 0 ? item.searchExchange.want! : [APIStatic.find(e => e.text === item.baseType)?.id ?? '']
    },
    'sort': { 'have': 'asc' },
    'engine': 'new'
  }
  await tradeApi.post('', exchangeJSON, { params: { url: `${tradeUrl}/exchange/${league}` } })
    .then((response) => {
      parseRateTimeLimit(response.headers as AxiosResponseHeaders)
      return response.data
    }).then((data) => {
      exchangeResult.searchID.ID = data.id
      exchangeResult.currency2 = exchangeJSON.query.want[0]
      for (const key in data.result) {
        for (const offer of data.result[key].listing.offers) {
          tempResult.push(offer.exchange.amount + '：' + offer.item.amount + '|' + offer.exchange.currency)
        }
      }
      exchangeResult.nowFetched = exchangeResult.totalCount = tempResult.length
    })
    .catch((err) => {
      console.error(err)
      if (err.response?.status === 400) {
        exchangeResult.errData = err.response.data?.error?.message
      }
      else {
        exchangeResult.errData = err.message || err
      }
      if (err.response?.status === 429) {
        startCountdown(parseInt(err.response.headers['retry-after']))
      }
    })
  const tempResultCountBy = countBy(tempResult)
  for (const key in tempResultCountBy) {
    const [price, currency] = key.split('|')
    exchangeResult.result.push({
      price,
      currency,
      amount: tempResultCountBy[key],
      image: `${import.meta.env.VITE_URL_BASE}${currencyImageUrl.find(ele => ele.id === currency)?.image}`
    })
  }
  if (exchangeResult.errData) return {
    ...exchangeResult, err: true
  }
  return {
    ...exchangeResult
  }
}