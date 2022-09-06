import { clipboard } from 'electron';
const DELAY = 50
const LIMIT = 250
let clipboardPromise: Promise<string> | null
export async function getClopboard() {
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