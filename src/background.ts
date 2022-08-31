'use strict';
import { app, dialog, ipcMain, protocol } from 'electron';
import { setupShortcut } from './main/shortcuts'
import { createWindow } from './main/overlayWindow'
import { setupTray } from './main/tray';
import { getAPIdata, checkForUpdate } from './main/setupAPI'
import { setupConfig } from './main/config'
import IPC from './ipc/ipcChannel'
const isDevelopment = process.env.NODE_ENV !== 'production';
protocol.registerSchemesAsPrivileged([
  {
    scheme: 'app',
    privileges: {
      secure: true, standard: true 
    } 
  }
]);
app.disableHardwareAcceleration()
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
app.on('ready', async () => {
  setupConfig()
  setupTray()
  try {
    await checkForUpdate()
  } catch (error: any) {
    dialog.showMessageBox({
      title: '讀取API資料錯誤',
      message: '請稍後重新讀取API資料',
      detail: `data: ${JSON.stringify(error?.response?.data)}\r\n
			status: ${error?.response?.status}`,
      type: 'error',
    })
  }
  await createWindow()
  setupShortcut()

  ipcMain.handle(IPC.RELOAD_APIDATA, async () => {
    try {
      await getAPIdata()
      return {
        status: true 
      }
    } catch (error: any) {
      dialog.showMessageBox({
        title: '讀取API資料錯誤',
        message: '請稍後重新讀取API資料',
        detail: `data: ${JSON.stringify(error?.response?.data)}\r\n
				status: ${error?.response?.status}`,
        type: 'error',
      })
      return {
        status: false, error 
      }
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