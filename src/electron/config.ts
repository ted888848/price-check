import Store, { Schema } from 'electron-store'
import { ipcMain, session } from 'electron'
import IPC from '@/ipc'
import { registerShortcut, unRegisterShortcut } from './shortcuts'
const defaultStore: Config = {
  characterName: '',
  searchExchangePrefer: 'divine&(C or Ex)',
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
  ],
  league: '',
  poeVersion: '1'
}
const storeSchema: Schema<Config> = {
  characterName: {
    type: 'string'
  },
  searchExchangePrefer: {
    type: 'string',
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
  },
  league: {
    type: 'string'
  },
  poeVersion: {
    type: 'string',
    default: '1'
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
  ipcMain.on(IPC.SET_CONFIG, (_e, configData: string) => {
    // const prevSetVersion = store.store.poeVersion
    store.store = JSON.parse(configData) as Config
    config = store.store
    unRegisterShortcut()
    registerShortcut()
    setCookie()
    // if (prevSetVersion !== config.poeVersion) {
    //   app.relaunch()
    //   app.quit()
    // }
  })
  ipcMain.on(IPC.GET_CONFIG, (e) => {
    e.returnValue = config
  })
  ipcMain.on(IPC.UPDATE_CONFIG, (_e, newConfigStr: string) => {
    // const prevSetVersion = store.store.poeVersion
    try {
      const newConfig = JSON.parse(newConfigStr) as Partial<Config>
      updateConfig(newConfig)
    }
    catch (e) {
      console.error(e)
    }
    // if (prevSetVersion !== config.poeVersion) {
    //   app.relaunch()
    //   app.quit()
    // }
  })
  setCookie()
}
export function updateConfig(newConfig: Partial<Config>) {
  store.store = { ...store.store, ...newConfig }
  config = store.store
  unRegisterShortcut()
  registerShortcut()
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
      sameSite: 'lax',
      domain: 'pathofexile.tw'
    })
  }
}