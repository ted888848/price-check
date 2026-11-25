<template>
  <OverlayWindow @reload-leagues="reloadLeagues" />
  <PriceCheck ref="priceCheck" />
</template>

<script setup lang="ts">
import OverlayWindow from "./view/OverlayWindow/OverlayWindow.vue";
import PriceCheck from "./view/PriceCheck/PriceCheck.vue";
import { useTemplateRef } from "vue";
import { loadAPIData } from "./lib/APIdata";
import { useQuery } from "@tanstack/vue-query";
import { marketQueryOption } from "./lib/market";
const priceCheckRef = useTemplateRef("priceCheck");
const reloadLeagues = () => {
  priceCheckRef.value?.loadLeagues();
};
loadAPIData();

useQuery(marketQueryOption);
</script>
