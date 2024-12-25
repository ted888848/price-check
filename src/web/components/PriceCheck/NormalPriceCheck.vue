<template>
  <div class="text-xl text-white my-1 text-center center gap-8px"
    @click="() => item.type.searchByType = Boolean(!item.type.searchByType && item.type.option)">
    <span v-if="item.name">{{ item.name }}</span>
    <div class="center gap-12px">
      <img v-if="itemProp.baseType === '滿靈柩'" class="h-28px" src="/coffin-dance.gif">
      <span :class="{ 'text-red-500': item.type.searchByType }">
        {{ item.elderMap ?
          `尊師守衛 ${elderMapOptions.find(e => e.value === item.elderMap!.value?.option)?.label}` :
          item.conquerorMap ?
            `征服者 ${conquerorMapOptions.find(e => e.value === item.conquerorMap!.value?.option)?.label}` : item.baseType
        }}
      </span>
      <img v-if="itemProp.baseType === '滿靈柩'" class="h-28px" src="/coffin-dance.gif">
    </div>
  </div>
  <div class="text-white text-center flex justify-between px-2">
    <span :style="{ visibility: item.pDPS ? 'visible' : 'hidden' }" class=" w-40">PDps: {{ item.pDPS }}</span>
    <span v-if="item.type.text" class="flex-1" :class="{ 'text-3xl': item.type.searchByType }">
      {{ item.type.text }}
    </span>
    <span :style="{ visibility: item.eDPS ? 'visible' : 'hidden' }" class=" w-40">EDps: {{ item.eDPS }}</span>
  </div>
  <VSelect v-if="undefinedUnique && item.uniques.length > 0" v-model="item.name" class="text-sm style-chooser"
    :options="item.uniques" label="name" :reduce="(ele: ArrayValueType<typeof item['uniques']>) => ele.name" />
  <div class="mx-0  bg-blue-900 grid grid-cols-3 select-none">
    <div v-if="!item.searchExchange.option" class="flex p-2 items-center justify-center">
      <span class="mx-1 text-white hover:cursor-default">汙染:</span>
      <VSelect v-model="item.isCorrupt" class="text-sm style-chooser flex-grow" :options="generalOption" label="label"
        :reduce="(ele: ArrayValueType<typeof generalOption>) => ele.value" :clearable="false" :searchable="false" />
    </div>
    <div v-if="!item.searchExchange.option && !item.type.text.endsWith('技能寶石')"
      class="flex p-2 items-center justify-center select-none">
      <span class="mx-1 text-white hover:cursor-default">已鑑定:</span>
      <VSelect v-model="item.isIdentify" class="text-sm style-chooser flex-grow" :options="generalOption" label="label"
        :reduce="(ele: ArrayValueType<typeof generalOption>) => ele.value" :clearable="false" :searchable="false" />
    </div>
    <div v-if="item.searchExchange.option" class="center p-2 select-none col-start-2">
      <span class="mx-1 text-white hover:cursor-default">使用:</span>
      <VSelect v-model="searchExchangeState" class="text-sm style-chooser flex-grow" :options="exchangeHave"
        label="label" :reduce="(ele: ArrayValueType<typeof exchangeHave>) => ele.value" :clearable="false"
        :searchable="false" />
    </div>
    <div v-if="!item.searchExchange.option" class="flex items-center justify-center">
      <ValueMinMax v-if="item.gemLevel" v-model="item.gemLevel" class="flex p-2 items-center justify-center">
        寶石等級:
      </ValueMinMax>
      <ValueMinMax v-else-if="item.mapTier" v-model="item.mapTier" class="flex p-2 items-center justify-center">
        地圖階級:
      </ValueMinMax>
      <ValueMinMax v-else-if="item.itemLevel" v-model="item.itemLevel" class="flex p-2 items-center justify-center">
        物品等級:
      </ValueMinMax>
    </div>
    <ValueMinMax v-if="!item.searchExchange.option" v-model="item.quality" class="flex p-2 items-center justify-center">
      品質:
    </ValueMinMax>
    <div v-if="item.blightedMap" class="flex items-center justify-center">
      <span class="mx-1 text-white hover:cursor-default">凋落圖</span>
    </div>
    <div v-else-if="item.UberBlightedMap" class="flex items-center justify-center">
      <span class="mx-1 text-white hover:cursor-default">Uber凋落圖</span>
    </div>
    <div v-else-if="item.isWeaponOrArmor || ['項鍊', '戒指', '腰帶', '箭袋'].includes(item.type.text)"
      class="flex col-span-2 items-center justify-center select-none">
      <span class="mx-1 text-white hover:cursor-default">勢力:</span>
      <div class=" flex-grow mx-1">
        <VSelect v-model="item.influences" class="text-sm style-chooser style-chooser-inf" :options="influencesOptions"
          label="label" :searchable="false" multiple />
      </div>
    </div>
    <div v-if="item.search6L !== undefined" class="flex items-center justify-center py-1 hover:cursor-pointer"
      @click="() => item.search6L = !item.search6L">
      <span class="mx-1 text-white">6L?</span>
      <CircleCheck :have-undefined="true" :checked="item.search6L" />
    </div>
    <div v-if="item.isRGB !== undefined" class="flex items-center justify-center py-1 hover:cursor-pointer"
      @click="() => item.isRGB = !item.isRGB">
      <span class="mx-1 text-white">RGB?</span>
      <CircleCheck :checked="item.isRGB" />
    </div>
    <div v-if="!item.searchExchange.option" class="flex items-center justify-center py-1 select-none">
      <span class="mx-1 text-white hover:cursor-default">稀有度:</span>
      <VSelect v-model="item.raritySearch" class="text-sm style-chooser w-24" :options="rarityOptions" label="label"
        :searchable="false" :clearable="false" />
    </div>
    <div v-if="!item.searchExchange.option" class="flex items-center justify-center py-1 hover:cursor-pointer"
      @click="() => item.searchTwoWeekOffline = !item.searchTwoWeekOffline">
      <span class="mx-1 text-white">2周離線</span>
      <CircleCheck :checked="item.searchTwoWeekOffline" />
    </div>
  </div>
  <table v-if="item.stats.length" class="bg-gray-700 text-center mt-1 text-white text-sm">
    <thead class="bg-green-600" @click="_event => modTbodyToggle = !modTbodyToggle">
      <tr class="text-lg">
        <td class="w-6 text-center hover:cursor-default">
          查
        </td>
        <td class="w-14 text-center hover:cursor-default">
          種類
        </td>
        <td class="text-center hover:cursor-default">
          詞綴
        </td>
        <td class="w-11 text-center hover:cursor-default">
          最小
        </td>
        <td class="w-11 text-center hover:cursor-default">
          最大
        </td>
      </tr>
    </thead>
    <tbody v-show="modTbodyToggle" class="modsTbody" style="">
      <tr v-for="mod in item.stats" :key="mod.id" class=" border-b-2 border-gray-400">
        <td class="text-base" @click="() => mod.disabled = !mod.disabled">
          <CircleCheck :checked="!mod.disabled" />
        </td>
        <td class=" text-lg font-semibold hover:cursor-default" :style="{ color: modTextColor(mod.type) }"
          @click="() => mod.disabled = !mod.disabled">
          {{ mod.type }}
        </td>
        <td @click="() => mod.disabled = !mod.disabled">
          <span v-if="!Array.isArray(mod.text)">{{ mod.text }}</span>
          <div v-else class=" text-center">
            <span v-for="t in mod.text" :key="t">{{ t }}<br></span>
          </div>
        </td>
        <td>
          <input v-if="mod.value && !mod.value.option" v-model.number="mod.value.min" type="number"
            class="w-8 appearance-none rounded bg-gray-400 text-center text-black font-bold"
            @dblclick="() => delete mod.value!.min">
        </td>
        <td>
          <input v-if="mod.value && !mod.value.option" v-model.number="mod.value.max" type="number"
            class="w-8 appearance-none rounded bg-gray-400 text-center text-black font-bold"
            @dblclick="() => delete mod.value!.max">
        </td>
      </tr>
    </tbody>
  </table>
  <div v-if="!isSearching" class="my-2 justify-center flex text-xl">
    <button
      class="mx-2 bg-gray-500 text-white rounded px-1 hover:bg-gray-400 disabled:cursor-default disabled:opacity-60 disabled:bg-gray-500"
      :disabled="rateTimeLimit.flag" @click="searchBtn">
      Search
    </button>
    <button
      class="mx-2 bg-gray-500 text-white rounded px-1 hover:bg-gray-400 disabled:cursor-default disabled:opacity-60 disabled:bg-gray-500"
      :disabled="rateTimeLimit.flag" @click="searchOnlyChaosOrExalted">
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
        :disabled="rateTimeLimit.flag" @click="openBrowser">
        B
      </button>
    </div>
    <button
      class="mx-2 bg-blue-800 text-white rounded px-4 hover:bg-blue-700 disabled:cursor-default disabled:opacity-60 disabled:bg-blue-800"
      :disabled="rateTimeLimit.flag" @click="openWebView">
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
        :class="{ 'text-yellow-400 text-xl bg-indigo-700 font-bold': ele.amount === maxAmount!.amount }">
        <td v-if="item.searchExchange.option" class="flex justify-center items-center">
          <img :src="ele.image" class=" w-7 h-7">{{ ele.price }}<img :src="currency2Img" class=" w-7 h-7">
        </td>
        <td v-else class="flex justify-center items-center">
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
  <span v-if="rateTimeLimit.flag" class="text-white bg-red-600 text-xl text-center my-2 hover:cursor-default">
    API次數限制 {{ rateTimeLimit.second }} 秒後再回來
  </span>
