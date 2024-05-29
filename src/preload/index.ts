import { IpcArgs, IpcReturn } from '@/ipc'
import { Channel } from '@/ipc'
import { contextBridge, ipcRenderer } from 'electron'
import Store from 'electron-store'
export const ipc = {
  send<C extends Channel>(channel: C, ...args: IpcArgs<C>): void {
    return ipcRenderer.send(channel, ...args)
  },
  sendSync<C extends Channel>(channel: C, ...args: IpcArgs<C>): IpcReturn<C> {
    return ipcRenderer.sendSync(channel, ...args)
  },
  invoke<C extends Channel>(channel: C, ...args: IpcArgs<C>): Promise<IpcReturn<C>> {
    return ipcRenderer.invoke(channel, ...args)
  },
  on<C extends Channel>(channel: C, listener: (event: Electron.IpcRendererEvent, ...args: IpcArgs<C>) => void) {
    return ipcRenderer.on(channel, listener as any)
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

export const proxyServer = {
  getPort(): number {
    return ipcRenderer.sendSync('getProxyPort' satisfies Channel)
  }
}
contextBridge.exposeInMainWorld('proxyServer', proxyServer)

ipcRenderer.setMaxListeners(15)