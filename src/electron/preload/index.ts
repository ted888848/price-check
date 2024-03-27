import { Channel } from '@/ipc'
import { contextBridge, ipcRenderer } from 'electron'
import Store from 'electron-store'

export const ipc = {
  send(channel: Channel, ...args: any[]): void {
    return ipcRenderer.send(channel, ...args)
  },
  sendSync(channel: Channel, ...args: any[]) {
    return ipcRenderer.sendSync(channel, ...args)
  },
  invoke(channel: Channel, ...args: any[]) {
    return ipcRenderer.invoke(channel, ...args)
  },
  on(channel: Channel, listener: (event: Electron.IpcRendererEvent, ...args: any[]) => void) {
    return ipcRenderer.on(channel, listener)
  }
}
contextBridge.exposeInMainWorld('ipc', ipc)

const apiDataStore = new Store({
  name: 'APIData'
})

export const store = {
  get(key: string): any {
    return apiDataStore.get(key)
  },
  set(key: string, value: any): void {
    apiDataStore.set(key, value)
  }
}
contextBridge.exposeInMainWorld('store', store)