import Store, { Schema } from 'electron-store'
import { ipcMain, session } from 'electron'
import IPC from '@/ipc'
import { registerShortcut, unRegisterShortcut } from './shortcuts'
const defaultStore: Config = {
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
      outputText: '/leave'
    },
    {
      hotkey: 'F5',
      type: 'type-in-chat',
      outputText: '/hideout'
    }
  ]
}
const storeSchema: Schema<Config> = {
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
    items: {
      type: 'object',
      properties: {
        hotkey: {
          type: 'string'
        },
        outputText: {
          type: 'string'
        },
      }
    }
  }
}
export const store = new Store({
  name: 'appConfig',
  defaults: defaultStore,
  schema: storeSchema
})
export let config: Config
export function setupConfig() {
  config = store.store
  ipcMain.on(IPC.SET_CONFIG, (_e, configData: Config) => {
    store.store = configData // JSON.parse(configData) as Config
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
      url: import.meta.env.VITE_URL_BASE,
      name: 'POESESSID',
      value: config.POESESSID,
      path: '/',
      httpOnly: true,
      secure: true,
      sameSite: 'lax'
    })
  }
}