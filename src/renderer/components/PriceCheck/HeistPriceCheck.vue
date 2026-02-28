<template>
  <div class="flex p-2 items-center justify-center">
    <span class="mx-1 text-white hover:cursor-default">物品:</span>
    <MySelect v-model="gemReplicaSelect" :options="gemReplicaOptions" label-key="text" value-key="text"
      :clearable="true" :filterable="true" class="flex-1" />
  </div>
  <div v-show="!((gemReplicaSelect?.text.startsWith('贗品') && gemReplicaSelect?.trans) ?? true)"
    class="flex p-2 items-center justify-center">
    <span class="mx-1 text-white hover:cursor-default">寶石版本:</span>
    <MySelect v-model="gemTransSelect" :options="gemReplicaSelect?.trans ?? []" label-key="text" value-key="disc"
      :filterable="false" :clearable="true" class="flex-1" />
  </div>
  <div class="flex items-center justify-center py-1 select-none">
    <span class="mx-1 text-white">搜尋類型:</span>
    <MySelect v-model="searchOnlineType" :options="searchOnlineTypeOptions" label-key="label" :reducer="i => i.value"
      class="w-100px" />
  </div>
  <div v-if="!isSearching" class="my-2 justify-center flex text-xl">
    <button
      class="mx-2 bg-gray-500 text-white rounded px-1 hover:bg-gray-400 disabled:cursor-default disabled:opacity-60 disabled:bg-gray-500"
      :disabled="rateTimeLimit.flag" @click="() => searchBtn(false)">
      Search
    </button>
    <button
      class="mx-2 bg-gray-500 text-white rounded px-1 hover:bg-gray-400 disabled:cursor-default disabled:opacity-60 disabled:bg-gray-500"
      :disabled="rateTimeLimit.flag" @click="() => searchBtn(true)">
      Search2
    </button>
    <div v-if="searchResult.err || searchResult.searchID.ID">
      <button
        class="mx-2 bg-green-400 text-black rounded px-1 hover:bg-green-300 disabled:cursor-default disabled:opacity-60 disabled:bg-green-400"
        :disabled="rateTimeLimit.flag || !hasNextPage" @click="fetchMore">
        在20筆
      </button>
      <button
        class="mx-2 bg-blue-800 text-white rounded px-4 hover:bg-blue-700 disabled:cursor-default disabled:opacity-60 disabled:bg-blue-800"
        @click="openBrowser">
        B
      </button>
    </div>
    <button
      class="mx-2 bg-blue-800 text-white rounded px-4 hover:bg-blue-700 disabled:cursor-default disabled:opacity-60 disabled:bg-blue-800"
      @click="openWebView">
      BV
    </button>
  </div>
  <span v-if="parseError" class="text-red-600 text-4xl text-center hover:cursor-default">
    {{ parseError }}
  </span>
  <table v-if="fetchResultSorted.length" class="bg-blue-500 text-center text-white text-sm my-1 mx-5 w-1/2 self-center">
    <thead class="">
      <tr class=" border-b-2 border-red-500 text-base">
        <td class=" hover:cursor-default">
          價格
        </td>
        <td class=" hover:cursor-default">
          數量
        </td>
      </tr>
    </thead>
    <tbody class="">
      <tr v-for="ele in fetchResultSorted" :key="`${ele.price}|${ele.currency}`" class=" border-b-2 border-gray-600"
        :class="{ 'text-red-500 text-xl bg-indigo-600 font-bold': ele.amount === maxAmount!.amount }">
        <td class="flex justify-center items-center">
          {{ ele.price }}<img :src="ele.image" class=" w-7 h-7">
        </td>
        <td>{{ ele.amount }}</td>
      </tr>
    </tbody>
  </table>
  <span v-if="searchResult.err" class="text-red-600 text-4xl text-center hover:cursor-default">
    {{ searchResult.errData || 'Fail' }}
  </span>
  <span v-if="searchResult.searchID?.ID" class="text-white text-2xl text-center hover:cursor-default">
    共{{ searchResult.totalCount }}筆,顯示{{ fetchedCount }}筆
  </span>
  <div v-if="isSearching" class=" text-8xl text-white my-5 text-center flex justify-center">
    <div class="i-svg-spinners:tadpole" />
  </div>
  <span v-if="rateTimeLimit.flag" class="text-white bg-red-600 text-xl text-center my-2 hover:cursor-default">API次數限制
    {{ rateTimeLimit.second.toFixed(1) }} 秒後再回來
  </span>
