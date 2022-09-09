import { Tray, Menu, app } from 'electron'
import { win } from './overlayWindow'
import { checkForUpdate } from './setupAPI'
import path from 'path'
import { updateState } from './setupAPI'
let tray: Tray
export function buildTray() {
  const trayMenu = Menu.buildFromTemplate([
    {
      label: 'DevTool',
      type: 'normal',
      click() {
        win.webContents.openDevTools({
          mode: 'detach', activate: false 
        })
      }
    },
    {
      label: `目前版本: v${app.getVersion()}`,
      enabled: false
    },
    {
      enabled: updateState.canClick,
      label: updateState.label,
      type: 'normal',
      click() {
        checkForUpdate()
      }
    },
    {
      label: 'Quit',
      type: 'normal',
      click() {
        app.quit()
      }
    }
  ])
  tray.setContextMenu(trayMenu)
}

export function setupTray() {
  tray = new Tray(path.join(__static, 'MavenOrb.ico'))
  buildTray()
}