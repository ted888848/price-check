import { contextBridge, ipcRenderer } from 'electron'
import IPC from '@/ipc/ipcChannel'
import Store from 'electron-store'

type IPCValue = typeof IPC[keyof typeof IPC]
export const api = {
  send(eventName: IPCValue, ...args: any[]) {
    return ipcRenderer.send(eventName, ...args)
  },
  sendSync(eventName: IPCValue, ...args: any[]) {
    return ipcRenderer.sendSync(eventName, ...args)
  },
  invoke(eventName: IPCValue, ...args: any[]) {
    return ipcRenderer.invoke(eventName, ...args)
  },
  on(eventName: IPCValue, listener: (...args: any[]) => void) {
    return ipcRenderer.on(eventName, listener)
  },
}
contextBridge.exposeInMainWorld('electron', api)

export const apiStore = new Store({
  name: 'APIData'
})
export const storeApi = {
  get(key: string) {
    return apiStore.get(key)
  }
}

contextBridge.exposeInMainWorld('apiStore', storeApi)

