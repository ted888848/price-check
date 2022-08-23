import { clipboard, globalShortcut } from 'electron'
import { toggleOverlay, togglePriceCheck } from './overlayWindow'
import { PoeWindow } from './POEWindow'
import { getClopboard } from './clipboard'
import { config } from './config'
import { uIOhook, UiohookKey } from 'uiohook-napi'
export function setupShortcut() {
	registShortcut()
	PoeWindow.on('poeActiveChange', (isActive) => {
		process.nextTick(() => {
			if (isActive) registShortcut()
			else unRegistShortcut()
		})
	})
}

function registShortcut() {
	globalShortcut.register('CmdOrCtrl+D', () => {
		getClopboard()
			.then((clip) => togglePriceCheck(clip))
			.catch((err) => console.log(err))
		uIOhook.keyTap(UiohookKey.C, [UiohookKey.Ctrl])
	});
	globalShortcut.register('CmdOrCtrl+F2', () => {
		toggleOverlay()
	})
	globalShortcut.register('F5', () => pasteTextToChat('/hideout'))
	globalShortcut.register('F4', () => pasteTextToChat(`/kick ${config.get('config.characterName')}`))
	globalShortcut.register('F3', () => pasteTextToChat('%TY'))
	globalShortcut.register('F2', () => pasteTextToChat('/invite ', true))
}
function unRegistShortcut() {
	globalShortcut.unregisterAll()
}
let isClipStored = true
function pasteTextToChat(text, moveToFront) {
	if (!isClipStored) {
		return
	}
	isClipStored = false
	let clipSave = clipboard.readText()
	if (moveToFront) {
		clipboard.writeText(text)
		uIOhook.keyTap(UiohookKey.Enter, [UiohookKey.Ctrl])
		uIOhook.keyTap(UiohookKey.Home)
		uIOhook.keyTap(UiohookKey.Delete)
	}
	else {
		clipboard.writeText(text)
		uIOhook.keyTap(UiohookKey.Enter)
	}
	uIOhook.keyTap(UiohookKey.V, [UiohookKey.Ctrl])
	uIOhook.keyTap(UiohookKey.Enter)
	//return to latest message
	uIOhook.keyTap(UiohookKey.Enter)
	uIOhook.keyTap(UiohookKey.ArrowUp)
	uIOhook.keyTap(UiohookKey.ArrowUp)
	uIOhook.keyTap(UiohookKey.Escape)

	setTimeout(() => {
		clipboard.writeText(clipSave)
		isClipStored = true
	}, 120)
}

