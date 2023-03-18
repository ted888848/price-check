import IPC from './ipcChannel'
import { win } from '../overlayWindow'

export function priceCheckEvent(clip: string | null, priceCheckPos: string) {
  win.webContents.send(IPC.PRICE_CHECK_SHOW, clip, priceCheckPos)
}

export function overlayEvent() {
  win.webContents.send(IPC.OVERLAY_SHOW)
}

