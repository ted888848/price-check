import { overlayWindow } from 'electron-overlay-window';
import { EventEmitter } from 'events'
class POEWindowClass extends EventEmitter{
    constructor(){
        super()
        this._isActive = true
    }
    
    set isActive(flag){
        if(this._isActive !== flag){
            this._isActive = flag
            this.emit('poeActiveChange', this._isActive)
        }
    }
    get isActive(){
        return this._isActive
    }
    attach(win) {
        overlayWindow.on('focus',() => this.isActive = true)
        overlayWindow.on('blur',() => this.isActive = false)
        overlayWindow.attachTo(win, 'Path of Exile')
    }
}

export const PoeWindow=new POEWindowClass()
