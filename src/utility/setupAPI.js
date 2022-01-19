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
// const fetch = require('node-fetch')

const baseURL = 'https://web.poe.garena.tw/api'
var leagues
let store 
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
    clusterJewel: undefined
}
function setupItemArray(itemArray){
    let itemBaseType=[]
    itemArray.slice().reverse().forEach(item => {
        let index=itemBaseType.findIndex(element => element.type === item.type)
        if(index===-1){
            itemBaseType.push({...item, unique: []})
        }
        if(item.flags && item.flags.unique===true){
            itemBaseType[index].unique.push({name: item.name, text: item.text})
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
                break
            default:
                return
                
        }
    })
    APIitems.league=leagues[0]
    store.set('APIitems', APIitems)
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
async function getLeagues(){
    await axios.get(`${baseURL}/trade/data/leagues`)
    .then(response => response.data)
    .then((data)=>{
      leagues = data.result.map(l => l.text)
      store.set('Leagues', leagues)
    })
    .catch((err)=>{
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
async function getCurrencyImageName(){
    await axios.get(`${baseURL}/trade/data/static`)
    .then((response) => response.data)
    .then((data)=>{
        data.result[0].league=leagues[0]
        store.set('APICurrencyImageName', data.result[0])
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
    if(store.has('APICurrencyImageName')){
        // APImods = store.get('APImods')
        APImods=store.get('APICurrencyImageName')
        if(APImods.league !== leagues[0]) await getCurrencyImageName()
    }
    else {
        await getCurrencyImageName()
    }
}
// export {APIitems, APImods, leagues}