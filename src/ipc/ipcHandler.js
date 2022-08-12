import IPC from './ipcChannel'
import { win } from '@/utility/overlayWindow'

export function priceCheckEvent(clip, priceCheckPos) {
	win.webContents.send(IPC.PRICE_CHECK_SHOW, clip, priceCheckPos);
}

export function overlayEvent() {
	win.webContents.send(IPC.OVERLAY_SHOW);
}

