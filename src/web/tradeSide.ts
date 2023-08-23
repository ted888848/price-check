import { GGCapi } from '../api'
import { APIStatic, currencyImageUrl } from './APIdata'
import { ref } from 'vue'
import { isUndefined, isNumber, countBy } from 'lodash-es'
import type { AxiosResponseHeaders } from 'axios'
export interface ISearchJson {
  query: {
    type?: string;
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
        filters: {
          links: { min?: number; max?: number };
        };
      };
    };
    stats: [{ type: 'and'; filters: IItemStat[] }];
    status: {
      option: 'any' | 'online' | 'onlineleague';
    };
  };
  sort: {
    price: 'asc';
  };
}

export const selectOptions = {
  generalOption: [{
    label: '任何',
    value: undefined
  }, {
    label: '是',
    value: true
  }, {
    label: '否',
    value: false
  }],
  gemAltQOptions: [{
    label: '普通',
    value: 0
  }, {
    label: '異常的',
    value: 1
  }, {
    label: '相異的',
    value: 2
  }, {
    label: '幻影的',
    value: 3
  }],
  influencesOptions: [{
    id: 'pseudo.pseudo_has_shaper_influence',
    label: '塑者'
  }, {
    id: 'pseudo.pseudo_has_elder_influence',
    label: '尊師'
  }, {
    id: 'pseudo.pseudo_has_crusader_influence',
    label: '聖戰'
  }, {
    id: 'pseudo.pseudo_has_redeemer_influence',
    label: '救贖'
  }, {
    id: 'pseudo.pseudo_has_hunter_influence',
    label: '狩獵'
  }, {
    id: 'pseudo.pseudo_has_warlord_influence',
    label: '督軍'
  }],
  elderMapOptions: [{
    value: 1,
    label: '奴役(右上)'
  }, {
    value: 2,
    label: '根除(右下)'
  }, {
    value: 3,
    label: '干擾(左下)'
  }, {
    value: 4,
    label: '淨化(左上)'
  }],
  conquerorMapOptions: [{
    value: 1,
    label: '巴倫'
  }, {
    value: 2,
    label: '維羅提尼亞'
  }, {
    value: 3,
    label: '奧赫茲明'
  }, {
    value: 4,
    label: '圖拉克斯'
  }],
  rarityOptions: [{
    value: undefined,
    label: '任何'
  }, {
    value: 'normal',
    label: '普通'
  }, {
    value: 'magic',
    label: '魔法'
  }, {
    value: 'rare',
    label: '稀有'
  }, {
    value: 'unique',
    label: '傳奇'
  }, {
    value: 'nonunique',
    label: '非傳奇'
  }],
}
const defaultSearchJson: ISearchJson = {
  query: {
    filters: {
      trade_filters: {
        filters: {
          price: {
            min: 2,
            option: 'chaos_divine'
          },
          collapse: {
            option: true
          }
        }
      },
      misc_filters: {
        filters: {
        }
      },
      type_filters: {
        filters: {
        }
      },
      map_filters: {
        filters: {
        }
      }
    },
    stats: [{
      type: 'and', filters: []
    }],
    status: {
      option: 'online'
    }
  },
  sort: {
    price: 'asc'
  }
}
export function getSearchJSON(item: IItem) {
  let searchJSON: ISearchJson = structuredClone(defaultSearchJson)
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
  if (item.onlyChaos) {
    searchJSON.query.filters.trade_filters.filters.price.option = 'chaos'
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
  fetch: [{
    limit: 14,
    time: 6
  }, {
    limit: 10,
    time: 2
  }],
  search: [{
    limit: 25,
    time: 120
  }, {
    limit: 12,
    time: 20
  }, {
    limit: 3,
    time: 3
  }],
  exchange: [{
    limit: 40,
    time: 200
  }, {
    limit: 10,
    time: 60
  }, {
    limit: 3,
    time: 8
  }]
} as const
let rateTimeLimit = ref({
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
  let type = header['x-rate-limit-policy'].split('-')[1] as keyof typeof rateTimeLimitArr
  if (Object.keys(rateTimeLimitArr).includes(type)) {
    let timesArr = header['x-rate-limit-ip-state'].split(',').map((ele: string) => parseInt(ele.substring(0, ele.indexOf(':')))).reverse()
    for (let i = 0; i < timesArr.length; ++i) {
      if (timesArr[i] >= rateTimeLimitArr[type][i].limit) {
        startCountdown(rateTimeLimitArr[type][i].time)
        break
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
  if (searchJson.query.type?.endsWith('虛空石')) {
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
  let searchResult: ISearchResult = {
    searchID: {
      type: 'search'
    },
    result: [],
    totalCount: 0,
    nowFetched: 0,
    err: false
  }
  searchJson = cleanupJSON(searchJson)
  if (process.env.NODE_ENV === 'development') console.log(searchJson)
  await GGCapi.post(encodeURI(`trade/search/${league}`), JSON.stringify(searchJson))
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
  if (searchResult.errData) return {
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
  let fetchResult: IFetchResult[] = []
  let itemJsonUrl: string[] = []
  for (let i = 0; i < fetchList.length; i += 10) {
    itemJsonUrl.push('trade/fetch/' + fetchList.slice(i, i + 10).join(',') + `?query=${searchID}`)
  }
  await Promise.all(itemJsonUrl.map((url) => GGCapi.get(encodeURI(url))))
    .then((responses) => {
      responses.forEach(res => {
        let tempResult = res.data.result.map((ele: any) => `${ele.listing.price.amount}|${ele.listing.price.currency}`)
        fetchResult.push(...tempResult)
      })
      parseRateTimeLimit(responses.pop()?.headers as AxiosResponseHeaders)
    })
    .catch(err => {
      console.error(err)
      if (err.response?.status === 429) {
        startCountdown(parseInt(err.response.headers['retry-after']))
      }
    })
  let countByFetchResult = countBy(fetchResult)
  fetchResult = oldFetchResult ?? []
  for (let key in countByFetchResult) {
    let [price, currency] = key.split('|')
    let numPrice = Number(price)
    let fetchResultFind = fetchResult.find((e) => (e.price === numPrice && e.currency === currency))
    if (fetchResultFind) {
      fetchResultFind.amount += countByFetchResult[key]
    }
    else {
      fetchResult.push({
        price: numPrice,
        currency,
        amount: countByFetchResult[key],
        image: `https://web.poe.garena.tw${currencyImageUrl.find(ele => ele.id === currency)?.image}`
      })
    }
  }
  return fetchResult
}
export interface IExchangeJson {
  query: {
    status: {
      option: 'online';
    };
    have: string[];
    want: string[];
  };
  sort: {
    have: 'asc';
  };
  engine: 'new';
}
export async function getDivineToChaos(league: string) {
  let exchangeJSON: IExchangeJson = {
    'query': {
      'status': {
        'option': 'online'
      },
      'have': [],
      'want': []
    },
    'sort': {
      'have': 'asc'
    },
    'engine': 'new'
  }
  exchangeJSON.query.have = ['divine']
  exchangeJSON.query.want = ['chaos']
  let chaos = 0
  await GGCapi.post(encodeURI(`trade/exchange/${league}`), JSON.stringify(exchangeJSON))
    .then((response) => {
      parseRateTimeLimit(response.headers as AxiosResponseHeaders)
      return response.data
    }).then((data) => {
      let temp = Object.keys(data.result).slice(0, 5)
      chaos = temp.reduce((pre, curr) =>
        pre + (data.result[curr].listing.offers[0].item.amount / data.result[curr].listing.offers[0].exchange.amount), chaos)
      chaos /= temp.length
    })
    .catch((err) => {
      console.error(err)
      if (err.response?.status === 429) {
        startCountdown(parseInt(err.response.headers['retry-after']))
      }
    })
  return Math.round(chaos * 0.2) * 5
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
export async function searchExchange(item: IItem, league: string): Promise<IExchangeResult> {
  let exchangeResult: IExchangeResult = {
    searchID: { type: 'exchange' },
    result: [] as IFetchResult[],
    totalCount: 0,
    nowFetched: 0,
    err: false
  }
  let tempResult: any = []
  let exchangeJSON: IExchangeJson = {
    'query': {
      'status': {
        'option': 'online'
      },
      'have': [],
      'want': []
    },
    'sort': {
      'have': 'asc'
    },
    'engine': 'new'
  }
  exchangeJSON.query.have = [item.searchExchange.have]
  exchangeJSON.query.want = [APIStatic.find(e => e.text === item.baseType)?.id ?? '']
  await GGCapi.post(encodeURI(`trade/exchange/${league}`), JSON.stringify(exchangeJSON))
    .then((response) => {
      parseRateTimeLimit(response.headers as AxiosResponseHeaders)
      return response.data
    }).then((data) => {
      exchangeResult.searchID.ID = data.id
      exchangeResult.currency2 = exchangeJSON.query.want[0]
      for (let key in data.result) {
        tempResult.push(data.result[key].listing.offers[0].exchange.amount + '：' + data.result[key].listing.offers[0].item.amount + '|' + item.searchExchange.have)
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
  let tempResultCountBy = countBy(tempResult)
  for (let key in tempResultCountBy) {
    let [price, currency] = key.split('|')
    exchangeResult.result.push({
      price,
      currency,
      amount: tempResultCountBy[key],
      image: `https://web.poe.garena.tw${currencyImageUrl.find(ele => ele.id === currency)?.image}`
    })
  }
  if (exchangeResult.errData) return {
    ...exchangeResult, err: true
  }
  return {
    ...exchangeResult
  }
}