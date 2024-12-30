import { Tray, Menu, app } from 'electron'
import { win } from './overlayWindow'
import { checkForUpdate } from './setupAPI'
import { join } from 'path'
import { updateState } from './setupAPI'
import { config, updateConfig } from './config'
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
      label: 'POE版本(修改需重啟此App)',
      type: 'submenu',
      submenu: [
        {
          label: '1',
          type: 'radio',
          checked: config.poeVersion === '1',
          click() {
            if (config.poeVersion === '1') return
            updateConfig({ poeVersion: '1' })
            app.relaunch()
            app.quit()
          }
        },
        {
          label: '2',
          type: 'radio',
          checked: config.poeVersion === '2',
          click() {
            if (config.poeVersion === '2') return
            updateConfig({ poeVersion: '2' })
            app.relaunch()
            app.quit()
          }
        }
      ]
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
  tray = new Tray(join(__dirname, 'SextantOrb128.ico'))
  buildTray()
}