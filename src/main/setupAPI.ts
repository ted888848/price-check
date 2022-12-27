import { GGCapi } from '@/utility/api'
import Store from 'electron-store'
import { cloneDeep } from 'lodash-es'
import { app, session, dialog } from 'electron' //, shell
import { autoUpdater } from 'electron-updater'
import { buildTray } from './tray'
import type {IAPIitems, IAPIMods, IStatic, IHiestReward} from '@/web/APIdata'
let store = new Store({
  name: 'APIData'
})

function setupItemArray(itemArray: any[], hiestReward: any[]) {
  let itemBaseType: any[] = []
  itemArray.slice().reverse().forEach((item: any) => {
    let index = itemBaseType.findIndex(element => element.type === item.type)
    if (index === -1) {
      itemBaseType.push({
        ...item, unique: [] 
      })
    }
    if (item.flags?.unique === true) {
      itemBaseType[index].unique.push({
        name: item.name, text: item.text 
      })
      if (item.name.startsWith('贗品')) {
        hiestReward.push({
          name: item.name, type: item.type, text: item.text 
        })
      }
    }
  })
  return itemBaseType
}
function setupAPIItems(itemsJson: any) {
  let APIitems: IAPIitems
  let hiestReward: IHiestReward[] = []
  itemsJson.result.forEach((itemGroup: any) => {
    let groupID = itemGroup.id as keyof IAPIitems
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
          id: itemGroup.id, label: itemGroup.label, entries: setupItemArray(itemGroup.entries, hiestReward) 
        }
        break
      case 'maps':
        APIitems[groupID] = {
          id: itemGroup.id, label: itemGroup.label, entries: setupItemArray(itemGroup.entries.filter((ele: any) => ele.disc === 'warfortheatlas'), hiestReward) 
        }
        break
      case 'cards':
      case 'currency':
      case 'gems':
        APIitems[groupID] = itemGroup
        if (itemGroup.id === 'gems') hiestReward.push(...itemGroup.entries)
        break
      default:
        return
    }
  })
  return {
    APIitems: APIitems!, hiestReward
  }
}
function checkNewline(statsGroup: any, type: string) {
  let mutiLines: any[] = []
  statsGroup.entries.forEach((stat: any) => {
    if (stat.text.includes('\n')) {
      let lines = stat.text.split('\n')
      mutiLines.push({
        id: stat.id, text: lines, type
      })
    }
  })
  if (mutiLines.length)
    return mutiLines.slice()
  return undefined
}
function setupAPIMods(statsJson: any) {
  let APImods: IAPIMods
  statsJson.result.forEach((statsGroup: any) => {
    switch (statsGroup.label) {
      case '偽屬性':
        APImods.pseudo = {
          label: statsGroup.label,
          entries: statsGroup.entries.filter((stat: any) => stat.text.indexOf('有房間：') === -1)
            .map((stat: any) => ({
              id: stat.id, text: stat.text, option: stat.option
            })),
          type: '偽屬性'
        }
        APImods.temple = {
          label: statsGroup.label,
          entries: statsGroup.entries.filter((stat: any) => stat.text.indexOf('有房間：') > -1)
            .map((stat: any) => ({
              id: stat.id,
              text: stat.text.substring(4).replace(/（階級 [123]）/, ''),
              value: {
                option: 1 
              }
            })),
          type: '神廟'
        }
        break
      case '隨機屬性':
        APImods.forbiddenJewel = {
          label: statsGroup.label,
          entries: statsGroup.entries.filter((ele: any) => /^若你在禁忌(烈焰|血肉)上有符合的詞綴，配置 #$/.test(ele.text)),
          type: '隨機' 
        }
        APImods.explicit = {
          label: statsGroup.label,
          entries: statsGroup.entries.map((ele: any) => ({
            ...ele
          }))
            .filter((stat: any) => !stat.text.includes('\n')),
          type: '隨機' 
        }
        APImods.explicit.mutiLines = checkNewline(statsGroup, '隨機')
        break
      case '固性屬性':
        APImods.implicit = {
          label: statsGroup.label,
          entries: statsGroup.entries.map((ele: any) => ({
            ...ele
          }))
            .filter((stat: any) => !stat.text.includes('\n')),
          type: '固定' 
        }
        APImods.implicit.mutiLines = checkNewline(statsGroup, '固定')
        break
      case '破裂':
        APImods.fractured = {
          label: statsGroup.label,
          entries: statsGroup.entries.map((ele: any) => ({
            ...ele
          }))
            .filter((stat: any) => !stat.text.includes('\n')),
          type: '破裂' 
        }
        APImods.fractured.mutiLines = checkNewline(statsGroup, '破裂')
        break
      case '附魔':
        APImods.clusterJewel = { 
          label: statsGroup.label, 
          entries: statsGroup.entries.splice(statsGroup.entries
            .findIndex((ele: any) => ele.text === '附加的小型天賦給予：#'), 1)[0].option.options,
          type: '附魔'
        }
        APImods.enchant = {
          label: statsGroup.label,
          entries: statsGroup.entries.map((ele: any) => ({
            ...ele 
          }))
            .filter((stat: any) => !stat.text.includes('\n')),
          type: '附魔'
        }
        APImods.enchant.mutiLines = checkNewline(statsGroup, '附魔')
        break
      case '已工藝':
        APImods.crafted = {
          label: statsGroup.label,
          entries: statsGroup.entries.map((ele: any) => ({
            ...ele
          }))
            .filter((stat: any) => !stat.text.includes('\n')),
          type: '工藝' 
        }
        APImods.crafted.mutiLines = checkNewline(statsGroup, '工藝')
        break
      default:
        return
    }
  })
  return APImods!
}
function setupAPIStatic(data: any) {
  let APIStatic: IStatic[] = []
  data.forEach((group: any) => {
    if (group.label?.match(/^地圖|命運卡/)) return
    APIStatic = APIStatic.concat(cloneDeep(group.entries))
  })
  return APIStatic
}
async function getLeagues() {
  return GGCapi.get('trade/data/leagues')
    .then(response => response.data)
    .then((data: any) => {
      let leagues = data.result.map((l: any) => l.text)
      store.set('Leagues', leagues)
    })
}
async function getItems() {
  return GGCapi.get('trade/data/items')
    .then(response => response.data)
    .then((data) => {
      let { APIitems, hiestReward } = setupAPIItems(data)
      store.set('APIitems', APIitems)
      store.set('hiestReward', hiestReward)
    })
}
async function getStats() {
  return GGCapi.get('trade/data/stats')
    .then((response) => response.data)
    .then((data) => {
      store.set('APImods', setupAPIMods(data))
    })
}
async function getStatic() {
  return GGCapi.get('trade/data/static')
    .then((response) => response.data)
    .then((data) => {
      let _currencyImageUrl = data.result[0].entries
      store.set('currencyImageUrl', _currencyImageUrl)
      store.set('APIStatic', setupAPIStatic(data.result))
    })
}
export async function getAPIdata() {
  let result = await Promise.allSettled([getLeagues(), getItems(), getStatic(), getStats()])
  result.forEach(e => {
    if (e.status === 'rejected') {
      throw e.reason
    }
  })
  store.set('APIVersion', app.getVersion())
}

export const updateState = {
  label: '',
  canClick: true
}

autoUpdater.on('update-available', ({version, releaseNotes}) => {
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
        setImmediate(() => {
          autoUpdater.quitAndInstall()
        })
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
    await getAPIdata()
  }
}