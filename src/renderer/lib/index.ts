import IPC from '@/ipc'
import { ref } from 'vue'
export const poeVersion = window.ipc.sendSync(IPC.GET_CONFIG).poeVersion
/**
 *POE1: Chaos, POE2: Exalted
 */
export const secondCurrency = poeVersion === '2' ? 'exalted' : 'chaos'
export const tradeUrl = poeVersion === '2' ? 'trade2' : 'trade'

export const leagueSelectRef = ref<string>('')
