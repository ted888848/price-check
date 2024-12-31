'use strict'
import { app, dialog, ipcMain } from 'electron'
import { setupShortcut } from './shortcuts'
import { createWindow } from './overlayWindow'
import { setupTray } from './tray'
import { checkForUpdate, getAPIData } from './setupAPI'
import { setupConfig } from './config'
import IPC from '@/ipc'
import './proxyServer'
import started from 'electron-squirrel-startup'

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit()
}
const isDevelopment = process.env.NODE_ENV !== 'production'

if (process.platform === 'win32') app.setAppUserModelId(app.getName())

app.disableHardwareAcceleration()
if (!app.requestSingleInstanceLock()) {
  app.quit()
  process.exit(0)
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('ready', async () => {
  setupConfig()
  setupTray()
  try {
    await checkForUpdate()
  } catch (error: any) {
    const detailMessage = error instanceof Error ? error?.stack ?? error.message : error
    dialog.showMessageBox({
      title: '讀取API資料錯誤',
      message: '請稍後重新讀取API資料',
      detail: detailMessage,
      type: 'error',
    })

  }
  await createWindow()
  setupShortcut()

  ipcMain.handle(IPC.RELOAD_APIDATA, async () => {
    try {
      await getAPIData()
      return {
        status: true
      }
    } catch (error: any) {
      const detailMessage = error instanceof Error ? error?.stack ?? error.message : error
      dialog.showMessageBox({
        title: '讀取API資料錯誤',
        message: '請稍後重新讀取API資料',
        detail: detailMessage,
        type: 'error',
      })
      return {
        status: false, error
      }
    }
  })

})
if (isDevelopment) {
  if (process.platform === 'win32') {
    process.on('message', (data) => {
      if (data === 'graceful-exit') {
        app.quit()
      }
    })
  }
  else {
    process.on('SIGTERM', () => {
      app.quit()
    })
  }
}