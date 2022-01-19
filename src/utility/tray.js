import { Tray, Menu, app } from "electron";
import { forcePOE, win } from './overlayWindow'
import path from 'path'
let tray 

export function setupTray(){
    tray = new Tray(path.join(__static,'MavenOrb256.ico'))
    const trayMenu = Menu.buildFromTemplate([
        {
            label: 'open DevTool',
            type: 'normal',
            click(){
                win.webContents.openDevTools({ mode: 'detach', activate: false })
            }
        },
        {
            label: 'Quit',
            type: 'normal',
            click(){
                app.quit()
            }
        }
    ])
    tray.setContextMenu(trayMenu)
}