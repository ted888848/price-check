<template>
  <OverlayWindow @reload-leagues="reloadLeagues" />
  <PriceCheck ref="priceCheck" />
</template>

<script setup lang="ts">
import OverlayWindow from '@/web/components/OverlayWindow/OverlayWindow.vue'
import PriceCheck from '@/web/components/PriceCheck/PriceCheck.vue'
import { useTemplateRef } from 'vue'
import { loadAPIData } from './lib/APIdata'
const priceCheckRef = useTemplateRef('priceCheck')
const reloadLeagues = () => {
  priceCheckRef.value?.loadLeagues()
}
loadAPIData()
</script>