import { Tray, Menu, app } from "electron";
import { win } from './overlayWindow'
import { checkForUpdate } from './setupAPI'
import path from 'path'
let tray

export function setupTray() {
	// eslint-disable-next-line no-undef
	tray = new Tray(path.join(__static, 'MavenOrb.ico'))
	const trayMenu = Menu.buildFromTemplate([
		{
			label: 'DevTool',
			type: 'normal',
			click() {
				win.webContents.openDevTools({ mode: 'detach', activate: false })
			}
		},
		{
			label: `目前版本: v${app.getVersion()}\n檢查更新`,
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