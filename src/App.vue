<template>
  <OverlayWindow @reload-leagues="reloadLeagues" />
  <PriceCheck ref="priceCheck" />
</template>
<script setup lang="ts">
import OverlayWindow from '@/web/components/OverlayWindow/OverlayWindow.vue'
import PriceCheck from '@/web/components/PriceCheck/PriceCheck.vue'
import { ref } from 'vue'
import { loadAPIdata } from './web/APIdata'
const priceCheck = ref<InstanceType<typeof PriceCheck>>()
const reloadLeagues = () => {
  priceCheck.value?.loadLeagues()
}
loadAPIdata()
</script>