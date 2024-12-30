import { GGCapi } from './lib/api'
import Store from 'electron-store'
import { app, session, dialog, autoUpdater } from 'electron' //, shell
import { updateElectronApp, makeUserNotifier } from 'update-electron-app'
// import { autoUpdater } from 'electron-updater'
import { buildTray } from './tray'
import { config } from './config'
const store1 = new Store({
  name: 'APIData'
})

const store2 = new Store({
  name: 'API2Data'
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
      case 'accessory':
      case 'armour':
      case 'flask':
      case 'jewel':
      case 'weapon':
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
      case 'map':
        APIitems[groupID] = {
          id: itemGroup.id,
          label: itemGroup.label,
          entries: setupItemEntries(itemGroup.entries.filter((ele) => ele.disc === 'warfortheatlas'), heistReward)
        }
        break
      case 'card':
      case 'currency':
        APIitems[groupID] = itemGroup
        break
      case 'gem':
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
              .findIndex((ele) => ele.text === '附加的小型天賦給予：#'), 1)[0].option?.options
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
async function getLeagues(poeVersion: POEVersion = '1') {
  const response = await GGCapi.get(`trade${poeVersion === '2' ? '2' : ''}/data/leagues`)
  const data = response.data as APILeagues
  const leagues = data.result.map((l) => l.text)
  const store = poeVersion === '2' ? store2 : store1
  store.set('Leagues', leagues)
}
async function getItems(poeVersion: POEVersion = '1') {
  const response = await GGCapi.get(`trade${poeVersion === '2' ? '2' : ''}/data/items`)
  const data = response.data as APIItems
  const { APIitems, heistReward } = setupAPIItems(data)
  const store = poeVersion === '2' ? store2 : store1
  store.set('APIitems', APIitems)
  store.set('heistReward', heistReward)
}
async function getStats(poeVersion: POEVersion = '1') {
  const response = await GGCapi.get(`trade${poeVersion === '2' ? '2' : ''}/data/stats`)
  const data = response.data as APIStats
  const store = poeVersion === '2' ? store2 : store1
  store.set('APImods', setupAPIMods(data))
}
async function getStatic(poeVersion: POEVersion = '1') {
  const response = await GGCapi.get(`trade${poeVersion === '2' ? '2' : ''}/data/static`)
  const data = response.data as APIStatic
  const _currencyImageUrl = data.result[0].entries
  const store = poeVersion === '2' ? store2 : store1
  store.set('currencyImageUrl', _currencyImageUrl)
  store.set('APIStatic', setupAPIStatic(data.result))
}
export async function get1APIdata() {
  const result = await Promise.allSettled([getLeagues(), getItems(), getStatic(), getStats()])
  let error: any
  result.forEach((e) => {
    if (e.status === 'rejected') {
      error = e.reason
    }
  })
  store1.set('APIVersion', app.getVersion())
  if (error?.length) throw error
}

export async function get2APIdata() {
  const result = await Promise.allSettled([getLeagues('2'), getItems('2'), getStatic('2'), getStats('2')])
  let error: any
  result.forEach((e) => {
    if (e.status === 'rejected') {
      error = e.reason
      console.log(error)
    }

  })
  store1.set('APIVersion', app.getVersion())
  if (error?.length) throw error
}


export const updateState = {
  label: '', canClick: true
}

autoUpdater.on('update-available', () => {
  updateState.label = '背景下載新版本中'
  updateState.canClick = false
  buildTray()
  dialog.showMessageBox({
    title: '有新版本',
    type: 'info',
    message: '有新版本正在背景下載',
  })
})
// autoUpdater.on('update-downloaded', () => {
//   updateState.label = '下載完成，關閉後將自動安裝'
//   updateState.canClick = false
//   buildTray()
//   dialog.showMessageBox({
//     title: '下載完成',
//     type: 'info',
//     message: '更新安裝擋已經下載完成，如果沒有自動重新啟動，\n請手動離開後稍等安裝完畢再打開',
//     buttons: ['重新開啟並安裝更新', '稍後再安裝'],
//     defaultId: 0
//   })
//     .then((result) => {
//       if (result.response === 0) {
//         setImmediate(() => { autoUpdater.quitAndInstall() })
//       }
//     })
// })
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
    // await autoUpdater.checkForUpdates()
    updateElectronApp({
      notifyUser: true,
      onNotifyUser(info) {
        makeUserNotifier({
          title: '新版本下載完成',
          detail: `新版本 ${info.releaseName}，已經下載完成\n
          ${info.releaseNotes!.toString().replaceAll(/<[/]?(ul|li)>/g, '')}`,
          laterButtonText: '稍後再安裝',
          restartButtonText: '重新開啟並安裝更新',
        })
      },
      updateInterval: '20 minutes',
    })
  }
  catch {
    updateState.label = '檢查更新錯誤'
    updateState.canClick = true
    buildTray()
  }
  if (config.poeVersion === '1') {
    if (store1.get('APIVersion', '') !== app.getVersion()) {
      try {
        await get1APIdata()
      }
      catch (err: any) {
        throw new Error(err)
      }
    }
  }
  else {
    if (store2.get('APIVersion', '') !== app.getVersion()) {
      try {
        await get2APIdata()
      }
      catch (err: any) {
        throw new Error(err)
      }
    }
  }
}
