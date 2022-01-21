<template>
    <div v-if="windowShowHide" class="absolute top-0 left-0 w-screen h-screen priceCheckRoot bg-gray-400 bg-opacity-25" @click.self="closePriceCheck" >
        <div  class="bg-gray-900 priceCheck absolute h-screen flex flex-col" :style="priceCheckPos">
            <div class="bg-gray-800 flex justify-center">
                <span class="text-white text-2xl font-bold absolute left-1 hover:cursor-default">普通查價 </span>
                <div class="flex items-center">
                    <div class="relative exaltedImg ">
                        <img :src="exaltedChaosImage[1].image" class=" w-8 h-8 ">
                        <ul v-if="exaltedToChaos" class="exaltedImgTooltip invisible bg-gray-700 z-10 text-center absolute text-white">
                        <li v-for="line in exaltedToChaosDec" :key="line.e" class="flex px-2 min-w-max text-xl">
                            {{line.e}} : {{line.c}}
                        </li>
                        </ul>
                    </div>
                    <span class=" text-white text-2xl">:{{exaltedToChaos}}</span>
                    <img :src="exaltedChaosImage[0].image" class=" w-8 h-8 hover:cursor-pointer" @dblclick="reflashChaos">
                </div>
                <button class="absolute right-1 text-white hover:text-red-500" @click="closePriceCheck">
                    <i class="fas fa-window-close fa-2x" ></i>
                </button>
            </div>
            <selecter class=" text-base style-chooser text-center" v-model="leagueSelect" :options="leagues" :clearable="false" />
            <div class=" text-xl text-white my-1 text-center" @click="isSearchByBaseType = !item.type.option || !isSearchByBaseType">
                <span v-if="item.name" class="mr-3">{{item.name}}</span>
                <span :class="{ 'text-red-500': !isSearchByBaseType }">{{ item.baseType }}</span>
            </div>
            <div v-if="searchJSON.query.filters.type_filters.filters.category" class="text-base text-white text-center" :class="{ 'text-3xl': !isSearchByBaseType }">
                <span>{{searchJSON.query.filters.type_filters.filters.category.text}}</span>
            </div>
            <selecter v-if="item.isIdentify===false && item.uniques !== [] && item.rarity==='傳奇'" class="text-sm style-chooser" :options="item.uniques" label="name" 
                v-model="searchJSON.query.name" :reduce="ele=>ele.name" />
            <div class="mx-0  bg-blue-900 grid grid-cols-3">
                <div class="flex p-2 items-center justify-center">
                    <span class="mx-1 text-white hover:cursor-default">汙染:</span>
                    <selecter class="text-sm style-chooser flex-grow" :options="generalOption" v-model="corruptedState" 
                     label="label" :reduce="ele => ele.value" :clearable="false" :filterable="false"/>
                </div>
                <div>
                    <div class="flex p-2 items-center justify-center" v-if="item.rarity!=='寶石'">
                        <span class="mx-1 text-white hover:cursor-default">已鑑定:</span>
                        <selecter class="text-sm style-chooser flex-grow" :options="generalOption" v-model="identifyState" 
                         label="label" :reduce="ele => ele.value" :clearable="false" :filterable="false"/>
                    </div>
                    <div class="flex p-2 items-center justify-center" v-else>
                        <span class="mx-1 text-white hover:cursor-default">相異品:</span>
                        <selecter class="text-sm style-chooser flex-grow" :options="gemAltQOptions" 
                        v-model="searchJSON.query.filters.misc_filters.filters.gem_alternate_quality.option" 
                         label="label" :reduce="ele => ele.value" :clearable="false" :filterable="false"/>
                    </div>
                </div>
                <div class="flex">
                    <div v-if="searchJSON.query.filters.misc_filters.filters.ilvl" class="flex p-2 items-center justify-center">
                        <span class="mx-1 text-white hover:cursor-default">物品等級:</span>
                        <input class="w-8 appearance-none rounded bg-gray-400 text-center mx-1 font-bold" type="number" 
                        v-model.number="searchJSON.query.filters.misc_filters.filters.ilvl.min" 
                        @dblclick="delete searchJSON.query.filters.misc_filters.filters.ilvl.min">
                        <input class="w-8 appearance-none rounded bg-gray-400 text-center font-bold" type="number" 
                        v-model.number="searchJSON.query.filters.misc_filters.filters.ilvl.max" 
                        @dblclick="delete searchJSON.query.filters.misc_filters.filters.ilvl.max">
                    </div>
                    <div v-else-if="searchJSON.query.filters.misc_filters.filters.gem_level" class="flex p-2 items-center justify-center">
                        <span class="mx-1 text-white hover:cursor-default">寶石等級:</span>
                        <input class="w-8 appearance-none rounded bg-gray-400 text-center mx-1 font-bold" type="number" 
                        v-model.number="searchJSON.query.filters.misc_filters.filters.gem_level.min" 
                        @dblclick="delete searchJSON.query.filters.misc_filters.filters.gem_level.min">
                        <input class="w-8 appearance-none rounded bg-gray-400 text-center font-bold" type="number" 
                        v-model.number="searchJSON.query.filters.misc_filters.filters.gem_level.max" 
                        @dblclick="delete searchJSON.query.filters.misc_filters.filters.gem_level.max">
                    </div>
                    <div v-else-if="searchJSON.query.filters.map_filters.filters.map_tier" class="flex p-2 items-center justify-center">
                        <span class="mx-1 text-white hover:cursor-default">地圖階級:</span>
                        <input class="w-8 appearance-none rounded bg-gray-400 text-center mx-1 font-bold" type="number" 
                        v-model.number="searchJSON.query.filters.map_filters.filters.map_tier.min" 
                        @dblclick="delete searchJSON.query.filters.map_filters.filters.map_tier.min">
                        <input class="w-8 appearance-none rounded bg-gray-400 text-center font-bold" type="number" 
                        v-model.number="searchJSON.query.filters.map_filters.filters.map_tier.max" 
                        @dblclick="delete searchJSON.query.filters.map_filters.filters.map_tier.max">
                    </div>
                </div>
                <div class="flex p-2 items-center justify-center">
                    <span class="mx-1 text-white hover:cursor-default">品質:</span>
                    <input class="w-8 appearance-none rounded bg-gray-400 text-center mx-1 font-bold" type="number" 
                    v-model.number="searchJSON.query.filters.misc_filters.filters.quality.min" 
                    @dblclick="delete searchJSON.query.filters.misc_filters.filters.quality.min">
                    <input class="w-8 appearance-none rounded bg-gray-400 text-center font-bold" type="number" 
                    v-model.number="searchJSON.query.filters.misc_filters.filters.quality.max" 
                    @dblclick="delete searchJSON.query.filters.misc_filters.filters.quality.max">
                </div>
                <div v-if="item.elderMap" class="flex col-span-2 items-center justify-center">
                    <span class="mx-1 text-white hover:cursor-default">尊師守衛:</span>
                    <selecter class="text-sm style-chooser-inf " :options="elderMapOptions" v-model="elderMapSelected" 
                         label="label" :filterable="false" :clearable="false"/>
                </div>
                <div v-else-if="item.blightedMap" class="flex items-center justify-center">
                    <span class="mx-1 text-white hover:cursor-default">凋落圖</span>
                </div>
                <div v-else-if="item.UberBlightedMap" class="flex items-center justify-center">
                    <span class="mx-1 text-white hover:cursor-default">Uber凋落圖</span>
                </div>
                <div v-else class="flex col-span-2 items-center justify-center">
                    <span class="mx-1 text-white hover:cursor-default">勢力:</span>
                    <selecter class="text-sm style-chooser-inf " :options="influencesOptions" v-model="influencesSelected" 
                         label="label" :filterable="false" multiple />
                </div>
                <div v-if="item.isWeaponOrArmor" class="flex items-center justify-center py-1 hover:cursor-pointer"
                    @click="searchJSON.query.filters.socket_filters.disabled=!searchJSON.query.filters.socket_filters.disabled">
                    <span class="mx-1 text-white text-xl">6L?</span>
                    <i v-if="!searchJSON.query.filters.socket_filters.disabled" class="fas fa-check-circle text-green-600 text-xl"></i>
                    <i v-else class="fas fa-times-circle text-red-600 text-xl"></i>
                </div>
                <div class="flex items-center justify-center py-1">
                    <span class="mx-1 text-white hover:cursor-default">稀有度:</span>
                    <selecter class="text-sm style-chooser w-24" :options="rarityOptions" v-model="raritySelected" 
                         label="label" :filterable="false" :clearable="false"  />
                </div>
                <div class="flex items-center justify-center py-1 hover:cursor-pointer" @click="twoWeekOffline=!twoWeekOffline">
                    <span class="mx-1 text-white hover:cursor-default">2周離線</span>
                    <td class="text-base">
                        <i v-if="twoWeekOffline" class="fas fa-check-circle text-green-600 text-xl"></i>
                        <i v-else class="fas fa-times-circle text-red-600 text-xl"></i>
                    </td>
                </div>
            </div>
            <table v-if="searchJSONStatsFiltered.length" class="bg-gray-700 text-center mt-1 text-white text-sm">
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
                    <tr v-for="mod in searchJSONStatsFiltered" :key="mod.id"
                        class=" border-b-2 border-gray-400">
                        <td @click="mod.disabled=!mod.disabled" class="text-base">
                            <i v-if="!mod.disabled" class="fas fa-check-circle text-green-600 text-lg"></i>
                            <i v-else class="fas fa-times-circle text-red-600 text-lg"></i>
                        </td>
                        <td @click="mod.disabled=!mod.disabled" class=" text-lg font-semibold hover:cursor-default" :style="{color: this.modTextColor(mod.type)}">{{mod.type}}</td>
                        <td @click="mod.disabled=!mod.disabled">
                            <span v-if="!Array.isArray(mod.text)">{{mod.text}}</span>
                            <div v-else class=" text-center">
                                <span v-for="t in mod.text" :key="t">{{t}}<br></span>
                            </div>
                        </td>
                        <td><input v-if="mod.value" @dblclick="delete mod.value.min" type="number" v-model="mod.value.min" 
                        class="w-8 appearance-none rounded bg-gray-400 text-center text-black font-bold"></td>
                        <td><input v-if="mod.value" @dblclick="delete mod.value.max" type="number" v-model="mod.value.max" 
                        class="w-8 appearance-none rounded bg-gray-400 text-center text-black font-bold"></td>
                    </tr>
                </tbody>
            </table>
            <table v-if="searchResultSorted.length" class="bg-blue-500 text-center text-white text-sm my-1 mx-5 w-1/2 self-center">
                <thead>
                    <tr>
                        <td class=" hover:cursor-default">價格</td>
                        <td class=" hover:cursor-default">數量</td>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="ele in searchResultSorted" :key="ele" class=" border-b-2 border-gray-600" 
                    :class="{'text-red-500 text-xl bg-indigo-600': ele.amount===maxAmout.amount}">
                        <td class="flex justify-center items-center">{{ele.price}}<img :src="ele.image" class=" w-7 h-7"></td>
                        <td>{{ele.amount}}</td>
                    </tr>
                </tbody>
            </table>
            <span v-if="isSearchFail" class="text-white text-4xl text-center hover:cursor-default">fail</span>
            <span v-if="isSearched" class="text-white text-2xl text-center hover:cursor-default">共{{searchTotal}}筆,顯示{{searchedNumber}}</span>
            <div class="my-2 justify-center flex text-xl" v-if="!isSearching" >
                <button @click="searchBtn" 
                class="mx-2 bg-gray-500 text-white rounded px-1 hover:bg-gray-400 disabled:cursor-default disabled:opacity-60 disabled:bg-gray-500" 
                :disabled="rateTimeLimit.flag.value" >Search</button>
                <div v-if="isSearched">
                    <button class="mx-2 bg-green-400 text-black rounded px-1 hover:bg-green-300 disabled:cursor-default disabled:opacity-60 disabled:bg-green-400" 
                    @click="fetchMore" :disabled="rateTimeLimit.flag.value || searchedNumber >= ( searchTotal >= 100 ? 100 : searchTotal)">在搜50筆</button>
                    <button class="mx-2 bg-blue-800 text-white rounded px-4 hover:bg-blue-700 disabled:cursor-default disabled:opacity-60 disabled:bg-blue-800" 
                    @click="openBrower" :disabled="rateTimeLimit.flag.value">B</button>
                </div>
                <button class="mx-2 bg-blue-800 text-white rounded px-4 hover:bg-blue-700 disabled:cursor-default disabled:opacity-60 disabled:bg-blue-800" 
                @click="openBrowerView" :disabled="rateTimeLimit.flag.value">BV</button>
            </div>
            <div v-if="isSearching" class=" text-8xl text-white my-5 text-center flex justify-center">
                <i class="fas fa-sync fa-spin"></i>
            </div>

            <!-- <span v-if="isSearching" class="text-xl text-white m-2 text-center">查詢中</span> -->
            <span v-if="rateTimeLimit.flag.value" class="text-white bg-red-600 text-xl text-center my-2 hover:cursor-default">API次數限制 {{rateTimeLimit.second.value}} 秒後再回來  </span>
            <!-- <button class="mx-2 bg-blue-800 text-white rounded px-4" @click="isRateTimeLimit=!isRateTimeLimit">count test</button> -->
        </div>
    </div>
