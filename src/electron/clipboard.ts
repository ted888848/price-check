import { clipboard } from 'electron'
import { debounce, throttle } from 'lodash-es'
const DELAY = 50
const LIMIT = 250
let clipboardPromise: Promise<string> | null
export class MyClipBoard {
  private static clipSave: string | null = null
  private static debounceFun = debounce(() => {
    if (this.clipSave !== null) clipboard.writeText(this.clipSave)
    this.clipSave = null
  }, 250)
  public static delayRestoreClipboard = throttle((callback: () => void) => {
    if (this.clipSave === null) {
      this.clipSave = clipboard.readText()
    }
    callback()
    this.debounceFun()
  }, 50, { leading: true, trailing: false })
}
export async function getClipboard() {
  let timeLimit = 0
  if (clipboardPromise) {
    return await clipboardPromise
  }
  const clipBefore = clipboard.readText()
  clipboard.writeText('')

  clipboardPromise = new Promise((resolve, reject) => {
    function foo() {
      const clipAfter = clipboard.readText()
      if (clipAfter.startsWith('物品種類:')) {
        clipboard.writeText(clipBefore)
        clipboardPromise = null
        resolve(clipAfter)
      }
      else {
        timeLimit += DELAY
        if (timeLimit > LIMIT) {
          clipboardPromise = null
          clipboard.writeText(clipBefore)
          reject('time limit')
        }
        else {
          setTimeout(foo, DELAY)
        }
      }
    }
    foo()
  })
  return clipboardPromise
}