'use strict'
import { app, dialog, ipcMain } from 'electron'
import { setupShortcut } from './shortcuts'
import { createWindow } from './overlayWindow'
import { setupTray } from './tray'
import { getAPIdata, checkForUpdate } from './setupAPI'
import { setupConfig } from './config'
import IPC from './ipcChannel'
import { join } from 'node:path'
const isDevelopment = process.env.NODE_ENV !== 'production'
process.env.DIST_ELECTRON = join(__dirname, '..')
process.env.DIST = join(process.env.DIST_ELECTRON, '../dist')
process.env.PUBLIC = process.env.VITE_DEV_SERVER_URL
  ? join(process.env.DIST_ELECTRON, '../public')
  : process.env.DIST

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
    let detailMessage = error instanceof Error ? error?.stack ?? error.message : error
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
      await getAPIdata()
      return { status: true }
    } catch (error: any) {
      let detailMessage = error instanceof Error ? error?.stack ?? error.message : error
      dialog.showMessageBox({
        title: '讀取API資料錯誤',
        message: '請稍後重新讀取API資料',
        detail: detailMessage,
        type: 'error',
      })
      return { status: false, error }
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