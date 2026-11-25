<template>
  <template v-if="!props.parseError">
    <MySelect
      v-if="undefinedUnique && item.uniques.length > 0"
      v-model="item.name"
      :options="item.uniques"
      label-key="name"
      :reducer="(i) => i.name"
      class="mx-4px"
    />
    <div
      class="text-xl text-white my-1 text-center center gap-8px"
      @click="() => (item.type.searchByType = Boolean(!item.type.searchByType && item.type.option))"
    >
      <span v-if="item.name && !item.elderMap && !item.conquerorMap">{{ item.name }}</span>
      <div class="center gap-4px">
        <span>
          {{
            item.elderMap
              ? `尊師守衛 ${elderMapOptions.find((e) => e.value === item.elderMap!.value?.option)?.label}`
              : item.conquerorMap
                ? `征服者 ${conquerorMapOptions.find((e) => e.value === item.conquerorMap!.value?.option)?.label}`
                : null
          }}
        </span>
        <span :class="{ 'text-red-500': item.type.searchByType }">
          {{ item.baseType }}
        </span>
      </div>
    </div>

    <div class="text-white text-center flex justify-between px-2">
      <span :style="{ visibility: item.pDPS ? 'visible' : 'hidden' }" class="w-40">PDps: {{ item.pDPS }}</span>
      <span v-if="item.type.text" class="flex-1" :class="{ 'text-3xl': item.type.searchByType }">
        {{ item.type.text }}
      </span>
      <span :style="{ visibility: item.eDPS ? 'visible' : 'hidden' }" class="w-40">EDps: {{ item.eDPS }}</span>
    </div>
    <div v-if="item.map_completion_reward" class="text-white center px-2">
      <span class="flex-1">
        {{ item.map_completion_reward }}
      </span>
    </div>
    <div v-if="item.inscribed" class="text-white center px-2">
      <div
        class="flex-1 flex flex-col"
        :class="{ 'text-red-500': !item.inscribed.searchRequirementItem }"
        @click="
          () => {
            if (!item.inscribed || item.inscribed.rewardItem?.startsWith('翻倍獻祭的') || item.inscribed.rewardItem === '物品和複製品') return;
            item.inscribed.searchRequirementItem = !item.inscribed.searchRequirementItem;
          }
        "
      >
        獻祭: {{ item.inscribed.requirementItem }}
        <span v-if="item.inscribed.rewardItem?.startsWith('翻倍獻祭的')" class="text-yellow-500 text-xs"> 目前沒有辦法顯示該筆是x1還是x4翻倍 </span>
      </div>
      <span class="flex-1"> 獎勵: {{ item.inscribed.rewardItem }} </span>
    </div>
    <div class="mx-0 bg-blue-900 grid grid-cols-3 select-none">
      <div v-if="!item.searchExchange.option" class="flex p-2 items-center justify-center">
        <span class="mx-1 text-white hover:cursor-default">汙染:</span>
        <MySelect v-model="corruptComputed" :options="corruptOption" label-key="label" :reducer="(i) => i.value" class="flex-1" />
      </div>
      <div v-if="!item.searchExchange.option && !item.type.text.endsWith('技能寶石')" class="flex p-2 items-center justify-center select-none">
        <span class="mx-1 text-white hover:cursor-default">已鑑定:</span>
        <MySelect v-model="item.isIdentify" :options="generalOption" label-key="label" :reducer="(i) => i.value" class="flex-1" />
      </div>
      <div v-if="item.searchExchange.option" class="select-none col-start-2 center p-2">
        <span class="mx-1 text-white hover:cursor-default">使用:</span>
        <MySelect v-model="searchExchangeState" :options="exchangeHave" label-key="label" :reducer="(i) => i.value" class="flex-1" />
      </div>
      <div v-if="!item.searchExchange.option" class="flex items-center justify-center">
        <ValueMinMax v-if="item.gemLevel" v-model="item.gemLevel" class="flex p-2 items-center justify-center"> 寶石等級: </ValueMinMax>
        <ValueMinMax v-else-if="item.mapTier" v-model="item.mapTier" class="flex p-2 items-center justify-center"> 地圖階級: </ValueMinMax>
        <ValueMinMax v-else-if="item.itemLevel" v-model="item.itemLevel" class="flex p-2 items-center justify-center"> 物品等級: </ValueMinMax>
      </div>
      <ValueMinMax v-if="!item.searchExchange.option" v-model="item.quality" class="flex p-2 items-center justify-center"> 品質: </ValueMinMax>
      <div v-if="item.blightedMap" class="flex items-center justify-center">
        <span class="mx-1 text-white hover:cursor-default">凋落圖</span>
      </div>
      <div v-else-if="item.UberBlightedMap" class="flex items-center justify-center">
        <span class="mx-1 text-white hover:cursor-default">Uber凋落圖</span>
      </div>

      <div v-if="item.type.option === 'map'" class="flex items-center justify-center" @click="() => (item.memoryMap = !item.memoryMap)">
        <span class="mx-1 text-white hover:cursor-default">記憶地圖</span>
        <CircleCheck :have-undefined="true" :checked="item.memoryMap ?? false" />
      </div>
      <div
        v-else-if="item.isWeaponOrArmor || ['項鍊', '戒指', '腰帶', '箭袋'].includes(item.type.text)"
        class="flex col-span-2 items-center justify-center select-none"
      >
        <span class="mx-1 text-white hover:cursor-default">勢力:</span>
        <div class="flex-grow mx-1">
          <MySelect
            v-model="item.influences"
            :options="influencesOptions"
            label-key="label"
            value-key="id"
            :multiple="true"
            :center-label="false"
            class="flex-1"
          />
        </div>
      </div>
      <div
        v-if="item.search6L !== undefined"
        class="flex items-center justify-center py-1 hover:cursor-pointer"
        @click="() => (item.search6L = !item.search6L)"
      >
        <span class="mx-1 text-white">6L?</span>
        <CircleCheck :have-undefined="true" :checked="item.search6L" />
      </div>
      <div
        v-if="item.isRGB !== undefined"
        class="flex items-center justify-center py-1 hover:cursor-pointer"
        @click="() => (item.isRGB = !item.isRGB)"
      >
        <span class="mx-1 text-white">RGB?</span>
        <CircleCheck :checked="item.isRGB" />
      </div>
      <div v-if="!item.searchExchange.option" class="flex items-center justify-center py-1 select-none">
        <span class="mx-1 text-white hover:cursor-default">稀有度:</span>
        <MySelect v-model="item.raritySearch" :options="rarityOptions" label-key="label" value-key="value" class="flex-1" />
      </div>
      <div v-if="!item.searchExchange.option" class="flex items-center justify-center py-1 select-none">
        <span class="mx-1 text-white">搜尋類型:</span>
        <MySelect v-model="item.searchOnlineType" :options="searchOnlineTypeOptions" label-key="label" :reducer="(i) => i.value" class="flex-1" />
      </div>

      <div
        v-if="item.type.option === 'gem.activegem'"
        class="flex items-center justify-center hover:cursor-pointer"
        @click="() => (item.vaalVer = !item.vaalVer)"
      >
        <span class="mx-1 text-white">瓦爾版</span>
        <CircleCheck :have-undefined="true" :checked="item.vaalVer ?? false" />
      </div>

      <div
        v-if="item.isMirrored !== undefined"
        class="flex items-center justify-center hover:cursor-pointer"
        @click="() => (item.isMirrored = !item.isMirrored)"
      >
        <span class="mx-1 text-white">已複製</span>
        <CircleCheck :have-undefined="true" :checked="item.isMirrored ?? false" />
      </div>

      <!-- 3.27 新增穢生選項 -->
      <div
        v-if="item.foulborn !== undefined"
        class="flex items-center justify-center hover:cursor-pointer"
        @click="() => (item.foulborn = !item.foulborn)"
      >
        <span class="mx-1 text-white">穢生:</span>
        <CircleCheck :have-undefined="true" :checked="item.foulborn ?? false" />
      </div>
      <ValueMinMax v-if="item.socketCount" v-model="item.socketCount" class="flex p-2 items-center justify-center"> 插槽: </ValueMinMax>
    </div>

    <ModTable :stats="item.stats" :expanded="modTbodyToggle" @update:expanded="modTbodyToggle = $event" />

    <SearchFunctions
      :is-searching="isSearching"
      :is-active="isActive"
      :show-result-actions="Boolean(searchResult.err || searchResult.searchID.ID)"
      :has-next-page="Boolean(hasNextPage)"
      @search="searchBtn"
      @fetch-more="fetchMore"
      @open-browser="openBrowser"
      @open-web-view="openWebView"
    />
    <div v-if="marketPrice" class="text-white text-18px text-center my-1 flex-col center gap-2px">
      <div class="text-16px">市場價:</div>
      <MarketPrice
        v-if="marketPrice.divine.amount !== null"
        :amount="marketPrice.divine.amount"
        :timestamp="marketPrice.divine.timestamp"
        :item-image="itemImage"
        :currency-image="divineImage"
        type="divine"
        :divineToChaosOrExalted="divineToChaosOrExalted"
      />
      <MarketPrice
        v-if="marketPrice.exalted && marketPrice.exalted.amount !== null"
        :amount="marketPrice.exalted.amount"
        :timestamp="marketPrice.exalted.timestamp"
        :item-image="itemImage"
        :currency-image="chaosOrExImage"
        type="chaosOrEx"
        :divineToChaosOrExalted="divineToChaosOrExalted"
      />
      <MarketPrice
        v-if="marketPrice.chaos && marketPrice.chaos.amount !== null"
        :amount="marketPrice.chaos.amount"
        :timestamp="marketPrice.chaos.timestamp"
        :item-image="itemImage"
        :currency-image="chaosOrExImage"
        type="chaosOrEx"
        :divineToChaosOrExalted="divineToChaosOrExalted"
      />
    </div>
    <PriceResultTable
      :results="fetchResultSorted"
      :max-amount="maxAmount"
      :second-max-amount="secondMaxAmount"
      :is-exchange="Boolean(item.searchExchange.option)"
      :currency2-image="currency2Img"
      :search-result="searchResult"
      :fetched-count="fetchedCount"
      :is-searching="isSearching"
      :is-active="isActive"
      :remaining="remaining"
    />
  </template>
  <span v-if="parseError" class="text-red-600 text-4xl text-center hover:cursor-default">
    {{ parseError }}
  </span>