</template>

<script setup lang="ts">
import { maxBy } from 'lodash-es'
import { computed, ref, nextTick, watch } from 'vue'
import {
  getSearchJSON, searchItem, fetchItem, getIsCounting, searchExchange, selectOptions,
} from '@/web/lib/tradeSide'
import IPC from '@/ipc'
import { APIStatic } from '@/web/lib/APIdata'
import CircleCheck from '../utility/CircleCheck.vue'
import ValueMinMax from '../utility/ValueMinMax.vue'
import type { ISearchResult, IExchangeResult, IFetchResult } from '@/web/lib/tradeSide'
import { secondCurrency, tradeUrl } from '@/web/lib'
const props = defineProps<{
  itemProp: ParsedItem;
  leagueSelect: string;
  divineToChaosOrExalted: number;
  isOverflow: () => boolean;
}>()
const { rateTimeLimit } = getIsCounting()
const item = ref(props.itemProp)
if (process.env.NODE_ENV === 'development') console.log(item.value)
const undefinedUnique = item.value.isIdentify === false && item.value.raritySearch.label === '傳奇'

const {
  generalOption, influencesOptions, elderMapOptions,
  conquerorMapOptions, rarityOptions, exchangeHave
} = selectOptions
function modTextColor(type?: string) {
  switch (type) {
    case '固定':
      return '#346beb'
    case '附魔':
      return '#41e635'
    case '破裂':
      return '#eba536'
    case '隨機':
      return 'red'
    case '偽屬性':
      return '#9936eb'
    default:
      return 'white'
  }
}

