import Store, {Schema} from 'electron-store'
import { ipcMain, session } from 'electron'
import IPC from './ipc/ipcChannel'
import {registerShortcut, unRegisterShortcut} from './shortcuts'
const defaultStore: IConfig = {
  characterName: '',
  searchExchangeDivine: false,
  POESESSID: '',
  searchTwoWeekOffline: false,
  priceCheckHotkey: 'Ctrl+D',
  settingHotkey: 'Ctrl+F2',
  shortcuts: [
    {
      hotkey: 'F2',
      type: 'type-in-chat',
      outputText: '/invite @last'
    },
    {
      hotkey: 'F3',
      type: 'type-in-chat',
      outputText: '%TY'
    },
    {
      hotkey: 'F4',
      type: 'type-in-chat',
      outputText: '/kick @char'
    },
    {
      hotkey: 'F5',
      type: 'type-in-chat',
      outputText: '/hideout'
    }
  ]
}
const storeSchema: Schema<IConfig> = {
  characterName: {
    type: 'string'
  },
  searchExchangeDivine: {
    type: 'boolean'
  },
  POESESSID: {
    type: 'string'
  },
  searchTwoWeekOffline: {
    type: 'boolean'
  },
  priceCheckHotkey: {
    type: 'string'
  },
  settingHotkey: {
    type: 'string'
  },
  shortcuts: {
    type: 'array',
  }
}
export let store = new Store({
  name: 'appConfig',
  defaults: defaultStore,
  schema: storeSchema
})
export let config: IConfig
export function setupConfig() {
  config = store.store
  ipcMain.on(IPC.SET_CONFIG, (_e, configData: string) => {
    store.store = JSON.parse(configData) as IConfig
    config = store.store
    unRegisterShortcut()
    registerShortcut()
    setCookie()
  }) 
  ipcMain.on(IPC.GET_CONFIG, (e) => {
    e.returnValue = config
  })
  setCookie()
}
function setCookie() {
  if (config.POESESSID) {
    session.defaultSession.cookies.set({
      url: 'https://web.poe.garena.tw',
      name: 'POESESSID',
      value: config.POESESSID,
      path: '/',
      httpOnly: true,
      secure: true,
      sameSite: 'no_restriction'
    })
  }
}