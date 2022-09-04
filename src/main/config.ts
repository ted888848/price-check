import Store from 'electron-store'
import { ipcMain, session } from 'electron'
import IPC from '@/ipc/ipcChannel'
export let config = new Store()
export function setupConfig() {
  if (!config.has('config')) config.set('config', {
    characterName: '',
    searchExchangeDivine: false,
    POESESSID: '',
    searchTwoWeekOffline: false
  })
  ipcMain.on(IPC.SET_CONFIG, (_e, configData) => {
    config.set('config', configData)
    setCookie()
  }) 
  ipcMain.handle(IPC.GET_CONFIG, () => {
    return config.get('config')
  })
  ipcMain.on(IPC.GET_CONFIG, (e) => {
    e.returnValue = config.get('config')
  })
  setCookie()
}
function setCookie() {
  let poesessid = config.get('config.POESESSID', '') as string
  if (poesessid) {
    session.defaultSession.cookies.set({
      url: 'https://web.poe.garena.tw',
      name: 'POESESSID',
      value: poesessid,
      path: '/',
      httpOnly: true,
      secure: true,
      sameSite: 'no_restriction'
    })
  }
}