const searchResult = ref<ISearchResult | IExchangeResult>({
  result: [],
  totalCount: 0,
  nowFetched: 0,
  searchID: {
    ID: '', type: 'search'
  },
  err: false
})
const fetchResult = ref<IFetchResult[]>([])
const isSearching = ref(false)
const modTbodyToggle = ref(true)
const currency2Img = ref('')
function searchOnlyChaosOrExalted() {
  item.value.onlyChaosOrExalted = true
  searchBtn().then(() => { item.value.onlyChaosOrExalted = false })
}
function resetSearchData() {
  searchResult.value = {
    result: [],
    totalCount: 0,
    nowFetched: 0,
    searchID: {
      ID: '', type: 'search'
    },
    err: false
  }
  fetchResult.value = []
  isSearching.value = false
  modTbodyToggle.value = true
  currency2Img.value = ''
}
async function fetchMore() {
  isSearching.value = true
  const fetchStartPos = searchResult.value.nowFetched
  const fetchEndPos = Math.min(searchResult.value.nowFetched + 20, searchResult.value.totalCount)
  searchResult.value.nowFetched = fetchEndPos
  const fetchList = searchResult.value.result.slice(fetchStartPos, fetchEndPos) as string[]
  fetchResult.value = await fetchItem(fetchList, searchResult.value.searchID.ID!, fetchResult.value)
  isSearching.value = false
  nextTick(() => { modTbodyToggle.value = !props.isOverflow() })
}
async function searchBtn() {
  if (rateTimeLimit.value.flag) return
  resetSearchData()
  isSearching.value = true
  if (item.value.searchExchange.option) {
    searchResult.value = (await searchExchange(item.value, props.leagueSelect))
    if (!searchResult.value.err) {
      const image = APIStatic.find(ele => ele.id === (searchResult.value as IExchangeResult).currency2)!.image
      currency2Img.value = image ? `${import.meta.env.VITE_URL_BASE}${image}` : ''
      fetchResult.value = searchResult.value.result
    }
  }
  else {
    searchResult.value = await searchItem(getSearchJSON(item.value), props.leagueSelect)
    if (!searchResult.value.err) {
      const fetchStartPos = searchResult.value.nowFetched
      const fetchEndPos = Math.min(searchResult.value.nowFetched + 20, searchResult.value.totalCount)
      searchResult.value.nowFetched = fetchEndPos
      const fetchList = searchResult.value.result.slice(fetchStartPos, fetchEndPos)
      fetchResult.value = await fetchItem(fetchList, searchResult.value.searchID.ID!)
    }
  }
  isSearching.value = false
  nextTick(() => { modTbodyToggle.value = !props.isOverflow() })
}

