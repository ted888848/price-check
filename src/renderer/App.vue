<template>
  <OverlayWindow @reload-leagues="reloadLeagues" />
  <PriceCheck ref="priceCheck" />
</template>

<script setup lang="ts">
import { useQuery } from "@tanstack/vue-query";
import { useTemplateRef } from "vue";
import { loadAPIData } from "./lib/APIdata";
import { marketQueryOption } from "./lib/market";
import OverlayWindow from "./view/OverlayWindow/OverlayWindow.vue";
import PriceCheck from "./view/PriceCheck/PriceCheck.vue";
const priceCheckRef = useTemplateRef("priceCheck");
const reloadLeagues = () => {
  priceCheckRef.value?.loadLeagues();
};
loadAPIData();

useQuery(marketQueryOption);
</script>