</template>

<script setup lang="ts">
import { countBy, maxBy } from "lodash-es";
import { computed, ref, nextTick, watch, onUnmounted, toRaw } from "vue";
import { getSearchJSON, searchItem, fetchItem, searchExchange, selectOptions } from "@/renderer/lib/tradeSide";
import IPC from "@/ipc";
import { APIStatic, divineImage, chaosOrExImage, currencyImageUrl } from "@/renderer/lib/APIdata";
import CircleCheck from "../../components/utility/CircleCheck.vue";
import ValueMinMax from "../../components/utility/ValueMinMax.vue";
import type { ISearchResult, IExchangeResult, IFetchResult } from "@/renderer/lib/tradeSide";
import { secondCurrency, tradeUrl } from "@/renderer/lib";
import MySelect from "../../components/utility/MySelect.vue";
import { useMyCountdown } from "@/renderer/lib/ratetimelimit";
import { useInfiniteQuery, useQuery, useQueryClient } from "@tanstack/vue-query";
import { getMarketPrice, marketQueryOption, type TMarketItemRate } from "@/renderer/lib/market";
import MarketPrice from "../../components/utility/MarketPrice.vue";
import ModTable from "./components/ModTable.vue";
import SearchFunctions from "./components/SearchFunctions.vue";
import PriceResultTable from "./components/PriceResultTable.vue";
import { DOUBLE_CORRUPT_VALUE } from "@/renderer/lib/const";
const props = defineProps<{
  itemProp: ParsedItem;
  leagueSelect: string;
  divineToChaosOrExalted: number;
  parseError?: string | null;
  isOverflow: () => boolean;
  prevSearch?: boolean;
}>();
const modTbodyToggle = ref(true);
const queryClient = useQueryClient();
if (!props.prevSearch) {
  queryClient.removeQueries({ queryKey: ["searchItem"] });
  queryClient.removeQueries({ queryKey: ["fetchItem"] });
}

