import Store from 'electron-store'
import { ipcMain } from 'electron'
import IPC from '../ipc/ipcChannel'


export let config
export function setupConfig(){
    config = new Store()
    if(!config.has('characterName')) config.set('characterName','')
    ipcMain.on(IPC.SET_CONFIG,(e, configData)=>{
        config.set('characterName',configData)
    })
    ipcMain.on(IPC.GET_CONFIG,(e)=>{
        e.returnValue=config.get('characterName')
    })
}   