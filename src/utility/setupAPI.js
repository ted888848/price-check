// import axios from 'axios'
// import fs from 'fs'
// import fetch from 'node-fetch'
// const axios = require('axios')
// const fs = require('fs')
import axios from 'axios'
// import fs from 'fs'
// import path from 'path'
// import { win } from './overlayWindow'
import Store from 'electron-store'
import _ from 'lodash'
import { app, dialog, shell, BrowserWindow, session } from 'electron'
// const fetch = require('node-fetch')

const baseURL = 'https://web.poe.garena.tw/api'
var leagues
let store 
let hiestReward=[]
export var APIitems={
    accessories: undefined,
    armour: undefined,
    cards: undefined,
    currency: undefined,
    flasks: undefined,
    gems: undefined,
    jewels: undefined,
    maps: undefined,
    weapons: undefined,
    watchstones: undefined,
    heistequipment: undefined,
    heistmission: undefined,
    logbook: undefined,
    league: undefined
}
export var APImods={
    pseudo: undefined,
    explicit: undefined,
    implicit: undefined,
    fractured: undefined,
    enchant: undefined,
    crafted: undefined,
    veiled: undefined,
    temple: undefined,
    league: undefined,
    clusterJewel: undefined,
    forbiddenJewel: undefined
}
export var APIStatic={
    league: undefined,
    entries: []
}
let currencyImageUrl
function setupItemArray(itemArray){
    let itemBaseType=[]
    itemArray.slice().reverse().forEach(item => {
        let index=itemBaseType.findIndex(element => element.type === item.type)
        if(index===-1){
            itemBaseType.push({...item, unique: []})
        }
        if(item.flags?.unique===true){
            itemBaseType[index].unique.push({name: item.name, text: item.text})
            if(item.name.startsWith('贗品')){
                hiestReward.push({name: item.name, type: item.type, text: item.text})
            }
        }
    })
    return itemBaseType
}
function setupAPIItems(itemsJson){
    itemsJson.result.forEach( itemGroup =>{
        switch(itemGroup.id){
            case 'accessories':
            case 'armour':
            case 'flasks':
            case 'jewels':
            case 'weapons':
            case 'watchstones':
            case 'heistequipment':
            case 'heistmission':
            case 'logbook':
                APIitems[itemGroup.id]={id: itemGroup.id, label: itemGroup.label, entries: setupItemArray(itemGroup.entries)}
                break
            case 'maps':
                APIitems[itemGroup.id]={id: itemGroup.id, label: itemGroup.label, entries: setupItemArray(itemGroup.entries.filter(ele=> ele.disc==="warfortheatlas"))}
                break
            case 'cards':
            case 'currency':
            case 'gems':
                APIitems[itemGroup.id]=itemGroup
                if(itemGroup.id==='gems')   hiestReward.push(...itemGroup.entries)
                break
            default:
                return
                
        }
    })
    APIitems.league=leagues[0]
    store.set('APIitems', APIitems)
    store.set('HiestReward', hiestReward)
    // fs.writeFileSync(path.join(__dirname,'items.json'), JSON.stringify(APIitems))

}
function checkNewline(statsGroup, _type){
    let mutiLines=[]
    statsGroup.entries.forEach((stat)=>{
        if(stat.text.includes('\n')){
            let lines=stat.text.split('\n')
            mutiLines.push({id: stat.id, text: lines, type: _type})
        }
    })
    if(mutiLines.length)
        return mutiLines.slice()
    return undefined
}
function setupAPIMods(statsJson){
    statsJson.result.forEach((statsGroup)=>{
        switch(statsGroup.label){
            case '偽屬性':
                APImods.pseudo={ lebel: statsGroup.label, entries: statsGroup.entries.filter(stat => stat.text.indexOf('有房間：')===-1)
                                                                                    .map( stat => ({id: stat.id, text: stat.text, option: stat.option})), type: '偽屬性' }
                APImods.temple={ lebel: statsGroup.label, entries: statsGroup.entries.filter(stat => stat.text.indexOf('有房間：')>-1)
                                                                                    .map(stat => ({id: stat.id, text: stat.text.substring(4).replace(/（階級 [123]）/,''), option: stat.option})), type: '神廟' }
                break
            case '隨機屬性':
                APImods.forbiddenJewel={label: statsGroup.label, entries: statsGroup.entries.filter(e => /^若你在禁忌(烈焰|血肉)上有符合的詞綴，配置 #$/.test(e.text))}
                APImods.explicit={label: statsGroup.label, entries: statsGroup.entries.map(ele=> ({...ele, type: '隨機' }))
                                                                                    .filter(stat => !stat.text.includes('\n'))}
                APImods.explicit.mutiLines=checkNewline(statsGroup, '隨機')
                break
            case '固性屬性':
                APImods.implicit={label: statsGroup.label, entries: statsGroup.entries.map(ele=> ({...ele, type: '固定' }))
                                                                                    .filter(stat => !stat.text.includes('\n'))}
                APImods.implicit.mutiLines=checkNewline(statsGroup, '固定')
                break
            case '破裂':
                APImods.fractured={label: statsGroup.label, entries: statsGroup.entries.map(ele=> ({...ele, type: '破裂' }))
                                                                                    .filter(stat => !stat.text.includes('\n'))}
                APImods.fractured.mutiLines=checkNewline(statsGroup, '破裂')
                break
            case '附魔':
                APImods.clusterJewel={label: statsGroup.label, entries: statsGroup.entries.splice(statsGroup.entries.findIndex(ele=>ele.text==="附加的小型天賦給予：#"), 1)[0].option.options }
                APImods.enchant={label: statsGroup.label, entries: statsGroup.entries.map(ele=> ({...ele, type: '附魔' }))
                                                                                    .filter(stat => !stat.text.includes('\n'))}
                APImods.enchant.mutiLines=checkNewline(statsGroup, '附魔')
                break
            case '已工藝':
                APImods.crafted={label: statsGroup.label, entries: statsGroup.entries.map(ele=> ({...ele, type: '工藝' }))
                                                                                    .filter(stat => !stat.text.includes('\n'))}
                APImods.crafted.mutiLines=checkNewline(statsGroup, '工藝')
                break
            case '隱匿':
                APImods.veiled={label: statsGroup.label, entries: statsGroup.entries.map(ele=> ({...ele, type: '隱匿' }))
                                                                                    .filter(stat => !stat.text.includes('\n'))}
                APImods.veiled.mutiLines=checkNewline(statsGroup, '隱匿')
                break
            default:
                return
        }
    })
    APImods.league=leagues[0]
    store.set('APImods', APImods)
    // fs.writeFileSync(path.join(__dirname,'stats.json'), JSON.stringify(APImods))
}

function setupAPIStatic(data){
    data.forEach(group => {
        if(group.label?.match(/^地圖（(階級\d+|傳奇)）|命運卡$/)) return
        APIStatic.entries = APIStatic.entries.concat(_.cloneDeep(group.entries))
    })
    APIStatic.league=leagues[0]
}

async function getLeagues(){
    await axios.get(`${baseURL}/trade/data/leagues`)
    .then(response => response.data)
    .then((data)=>{
      leagues = data.result.map(l => l.text)
      store.set('Leagues', leagues)
    })
    .catch((err)=>{
        leagues=store.get('Leagues')
        console.log(err)
    })
}
async function getItems(){
    await axios.get(`${baseURL}/trade/data/items`)
    .then(response => response.data)
    .then((data)=>{
        setupAPIItems(data)
    })
}
async function getStats(){
    await axios.get(`${baseURL}/trade/data/stats`)
    .then((response) => response.data)
    .then((data)=>{
        setupAPIMods(data)
    })
}
async function getStatic(){
    await axios.get(`${baseURL}/trade/data/static`)
    .then((response) => response.data)
    .then((data)=>{
        currencyImageUrl=data.result[0]
        store.set('currencyImageUrl', currencyImageUrl)
        setupAPIStatic(data.result)
        store.set('APIStatic', APIStatic)
    })
}
export async function checkAPIdata(){
    store = new Store()
    await getLeagues()
    if(store.has('APIitems')){
        // APIitems = store.get('APIitems')
        APIitems=store.get('APIitems')
        if(APIitems.league !== leagues[0]) await getItems()
    }
    else {
        await getItems()
    }
    if(store.has('APImods')){
        // APImods = store.get('APImods')
        APImods=store.get('APImods')
        if(APImods.league !== leagues[0]) await getStats()
    }
    else {
        await getStats()
    }
    if(store.has('APIStatic') && store.has('currencyImageUrl')){
        // APImods = store.get('APImods')
        APIStatic=store.get('APIStatic')
        if(APIStatic.league !== leagues[0]) await getStatic()
    }
    else {
        await getStatic()
    }
}
export function checkForUpdate(){
    if((session.defaultSession?.getCacheSize() >>> 20) >= 20){ //大於20MB
        session.defaultSession.clearCache()
            .catch(err=>console.log(err))
        session.defaultSession.clearCodeCaches({})
        .catch(err=>console.log(err))
    }
    axios.get('https://api.github.com/repos/ted888848/price-check/releases/latest')
    .then(response=>{
        let latestVer=response.data.tag_name.substring(1).split('.')
        let currVer=app.getVersion().split('.')
        let flag=false
        for(let i=0;i<3;++i){
            if(latestVer[i]>currVer[i]) {
                flag=true
                break
            }
            if(latestVer[i]<currVer[i]) {
                flag=false
                break
            }
        }
        if(flag){
            dialog.showMessageBox(new BrowserWindow({
                show: false,
                alwaysOnTop: true
              }),{
                title: '有新版本',
                type: 'info',
                message: `目前版本: ${app.getVersion()}\n新版本: ${latestVer.join('.')}\n${response.data.body}`,
                buttons: ['打開下載網址', '好'],
                defaultId: 0
            })
            .then(result=>{
                if(result.response===0){
                    shell.openExternal('https://github.com/ted888848/price-check/releases/latest')
                }
            })
            .catch(err => console.log(err))
        }
    })
}