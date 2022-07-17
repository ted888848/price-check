<template>
    <div class=" text-xl text-white my-1 text-center" @click="item.type.searchByType = !item.type.option || !item.type.searchByType">
        <span v-if="item.name" class="mr-3">{{item.name}}</span>
        <span :class="{ 'text-red-500': item.type.searchByType }">{{ item.baseType }}</span>
    </div>
    <div v-if="item.type.option" class="text-base text-white text-center" :class="{ 'text-3xl': item.type.searchByType }">
        <span>{{item.type.text}}</span>
    </div>
    <selecter v-if="item.undefinedUnqiue && item.uniques !== []" class="text-sm style-chooser" :options="item.uniques" label="name" 
        v-model="item.name" :reduce="ele=>ele.name" />
    <div class="mx-0  bg-blue-900 grid grid-cols-3">
        <div class="flex p-2 items-center justify-center">
            <span class="mx-1 text-white hover:cursor-default">汙染:</span>
            <selecter class="text-sm style-chooser flex-grow" :options="generalOption" v-model="item.isCorrupt" 
             label="label" :reduce="ele => ele.value" :clearable="false" :searchable="false"/>
        </div>
        <div>
            <div class="flex p-2 items-center justify-center" v-if="!item.type.text.endsWith('技能寶石')">
                <span class="mx-1 text-white hover:cursor-default">已鑑定:</span>
                <selecter class="text-sm style-chooser flex-grow" :options="generalOption" v-model="item.isIdentify" 
                 label="label" :reduce="ele => ele.value" :clearable="false" :searchable="false"/>
            </div>
            <div class="flex p-2 items-center justify-center" v-else>
                <span class="mx-1 text-white hover:cursor-default">相異品:</span>
                <selecter class="text-sm style-chooser flex-grow" :options="gemAltQOptions" v-model="item.altQType" 
                 label="label" :reduce="ele => ele.value" :clearable="false" :searchable="false"/>
            </div>
        </div>
        <div class="flex items-center justify-center">
            <div v-if="item.gemLevel" class="flex p-2 items-center justify-center" :class="{'opacity-30': !item.gemLevel.search}" 
            @click.self="item.gemLevel.search=!item.gemLevel.search">
                <span class="mx-1 text-white hover:cursor-default" @click.self="item.gemLevel.search=!item.gemLevel.search">寶石等級:</span>
                <input class="w-8 appearance-none rounded bg-gray-400 text-center mx-1 font-bold" type="number" 
                v-model.number="item.gemLevel.min" :disabled="!item.gemLevel.search" 
                @dblclick="item.gemLevel.min=''">
                <input class="w-8 appearance-none rounded bg-gray-400 text-center font-bold" type="number" 
                v-model.number="item.gemLevel.max" :disabled="!item.gemLevel.search" 
                @dblclick="item.gemLevel.max=''">
            </div>
            <div v-else-if="item.mapTier" class="flex p-2 items-center justify-center" :class="{'opacity-30': !item.mapTier.search}" 
            @click.self="item.mapTier.search=!item.mapTier.search">
                <span class="mx-1 text-white hover:cursor-default" @click.self="item.mapTier.search=!item.mapTier.search">地圖階級:</span>
                <input class="w-8 appearance-none rounded bg-gray-400 text-center mx-1 font-bold" type="number" 
                v-model.number="item.mapTier.min" :disabled="!item.mapTier.search" 
                @dblclick="item.mapTier.min=''">
                <input class="w-8 appearance-none rounded bg-gray-400 text-center font-bold" type="number" 
                v-model.number="item.mapTier.max" :disabled="!item.mapTier.search" 
                @dblclick="item.mapTier.max=''">
            </div>
            <div v-else-if="item.itemLevel" class="flex p-2 items-center justify-center " :class="{'opacity-30': !item.itemLevel.search}" 
            @click.self="item.itemLevel.search=!item.itemLevel.search">
                <span class="mx-1 text-white hover:cursor-default" @click.self="item.itemLevel.search=!item.itemLevel.search">物品等級:</span>
                <input class="w-8 appearance-none rounded bg-gray-400 text-center mx-1 font-bold" type="number" 
                v-model.number="item.itemLevel.min" :disabled="!item.itemLevel.search" 
                @dblclick.stop="item.itemLevel.min=''">
                <input class="w-8 appearance-none rounded bg-gray-400 text-center font-bold" type="number" 
                v-model.number="item.itemLevel.max" :disabled="!item.itemLevel.search" 
                @dblclick="item.itemLevel.max=''">
            </div>
            <div v-else-if="item.searchExchange.option" class="flex p-2 items-center justify-center" @click="item.searchExchange.have = ('exalted' === item.searchExchange.have) ? 'chaos' : 'exalted'">
                <span class="mx-1 text-white hover:cursor-default">崇高價</span>
                <font-awesome-icon v-if="item.searchExchange.have==='exalted'" icon="circle-check" class="text-green-600 text-xl"/>
                <font-awesome-icon v-else icon="circle-xmark" class="text-red-600 text-xl"/>
            </div>
        </div>
        <div class="flex p-2 items-center justify-center" :class="{'opacity-30': !item.quality.search}" 
            @click.self="item.quality.search=!item.quality.search">
            <span class="mx-1 text-white hover:cursor-default" @click.self="item.quality.search=!item.quality.search">品質:</span>
            <input class="w-8 appearance-none rounded bg-gray-400 text-center mx-1 font-bold" type="number" 
            v-model.number="item.quality.min" :disabled="!item.quality.search" 
            @dblclick="item.quality.min=''">
            <input class="w-8 appearance-none rounded bg-gray-400 text-center font-bold" type="number" 
            v-model.number="item.quality.max" :disabled="!item.quality.search" 
            @dblclick="item.quality.max=''">
        </div>
        <div v-if="item.elderMap" class="flex col-span-2 items-center justify-center">
            <span class="mx-1 text-white hover:cursor-default">尊師守衛:</span>
            <selecter class="text-sm style-chooser style-chooser-inf " :options="elderMapOptions" v-model="item.elderMap.value.option" 
                :reduce="ele => ele.value" label="label" :searchable="false" :clearable="false"/>
        </div>
        <div v-if="item.conquerorMap" class="flex col-span-2 items-center justify-center">
            <span class="mx-1 text-white hover:cursor-default">征服者:</span>
            <selecter class="text-sm style-chooser style-chooser-inf " :options="conquerorMapOptions" v-model="item.conquerorMap.value.option"
                :reduce="ele => ele.value" label="label" :searchable="false" :clearable="false"/>
        </div>
        <div v-else-if="item.blightedMap" class="flex items-center justify-center">
            <span class="mx-1 text-white hover:cursor-default">凋落圖</span>
        </div>
        <div v-else-if="item.UberBlightedMap" class="flex items-center justify-center">
            <span class="mx-1 text-white hover:cursor-default">Uber凋落圖</span>
        </div>
        <div v-else-if="item.isWeaponOrArmor || ['項鍊','戒指','腰帶','箭袋'].includes(item.type.text)" class="flex col-span-2 items-center justify-center">
            <span class="mx-1 text-white hover:cursor-default">勢力:</span>
            <div class=" flex-grow mx-1"><selecter class="text-sm style-chooser style-chooser-inf " :options="influencesOptions" v-model="item.influences" 
            label="label" :searchable="false" multiple /></div>
        </div>
        <div v-if="item.isWeaponOrArmor" class="flex items-center justify-center py-1 hover:cursor-pointer"
            @click="item.search6L=!item.search6L">
            <span class="mx-1 text-white text-xl">6L?</span>
            <font-awesome-icon v-if="item.search6L" icon="circle-check" class="text-green-600 text-xl"/>
            <font-awesome-icon v-else icon="circle-xmark" class="text-red-600 text-xl"/>
        </div>
        <div class="flex items-center justify-center py-1">
            <span class="mx-1 text-white hover:cursor-default">稀有度:</span>
            <selecter class="text-sm style-chooser w-24" :options="rarityOptions" v-model="item.rarity" 
                 label="label" :searchable="false" :clearable="false"  />
        </div>
        <div class="flex items-center justify-center py-1 hover:cursor-pointer" @click="item.searchTwoWeekOffline=!item.searchTwoWeekOffline">
            <span class="mx-1 text-white">2周離線</span>
            <font-awesome-icon v-if="item.searchTwoWeekOffline" icon="circle-check" class="text-green-600 text-xl"/>
            <font-awesome-icon v-else icon="circle-xmark" class="text-red-600 text-xl"/>
        </div>
    </div>
    <table v-if="searchStats.length" class="bg-gray-700 text-center mt-1 text-white text-sm">
        <thead class="bg-green-600" @click="modTbodyToggle=!modTbodyToggle">
            <tr class="text-lg">
                <td class="w-6 text-center hover:cursor-default">查</td>
                <td class="w-14 text-center hover:cursor-default">種類</td>
                <td class="text-center hover:cursor-default">詞綴</td>
                <td class="w-11 text-center hover:cursor-default">最小</td>
                <td class="w-11 text-center hover:cursor-default">最大</td>
            </tr>
        </thead>
        <tbody v-show="modTbodyToggle" class="modsTbody" style="">
            <tr v-for="mod in searchStats" :key="mod.id"
                class=" border-b-2 border-gray-400">
                <td @click="mod.disabled=!mod.disabled" class="text-base">
                    <font-awesome-icon v-if="!mod.disabled" icon="circle-check" class="text-green-600 text-lg"/>
                    <font-awesome-icon v-else icon="circle-xmark" class="text-red-600 text-lg"/>
                </td>
                <td @click="mod.disabled=!mod.disabled" class=" text-lg font-semibold hover:cursor-default" :style="{color: this.modTextColor(mod.type)}">{{mod.type}}</td>
                <td @click="mod.disabled=!mod.disabled">
                    <span v-if="!Array.isArray(mod.text)">{{mod.text}}</span>
                    <div v-else class=" text-center">
                        <span v-for="t in mod.text" :key="t">{{t}}<br></span>
                    </div>
                </td>
                <td><input v-if="mod.value" @dblclick="delete mod.value.min" type="number" v-model.number="mod.value.min" 
                class="w-8 appearance-none rounded bg-gray-400 text-center text-black font-bold"></td>
                <td><input v-if="mod.value" @dblclick="delete mod.value.max" type="number" v-model.number="mod.value.max" 
                class="w-8 appearance-none rounded bg-gray-400 text-center text-black font-bold"></td>
            </tr>
        </tbody>
    </table>
    <div class="my-2 justify-center flex text-xl" v-if="!isSearching" >
        <button @click="searchBtn" 
        class="mx-2 bg-gray-500 text-white rounded px-1 hover:bg-gray-400 disabled:cursor-default disabled:opacity-60 disabled:bg-gray-500" 
        :disabled="rateTimeLimit.flag" >Search</button>
        <div v-if="isSearched">
            <button class="mx-2 bg-green-400 text-black rounded px-1 hover:bg-green-300 disabled:cursor-default disabled:opacity-60 disabled:bg-green-400" 
            @click="fetchMore" :disabled="rateTimeLimit.flag || searchedNumber >= ( searchTotal >= 100 ? 100 : searchTotal)">在20筆</button>
            <button class="mx-2 bg-blue-800 text-white rounded px-4 hover:bg-blue-700 disabled:cursor-default disabled:opacity-60 disabled:bg-blue-800" 
            @click="openBrower" :disabled="rateTimeLimit.flag">B</button>
        </div>
        <button class="mx-2 bg-blue-800 text-white rounded px-4 hover:bg-blue-700 disabled:cursor-default disabled:opacity-60 disabled:bg-blue-800" 
        @click="openBrowerView" :disabled="rateTimeLimit.flag">BV</button>
    </div>
    <table v-if="searchResultSorted.length" class="bg-blue-500 text-center text-white text-sm my-1 mx-5 w-1/2 self-center">
        <thead class="">
            <tr class=" border-b-2 border-red-500 text-base">
                <td class=" hover:cursor-default">價格</td>
                <td class=" hover:cursor-default">數量</td>
            </tr>
        </thead>
        <tbody class="">
            <tr v-for="ele in searchResultSorted" :key="ele" class=" border-b-2 border-gray-600" 
            :class="{'text-red-500 text-xl bg-indigo-600 font-bold': ele.amount===maxAmout.amount}">
                <td v-if="item.searchExchange.option" class="flex justify-center items-center"><img :src="ele.image" class=" w-7 h-7">{{ele.price}}<img :src="ele.image2" class=" w-7 h-7"></td>
                <td v-else class="flex justify-center items-center">{{ele.price}}<img :src="ele.image" class=" w-7 h-7"></td>
                <td>{{ele.amount}}</td>
            </tr>
        </tbody>
    </table>
    <span v-if="isSearchFail" class="text-white text-4xl text-center hover:cursor-default">fail</span>
    <span v-if="isSearched" class="text-white text-2xl text-center hover:cursor-default">共{{searchTotal}}筆,顯示{{searchedNumber}}</span>
    <div v-if="isSearching" class=" text-8xl text-white my-5 text-center flex justify-center">
        <font-awesome-icon icon="spinner" spin />
    </div>
    <span v-if="rateTimeLimit.flag" class="text-white bg-red-600 text-xl text-center my-2 hover:cursor-default">API次數限制 {{rateTimeLimit.second}} 秒後再回來  </span>
