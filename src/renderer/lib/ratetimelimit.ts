import type { AxiosResponseHeaders } from "axios";
import { ref } from "vue";
import { RateLimiter } from '@tanstack/pacer'

interface TRateTimeLimitItem {
  inTime: number;
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
      { times: 8, inTime: 10, timeout: 60 },
      { times: 15, inTime: 60, timeout: 120 },
      { times: 60, inTime: 300, timeout: 1800 }
    ],
    account: [
      { times: 3, inTime: 5, timeout: 60 }
    ]
  },
  fetch: {
    ip: [
      { times: 12, inTime: 4, timeout: 60 },
      { times: 16, inTime: 12, timeout: 120 },
    ],
    account: [
      { times: 6, inTime: 4, timeout: 10 }
    ]
  },
  exchange: {
    ip: [
      { times: 7, inTime: 15, timeout: 60 },
      { times: 15, inTime: 90, timeout: 120 },
      { times: 45, inTime: 300, timeout: 1800 }
    ],
    account: [
      { times: 3, inTime: 5, timeout: 60 }
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
                window: ele.inTime * 1000,
                limit: ele.times,
              }))
        });
    });
}
createRateLimiter()
export function getRateLimiters() {
  return { ratetimelimiters }
}
export const rateTimeLimitArr = {
  search: {
    ip: [
      { limit: 45, time: 60 },
      { limit: 13, time: 20 },
      { limit: 6, time: 3 }
    ],
    account: [
      { limit: 2, time: 1 }
    ]
  },
  fetch: {
    ip: [
      { limit: 14, time: 4 },
      { limit: 10, time: 1 }
    ],
    account: [
      { limit: 5, time: 1 }
    ]
  },
  exchange: {
    ip: [
      { limit: 40, time: 60 },
      { limit: 13, time: 30 },
      { limit: 5, time: 3 }
    ],
    account: [
      { limit: 2, time: 2 }
    ]
  }
} as const
const rateTimeLimitCounting = ref({
  flag: false, second: 0
})
export function getIsCounting() {
  return {
    rateTimeLimit: rateTimeLimitCounting
  }
}


const rateTimeLimitState = ref<TRateTimeLimitState>({})

export function getRateTimeLimitState() {
  return { rateTimeLimitState }
}

let interval: NodeJS.Timeout | undefined
const countDownStep = 0.1
export function startCountdown(time: number) {
  if (time < rateTimeLimitCounting.value.second) return
  if (interval) {
    clearInterval(interval)
    interval = undefined
  }
  rateTimeLimitCounting.value.flag = true
  rateTimeLimitCounting.value.second = time
  interval = setInterval(() => {
    rateTimeLimitCounting.value.second = Math.max(0, rateTimeLimitCounting.value.second - countDownStep)
    if (rateTimeLimitCounting.value.second <= 0) {
      rateTimeLimitCounting.value.flag = false
      clearInterval(interval)
      interval = undefined
    }
  }, 1000 * countDownStep)
}

export function parseRateTimeLimit(header?: AxiosResponseHeaders) {
  if (!header) return
  const rules = header['x-rate-limit-rules'].split(',').map((ele: string) => ele.toLowerCase()) as ('ip' | 'account')[]
  const type = header['x-rate-limit-policy'].split('-')[1] as keyof typeof rateTimeLimitArr
  if (Object.keys(rateTimeLimitArr).includes(type)) {
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
          rateTimeLimitState.value[type]![rule].push({ times, inTime, timeout })
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
          if (nextWindow > 0) startCountdown(nextWindow + 0.25)
        }
      }
    }
  }
}