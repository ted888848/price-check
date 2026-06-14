import { beforeAll, describe, expect, it, vi } from 'vitest'
import { readFile } from 'node:fs/promises'
import config from './data/appConfig.json'
import IPC from '@/ipc'
import { itemTemplateRaw } from './data/templateItems'
// 先載入資料
let testData: any

async function loadPOE1Config() {
  const dataFile = await readFile('C:\\Users\\zhou\\AppData\\Roaming\\price-check\\APIData.json', 'utf-8')
  testData = JSON.parse(dataFile)
}
// 在載入完資料後才 import itemAnalyze
beforeAll(async () => {
  await loadPOE1Config()
})

// Mock APIdata 模組
vi.mock('@/renderer/lib/APIdata', () => ({
  get leagues() { return testData?.Leagues || [] },
  get APIitems() { return testData?.APIitems },
  get heistReward() { return testData?.heistReward || [] },
  get APImods() { return testData?.APImods },
  get APIStatic() { return testData?.APIStatic || [] },
  get currencyImageUrl() { return testData?.currencyImageUrl || [] },
}))


vi.hoisted(() => {
  // Mock window.store 和 IPC
  vi.stubGlobal('window', {
    store: {
      get: vi.fn()
    },
    ipc: {
      sendSync: vi.fn((channel: string) => {
        // Mock GET_CONFIG 回應
        if (channel === IPC.GET_CONFIG) {
          return config
        }
        return {}
      }),
      send: vi.fn(),
      on: vi.fn(),
    }
  })
})

const testCase =
  Object.entries(itemTemplateRaw)
    .map(([item, data]) => {
      return {
        label: item,
        item: data.source,
        match: data.match
      }
    })


import { itemAnalyze } from '@/renderer/lib/itemAnalyze'

describe('parseItem', () => {
  it.each(testCase)('$label', ({ item, match }) => {
    const parseResult = itemAnalyze(item);
    expect(parseResult).toMatchObject(match)
  })
})