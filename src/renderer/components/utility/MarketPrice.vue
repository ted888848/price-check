<template>
  <div v-if="props.amount !== null" class="center gap-2px">
    <img :src="props.currencyImage" class="flex-shrink-0 w-20px h-20px" />
    <span v-if="props.amount < 1">
      1：{{ priceFormatter(1 / props.amount) }}
    </span>
    <span v-else>
      {{ priceFormatter(props.amount) }}：1
    </span>
    <img :src="props.itemImage" class=" w-7 h-7">
    &nbsp;({{ rtf.format(Math.floor((props.timestamp! - Date.now()) / 60000), 'minutes') }})
  </div>
</template>
<script setup lang="ts">
import type { TMarketQuoteRate } from '@/renderer/lib/market';

const props = defineProps<{
  amount: TMarketQuoteRate['amount'];
  timestamp: TMarketQuoteRate['timestamp'];
  itemImage: string;
  currencyImage: string;
  type: 'divine' | 'chaosOrEx';
  divineToChaosOrExalted: number;
}>()
const rtf = new Intl.RelativeTimeFormat('zh-TW', { numeric: 'auto', style: 'short' });
const priceFormatter = new Intl.NumberFormat('zh-TW', { maximumFractionDigits: 1 }).format
</script>