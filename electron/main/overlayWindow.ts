import { BrowserWindow, ipcMain, shell } from 'electron'
import { OverlayController, OVERLAY_WINDOW_OPTS } from 'electron-overlay-window'
import { PoeWindow } from './POEWindow'
import IPC from './ipcChannel'
import { join } from 'path'
export let win: BrowserWindow
let isOverlayOpen: boolean
export async function createWindow() {
  win = new BrowserWindow({
    width: 800,
    height: 600,
    ...OVERLAY_WINDOW_OPTS,
    icon: join(process.env.PUBLIC, 'MavenOrb256.ico'),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false,
      webviewTag: true
    },
  })
  if (process.env.VITE_DEV_SERVER_URL) {
    await win.loadURL(process.env.VITE_DEV_SERVER_URL)
    win.webContents.openDevTools({ mode: 'detach', activate: false })
  }
  else {
    await win.loadFile(join(process.env.DIST, 'index.html'))
  }
  ipcMain.on(IPC.FORCE_POE, () => {
    forcePOE()
  })
  PoeWindow.attach(win, 'Path of Exile')
  PoeWindow.on('poeActiveChange', handlePoeActive)
  win.webContents.on('before-input-event', handleBIEvent)
  win.webContents.on('did-attach-webview', (_, webviewWebContent) => {
    webviewWebContent.on('before-input-event', handleBIEvent)
  })
  win.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })
}

function handlePoeActive(isActive: boolean) {
  if (isOverlayOpen) forceOverlay()
  else if (isActive) {
    win.webContents.send(IPC.POE_ACTIVE)
  }
}
function handleBIEvent(event: Electron.Event, input: Electron.Input) {
  if (input.type !== 'keyDown') return
  let { code, control, alt, shift } = input
  if (code.indexOf('Key') !== -1) code = code.substring(code.indexOf('Key') + 3)
  if (control && !alt && !shift) code = 'Ctrl+' + code
  switch (code) {
    case 'Ctrl+W':
    case 'Escape':
      event.preventDefault()
      forcePOE()
      break
    default:
      return
  }
}

export function toggleOverlay() {
  win.webContents.send(IPC.OVERLAY_SHOW)
  forceOverlay()
}

export function togglePriceCheck(clip: string | null = null) {
  win.webContents.send(IPC.PRICE_CHECK_SHOW, clip, PoeWindow.priceCheckPos)
  forceOverlay()
}
export function forceOverlay() {
  isOverlayOpen = true
  PoeWindow.isActive = false
  OverlayController.activateOverlay()
}
export function forcePOE() {
  isOverlayOpen = false
  PoeWindow.isActive = true
  OverlayController.focusTarget()
}