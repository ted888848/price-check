<template>
  <div class="flex items-center justify-center p-2">
    <span class="mx-1 text-white hover:cursor-default">物品:</span>
    <MySelect
      v-model="gemReplicaSelect"
      :options="gemReplicaOptions"
      label-key="text"
      value-key="text"
      :clearable="true"
      :filterable="true"
      class="flex-1"
    />
  </div>
  <div v-show="!((gemReplicaSelect?.text.startsWith('贗品') && gemReplicaSelect?.trans) ?? true)" class="flex items-center justify-center p-2">
    <span class="mx-1 text-white hover:cursor-default">寶石版本:</span>
    <MySelect
      v-model="gemTransSelect"
      :options="gemReplicaSelect?.trans ?? []"
      label-key="text"
      value-key="disc"
      :filterable="false"
      :clearable="true"
      class="flex-1"
    />
  </div>
  <div class="flex items-center justify-center py-1 select-none">
    <span class="mx-1 text-white">搜尋類型:</span>
    <MySelect v-model="searchOnlineType" :options="searchOnlineTypeOptions" label-key="label" :reducer="(i) => i.value" class="w-100px" />
  </div>
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
  <PriceResultTable
    :results="fetchResultSorted"
    :max-amount="maxAmount"
    :search-result="searchResult"
    :fetched-count="fetchedCount"
    :is-searching="isSearching"
    :is-active="isActive"
    :remaining="remaining"
  />
  <span v-if="parseError" class="text-center text-4xl text-red-600 hover:cursor-default">
    {{ parseError }}
  </span>
</template>

<script setup lang="ts">
import { useInfiniteQuery, useQuery, useQueryClient } from "@tanstack/vue-query";
import { countBy, maxBy } from "lodash-es";
import { computed, reactive, ref, watch, watchEffect } from "vue";
import { secondCurrency, tradeUrl } from "@/renderer/lib";
import { currencyImageUrl, heistReward as gemReplicaOptions } from "@/renderer/lib/APIdata";
import { useMyCountdown } from "@/renderer/lib/ratetimelimit";
import { searchItem, fetchItem, selectOptions } from "@/renderer/lib/tradeSide";
import type { ISearchResult, ISearchJson, IFetchResult } from "@/renderer/lib/tradeSide";
import MySelect from "../../components/utility/MySelect.vue";
import PriceResultTable from "./components/PriceResultTable.vue";
import SearchFunctions from "./components/SearchFunctions.vue";
const props = defineProps<{
  itemProp: ParsedItem;
  leagueSelect: string;
  divineToChaosOrExalted: number;
  parseError?: string | null;
  isOverflow: () => boolean;
}>();
const { remaining, isActive } = useMyCountdown();
const { searchOnlineTypeOptions } = selectOptions;
const baseSearchJSON = Object.freeze({
  query: {
    filters: {
      trade_filters: {
        filters: {
          collapse: {
            option: true,
          },
          price: {
            min: 2,
          },
        },
      },
      misc_filters: {
        filters: {},
      },
      type_filters: {
        filters: {},
      },
      map_filters: {
        filters: {},
      },
    },
    stats: [
      {
        type: "and",
        filters: [],
      },
    ],
    status: {
      option: "securable",
    },
  },
  sort: {
    price: "asc",
  },
} satisfies ISearchJson);
const searchJSON: ISearchJson = reactive(structuredClone(baseSearchJSON));
const searchOnlineType = ref<(typeof searchOnlineTypeOptions)[number]["value"]>("online");
watch(searchOnlineType, (newValue) => {
  if (newValue === "securable") {
    searchJSON.query.status.option = "securable";
    //@ts-expect-error
    delete searchJSON.query.filters.trade_filters.filters.price.min;
    return;
  }
  searchJSON.query.filters.trade_filters.filters.price.min = 2;
  if (newValue === "online") {
    searchJSON.query.status.option = "available";
    return;
  }
  if (newValue === "1week") {
    searchJSON.query.filters.trade_filters.filters.indexed = {
      option: "1week",
    };
    searchJSON.query.status.option = "any";
    return;
  }
  searchJSON.query.status.option = "any";
});