const { remaining, isActive } = useMyCountdown();
const item = ref(props.itemProp);
const itemImage = computed(() => {
  const image = APIStatic.find((ele) => ele.id === item.value.itemID)?.image;
  return image ? `${import.meta.env.VITE_URL_BASE}${image}` : "";
});
// oxlint-disable-next-line no-console
if (process.env.NODE_ENV === "development") console.log(structuredClone(toRaw(item.value)));
const undefinedUnique = item.value.isIdentify === false && item.value.raritySearch.label === "傳奇";

const marketPrice = ref<TMarketItemRate | null>(null);
watch(
  () => item.value,
  () => {
    const marketData = queryClient.getQueryData(marketQueryOption.queryKey);
    if (marketData) {
      marketPrice.value = getMarketPrice(item.value, marketData, props.leagueSelect);
    }
  },
  { immediate: true },
);
const {
  generalOption,
  corruptOption,
  influencesOptions,
  elderMapOptions,
  conquerorMapOptions,
  rarityOptions,
  exchangeHave,
  searchOnlineTypeOptions,
} = selectOptions;
const {
  data: searchResult,
  isFetching: isFetchingSearchResult,
  refetch: refetchSearchItem,
  isFetched: isFetchedSearchItem,
} = useQuery<ISearchResult | IExchangeResult>({
  queryKey: ["searchItem"],
  queryFn: () => {
    if (item.value.searchExchange.option) {
      return searchExchange(item.value, props.leagueSelect);
    } else return searchItem(getSearchJSON(item.value), props.leagueSelect);
  },
  enabled: false,
  staleTime: 5 * 60 * 1000,
  gcTime: 5 * 60 * 1000,
  initialData: {
    result: [],
    totalCount: 0,
    searchID: {
      ID: "",
      type: "search",
    },
    err: false,
  },
});
const currency2Img = computed(() => {
  if (!item.value.searchExchange.option || isFetchingSearchResult.value || !searchResult.value.result.length || searchResult.value.err) {
    return "";
  }

  const image = APIStatic.find((ele) => ele.id === (searchResult.value as IExchangeResult).currency2)?.image;
  return image ? `${import.meta.env.VITE_URL_BASE}${image}` : "";
});

