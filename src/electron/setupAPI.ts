import { GGCapi } from '@/lib/api'
import Store from 'electron-store'
import { app, session, dialog } from 'electron' //, shell
import { autoUpdater } from 'electron-updater'
import { buildTray } from './tray'
const store = new Store({
  name: 'APIData'
})

function setupItemEntries(itemArray: APIItem['entries'], heistReward: HeistReward[]) {
  const itemBaseType: Item['entries'] = []
  try {
    itemArray.slice().forEach((item) => {
      let tempItem = itemBaseType.find(element => element.type === item.type)
      if (!tempItem) {
        tempItem = {
          type: item.type,
          text: item.type,
          unique: []
        }
      }
      if (item.flags?.unique === true) {
        tempItem.unique.push({
          name: item.name, text: item.text
        })
        if (item.name.startsWith('贗品')) {
          heistReward.push({
            name: item.name, type: item.type, text: item.text
          })
        }
      }
      itemBaseType.push(tempItem)
    })
  } catch (e) {
    console.log(e)
  }
  return itemBaseType
}
function parseGams(gemEntries: APIItem['entries']) {
  const result: ItemGem['entries'] = []
  gemEntries.forEach((gem) => {
    if (gem.disc && !gem.disc.startsWith('alt_')) return
    if (gem.disc && gem.disc.startsWith('alt_')) {
      const sameTypeGem = result.find(resultGem => resultGem.type === gem.type)
      if (sameTypeGem) {
        sameTypeGem.trans.push({
          text: gem.text, disc: gem.disc
        })
      }
      else {
        result.push({
          type: gem.type,
          text: gem.type,
          trans: [{
            text: gem.text, disc: gem.disc
          }]
        })
      }
    }
    else {
      result.push({
        type: gem.type, text: gem.type, trans: []
      })
    }
  })
  return result
}
function setupAPIItems(itemsJson: APIItems) {
  const APIitems: Partial<ParsedAPIitems> = {
  }
  const heistReward: HeistReward[] = []
  itemsJson.result.forEach((itemGroup) => {
    const groupID = itemGroup.id as keyof ParsedAPIitems
    switch (groupID) {
      case 'accessories':
      case 'armour':
      case 'flasks':
      case 'jewels':
      case 'weapons':
      case 'watchstones':
      case 'heistequipment':
      case 'heistmission':
      case 'logbook':
        APIitems[groupID] = {
          id: itemGroup.id,
          label: itemGroup.label,
          entries: setupItemEntries(itemGroup.entries, heistReward)
        }
        break
      case 'maps':
        APIitems[groupID] = {
          id: itemGroup.id,
          label: itemGroup.label,
          entries: setupItemEntries(itemGroup.entries.filter((ele) => ele.disc === 'warfortheatlas'), heistReward)
        }
        break
      case 'cards':
      case 'currency':
        APIitems[groupID] = itemGroup
        break
      case 'gems':
        APIitems[groupID] = {
          ...itemGroup, entries: parseGams(itemGroup.entries), id: 'gems'
        }
        heistReward.push(...parseGams(itemGroup.entries))
        break
      default:
        APIitems[groupID] = {
          ...itemGroup, entries: setupItemEntries(itemGroup.entries, heistReward), id: groupID as string
        }
        return
    }
  })
  return {
    APIitems, heistReward
  }
}
function checkNewline(statsGroup: APIStatsItem) {
  const mutiLines: ParsedAPIMod['mutiLines'] = []
  statsGroup.entries.forEach((stat: any) => {
    if (stat.text.includes('\n')) {
      const lines = stat.text.split('\n')
      mutiLines.push({
        id: stat.id, text: lines
      })
    }
  })
  if (mutiLines.length) return mutiLines.slice()
  return undefined
}
function setupAPIMods(statsJson: APIStats) {
  const APImods: Partial<ParsedAPIMods> = {
  }
  statsJson.result.forEach((statsGroup) => {
    switch (statsGroup.id) {
      case 'pseudo':
        APImods.pseudo = {
          label: statsGroup.label,
          entries: statsGroup.entries.filter((stat) => stat.text.indexOf('有房間：') === -1)
            .map((stat) => ({
              id: stat.id, text: stat.text, option: stat.option
            })),
          type: '偽屬性'
        }
        APImods.temple = {
          label: statsGroup.label,
          entries: statsGroup.entries.filter((stat) => stat.text.indexOf('有房間：') > -1)
            .map((stat) => ({
              id: stat.id,
              text: stat.text.substring(4).replace(/（階級 [123]）/, ''),
              value: {
                option: 1
              }
            })),
          type: '神廟'
        }
        break
      case 'explicit':
        APImods.forbiddenJewel = {
          label: statsGroup.label,
          entries: statsGroup.entries.filter((ele) => /^若你在禁忌(烈焰|血肉)上有符合的詞綴，配置 #$/.test(ele.text)),
          type: '隨機'
        }
        APImods.explicit = {
          label: statsGroup.label,
          entries: statsGroup.entries.map((ele) => ({
            ...ele
          })).filter((stat) => !stat.text.includes('\n')),
          type: '隨機'
        }
        APImods.explicit.mutiLines = checkNewline(statsGroup)
        break
      case 'implicit':
        APImods.implicit = {
          label: statsGroup.label,
          entries: statsGroup.entries.map((ele) => ({
            ...ele
          })).filter((stat) => !stat.text.includes('\n')),
          type: '固定'
        }
        APImods.implicit.mutiLines = checkNewline(statsGroup)
        break
      case 'fractured':
        APImods.fractured = {
          label: statsGroup.label,
          entries: statsGroup.entries.map((ele) => ({
            ...ele
          })).filter((stat) => !stat.text.includes('\n')),
          type: '破裂'
        }
        APImods.fractured.mutiLines = checkNewline(statsGroup)
        break
      case 'enchant':
        APImods.clusterJewel = {
          label: statsGroup.label,
          entries:
            statsGroup.entries.splice(statsGroup.entries
              .findIndex((ele) => ele.text === '附加的小型天賦給予：#'), 1)[0].option.options
              .map(option => ({
                id: option.id.toString(), text: option.text
              })),
          type: '附魔'
        }
        APImods.enchant = {
          label: statsGroup.label,
          entries: statsGroup.entries.map((ele) => ({
            ...ele
          }))
            .filter((stat) => !stat.text.includes('\n')),
          type: '附魔'
        }
        APImods.enchant.mutiLines = checkNewline(statsGroup)
        break
      case 'crafted':
        APImods.crafted = {
          label: statsGroup.label,
          entries: statsGroup.entries.map((ele) => ({
            ...ele
          })).filter((stat) => !stat.text.includes('\n')),
          type: '工藝'
        }
        APImods.crafted.mutiLines = checkNewline(statsGroup)
        break
      case 'sanctum':
        APImods.sanctum = {
          label: statsGroup.label,
          entries: statsGroup.entries.map((ele) => ({
            ...ele
          })).filter((stat) => !stat.text.includes('\n')),
          type: '聖域'
        }
        APImods.sanctum.mutiLines = checkNewline(statsGroup)
      case 'necropolis':
        APImods.necropolis = {
          label: statsGroup.label,
          entries: statsGroup.entries.map((ele) => ({
            ...ele
          })).filter((stat) => !stat.text.includes('\n')),
          type: '棺材'
        }
        APImods.necropolis.mutiLines = checkNewline(statsGroup)
      default:
        return
    }
  })
  return APImods
}
function setupAPIStatic(data: APIStaticItem[]) {
  let APIStatic: Static[] = []
  data.forEach((group) => {
    if (group.label?.match(/^地圖(（|\s\()|命運卡/)) return
    APIStatic = APIStatic.concat(structuredClone(group.entries))
  })
  return APIStatic
}
async function getLeagues() {
  const response = await GGCapi.get('trade/data/leagues')
  const data = response.data as APILeagues
  const leagues = data.result.map((l) => l.text)
  store.set('Leagues', leagues)
}
async function getItems() {
  const response = await GGCapi.get('trade/data/items')
  const data = response.data as APIItems
  const { APIitems, heistReward } = setupAPIItems(data)
  store.set('APIitems', APIitems)
  store.set('heistReward', heistReward)
}
async function getStats() {
  const response = await GGCapi.get('trade/data/stats')
  const data = response.data as APIStats
  store.set('APImods', setupAPIMods(data))
}
async function getStatic() {
  const response = await GGCapi.get('trade/data/static')
  const data = response.data as APIStatic
  const _currencyImageUrl = data.result[0].entries
  store.set('currencyImageUrl', _currencyImageUrl)
  store.set('APIStatic', setupAPIStatic(data.result))
}
export async function getAPIdata() {
  const result = await Promise.allSettled([getLeagues(), getItems(), getStatic(), getStats()])
  let error: any
  result.forEach((e) => {
    if (e.status === 'rejected') {
      error = e.reason
    }
  })
  store.set('APIVersion', app.getVersion())
  if (error?.length) throw error
}

export const updateState = {
  label: '', canClick: true
}

autoUpdater.on('update-available', ({ version, releaseNotes }) => {
  updateState.label = `下載新版本 v${version}中`
  updateState.canClick = false
  buildTray()
  dialog.showMessageBox({
    title: '有新版本',
    type: 'info',
    message: `有新版本 v${version}，並已經開始在背景下載\n
    ${releaseNotes!.toString().replaceAll(/<[/]?(ul|li)>/g, '')}`,
  })
})
autoUpdater.on('update-downloaded', () => {
  updateState.label = '下載完成，關閉後將自動安裝'
  updateState.canClick = false
  buildTray()
  dialog.showMessageBox({
    title: '下載完成',
    type: 'info',
    message: '更新安裝擋已經下載完成，如果沒有自動重新啟動，\n請手動離開後稍等安裝完畢再打開',
    buttons: ['重新開啟並安裝更新', '稍後再安裝'],
    defaultId: 0
  })
    .then((result) => {
      if (result.response === 0) {
        setImmediate(() => { autoUpdater.quitAndInstall() })
      }
    })
})
autoUpdater.on('update-not-available', () => {
  updateState.label = '目前沒有新版本'
  updateState.canClick = true
  buildTray()
})
export async function checkForUpdate() {
  if ((await session.defaultSession?.getCacheSize() >>> 20) >= 30) { //大於30MB
    session.defaultSession.clearCache()
      .catch(err => console.log(err))
    session.defaultSession.clearCodeCaches({
    })
      .catch(err => console.log(err))
  }
  updateState.label = '檢查更新中'
  updateState.canClick = false
  buildTray()
  try {
    await autoUpdater.checkForUpdates()
  }
  catch {
    updateState.label = '檢查更新錯誤'
    updateState.canClick = true
    buildTray()
  }
  if (store.get('APIVersion', '') !== app.getVersion()) {
    try {
      await getAPIdata()
    }
    catch (err: any) {
      throw new Error(err)
    }
  }
}
