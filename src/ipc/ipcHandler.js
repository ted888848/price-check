
import IPC from './ipcChannel'
import { win } from '../utility/overlayWindow'


export function priceCheckEvent(clip){
    win.webContents.send(IPC.PRICE_CHECK_SHOW, clip);
}

export function overlayEvent(){
    win.webContents.send(IPC.OVERLAY_SHOW);
}

// export function priceCheckEvent(){
//     getClopboard().then((clip)=>{
//         console.log(clip)
//         //win.webContents.send(IPC.PRICE_CHECK_SHOW);
//     })

// }