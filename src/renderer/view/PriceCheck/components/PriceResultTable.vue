<template>
  <table v-if="props.results.length" class="mx-5 my-1 w-1/2 self-center bg-blue-500 text-center text-sm text-white">
    <thead class="">
      <tr class="border-b-2 border-red-500 text-base">
        <td class="hover:cursor-default">價格</td>
        <td class="hover:cursor-default">數量</td>
      </tr>
    </thead>
    <tbody class="">
      <tr
        v-for="ele in props.results"
        :key="`${ele.price}|${ele.currency}`"
        class="border-b-2 border-gray-600"
        :class="{
          'bg-indigo-700 text-xl font-bold text-yellow-400': ele.amount === props.maxAmount?.amount,
          'bg-indigo-500 text-yellow-300': props.secondMaxAmount?.amount !== props.maxAmount?.amount && ele.amount === props.secondMaxAmount?.amount,
        }"
      >
        <td v-if="props.isExchange" class="flex items-center justify-center">
          <img :src="ele.image" class="h-7 w-7" />{{ ele.price }}<img :src="props.currency2Image" class="h-7 w-7" />
        </td>
        <td v-else class="flex items-center justify-center">{{ ele.price }}<img :src="ele.image" class="h-7 w-7" /></td>
        <td>{{ ele.amount }}</td>
      </tr>
    </tbody>
  </table>

  <span v-if="props.searchResult.err" class="text-center text-4xl text-red-600 hover:cursor-default">
    {{ props.searchResult.errData || "Fail" }}
  </span>
  <span v-if="props.searchResult.searchID.ID" class="text-center text-2xl text-white hover:cursor-default">
    共{{ props.searchResult.totalCount }}筆,顯示{{ props.fetchedCount }}筆
  </span>
  <div v-if="props.isSearching" class="my-5 flex justify-center text-center text-8xl text-white">
    <div class="i-svg-spinners:tadpole" />
  </div>
  <span v-if="props.isActive" class="my-2 bg-red-600 text-center text-xl text-white hover:cursor-default">
    API次數限制 {{ props.remaining.toFixed(1) }} 秒後再回來
  </span>
</template>

<script setup lang="ts">
import type { IExchangeResult, IFetchResult, ISearchResult } from "@/renderer/lib/tradeSide";

const props = defineProps<{
  results: IFetchResult[];
  maxAmount?: IFetchResult;
  secondMaxAmount?: IFetchResult;
  isExchange?: boolean;
  currency2Image?: string;
  searchResult: ISearchResult | IExchangeResult;
  fetchedCount: number;
  isSearching: boolean;
  isActive: boolean;
  remaining: number;
}>();
</script>