</template>
<script>
import { ipcRenderer, shell } from 'electron'
import IPC from '@/ipc/ipcChannel'
import { itemAnalyze } from '@/utility/itemAnalyze'
import Store from 'electron-store'
import { getSearchJSON, searchItem, getExaltedToChaos, fetchItem, getIsCounting } from '@/utility/tradeSide'
import _ from 'lodash' 
export default {
    name: "PriceCheck",
    setup(){
        const { rateTimeLimit } = getIsCounting()
        return { rateTimeLimit }
    },
    data(){
        return{
            priceCheckPos: {
                right: '0px',
            },
            windowShowHide: false,
            item: undefined,
            leagues: [],
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
            influencesSelected: [],
            elderMapOptions: [
            {
                id: 1,
                label: "奴役(右上)"
            },
            {
                id: 2,
                label: "根除(右下)"
            },
            {
                id: 3,
                label: "干擾(左下)"
            },
            {
                id: 4,
                label: "淨化(左上)"
            }
            ],
            elderMapSelected: undefined,
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
            raritySelected: undefined,
            corruptedState: undefined,
            identifyState: undefined,
            leagueSelect: undefined,
            searchJSON: undefined,
            currencyImageUrl: [],
            searchResult: [],
            isSearchFail: false,
            isSearched: false,
            isSearching: false,
            searchTotal: 0,
            searchID: '',
            isSearchByBaseType: true,
            modTbodyToggle: true,
            exaltedToChaos: 0,
            exaltedChaosImage: [],
            twoWeekOffline: false,
        }
    },
    created(){
        ipcRenderer.on(IPC.PRICE_CHECK_SHOW,(e,clip, pos)=>{
            this.priceCheckPos.right = pos
            this.windowShowHide=true
            this.resetSearchData()
            this.resetItemData()
            this.item = itemAnalyze(clip)
            console.log(this.item)
            this.searchJSON=getSearchJSON(this.item)
            console.log(this.searchJSON)
            this.setupJSONdata()
        })
        ipcRenderer.on(IPC.POE_ACTIVE,()=>{
            this.windowShowHide=false
            this.resetItemData()
        })
        this.loadLeagues()
    },
	watch:{
        corruptedState: function(value){
            if(_.isUndefined(value))
                delete this.searchJSON.query.filters.misc_filters.filters.corrupted
            else
                this.searchJSON.query.filters.misc_filters.filters.corrupted={ option: value }
        },
        identifyState: function(value){
            if(_.isUndefined(value))
                delete this.searchJSON.query.filters.misc_filters.filters.identified
            else
                this.searchJSON.query.filters.misc_filters.filters.identified={ option: value }
        },
        'searchJSON.query.filters.misc_filters.filters.ilvl':{
            handler(value){
                if(!value) return
                if(value.min==='') value.min=undefined
                if(value.max==='') value.max=undefined
            },
            deep: true
        },
        'searchJSON.query.filters.misc_filters.filters.gem_level':{
            handler(value){
                if(!value) return
                if(value.min==='') value.min=undefined
                if(value.max==='') value.max=undefined
            },
            deep: true
        },
        'searchJSON.query.filters.misc_filters.filters.quality':{
            handler(value){
                if(!value) return
                if(value.min==='') value.min=undefined
                if(value.max==='') value.max=undefined
            },
            deep: true
        },
        influencesSelected: function(value,preValue){
            if(value.length>preValue.length)
                this.searchJSON.query.stats[0].filters.push(..._.clone(value.slice(preValue.length,value.length)))
            else if(value.length<preValue.length){
                let diff=_.differenceBy(preValue, value, 'id')[0]
                let temp=this.searchJSON.query.stats[0].filters.findIndex(ele => ele.id === diff.id)
                if(temp>-1)
                    this.searchJSON.query.stats[0].filters.splice(temp, 1)
            }
        },
        elderMapSelected: function(value){
            if(!value) return
            let foundMod=this.searchJSON.query.stats[0].filters.find(ele=>ele.id==="implicit.stat_3624393862")
            foundMod.value.option=value.id
        },
        isSearchByBaseType: function(value){
            if(value){
                this.searchJSON.query.type=this.item.baseType
            }
            else{
                delete this.searchJSON.query.type
            }
        },
        raritySelected: function(value){
            if(value?.id)
                this.searchJSON.query.filters.type_filters.filters.rarity = { option: value.id }
            else
                delete this.searchJSON.query.filters.type_filters.filters.rarity
        },
        twoWeekOffline: function(value){
            if(value){
                this.searchJSON.query.filters.trade_filters.filters.indexed={ option: "2weeks" }
                this.searchJSON.query.status.option="any"
            }
            else{
                delete this.searchJSON.query.filters.trade_filters.filters.indexed
                this.searchJSON.query.status.option="online"
            }

        }
        
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
        resetItemData(){
            this.influencesSelected=[]
            this.elderMapSelected=undefined
            this.raritySelected=undefined
            this.corruptedState=undefined
            this.identifyState=undefined
            this.twoWeekOffline = false
            this.isSearchByBaseType=true
        },
        loadLeagues(){
            let store = new Store()
            this.leagues = store.get('Leagues')
            this.leagueSelect = this.leagues[0]
            this.currencyImageUrl = store.get('APICurrencyImageName')?.entries
            this.exaltedChaosImage=this.currencyImageUrl.filter(ele=>['exalted','chaos'].includes(ele.id)).map(ele=>({...ele,image: 'https://web.poe.garena.tw'+ele.image}))
        },
        closePriceCheck(){
            this.windowShowHide = false
            this.resetItemData()
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
        setupJSONdata(){
            let temp=this.searchJSON.query.filters.misc_filters.filters.corrupted
            this.corruptedState = temp?.option
            temp=this.searchJSON.query.filters.misc_filters.filters.identified
            this.identifyState = temp?.option
            if(this.item.elderMap){
                this.elderMapSelected=this.elderMapOptions[this.item.elderMap.value.option-1]
            }
            this.influencesSelected=this.influencesOptions.filter( ele => this.searchJSON.query.stats[0].filters.find(inf => inf.id===ele.id))
            this.searchJSON.query.stats[0].filters=this.searchJSON.query.stats[0].filters.filter(ele => !(ele.id.endsWith('_influence')))
            if(['普通', '魔法', '稀有'].includes(this.item.rarity)){
                this.raritySelected = this.rarityOptions[5]
            }
            else if(this.item.rarity==='傳奇'){
                this.raritySelected = this.rarityOptions[4]
            }
            else{
                this.raritySelected = this.rarityOptions[0]
            }
        },
        openBrowerView(){
            this.priceCheckPos.right='0px'
            console.log(this.searchID)
            ipcRenderer.send(IPC.BROWSER_VIEW,`${this.leagueSelect}/${this.searchID}`)
        },
        openBrower(){
            shell.openExternal(encodeURI(`https://web.poe.garena.tw/trade/search/${this.leagueSelect}/${this.searchID}`))
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
            this.modTbodyToggle=false
            this.isSearching=false
        },
        searchBtn: _.debounce( async function(){
            this.resetSearchData()
            this.isSearching=true
            let temp = await searchItem(this.searchJSON,this.leagueSelect)
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
                    this.searchResult.push({price: _price, currency: _currency, amount: temp.result[key], image: `https://web.poe.garena.tw${this.currencyImageUrl.find(ele=>ele.id===_currency).image}`})
                }
            }
            this.searchID = temp.searchID
            this.modTbodyToggle=false
            this.isSearched=true
            this.isSearching=false
        },300),
        async reflashChaos(){
            this.exaltedToChaos=await getExaltedToChaos(this.leagueSelect)
        }
    },
    computed:{
        searchedNumber(){
            return this.searchResultSorted.reduce((pre, curr)=>pre + curr.amount,0)
        },
        searchResultSorted(){
            if(this.exaltedToChaos)
                return this.searchResult.slice().sort((a,b)=>{
                    let ca = a.currency==='exalted' ? a.price*this.exaltedToChaos : a.price
                    let cb = b.currency==='exalted' ? b.price*this.exaltedToChaos : b.price
                    return ca-cb
                })
            else
                return this.searchResult
        },
        searchJSONStatsFiltered(){
            return this.searchJSON.query.stats[0].filters.filter(ele => !(ele.id.endsWith('_influence') || ele.id.endsWith('stat_3624393862')))
        },
        maxAmout(){
            return _.maxBy(this.searchResult, ele => ele.amount)
        },
        exaltedToChaosDec(){
            
            return _.range(0.1,1,0.1).map(ele=>({e: ele.toFixed(1), c: (ele*this.exaltedToChaos).toFixed(0)}))
        },
        
    }
}

</script>
<style>
div.priceCheckRoot{
    overflow-x: hidden;
}
div.priceCheck{
    width: 500px;
    
}
.style-chooser .vs__search::placeholder,
.style-chooser .vs__dropdown-toggle,
.style-chooser .vs__dropdown-menu{
    text-align: center;
    min-width: 0px;
	background: #dfe5fb;
	border: none;
	color: #394066;
}
.style-chooser .vs__search{
    padding: 0;
    width: 0;
    flex-grow: 0;
}
.style-chooser .vs__selected{
    justify-content: center;
    flex-grow: 1;
}
.style-chooser-inf .vs__search::placeholder,
.style-chooser-inf .vs__dropdown-toggle,
.style-chooser-inf .vs__dropdown-menu{
    text-align: center;
    min-width: fit-content;
	background: #dfe5fb;
	border: none;
	color: #394066;
}
.style-chooser-inf .vs__selected-options{
    min-width: 100px;
}
input::-webkit-outer-spin-button,
input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
tbody.modsTbody>tr>td{
    padding: 5px 1px;
}
.exaltedImg:hover .exaltedImgTooltip{
    visibility: visible;
}
</style>