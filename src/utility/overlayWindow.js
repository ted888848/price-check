import { BrowserWindow, ipcMain, BrowserView } from 'electron'
import { createProtocol } from 'vue-cli-plugin-electron-builder/lib';
import { OverlayWindow } from 'electron-overlay-window';
import { PoeWindow } from './POEWindow'
import IPC from '@/ipc/ipcChannel'
import { overlayEvent, priceCheckEvent } from '@/ipc/ipcHandler'
export let win;
let BVwin
let isOverlayOpen
export async function createWindow() {
	win = new BrowserWindow({
		width: 800,
		height: 600,
		...OverlayWindow.WINDOW_OPTS,
		// eslint-disable-next-line no-undef
		icon: `${__static}/MavenOrb256.ico`,
		webPreferences: {
			nodeIntegration: true,
			contextIsolation: false,
			webSecurity: false,
		},
	});
	if (process.env.WEBPACK_DEV_SERVER_URL) {
		await win.loadURL(process.env.WEBPACK_DEV_SERVER_URL)
		win.webContents.openDevTools({ "mode": 'detach', "activate": false })
	}
	else {
		createProtocol('app')
		await win.loadURL('app://./index.html')
	}
	ipcMain.on(IPC.FORCE_POE, () => {
		forcePOE()
	})
	ipcMain.on(IPC.BROWSER_VIEW, (_, url) => {
		setupBV(url)
	})
	PoeWindow.attach(win, 'Path of Exile')
	PoeWindow.on('poeActiveChange', handlePoeActive)
	win.webContents.on('before-input-event', handleBIEvent)
}

function setupBV(url) {
	if (!BVwin) BVwin = new BrowserView()
	win.setBrowserView(BVwin)
	BVwin.setBounds({ x: 0, y: 0, width: PoeWindow.bounds.width - 500, height: PoeWindow.bounds.height })
	BVwin.webContents.loadURL(encodeURI(`https://web.poe.garena.tw/trade/${url}`))
	BVwin.webContents.on('before-input-event', handleBIEvent)
}
function handlePoeActive(isActive) {
	if (isOverlayOpen) forceOverlay()
	else if (isActive) {
		win.webContents.send(IPC.POE_ACTIVE)
	}
}
function handleBIEvent(event, input) {
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
	forceOverlay()
	overlayEvent()
}

export function togglePriceCheck(clip = null) {
	priceCheckEvent(clip, PoeWindow.priceCheckPos)
	forceOverlay()
}
export function forceOverlay() {
	isOverlayOpen = true
	PoeWindow.isActive = false
	OverlayWindow.activateOverlay()
}
export function forcePOE() {
	isOverlayOpen = false
	PoeWindow.isActive = true
	if (BVwin) {
		win.removeBrowserView(BVwin)
		BVwin.webContents.loadURL('about:blank')
	}
	OverlayWindow.focusTarget()
}