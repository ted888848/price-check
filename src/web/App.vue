<template>
  <OverlayWindow @reload-leagues="reloadLeagues" />
  <PriceCheck ref="priceCheck" />
</template>

<script setup lang="ts">
import OverlayWindow from '@/web/components/OverlayWindow/OverlayWindow.vue'
import PriceCheck from '@/web/components/PriceCheck/PriceCheck.vue'
import { onMounted, onUnmounted, ref, useTemplateRef } from 'vue'
import { loadAPIData } from './lib/APIdata'
import { initMarketData } from './lib/market'
const priceCheckRef = useTemplateRef('priceCheck')
const reloadLeagues = () => {
  priceCheckRef.value?.loadLeagues()
}
loadAPIData()
const marketInterval = ref()

// onMounted(async () => {
//   marketInterval.value = await initMarketData()
// })
onUnmounted(() => {
  if (marketInterval.value) {
    clearInterval(marketInterval.value)
  }
})
</script>