</template>

<script setup lang="ts">
import { computed, nextTick, reactive, ref, watch, watchEffect } from 'vue'
import { countBy, maxBy } from 'lodash-es'
import { searchItem, fetchItem, selectOptions } from '@/renderer/lib/tradeSide'
import { currencyImageUrl, heistReward as gemReplicaOptions } from '@/renderer/lib/APIdata'
import CircleCheck from '../utility/CircleCheck.vue'
import type { ISearchResult, ISearchJson, IFetchResult } from '@/renderer/lib/tradeSide'
import { poeVersion, secondCurrency, tradeUrl } from '@/renderer/lib'
import MySelect from '../utility/MySelect.vue'
import { getIsCounting } from '@/renderer/lib/ratetimelimit'
import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/vue-query'
const props = defineProps<{
  itemProp: ParsedItem;
  leagueSelect: string;
  divineToChaosOrExalted: number;
  parseError?: string | null;
  isOverflow: () => boolean;
}>()
const { rateTimeLimit } = getIsCounting()
const { searchOnlineTypeOptions: searchOnlineTypeOptions } = selectOptions
const baseSearchJSON = Object.freeze({
  query: {
    filters: {
      trade_filters: {
        filters: {
          collapse: {
            option: true
          },
          price: {
            min: 2
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
      option: 'available'
    }
  },
  sort: {
    price: 'asc'
  }
} satisfies ISearchJson)
const searchJSON: ISearchJson = reactive(structuredClone(baseSearchJSON))
const searchOnlineType = ref<typeof searchOnlineTypeOptions[number]['value']>('online')
watch(searchOnlineType, (newValue) => {
  if (newValue === 'securable') {
    searchJSON.query.status.option = 'securable'
    //@ts-expect-error 
    delete searchJSON.query.filters.trade_filters.filters.price.min
    return;
  }
  searchJSON.query.filters.trade_filters.filters.price.min = 2
  if (newValue === 'online') {
    searchJSON.query.status.option = 'available'
    return
  }
  if (newValue === '1week') {
    searchJSON.query.filters.trade_filters.filters.indexed = {
      option: '1week'
    }
    searchJSON.query.status.option = 'any'
    return
  }
  searchJSON.query.status.option = 'any'
})

const gemTransSelect = ref<ArrayValueType<HeistReward['trans']>>()
watch(gemTransSelect, (newValue) => {
  if (!gemReplicaSelect.value?.name?.startsWith('贗品') && newValue) {
    searchJSON.query.type = {
      option: gemReplicaSelect.value?.type ?? '', discriminator: newValue?.disc ?? ''
    }
  }
  else {
    delete searchJSON.query.type
  }
})
const gemReplicaSelect = ref<HeistReward>()
watch(gemReplicaSelect, (newValue) => {
  if (newValue) {
    searchJSON.query.name = newValue.name
    searchJSON.query.type = newValue.type
  }
  else {
    delete searchJSON.query.name
  }
})

watchEffect(() => {
  if (gemReplicaSelect.value) {
    searchJSON.query.name = gemReplicaSelect.value.name
    searchJSON.query.type = gemReplicaSelect.value.type
  }
  else {
    delete searchJSON.query.name
    delete searchJSON.query.type
  }
  if (!gemReplicaSelect.value?.name?.startsWith('贗品') && gemTransSelect.value) {
    searchJSON.query.type = {
      option: gemReplicaSelect.value?.type ?? '', discriminator: gemTransSelect.value.disc ?? ''
    }
  }
})


const { data: searchResult, isFetching: isFetchingSearchResult, refetch: refetchSearchItem, isFetched: isFetchedSearchItem } = useQuery<ISearchResult>({
  queryKey: ['searchItemHeist'],
  queryFn: () => {
    return searchItem(searchJSON, props.leagueSelect)
  },
  enabled: false,
  staleTime: 0,
  gcTime: 0,
  initialData: {
    result: [],
    totalCount: 0,
    searchID: {
      ID: '', type: 'search'
    },
    err: false
  }
})

const { data: searchItemFetchResult, hasNextPage, fetchNextPage, isFetchingNextPage } = useInfiniteQuery({
  queryKey: ['fetchItemHeist', searchResult.value.searchID.ID, searchResult.value.result],
  queryFn: ({ pageParam }) => {
    const startIndex = pageParam * 20
    const endIndex = Math.min(startIndex + 20, searchResult.value.result.length)
    const searchResultList = (searchResult.value as unknown as ISearchResult).result.slice(startIndex, endIndex)
    return fetchItem(searchResultList, searchResult.value.searchID.ID!)
  },
  initialPageParam: 0,
  getNextPageParam: (lastPage, pages) => {
    const fetchedCount = pages.length * 20
    if (fetchedCount < (searchResult.value as unknown as ISearchResult).totalCount) {
      return pages.length
    }
    return undefined
  },
  staleTime: 0,
  gcTime: 0,
  enabled: false
})

function fetchMore() {
  if (rateTimeLimit.value.flag) return
  fetchNextPage()
}

const isSearching = computed(() => isFetchingSearchResult.value || isFetchingNextPage.value)

const fetchedCount = computed(() => {
  return searchItemFetchResult.value ? searchItemFetchResult.value.pages.flat().length : 0
})
const fetchResult = computed<IFetchResult[]>(() => {
  if (searchItemFetchResult.value) {
    const searchResultsFlat = searchItemFetchResult.value.pages.flat()
    const countByFetchResult = countBy(searchResultsFlat)
    const fetchResult: IFetchResult[] = []
    for (const key in countByFetchResult) {
      const [price, currency] = key.split('|') as [string, string]
      const numPrice = Number(price)
      const fetchResultFind = fetchResult.find((e) => (e.price === numPrice && e.currency === currency))
      if (fetchResultFind) {
        fetchResultFind.amount += countByFetchResult[key]!
      }
      else {
        fetchResult.push({
          price: numPrice,
          currency,
          amount: countByFetchResult[key]!,
          image: `${import.meta.env.VITE_URL_BASE}${currencyImageUrl.find(ele => ele.id === currency)?.image}`
        })
      }
    }
    return fetchResult
  }
  return []
})

const queryClient = useQueryClient()

async function searchBtn(onlyChaosOrExalted = false) {
  if (rateTimeLimit.value.flag) return
  searchJSON.query.filters.trade_filters.filters.price.option = onlyChaosOrExalted ? 'chaos' : undefined
  queryClient.removeQueries({ queryKey: ['fetchItemHeist'] })
  queryClient.removeQueries({ queryKey: ['searchItemHeist'] })
  await refetchSearchItem()
  await fetchNextPage()
}

const fetchResultSorted = computed(() => {
  if (props.divineToChaosOrExalted) {
    return fetchResult.value.slice().sort((a, b) => {
      if (!['divine', secondCurrency].includes(a.currency)) return 1
      if (!['divine', secondCurrency].includes(b.currency)) return -1
      const ca = a.currency === 'divine' ? (a.price as number) * props.divineToChaosOrExalted : a.price as number
      const cb = b.currency === 'divine' ? (b.price as number) * props.divineToChaosOrExalted : b.price as number
      return ca - cb
    })
  }
  else
    return fetchResult.value
})

const maxAmount = computed(() => {
  return maxBy(fetchResult.value, ele => ele.amount)
})

const emit = defineEmits<{
  'open-web-view': [extendUrl: string];
}>()
function openWebView() {
  emit('open-web-view', `search/${props.leagueSelect}/${searchResult.value.searchID.ID}`)
}
function openBrowser() {
  window.open(encodeURI(`${import.meta.env.VITE_URL_BASE}/${tradeUrl}/${searchResult.value.searchID.type}/${props.leagueSelect}/${searchResult.value.searchID.ID}`))
}
</script>

<style></style>