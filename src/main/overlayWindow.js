import { BrowserWindow, ipcMain, shell } from 'electron'
import { createProtocol } from 'vue-cli-plugin-electron-builder/lib';
import { OverlayWindow } from 'electron-overlay-window';
import { PoeWindow } from './POEWindow'
import { overlayEvent, priceCheckEvent } from '@/ipc/ipcHandler'
import IPC from '@/ipc/ipcChannel'
import path from 'path';
export let win;
let isOverlayOpen
export async function createWindow() {
	win = new BrowserWindow({
		width: 800,
		height: 600,
		...OverlayWindow.WINDOW_OPTS,
		// eslint-disable-next-line no-undef
		icon: path.join(__static, 'MavenOrb256.ico'),

		webPreferences: {
			nodeIntegration: true,
			contextIsolation: false,
			webSecurity: false,
			webviewTag: true
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
	// ipcMain.on(IPC.GET_COOKIE, async (e) => {
	// 	let [cookie] = await session.defaultSession.cookies.get({ name: 'POESESSID' })
	// 	e.returnValue = cookie
	// })
	// handleHeaderReceived()
	// handleHeaderBeforeSend()
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

// function handleHeaderBeforeSend() {
// 	session.defaultSession.webRequest.onBeforeSendHeaders({ urls: ['https://web.poe.garena.tw/*/*'] },
// 		(details, callback) => {
// 			let poesessid = config.get('config.POESESSID', '')
// 			if (poesessid) {
// 				if (details.requestHeaders['Cookie']) {
// 					details.requestHeaders['Cookie'] = details.requestHeaders['Cookie']
// 						.split(';').map(e => e.trim())
// 						.filter(e => !e.startsWith('POESESSID'))
// 						.join('; ')
// 						.concat(`; POESESSID=${poesessid}`)
// 				}
// 				else {
// 					details.requestHeaders['Cookie'] = `POESESSID=${poesessid}`
// 				}
// 			}
// 			callback({ requestHeaders: details.requestHeaders })
// 		})
// }

// function handleHeaderReceived() {
// 	session.defaultSession.webRequest.onHeadersReceived({ urls: ['https://web.poe.garena.tw/*/*'] },
// 		(details, callback) => {
// 			for (let key in details.responseHeaders) {
// 				if (key.toLowerCase() == 'set-cookie') {
// 					details.responseHeaders[key] = details.responseHeaders[key].map(cookie => {
// 						cookie = cookie.split(';').map(e => e.trim())
// 							.filter(e => !(e.startsWith('SameSite') || e.startsWith('secure')))
// 							.join('; ')
// 						return `${cookie}; SameSite=None; Secure`
// 					})
// 				}
// 			}
// 			callback({ responseHeaders: details.responseHeaders })
// 		})
// }

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
	OverlayWindow.focusTarget()
}