import { clipboard, globalShortcut } from 'electron'
import { toggleOverlay, togglePriceCheck } from './overlayWindow';
import { PoeWindow } from './POEWindow'
import { getClopboard } from './clipboard'
import { config } from './config';
// import robotjs from 'robotjs'
import robotjs from 'robotjs'
// const robotjs = require('robotjs')
export function setupShortcut(){
    robotjs.setKeyboardDelay(0)
    registShortcut()
    PoeWindow.on('poeActiveChange',(isActive)=>{
        process.nextTick(()=>{
            if(isActive) registShortcut()
            else unRegistShortcut()
        })
    })
}

function registShortcut() {
    globalShortcut.register('CmdOrCtrl+D', () => {
        getClopboard()
        .then((clip) => togglePriceCheck(clip))
        .catch((err) => console.log(err))
        robotjs.keyTap('C',['control'])
        //togglePriceCheck()
    });
    globalShortcut.register('CmdOrCtrl+F2', () => {
        toggleOverlay()
    })
    globalShortcut.register('F5',()=>pasteTextToChat('/hideout'))
    globalShortcut.register('F4',()=>pasteTextToChat(`/kick ${config.get('config.characterName')}`))
    globalShortcut.register('F3',()=>pasteTextToChat('%TY'))
    globalShortcut.register('F2',()=>pasteTextToChat('/invite ',true))
}
function unRegistShortcut(){
    globalShortcut.unregisterAll()
}

function pasteTextToChat(text, moveToFront){
    let clipSave=clipboard.readText()
    clipboard.writeText(text)
    if(moveToFront){
        robotjs.keyTap('enter',['control'])
        robotjs.keyTap('home')
        robotjs.keyTap('delete')
    }
    else{
        robotjs.keyTap('enter')
        // robotjs.keyTap('A',['control'])
    }
    robotjs.keyTap('V',['control'])
    robotjs.keyTap('enter')
    // robotjs.keyTap('enter')
    // robotjs.keyTap('up')
    // robotjs.keyTap('up')
    // robotjs.keyTap('escape')
    clipboard.writeText(clipSave)
}

