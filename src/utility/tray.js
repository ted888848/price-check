import { Tray, Menu, app, shell } from "electron";
import { win } from './overlayWindow'
import path from 'path'
let tray

export function setupTray() {
	// eslint-disable-next-line no-undef
	tray = new Tray(path.join(__static, 'MavenOrb256.ico'))
	const trayMenu = Menu.buildFromTemplate([
		{
			label: 'DevTool',
			type: 'normal',
			click() {
				win.webContents.openDevTools({ mode: 'detach', activate: false })
			}
		},
		{
			label: '最新版本',
			type: 'normal',
			click() {
				shell.openExternal('https://github.com/ted888848/price-check/releases/latest')
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