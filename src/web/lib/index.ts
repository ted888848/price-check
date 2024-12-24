import IPC from '@/ipc'
export const poeVersion = window.ipc.sendSync(IPC.GET_CONFIG).poeVersion
export const secondCurrency = poeVersion === '2' ? 'exalted' : 'chaos'
export const tradeBase = poeVersion === '2' ? 'trade2' : 'trade'