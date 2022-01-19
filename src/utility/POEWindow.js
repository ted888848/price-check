import { OverlayWindow } from 'electron-overlay-window';
import { EventEmitter } from 'events'
class POEWindowClass extends EventEmitter{
    constructor(){
        super()
        this._isActive = true
    }
    get bounds(){
        return OverlayWindow.bounds
    }
    get priceCheckPos(){
        return `${Math.round(this.bounds.height*(37/60)-1)}px`
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
        OverlayWindow.events.on('focus',() => this.isActive = true)
        OverlayWindow.events.on('blur',() => this.isActive = false)
        OverlayWindow.attachTo(win, 'Path of Exile')
    }
}

export const PoeWindow=new POEWindowClass()