</template>
<script>
import { ipcRenderer, shell } from 'electron'
import IPC from '@/ipc/ipcChannel'
import { getSearchJSON, searchItem, fetchItem, getIsCounting, searchExchange } from '@/utility/tradeSide'
import _ from 'lodash' 
import Store from 'electron-store'
export default {
    name: "NormalPriceCheck",
    props: ["itemProp", "leagueSelect","currencyImageUrl","exaltedToChaos"],
    setup(){
        const { rateTimeLimit } = getIsCounting()
        return { rateTimeLimit }
    },
    data(){
        return{
            item: this.itemProp,
            searchJSON: undefined,
            generalOption: [
            {
                label: '任何',
                value: undefined
            },
            {
                label: '是',
                value: true
            },
            {
                label: '否',
                value: false
            }],
            gemAltQOptions:[
                {
                    label: '普通',
                    value: 0
                },
                {
                    label: '異常的',
                    value: 1
                },
                {
                    label: '相異的',
                    value: 2
                },
                {
                    label: '幻影的',
                    value: 3
                }
            ],
            influencesOptions:  [{
                id: "pseudo.pseudo_has_shaper_influence",
                label: "塑者"
            },
            {
                id: "pseudo.pseudo_has_elder_influence",
                label: "尊師"
            },
            {
                id: "pseudo.pseudo_has_crusader_influence",
                label: "聖戰"
            },
            {
                id: "pseudo.pseudo_has_redeemer_influence",
                label: "救贖"
            },
            {
                id: "pseudo.pseudo_has_hunter_influence",
                label: "狩獵"
            },
            {
                id: "pseudo.pseudo_has_warlord_influence",
                label: "督軍"
            }],
            elderMapOptions: [
            {
                value: 1,
                label: "奴役(右上)"
            },
            {
                value: 2,
                label: "根除(右下)"
            },
            {
                value: 3,
                label: "干擾(左下)"
            },
            {
                value: 4,
                label: "淨化(左上)"
            }
            ],
            conquerorMapOptions: [
            {
                value: 1,
                label: "巴倫"
            },
            {
                value: 2,
                label: "維羅提尼亞"
            },
            {
                value: 3,
                label: "奧赫茲明"
            },
            {
                value: 4,
                label: "圖拉克斯"
            }
            ],
            rarityOptions: [
            {
                id: undefined,
                label: "任何"
            },
            {
                id: 'normal',
                label: "普通"
            },
            {
                id: 'magic',
                label: "魔法"
            },
            {
                id: 'rare',
                label: "稀有"
            },
            {
                id: 'unique',
                label: "傳奇"
            },
            {
                id: 'nonunique',
                label: "非傳奇"
            },
            ],
            searchResult: [],
            isSearchFail: false,
            isSearched: false,
            isSearching: false,
            searchTotal: 0,
            searchID: {ID: '', type: 'search'},
            modTbodyToggle: true,
            APIStatic: undefined
        }
    },
    created(){
        this.resetSearchData()
        console.log(this.item)
        this.item.undefinedUnqiue = this.item.isIdentify===false && this.item.rarity.label==='傳奇'
        if(this.item.autoSearch)
            this.searchBtn()
    },
    methods:{
        resetSearchData(){
            this.searchResult=[]
            this.isSearchFail=false
            this.isSearched=false
            this.searchTotal=0
            this.modTbodyToggle=true
            this.isSearching=false
            this.searchID=''
        },
        closePriceCheck(){
            this.windowShowHide = false
            ipcRenderer.send(IPC.FORCE_POE)
        },
        modTextColor(type){
            switch(type){
                case '固定':
                    return '#346beb'
                case '附魔':
                    return '#41e635'
                case '破裂':
                    return '#eba536'
                case '隨機':
                    return 'red'
                case '偽屬性':
                    return '#9936eb'
            }
            return 'white'
        },
        openBrowerView(){
            ipcRenderer.send(IPC.BROWSER_VIEW,`${this.searchID.type}/${this.leagueSelect}/${this.searchID.ID}`)
            this.$emit("BrowerView")
        },
        openBrower(){
            shell.openExternal(encodeURI(`https://web.poe.garena.tw/trade/${this.searchID.type}/${this.leagueSelect}/${this.searchID.ID}`))
        },
        async fetchMore(){
            this.isSearching=true
            let temp=await fetchItem()
            if(!temp) {
                this.isSearching=false
                return 
            }
            for(let [key, index] of Object.entries(temp)){
                let tempArr=key.split('|')
                let _price=tempArr[0]
                let _currency=tempArr[1]
                let findRes=this.searchResult.find(ele=>ele.price===_price)
                if(findRes){
                    findRes.amount+=temp[key]
                }
                else{
                    this.searchResult.push({price: _price, currency: _currency, amount: temp[key], image: `https://web.poe.garena.tw${this.currencyImageUrl.find(ele=>ele.id===_currency).image}`})
                }
            }
            this.isSearching=false
        },
        searchBtn: _.debounce( async function(){
            this.resetSearchData()
            this.isSearching=true
            let temp
            let currency2Img
            if(this.item.searchExchange.option){
                temp = await searchExchange(this.item, this.leagueSelect)
                console.log(temp.currency2)
                let store=new Store()
                this.APIStatic=store.get('APIStatic').entries
                currency2Img=`https://web.poe.garena.tw${this.APIStatic.find(ele=>ele.id === temp.currency2).image}`
            }
            else{
                temp = await searchItem(getSearchJSON(this.item),this.leagueSelect)
            }
            if(temp.err) {
                this.isSearching=false
                this.isSearchFail=true
                return
            }
            else if(temp.total){
                this.searchTotal=temp.total
                
                for(let [key, index] of Object.entries(temp.result)){
                    let tempArr=key.split('|')
                    let _price=tempArr[0]
                    let _currency=tempArr[1]
                    this.searchResult.push({price: _price, currency: _currency, amount: temp.result[key], image: `https://web.poe.garena.tw${this.currencyImageUrl.find(ele=>ele.id===_currency).image}`, image2: currency2Img})
                }
            }
            this.searchID = temp.searchID
            this.isSearched=true
            this.isSearching=false
        },300)
    },
    computed:{
        searchedNumber(){
            return this.searchResultSorted.reduce((pre, curr)=>pre + curr.amount,0)
        },
        searchResultSorted(){
            if(this.exaltedToChaos && !this.item.searchExchange.option)
                return this.searchResult.slice().sort((a,b)=>{
                    let ca = a.currency==='exalted' ? a.price*this.exaltedToChaos : a.price
                    let cb = b.currency==='exalted' ? b.price*this.exaltedToChaos : b.price
                    return ca-cb
                })
            else
                return this.searchResult
        },
        maxAmout(){
            return _.maxBy(this.searchResult, ele => ele.amount)
        },
        searchStats(){
            let temp=[]     
            if(this.item.enchant)    temp=temp.concat(this.item.enchant)
            if(this.item.implicit)   temp=temp.concat(this.item.implicit)
            if(this.item.explicit)   temp=temp.concat(this.item.explicit)
            if(this.item.fractured)  temp=temp.concat(this.item.fractured)
            if(this.item.crafted)    temp=temp.concat(this.item.crafted)
            if(this.item.pseudo)     temp=temp.concat(this.item.pseudo)          
            if(this.item.temple)     temp=temp.concat(this.item.temple)
            return temp
        }
    }
}

</script>
<style>
</style>