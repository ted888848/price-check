import { clipboard, globalShortcut } from 'electron'
import { toggleOverlay, togglePriceCheck } from './overlayWindow'
import { PoeWindow } from './POEWindow'
import { getClipboard } from './clipboard'
import { config } from './config'
import { uIOhook, UiohookKey } from 'uiohook-napi'
export function setupShortcut() {
  if (PoeWindow.isActive) {
    registerShortcut()
  }
  PoeWindow.on('poeActiveChange', (isActive) => {
    process.nextTick(() => {
      if (PoeWindow.isActive === isActive) {
        if (isActive) registerShortcut()
        else unRegisterShortcut()
      }
    })
  })
}

export function registerShortcut() {
  globalShortcut.register(config.priceCheckHotkey, () => {
    getClipboard()
      .then((clip) => togglePriceCheck(clip))
      .catch((err) => console.log(err))
    uIOhook.keyTap(UiohookKey.C, [UiohookKey.Ctrl])
  })
  globalShortcut.register(config.settingHotkey, () => {
    toggleOverlay()
  })
  config.shortcuts.forEach((shortcut) => {
    if (!shortcut.hotkey.length) return
    let typeText = ''
    let moveToFront = false
    let lastMsg = false
    if (shortcut.outputText.startsWith('@last')) {
      lastMsg = true
      typeText = shortcut.outputText.substring(5).trim()
    }
    else if (shortcut.outputText.endsWith('@last')) {
      lastMsg = true
      moveToFront = true
      typeText = shortcut.outputText.substring(0, shortcut.outputText.length - 5)
    }
    else if (shortcut.outputText.includes('@char')) {
      typeText = shortcut.outputText.replace('@char', config.characterName)
    }
    else {
      typeText = shortcut.outputText
    }
    globalShortcut.register(shortcut.hotkey, () => pasteTextToChat(typeText, lastMsg, moveToFront))
  })
}
export function unRegisterShortcut() {
  globalShortcut.unregisterAll()
}
let isClipStored = true
async function pasteTextToChat(text: string, lastMsg?: boolean, moveToFront?: boolean) {
  if (!isClipStored) {
    return
  }
  isClipStored = false
  let clipSave = clipboard.readText()
  clipboard.writeText(text)
  for (let i = 0; i < 5; ++i) {
    await new Promise((resolve) => setTimeout(resolve, 20))
    if (clipboard.readText() === text) break
    clipboard.writeText(text)
  }
  if (lastMsg) {
    uIOhook.keyTap(UiohookKey.Enter, [UiohookKey.Ctrl])
  }
  else {
    uIOhook.keyTap(UiohookKey.Enter)
  }

  if (moveToFront) {
    uIOhook.keyTap(UiohookKey.Home)
    uIOhook.keyTap(UiohookKey.Delete)
  }
  else if (/^[#%$&/]/.test(text)) {
    uIOhook.keyTap(UiohookKey.A, [UiohookKey.Ctrl])
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

