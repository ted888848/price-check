<template>
  <OverlayWindow @reload-leagues="reloadLeagues" />
  <PriceCheck ref="priceCheck" />
</template>

<script setup lang="ts">
import OverlayWindow from '@/renderer/components/OverlayWindow/OverlayWindow.vue'
import PriceCheck from '@/renderer/components/PriceCheck/PriceCheck.vue'
import { onUnmounted, ref, useTemplateRef } from 'vue'
import { loadAPIData } from './lib/APIdata'
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