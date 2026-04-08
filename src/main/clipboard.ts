import { clipboard } from 'electron'
const DELAY = 50
const LIMIT = 250
let clipboardPromise: Promise<string> | null

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

export function withTemporaryClipboardText(
  text: string,
  action: () => void,
  options?: { maxRetry?: number, retryIntervalMs?: number, restoreDelayMs?: number }
) {
  const beforeText = clipboard.readText()
  const maxRetry = options?.maxRetry ?? 10
  const retryIntervalMs = options?.retryIntervalMs ?? 20
  const restoreDelayMs = options?.restoreDelayMs ?? 250
  let retryCount = 0

  const runAction = () => {
    action()
    setTimeout(() => {
      clipboard.writeText(beforeText)
    }, restoreDelayMs)
  }

  const ensureClipboard = () => {
    clipboard.writeText(text)
    if (clipboard.readText() === text) {
      runAction()
      return
    }

    retryCount += 1
    if (retryCount > maxRetry) {
      runAction()
      return
    }

    setTimeout(ensureClipboard, retryIntervalMs)
  }

  ensureClipboard()
}