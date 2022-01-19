import { BrowserWindow, ipcMain, BrowserView, dialog } from 'electron'
import { createProtocol } from 'vue-cli-plugin-electron-builder/lib';
import { overlayWindow } from 'electron-overlay-window';
import { PoeWindow } from './POEWindow'
import IPC from '../ipc/ipcChannel'
import { overlayEvent, priceCheckEvent} from '../ipc/ipcHandler'
// let overlaySH = false
// let priceCheckSH = false
export let win;
let BVwin
export async function createWindow() {
    win = new BrowserWindow({
        width: 800,
        height: 600,
        ...overlayWindow.WINDOW_OPTS,
        icon: `${__static}/MavenOrb256.ico`,
        //backgroundColor: '#00000008',
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            webSecurity: false,
            //preload: path.join(__dirname, 'preload.js')
        },
    });
    if (process.env.WEBPACK_DEV_SERVER_URL) {
        await win.loadURL(process.env.WEBPACK_DEV_SERVER_URL)
        win.webContents.openDevTools({ mode: 'detach', activate: false })
    }
    else {
        createProtocol('app')
        await win.loadURL('app://./index.html')
    }
    //win.setIgnoreMouseEvents(false);
    ipcMain.on(IPC.FORCE_POE,() => { //true overlay ,false priceCheck
        forcePOE()
    })
    ipcMain.on(IPC.BROWSER_VIEW,(e, url)=>{
        setupBV(url)
    })
    PoeWindow.attach(win, 'Path of Exile')
    PoeWindow.on('poeActiveChange',handlePoeActive)
    win.webContents.on('before-input-event',handleBIEvent)
    // ipcMain.on('vueError',(e, name, message)=>{
    //     dialog.showErrorBox(name, message)
    // })
    //forcePOE()

}

function setupBV(url){
    if(!BVwin) BVwin = new BrowserView()
    win.setBrowserView(BVwin)
    BVwin.setBounds({x: 0, y: 0, width: 1920-500, height: 1080})
    BVwin.webContents.loadURL(encodeURI(`https://web.poe.garena.tw/trade/search/${url}`))
    BVwin.webContents.on('before-input-event',handleBIEvent)
}
function handlePoeActive(isActive){
    if(isActive){
        win.webContents.send(IPC.POE_ACTIVE)
    }
}
function handleBIEvent(event,input){
    if(input.type !== 'keyDown') return
    let {code, control, alt, shift}=input
    if(code.indexOf('Key')!==-1) code = code.substring(code.indexOf('Key')+3)
    if(control && !alt && !shift)  code = 'Ctrl+' + code
    switch(code){
        case 'Ctrl+W':
        case 'Escape':
            event.preventDefault()
            forcePOE()
            break
        default:
            return
    }
}
export function toggleOverlay(){
    forceOverlay()
    overlayEvent()
}

export function togglePriceCheck(clip = null){
    priceCheckEvent(clip)
    forceOverlay()
}
export function forceOverlay(){
    PoeWindow.isActive = false
    //win.setIgnoreMouseEvents(false);
    overlayWindow.activateOverlay()
}
export function forcePOE(){
    PoeWindow.isActive = true
    if(BVwin) {
        win.removeBrowserView(BVwin)
        BVwin.webContents.loadURL('about:blank')
    }
    //win.setIgnoreMouseEvents(true);
    overlayWindow.focusTarget()
}