import { poeVersion } from "."
import { queryOptions } from "@tanstack/vue-query"
import { APIStatic } from "./APIdata"
const baseUrl = `${import.meta.env.VITE_MARKET_API_URL}/currency-exchange${poeVersion === '2' ? '/poe2' : ''}`
let lastMarketData: TCurrencyMarket | null = null
export interface TCurrencyMarket {
  [league: string]: {
    [item: string]: TMarketItemRate;
  };
}

export interface TMarketQuoteRate {
  amount: number | null;
  timestamp: number | null;
}

export interface TMarketItemRate {
  chaos?: TMarketQuoteRate;  // for POE1
  exalted?: TMarketQuoteRate; // for POE2
  divine: TMarketQuoteRate;
}

export const marketQueryOption = queryOptions({
  queryKey: ['market-data'],
  queryFn: async () => getLatestMarketData(),
  refetchOnWindowFocus: false,
  refetchOnReconnect: true,
  refetchInterval: 60 * 10 * 1000 + 5000,
  refetchIntervalInBackground: true,
  retryDelay: 5000,
  retry: 3
})
export async function getLatestMarketData() {
  try {
    const res = await fetch(baseUrl)
    if (!res.ok) throw new Error(`Failed to fetch market data: ${res.status}`)
    const data = await res.json() as TCurrencyMarket
    lastMarketData = data
    return data
  } catch (error) {
    if (lastMarketData) {
      return lastMarketData
    }
    throw error
  }
}

export function getMarketPrice(itemParsed: ParsedItem, marketData: TCurrencyMarket, league: string) {
  if (!marketData[league]) return null;
  const itemId = APIStatic.find(i => i.id === itemParsed.itemID)?.id;
  if (!itemId) return null;
  const marketItem = marketData[league][itemId];
  if (!marketItem) return null;
  return marketItem
}