const fetchResultSorted = computed(() => {
  if (props.divineToChaosOrExalted) {
    if (item.value.searchExchange.option) {
      return fetchResult.value.slice().sort((a, b) => {
        const [aCurrencyCount, aItemCount] = (a.price as string).split('：').map(Number)
        const aPrice = aCurrencyCount / aItemCount
        const [bCurrencyCount, bItemCount] = (b.price as string).split('：').map(Number)
        const bPrice = bCurrencyCount / bItemCount
        const ca = a.currency === 'divine' ? aPrice * props.divineToChaosOrExalted : aPrice as number
        const cb = b.currency === 'divine' ? bPrice * props.divineToChaosOrExalted : bPrice as number
        return ca - cb
      })
    }
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
const maxAmount = computed(() => maxBy(fetchResult.value, ele => ele.amount))
const searchExchangeState = computed<Config['searchExchangePrefer']>({
  get() {
    if (item.value.searchExchange.have.length === 2 &&
      (item.value.searchExchange.have.includes('chaos') || item.value.searchExchange.have.includes('exalted')) &&
      item.value.searchExchange.have.includes('divine')
    )
      return 'divine&(C or Ex)' as Config['searchExchangePrefer']
    return item.value.searchExchange.have[0] as Config['searchExchangePrefer']
  },
  set(value,) {
    if (value === 'divine&(C or Ex)') {
      item.value.searchExchange.have = [secondCurrency, 'divine']
    }
    else {
      item.value.searchExchange.have = [value]
    }
    searchBtn()
  }
})
watch(searchExchangeState, (value) => {
  window.ipc.send(IPC.UPDATE_CONFIG, JSON.stringify({ searchExchangePrefer: value } satisfies Partial<Config>))
})


const emit = defineEmits<{
  'open-web-view': [extendUrl: string];
}>()
function openWebView() {
  emit('open-web-view', `${searchResult.value.searchID.type}/${props.leagueSelect}/${searchResult.value.searchID.ID}`)
}
function openBrowser() {
  window.open(encodeURI(`${import.meta.env.VITE_URL_BASE}/${tradeUrl}/${searchResult.value.searchID.type}/${props.leagueSelect}/${searchResult.value.searchID.ID}`))
}
if (item.value.autoSearch)
  searchBtn()

</script>

<style></style>