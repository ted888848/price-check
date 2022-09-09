import { OverlayWindow } from 'electron-overlay-window'
import { EventEmitter } from 'events'
import type { BrowserWindow } from 'electron'
class POEWindowClass extends EventEmitter {
  private _isActive: boolean;
  constructor() {
    super()
    this._isActive = false
  }
  get bounds() {
    return OverlayWindow.bounds
  }
  get priceCheckPos() {
    return `${Math.round(this.bounds.height * (37 / 60) - 1)}px`
  }
  set isActive(flag) {
    if (this._isActive !== flag) {
      this._isActive = flag
      this.emit('poeActiveChange', this._isActive)
    }
  }
  get isActive() {
    return this._isActive
  }
  attach(win: BrowserWindow, windowName: string ) {
    OverlayWindow.events.on('focus', () => this.isActive = true)
    OverlayWindow.events.on('blur', () => this.isActive = false)
    OverlayWindow.attachTo(win, windowName)
  }
}

export const PoeWindow = new POEWindowClass()