const {
  data: searchItemFetchResult,
  hasNextPage,
  fetchNextPage,
  isFetchingNextPage,
} = useInfiniteQuery({
  queryKey: ["fetchItem"],
  queryFn: ({ pageParam }) => {
    const startIndex = pageParam * item.value.fetchCount;
    const endIndex = Math.min(startIndex + item.value.fetchCount, searchResult.value.result.length);
    const searchResultList = (searchResult.value as unknown as ISearchResult).result.slice(startIndex, endIndex);
    return fetchItem(searchResultList, searchResult.value.searchID.ID);
  },
  initialPageParam: 0,
  getNextPageParam: (_lastPage, pages) => {
    const fetchedCount = pages.length * item.value.fetchCount;
    if (fetchedCount < (searchResult.value as unknown as ISearchResult).totalCount) {
      return pages.length;
    }
    return undefined;
  },
  staleTime: 5 * 60 * 1000,
  gcTime: 5 * 60 * 1000,
  enabled: false,
});

function fetchMore() {
  if (isActive.value) return;
  fetchNextPage();
}

const isSearching = computed(() => isFetchingSearchResult.value || isFetchingNextPage.value);

const fetchedCount = computed(() => {
  if (item.value.searchExchange.option) {
    return (searchResult.value as IExchangeResult).totalCount;
  } else {
    return searchItemFetchResult.value ? searchItemFetchResult.value.pages.flat().length : 0;
  }
});
const fetchResult = computed<IFetchResult[]>(() => {
  if (item.value.searchExchange.option) {
    if (!searchResult.value.result || searchResult.value.result.length === 0) return [];
    if (!searchResult.value.err) {
      return (searchResult.value as IExchangeResult).result;
    }
  } else {
    if (searchItemFetchResult.value) {
      const searchResultsFlat = searchItemFetchResult.value.pages.flat();
      const countByFetchResult = countBy(searchResultsFlat);
      const fetchResult: IFetchResult[] = [];
      for (const key in countByFetchResult) {
        const [price, currency] = key.split("|") as [string, string];
        const numPrice = Number(price);
        const fetchResultFind = fetchResult.find((e) => e.price === numPrice && e.currency === currency);
        if (fetchResultFind) {
          fetchResultFind.amount += countByFetchResult[key];
        } else {
          fetchResult.push({
            price: numPrice,
            currency,
            amount: countByFetchResult[key],
            image: `${import.meta.env.VITE_URL_BASE}${currencyImageUrl.find((ele) => ele.id === currency)?.image}`,
          });
        }
      }
      return fetchResult;
    }
  }
  return [];
});

async function searchBtn(onlyChaosOrExalted = false) {
  if (isActive.value) return;
  modTbodyToggle.value = true;
  item.value.onlyChaosOrExalted = onlyChaosOrExalted;
  queryClient.removeQueries({ queryKey: ["fetchItem"] });
  queryClient.removeQueries({ queryKey: ["searchItem"] });
  await refetchSearchItem();
  if (!item.value.searchExchange.option) {
    await fetchNextPage();
  }
  nextTick(() => {
    modTbodyToggle.value = !props.isOverflow();
  });
}

