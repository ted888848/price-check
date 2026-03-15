<template>
  <OverlayWindow @reload-leagues="reloadLeagues" />
  <PriceCheck ref="priceCheck" />
</template>

<script setup lang="ts">
import OverlayWindow from '@/renderer/components/OverlayWindow/OverlayWindow.vue'
import PriceCheck from '@/renderer/components/PriceCheck/PriceCheck.vue'
import { onUnmounted, useTemplateRef } from 'vue'
import { loadAPIData } from './lib/APIdata'
import { useQuery } from '@tanstack/vue-query'
import { marketQueryOption } from './lib/market'
const priceCheckRef = useTemplateRef('priceCheck')
const reloadLeagues = () => {
  priceCheckRef.value?.loadLeagues()
}
loadAPIData()

useQuery(marketQueryOption)
console.log('test')
onUnmounted(() => {
  console.log('unmounted')
})
</script>