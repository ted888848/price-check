import type { AxiosResponseHeaders } from "axios";
import { computed, ref, watch, type Ref } from "vue";
import { RateLimiter } from '@tanstack/pacer'
import { useCountdown, useIntervalFn } from "@vueuse/core";

interface TRateTimeLimitItem {
  window: number;
  times: number;
  timeout?: number;
}

interface TRateTimeLimitState {
  search?: {
    ip?: TRateTimeLimitItem[];
    account?: TRateTimeLimitItem[];
  }
  fetch?: {
    ip?: TRateTimeLimitItem[];
    account?: TRateTimeLimitItem[];
  }
  exchange?: {
    ip?: TRateTimeLimitItem[];
    account?: TRateTimeLimitItem[];
  }
}
export const apiRateTimeLimitMax: TRateTimeLimitState = {
  search: {
    ip: [
      { times: 8, window: 10, timeout: 60 },
      { times: 15, window: 60, timeout: 120 },
      { times: 60, window: 300, timeout: 1800 }
    ],
    account: [
      { times: 3, window: 5, timeout: 60 }
    ]
  },
  fetch: {
    ip: [
      { times: 12, window: 4, timeout: 60 },
      { times: 16, window: 12, timeout: 120 },
    ],
    account: [
      { times: 6, window: 4, timeout: 10 }
    ]
  },
  exchange: {
    ip: [
      { times: 7, window: 15, timeout: 60 },
      { times: 15, window: 90, timeout: 120 },
      { times: 45, window: 300, timeout: 1800 }
    ],
    account: [
      { times: 3, window: 5, timeout: 60 }
    ]
  }
} as const
type TRateLimiter = RateLimiter<() => void>
interface TRateTimeLimiters {
  search?: {
    ip: TRateLimiter[];
    account: TRateLimiter[];
  };
  fetch?: {
    ip: TRateLimiter[];
    account: TRateLimiter[];
  };
  exchange?: {
    ip: TRateLimiter[];
    account: TRateLimiter[];
  };
}
const ratetimelimiters = ref<TRateTimeLimiters>({})

function createRateLimiter() {
  (Object.keys(apiRateTimeLimitMax) as unknown as (keyof TRateTimeLimitState)[])
    .forEach((type) => {
      ratetimelimiters.value[type] ||= { ip: [], account: [] };
      (Object.keys(apiRateTimeLimitMax[type] || {}) as ('ip' | 'account')[])
        .forEach((rule) => {
          ratetimelimiters.value[type]![rule] = (apiRateTimeLimitMax[type]![rule] || [])
            .map((ele) =>
              new RateLimiter(() => { }, {
                windowType: 'sliding',
                window: ele.window * 1000,
                limit: ele.times - ((ele.timeout ?? 0) > 60 ? 1 : 0),
              }))
        });
    });
}
createRateLimiter()
export function getRateLimiters() {
  return { ratetimelimiters }
}

export const waitUntil: Ref<null | Date> = ref(null)

const rateTimeLimitState = ref<TRateTimeLimitState>({})

export function getRateTimeLimitState() {
  return { rateTimeLimitState }
}
//                            wait time in second
export function startCountdown(time: number) {
  waitUntil.value = new Date(Date.now() + time * 1000)
}

export function useMyCountdown() {
  const rateLimitTimeLeft = ((waitUntil.value?.getTime() || Date.now()) - Date.now()) / 1000
  // *10 讓時間可以顯示小數點後第一位, useCountdown的scheduler預設是1000ms，改成100ms可以讓倒數更順暢
  const { start, remaining: remainingBy10, isActive } = useCountdown(rateLimitTimeLeft * 10, {
    scheduler: (cb) => useIntervalFn(cb, 100, { immediate: false }),
  })
  if (waitUntil.value && rateLimitTimeLeft > 0) {
    start()
  }
  watch(waitUntil, (value) => {
    if (value) {
      const timeLeft = (value.getTime() - Date.now()) / 1000
      if (timeLeft > 0) {
        start(timeLeft * 10)
      }
    }
  })
  const remaining = computed(() => remainingBy10.value / 10)
  return { remaining, isActive }
}

export function parseRateTimeLimit(header?: AxiosResponseHeaders) {
  if (!header) return
  if (waitUntil.value && new Date() < waitUntil.value) return
  waitUntil.value = null
  const rules = header['x-rate-limit-rules'].split(',').map((ele: string) => ele.toLowerCase()) as ('ip' | 'account')[]
  const type = header['x-rate-limit-policy'].split('-')[1] as keyof TRateTimeLimitState
  if (Object.keys(apiRateTimeLimitMax).includes(type)) {
    for (const rule of rules) {
      const maxLimit = header[`x-rate-limit-${rule}`].split(',')
      const arr = header[`x-rate-limit-${rule}-state`].split(',')

      if (!rateTimeLimitState.value[type]) rateTimeLimitState.value[type] = {}
      if (!rateTimeLimitState.value[type]![rule]) rateTimeLimitState.value[type]![rule] = []
      rateTimeLimitState.value[type]![rule] = []
      for (let i = 0; i < arr.length; i++) {
        const [times, inTime, timeout] = arr[i].split(':').map((e: string) => parseInt(e))
        const [maxTimes, maxInTime] = maxLimit[i].split(':').map((e: string) => parseInt(e))
        if (rateTimeLimitState.value[type]![rule]) {
          rateTimeLimitState.value[type]![rule].push({ times, window: inTime, timeout })
        }
        const limiter = ratetimelimiters.value[type]![rule][i]
        if (limiter) {
          limiter.setOptions({
            window: maxInTime * 1000,
            limit: maxTimes,
          })
          const limiterTimesLength = limiter.store.state.executionTimes.length
          for (let j = 0; j < (times - limiterTimesLength); j++) {
            limiter.maybeExecute()
          }
          const nextWindow = (limiter.getMsUntilNextWindow()) / 1000
          if (nextWindow > 0) {
            startCountdown(nextWindow + 0.25)
          }
        }
      }
    }
  }
}