const gemTransSelect = ref<ArrayValueType<HeistReward["trans"]>>();
watch(gemTransSelect, (newValue) => {
  if (!gemReplicaSelect.value?.name?.startsWith("贗品") && newValue) {
    searchJSON.query.type = {
      option: gemReplicaSelect.value?.type ?? "",
      discriminator: newValue?.disc ?? "",
    };
  } else {
    delete searchJSON.query.type;
  }
});
const gemReplicaSelect = ref<HeistReward>();
watch(gemReplicaSelect, (newValue) => {
  if (newValue) {
    searchJSON.query.name = newValue.name;
    searchJSON.query.type = newValue.type;
  } else {
    delete searchJSON.query.name;
  }
});

watchEffect(() => {
  if (gemReplicaSelect.value) {
    searchJSON.query.name = gemReplicaSelect.value.name;
    searchJSON.query.type = gemReplicaSelect.value.type;
  } else {
    delete searchJSON.query.name;
    delete searchJSON.query.type;
  }
  if (!gemReplicaSelect.value?.name?.startsWith("贗品") && gemTransSelect.value) {
    searchJSON.query.type = {
      option: gemReplicaSelect.value?.type ?? "",
      discriminator: gemTransSelect.value.disc ?? "",
    };
  }
});

const {
  data: searchResult,
  isFetching: isFetchingSearchResult,
  refetch: refetchSearchItem,
} = useQuery<ISearchResult>({
  queryKey: ["searchItemHeist"],
  queryFn: () => {
    return searchItem(searchJSON, props.leagueSelect);
  },
  enabled: false,
  staleTime: 0,
  gcTime: 0,
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

const {
  data: searchItemFetchResult,
  hasNextPage,
  fetchNextPage,
  isFetchingNextPage,
} = useInfiniteQuery({
  queryKey: ["fetchItemHeist"],
  queryFn: ({ pageParam }) => {
    const startIndex = pageParam * 20;
    const endIndex = Math.min(startIndex + 20, searchResult.value.result.length);
    const searchResultList = (searchResult.value as unknown as ISearchResult).result.slice(startIndex, endIndex);
    return fetchItem(searchResultList, searchResult.value.searchID.ID);
  },
  initialPageParam: 0,
  getNextPageParam: (_lastPage, pages) => {
    const fetchedCount = pages.length * 20;
    if (fetchedCount < (searchResult.value as unknown as ISearchResult).totalCount) {
      return pages.length;
    }
    return undefined;
  },
  staleTime: 0,
  gcTime: 0,
  enabled: false,
});

function fetchMore() {
  if (isActive.value) return;
  fetchNextPage();
}

const isSearching = computed(() => isFetchingSearchResult.value || isFetchingNextPage.value);

const fetchedCount = computed(() => {
  return searchItemFetchResult.value ? searchItemFetchResult.value.pages.flat().length : 0;
});
const fetchResult = computed<IFetchResult[]>(() => {
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
  return [];
});

const queryClient = useQueryClient();

async function searchBtn(onlyChaosOrExalted = false) {
  if (isActive.value) return;
  searchJSON.query.filters.trade_filters.filters.price.option = onlyChaosOrExalted ? "chaos" : undefined;
  queryClient.removeQueries({ queryKey: ["fetchItemHeist"] });
  queryClient.removeQueries({ queryKey: ["searchItemHeist"] });
  await refetchSearchItem();
  await fetchNextPage();
}

const fetchResultSorted = computed(() => {
  if (props.divineToChaosOrExalted) {
    return fetchResult.value.slice().sort((a, b) => {
      if (!["divine", secondCurrency].includes(a.currency)) return 1;
      if (!["divine", secondCurrency].includes(b.currency)) return -1;
      const ca = a.currency === "divine" ? (a.price as number) * props.divineToChaosOrExalted : (a.price as number);
      const cb = b.currency === "divine" ? (b.price as number) * props.divineToChaosOrExalted : (b.price as number);
      return ca - cb;
    });
  } else return fetchResult.value;
});

const maxAmount = computed(() => {
  return maxBy(fetchResult.value, (ele) => ele.amount);
});

const emit = defineEmits<{
  "open-web-view": [extendUrl: string];
}>();
function openWebView() {
  emit("open-web-view", `search/${props.leagueSelect}/${searchResult.value.searchID.ID}`);
}
function openBrowser() {
  window.open(
    encodeURI(
      `${import.meta.env.VITE_URL_BASE}/${tradeUrl}/${searchResult.value.searchID.type}/${props.leagueSelect}/${searchResult.value.searchID.ID}`,
    ),
  );
}
</script>

<style></style>