const fetchResultSorted = computed(() => {
  if (props.divineToChaosOrExalted) {
    if (item.value.searchExchange.option) {
      return fetchResult.value.slice().sort((a, b) => {
        const [aCurrencyCount, aItemCount] = (a.price as string).split("：").map(Number) as [number, number];
        const aPrice = aCurrencyCount / aItemCount;
        const [bCurrencyCount, bItemCount] = (b.price as string).split("：").map(Number) as [number, number];
        const bPrice = bCurrencyCount / bItemCount;
        const ca = a.currency === "divine" ? aPrice * props.divineToChaosOrExalted : (aPrice as number);
        const cb = b.currency === "divine" ? bPrice * props.divineToChaosOrExalted : (bPrice as number);
        return ca - cb;
      });
    }
    return fetchResult.value.slice().sort((a, b) => {
      if (!["divine", secondCurrency].includes(a.currency)) return 1;
      if (!["divine", secondCurrency].includes(b.currency)) return -1;
      const ca = a.currency === "divine" ? (a.price as number) * props.divineToChaosOrExalted : (a.price as number);
      const cb = b.currency === "divine" ? (b.price as number) * props.divineToChaosOrExalted : (b.price as number);
      return ca - cb;
    });
  } else return fetchResult.value;
});
const maxAmount = computed(() => maxBy(fetchResult.value, (ele) => ele.amount));
const secondMaxAmount = computed(() => {
  const max = maxAmount.value;
  if (!max) return undefined;
  return maxBy(
    fetchResult.value.filter((ele) => ele !== max),
    (ele) => ele.amount,
  );
});
const searchExchangeState = computed<Config["searchExchangePrefer"]>({
  get() {
    if (!item.value?.searchExchange?.option) return "none" as Config["searchExchangePrefer"];
    if (
      item.value.searchExchange.have.length === 2 &&
      (item.value.searchExchange.have.includes("chaos") || item.value.searchExchange.have.includes("exalted")) &&
      item.value.searchExchange.have.includes("divine")
    )
      return "divine&(C or Ex)" as Config["searchExchangePrefer"];
    return item.value.searchExchange.have[0] as Config["searchExchangePrefer"];
  },
  set(value) {
    if (value === "divine&(C or Ex)") {
      item.value.searchExchange.have = [secondCurrency, "divine"];
    } else {
      item.value.searchExchange.have = [value];
    }
    searchBtn();
  },
});

const corruptComputed = computed<(typeof corruptOption)[number]["value"]>({
  set(value) {
    if (value === DOUBLE_CORRUPT_VALUE) {
      item.value.isDoubleCorrupt = true;
      item.value.isCorrupt = undefined;
    } else {
      item.value.isDoubleCorrupt = undefined;
      item.value.isCorrupt = value as boolean | undefined;
    }
  },
  get() {
    if (item.value.isDoubleCorrupt) {
      return DOUBLE_CORRUPT_VALUE;
    }
    return item.value.isCorrupt;
  },
});
watch(searchExchangeState, (value) => {
  window.ipc.send(IPC.UPDATE_CONFIG, JSON.stringify({ searchExchangePrefer: value } satisfies Partial<Config>));
});

watch(
  () => item.value.searchOnlineType,
  (value) => {
    if (value === "securable") {
      item.value.fetchCount = 10;
    } else {
      item.value.fetchCount = 20;
    }
  },
);

const emit = defineEmits<{
  "open-web-view": [extendUrl: string];
}>();
function openWebView() {
  emit("open-web-view", `${searchResult.value.searchID.type}/${props.leagueSelect}/${searchResult.value.searchID.ID}`);
}
function openBrowser() {
  window.open(
    encodeURI(
      `${import.meta.env.VITE_URL_BASE}/${tradeUrl}/${searchResult.value.searchID.type}/${props.leagueSelect}/${searchResult.value.searchID.ID}`,
    ),
  );
}
if (item.value.autoSearch && !props.parseError && !props.prevSearch) {
  searchBtn();
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === "Enter" && !isSearching.value && !props.parseError) {
    e.preventDefault();
    if (isFetchedSearchItem.value && !item.value.searchExchange.option) {
      fetchMore();
    } else {
      if (e.altKey) {
        searchBtn(true);
      } else {
        searchBtn(false);
      }
    }
  }
}

window.addEventListener("keydown", handleKeydown);
onUnmounted(() => {
  window.removeEventListener("keydown", handleKeydown);
});
</script>
