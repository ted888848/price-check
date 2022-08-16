<template>
	<OverlayWindow @reload-leagues="reloadLeagues" />
	<PriceCheck ref="priceCheck" />
</template>
<script setup>
import OverlayWindow from '@/components/OverlayWindow/OverlayWindow.vue'
import PriceCheck from '@/components/PriceCheck/PriceCheck.vue';
import { ref } from 'vue'
import { loadAPIdata } from './web/APIdata';
const priceCheck = ref(null);
const reloadLeagues = () => {
	priceCheck.value.loadLeagues()
}
loadAPIdata()
</script>