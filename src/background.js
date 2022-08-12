'use strict';
import { app, dialog, ipcMain, protocol } from 'electron';
import { setupShortcut } from './utility/shortcuts'
import { createWindow } from './utility/overlayWindow'
import { setupTray } from './utility/tray';
import { getAPIdata, checkForUpdate } from './utility/setupAPI'
import { setupConfig } from './utility/config'
import { EventEmitter } from 'events'
import IPC from './ipc/ipcChannel'
const isDevelopment = process.env.NODE_ENV !== 'production';
protocol.registerSchemesAsPrivileged([
	{ scheme: 'app', privileges: { secure: true, standard: true } }
]);
app.disableHardwareAcceleration()
const emitter = new EventEmitter();
emitter.setMaxListeners(20)
app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') {
		app.quit();
	}
});
app.on('ready', async () => {
	try {
		await checkForUpdate()
	} catch (error) {
		dialog.showMessageBox({
			title: '檢查更新錯誤',
			message: '請稍後重新讀取API資料',
			// detail: error?.response?.data?.error?.message,
			detail: `data: ${JSON.stringify(error?.response?.data)}\r\n
			status: ${error?.response?.status}`,
			type: 'error',
		})
	}
	setupConfig()
	setupTray()
	await createWindow()
	setupShortcut()

	ipcMain.handle(IPC.RELOAD_APIDATA, async () => {
		try {
			await getAPIdata()
			return true
		} catch (error) {
			dialog.showErrorBox("API資料錯誤，請稍後重新讀取API資料", error)
			return error
		}
	})

});
if (isDevelopment) {
	if (process.platform === 'win32') {
		process.on('message', (data) => {
			if (data === 'graceful-exit') {
				app.quit();
			}
		});
	}
	else {
		process.on('SIGTERM', () => {
			app.quit();
		});
	}
}