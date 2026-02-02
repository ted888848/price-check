import { test, expect, beforeAll, vi, it } from 'vitest'
import { readFile } from 'node:fs/promises'
import exampleItems from './exampleItems'
import config from './appConfig.json'
import IPC from '@/ipc'

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
vi.mock('../web/lib/APIdata', () => ({
  get leagues() { return testData?.Leagues || [] },
  get APIitems() { return testData?.APIitems },
  get heistReward() { return testData?.heistReward || [] },
  get APImods() { return testData?.APImods },
  get APIStatic() { return testData?.APIStatic || [] },
  get currencyImageUrl() { return testData?.currencyImageUrl || [] },
}))

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

const { itemAnalyze } = await import('../web/lib/itemAnalyze')

for (const item of exampleItems.items) {
  it(`parse ${item.name}`, () => {
    const result = itemAnalyze(item.text)
    expect(result).toMatchObject(item.result)
  })
}