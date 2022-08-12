import { clipboard, globalShortcut } from 'electron'
import { toggleOverlay, togglePriceCheck } from './overlayWindow';
import { PoeWindow } from './POEWindow'
import { getClopboard } from './clipboard'
import { config } from './config';
import robotjs from '@jitsi/robotjs'
export function setupShortcut() {
	robotjs.setKeyboardDelay(1)
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
		robotjs.keyTap('C', ['control'])
		//togglePriceCheck()
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
		robotjs.keyTap('enter', ['control'])
		robotjs.keyTap('home')
		robotjs.keyTap('delete')
	}
	else {
		clipboard.writeText(text)
		robotjs.keyTap('enter')
	}
	robotjs.keyTap('V', ['control'])
	robotjs.keyTap('enter')
	setTimeout(() => {
		clipboard.writeText(clipSave)
		isClipStored = true
	}, 120)
}

