<template>
  <table v-if="props.results.length" class="bg-blue-500 text-center text-white text-sm my-1 mx-5 w-1/2 self-center">
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
          'text-yellow-400 text-xl bg-indigo-700 font-bold': ele.amount === props.maxAmount?.amount,
          'text-yellow-300 bg-indigo-500': props.secondMaxAmount?.amount !== props.maxAmount?.amount && ele.amount === props.secondMaxAmount?.amount,
        }"
      >
        <td v-if="props.isExchange" class="flex justify-center items-center">
          <img :src="ele.image" class="w-7 h-7" />{{ ele.price }}<img :src="props.currency2Image" class="w-7 h-7" />
        </td>
        <td v-else class="flex justify-center items-center">{{ ele.price }}<img :src="ele.image" class="w-7 h-7" /></td>
        <td>{{ ele.amount }}</td>
      </tr>
    </tbody>
  </table>

  <span v-if="props.searchResult.err" class="text-red-600 text-4xl text-center hover:cursor-default">
    {{ props.searchResult.errData || "Fail" }}
  </span>
  <span v-if="props.searchResult.searchID.ID" class="text-white text-2xl text-center hover:cursor-default">
    共{{ props.searchResult.totalCount }}筆,顯示{{ props.fetchedCount }}筆
  </span>
  <div v-if="props.isSearching" class="text-8xl text-white my-5 text-center flex justify-center">
    <div class="i-svg-spinners:tadpole" />
  </div>
  <span v-if="props.isActive" class="text-white bg-red-600 text-xl text-center my-2 hover:cursor-default">
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
