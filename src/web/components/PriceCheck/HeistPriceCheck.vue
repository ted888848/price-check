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
  <div class="flex items-center justify-center py-1 hover:cursor-pointer" @click="twoWeekOffline = !twoWeekOffline">
    <span class="mx-1 text-white">2周離線</span>
    <CircleCheck :checked="twoWeekOffline" />
  </div>
  <div v-if="!isSearching" class="my-2 justify-center flex text-xl">
    <button
      class="mx-2 bg-gray-500 text-white rounded px-1 hover:bg-gray-400 disabled:cursor-default disabled:opacity-60 disabled:bg-gray-500"
      :disabled="rateTimeLimit.flag" @click="searchBtn">
      Search
    </button>
    <button
      class="mx-2 bg-gray-500 text-white rounded px-1 hover:bg-gray-400 disabled:cursor-default disabled:opacity-60 disabled:bg-gray-500"
      :disabled="rateTimeLimit.flag" @click="searchOnlyChaos">
      Search2
    </button>
    <div v-if="searchResult.err || searchResult.searchID.ID">
      <button
        class="mx-2 bg-green-400 text-black rounded px-1 hover:bg-green-300 disabled:cursor-default disabled:opacity-60 disabled:bg-green-400"
        :disabled="rateTimeLimit.flag || searchResult.nowFetched >= searchResult.totalCount" @click="fetchMore">
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
    共{{ searchResult.totalCount }}筆,顯示{{ searchResult.nowFetched }}筆
  </span>
  <div v-if="isSearching" class=" text-8xl text-white my-5 text-center flex justify-center">
    <div class="i-svg-spinners:tadpole" />
  </div>
  <span v-if="rateTimeLimit.flag" class="text-white bg-red-600 text-xl text-center my-2 hover:cursor-default">API次數限制
    {{ rateTimeLimit.second }} 秒後再回來
  </span>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { maxBy } from 'lodash-es'
import { searchItem, fetchItem, getIsCounting } from '@/web/lib/tradeSide'
import { heistReward as gemReplicaOptions } from '@/web/lib/APIdata'
import CircleCheck from '../utility/CircleCheck.vue'
import type { ISearchResult, ISearchJson, IFetchResult } from '@/web/lib/tradeSide'
import { secondCurrency, tradeUrl } from '@/web/lib'
import MySelect from '../utility/MySelect.vue'
const props = defineProps<{
  itemProp: ParsedItem;
  leagueSelect: string;
  divineToChaosOrExalted: number;
  isOverflow: () => boolean;
}>()
const { rateTimeLimit } = getIsCounting()

const gemReplicaSelect = ref<HeistReward>()
const gemTransSelect = ref<ArrayValueType<HeistReward['trans']>>()
const searchJSON: ISearchJson = {
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
      option: 'online'
    }
  },
  sort: {
    price: 'asc'
  }
}
const searchResult = ref<ISearchResult>({
  result: [],
  err: false,
  totalCount: 0,
  nowFetched: 0,
  searchID: {
    ID: '', type: 'search'
  }
})
const fetchResult = ref<IFetchResult[]>([])
const isSearching = ref(false)
const twoWeekOffline = ref(false)
watch(twoWeekOffline, (newValue) => {
  if (newValue) {
    searchJSON.query.filters.trade_filters.filters.indexed = {
      option: '2weeks'
    }
    searchJSON.query.status.option = 'any'
  }
  else {
    delete searchJSON.query.filters.trade_filters.filters.indexed
    searchJSON.query.status.option = 'online'
  }
})
function resetSearchData() {
  searchResult.value = {
    result: [],
    err: false,
    totalCount: 0,
    nowFetched: 0,
    searchID: {
      ID: '', type: 'search'
    }
  }
  fetchResult.value = []
  isSearching.value = false
}
async function fetchMore() {
  isSearching.value = true
  const fetchStartPos = searchResult.value.nowFetched
  const fetchEndPos = Math.min(searchResult.value.nowFetched + 20, searchResult.value.totalCount)
  searchResult.value.nowFetched = fetchEndPos
  const fetchList = searchResult.value.result.slice(fetchStartPos, fetchEndPos)
  fetchResult.value = await fetchItem(fetchList, searchResult.value.searchID.ID!, fetchResult.value)
  isSearching.value = false
}
function searchOnlyChaos() {
  searchJSON.query.filters.trade_filters.filters.price.option = 'chaos'
  searchBtn().then(() => { delete searchJSON.query.filters.trade_filters.filters.price.option })
}
async function searchBtn() {
  if (rateTimeLimit.value.flag) return
  resetSearchData()
  isSearching.value = true
  searchJSON.query.name = gemReplicaSelect.value?.name
  searchJSON.query.type = gemReplicaSelect.value?.type
  if (!gemReplicaSelect.value?.name?.startsWith('贗品') && gemTransSelect.value) {
    searchJSON.query.type = {
      option: gemReplicaSelect.value?.type ?? '', discriminator: gemTransSelect.value?.disc
    }
  }
  searchResult.value = await searchItem(searchJSON, props.leagueSelect)
  if (!searchResult.value.err) {
    const fetchStartPos = searchResult.value.nowFetched
    const fetchEndPos = Math.min(searchResult.value.nowFetched + 20, searchResult.value.totalCount)
    searchResult.value.nowFetched = fetchEndPos
    const fetchList = searchResult.value.result.slice(fetchStartPos, fetchEndPos)
    fetchResult.value = await fetchItem(fetchList, searchResult.value.searchID.ID!)
  }
  isSearching.value = false
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