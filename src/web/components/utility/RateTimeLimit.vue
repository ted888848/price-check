<template>
  <div class="bg-gray-800 text-white absolute bottom-0 left-0 transform -translate-x-full p-8px">
    <div>Rate Limit</div>
    <div>Search</div>
    <ul>
      <li v-for="(state, rule) in rateTimeLimitState.search" :key="rule" class="text-sm hover:cursor-default">
        {{ rule }}:
        <ul>
          <li v-for="(item, index) in state" :key="index" class="text-xs hover:cursor-default">
            {{ item.times }} / {{ apiRateTimeLimitMax['search']![rule]![index].times }} ({{
              apiRateTimeLimitMax['search']![rule]![index].timeout }}s)
          </li>
        </ul>
      </li>
    </ul>
  </div>
</template>
<script setup lang="ts">
import { getRateTimeLimitState, apiRateTimeLimitMax, getRateLimiters } from '@/web/lib/ratetimelimit';
const { rateTimeLimitState } = getRateTimeLimitState()
const { ratetimelimiters } = getRateLimiters()
console.log(ratetimelimiters.value)
</script>