import Store from 'electron-store'
import { ipcMain } from 'electron'
import IPC from '@/ipc/ipcChannel'

export let config
export function setupConfig() {
	config = new Store()
	if (!config.has('config')) config.set('config', {
		characterName: '',
		searchExchangeExalted: false
	})
	ipcMain.on(IPC.SET_CONFIG, (e, configData) => {
		config.set('config', configData)
	})
	ipcMain.handle(IPC.GET_CONFIG, (e) => {
		return config.get('config')
	})
	ipcMain.on(IPC.GET_CONFIG, (e) => {
		e.returnValue = config.get('config')
	})
}   