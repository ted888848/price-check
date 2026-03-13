import axios from "axios"
import { leagueSelectRef, poeVersion } from "."
import { queryOptions } from "@tanstack/vue-query"
import { APIStatic } from "./APIdata"
const baseUrl = `${import.meta.env.VITE_MARKET_API_URL}/api/v1/${poeVersion === '2' ? 'poe2' : 'poe1'}/currency/latest`

export interface TMarketDataItem {
  code: string
  name: string
  category_id: string
  category_label: string
  image: string
  price: {
    unit: string
    buy: number
    divinePer1: number
    chaosPer1?: number
    exaltPer1?: number
    secondCurrencyPer1?: number //custom field

  }
  trust_score: number
  last_updated: string
  last_updated_formatted?: string //custom field
}


export const marketQueryOption = queryOptions({
  queryKey: ['market-data', leagueSelectRef.value],
  queryFn: async () => getLatestMarketData(),
  refetchOnWindowFocus: false,
  refetchOnReconnect: false,
  refetchInterval: 10 * 60 * 1000,
  enabled: () => !!leagueSelectRef.value,
})
export async function getLatestMarketData() {
  const data = await axios.get(baseUrl, {
    params: { league: leagueSelectRef.value },
  }).then(res => res.data) as unknown as Promise<TMarketDataItem[]>
  return data
}

const rtf = new Intl.RelativeTimeFormat('zh-TW', { numeric: 'auto' });
export function getMarketPrice(itemParsed: ParsedItem, marketData: TMarketDataItem[]) {
  const marketItem = marketData.find(m => m.name === itemParsed.baseType || m.code === itemParsed.itemID)
  if (!marketItem || !marketItem.last_updated) return null;

  try {
    const timesAgo = rtf.format(
      Math.floor((new Date(marketItem.last_updated).getTime() - Date.now()) / 60000),
      'minute'
    );
    marketItem.last_updated_formatted = timesAgo;
  } catch { }

  if (poeVersion === '2') {
    marketItem.price.secondCurrencyPer1 = marketItem.price.exaltPer1
  }
  else {
    marketItem.price.secondCurrencyPer1 = marketItem.price.chaosPer1
  }
  return marketItem
}
