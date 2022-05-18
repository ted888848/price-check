<template>
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
             label="label" :reduce="ele => ele.value" :clearable="false" :searchable="false"/>
        </div>
        <div>
            <div class="flex p-2 items-center justify-center" v-if="item.rarity!=='寶石'">
                <span class="mx-1 text-white hover:cursor-default">已鑑定:</span>
                <selecter class="text-sm style-chooser flex-grow" :options="generalOption" v-model="identifyState" 
                 label="label" :reduce="ele => ele.value" :clearable="false" :searchable="false"/>
            </div>
            <div class="flex p-2 items-center justify-center" v-else>
                <span class="mx-1 text-white hover:cursor-default">相異品:</span>
                <selecter class="text-sm style-chooser flex-grow" :options="gemAltQOptions" 
                v-model="searchJSON.query.filters.misc_filters.filters.gem_alternate_quality.option" 
                 label="label" :reduce="ele => ele.value" :clearable="false" :searchable="false"/>
            </div>
        </div>
        <div class="flex">
            <div v-if="itemILVL.show" class="flex p-2 items-center justify-center " :class="{'opacity-30': itemILVL.disabled}" 
            @click.self="itemILVL.disabled=!itemILVL.disabled">
                <span class="mx-1 text-white hover:cursor-default" @click.self="itemILVL.disabled=!itemILVL.disabled">物品等級:</span>
                <input class="w-8 appearance-none rounded bg-gray-400 text-center mx-1 font-bold" type="number" 
                v-model.number="itemILVL.min" :disabled="itemILVL.disabled" 
                @dblclick.stop="itemILVL.min=''">
                <input class="w-8 appearance-none rounded bg-gray-400 text-center font-bold" type="number" 
                v-model.number="itemILVL.max" :disabled="itemILVL.disabled" 
                @dblclick="itemILVL.max=''">
            </div>
            <div v-else-if="gemLVL.show" class="flex p-2 items-center justify-center" :class="{'opacity-30': gemLVL.disabled}" 
            @click.self="gemLVL.disabled=!gemLVL.disabled">
                <span class="mx-1 text-white hover:cursor-default" @click.self="gemLVL.disabled=!gemLVL.disabled">寶石等級:</span>
                <input class="w-8 appearance-none rounded bg-gray-400 text-center mx-1 font-bold" type="number" 
                v-model.number="gemLVL.min" :disabled="gemLVL.disabled" 
                @dblclick="gemLVL.min=''">
                <input class="w-8 appearance-none rounded bg-gray-400 text-center font-bold" type="number" 
                v-model.number="gemLVL.max" :disabled="gemLVL.disabled" 
                @dblclick="gemLVL.max=''">
            </div>
            <div v-else-if="mapTier.show" class="flex p-2 items-center justify-center" :class="{'opacity-30': mapTier.disabled}" 
            @click.self="mapTier.disabled=!mapTier.disabled">
                <span class="mx-1 text-white hover:cursor-default" @click.self="mapTier.disabled=!mapTier.disabled">地圖階級:</span>
                <input class="w-8 appearance-none rounded bg-gray-400 text-center mx-1 font-bold" type="number" 
                v-model.number="mapTier.min" :disabled="mapTier.disabled" 
                @dblclick="mapTier.min=''">
                <input class="w-8 appearance-none rounded bg-gray-400 text-center font-bold" type="number" 
                v-model.number="mapTier.max" :disabled="mapTier.disabled" 
                @dblclick="mapTier.max=''">
            </div>
        </div>
        <div class="flex p-2 items-center justify-center" :class="{'opacity-30': itemQuality.disabled}" 
            @click.self="itemQuality.disabled=!itemQuality.disabled">
            <span class="mx-1 text-white hover:cursor-default" @click.self="itemQuality.disabled=!itemQuality.disabled">品質:</span>
            <input class="w-8 appearance-none rounded bg-gray-400 text-center mx-1 font-bold" type="number" 
            v-model.number="itemQuality.min" :disabled="itemQuality.disabled" 
            @dblclick="itemQuality.min=''">
            <input class="w-8 appearance-none rounded bg-gray-400 text-center font-bold" type="number" 
            v-model.number="itemQuality.max" :disabled="itemQuality.disabled" 
            @dblclick="itemQuality.max=''">
        </div>
        <div v-if="item.elderMap" class="flex col-span-2 items-center justify-center">
            <span class="mx-1 text-white hover:cursor-default">尊師守衛:</span>
            <selecter class="text-sm style-chooser style-chooser-inf " :options="elderMapOptions" v-model="elderMapSelected" 
                 label="label" :searchable="false" :clearable="false"/>
        </div>
        <div v-if="item.conquerorMap" class="flex col-span-2 items-center justify-center">
            <span class="mx-1 text-white hover:cursor-default">征服者:</span>
            <selecter class="text-sm style-chooser style-chooser-inf " :options="conquerorMapOptions" v-model="conquerorMapSelected" 
                 label="label" :searchable="false" :clearable="false"/>
        </div>
        <div v-else-if="item.blightedMap" class="flex items-center justify-center">
            <span class="mx-1 text-white hover:cursor-default">凋落圖</span>
        </div>
        <div v-else-if="item.UberBlightedMap" class="flex items-center justify-center">
            <span class="mx-1 text-white hover:cursor-default">Uber凋落圖</span>
        </div>
        <div v-else-if="item.isWeaponOrArmor || ['項鍊','戒指','腰帶','箭袋'].includes(item.type.text)" class="flex col-span-2 items-center justify-center">
            <span class="mx-1 text-white hover:cursor-default">勢力:</span>
            <div class=" flex-grow mx-1"><selecter class="text-sm style-chooser style-chooser-inf " :options="influencesOptions" v-model="influencesSelected" 
            label="label" :searchable="false" multiple /></div>
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
                 label="label" :searchable="false" :clearable="false"  />
        </div>
        <div class="flex items-center justify-center py-1 hover:cursor-pointer" @click="twoWeekOffline=!twoWeekOffline">
            <span class="mx-1 text-white">2周離線</span>
            <i v-if="twoWeekOffline" class="fas fa-check-circle text-green-600 text-xl"></i>
            <i v-else class="fas fa-times-circle text-red-600 text-xl"></i>
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
                <td class="flex justify-center items-center">{{ele.price}}<img :src="ele.image" class=" w-7 h-7"></td>
                <td>{{ele.amount}}</td>
            </tr>
        </tbody>
    </table>
    <span v-if="isSearchFail" class="text-white text-4xl text-center hover:cursor-default">fail</span>
    <span v-if="isSearched" class="text-white text-2xl text-center hover:cursor-default">共{{searchTotal}}筆,顯示{{searchedNumber}}</span>
    <div v-if="isSearching" class=" text-8xl text-white my-5 text-center flex justify-center">
        <i class="fas fa-sync fa-spin"></i>
    </div>
    <span v-if="rateTimeLimit.flag" class="text-white bg-red-600 text-xl text-center my-2 hover:cursor-default">API次數限制 {{rateTimeLimit.second}} 秒後再回來  </span>
</template>
<script>
import { ipcRenderer, shell } from 'electron'
import IPC from '@/ipc/ipcChannel'
import { getSearchJSON, searchItem, fetchItem, getIsCounting } from '@/utility/tradeSide'
import _ from 'lodash' 
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
            conquerorMapOptions: [
            {
                id: 1,
                label: "巴倫"
            },
            {
                id: 2,
                label: "維羅提尼亞"
            },
            {
                id: 3,
                label: "奧赫茲明"
            },
            {
                id: 4,
                label: "圖拉克斯"
            }
            ],
            conquerorMapSelected: undefined,
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
            searchResult: [],
            isSearchFail: false,
            isSearched: false,
            isSearching: false,
            searchTotal: 0,
            searchID: '',
            isSearchByBaseType: true,
            modTbodyToggle: true,
            twoWeekOffline: false,
            itemILVL:   {disabled: true, min: undefined, max: undefined, show: false},
            gemLVL:     {disabled: false, min: undefined, max: undefined, show: false},
            itemQuality: {disabled: true, min: undefined, max: undefined, show: true},
            mapTier:    {disabled: true, min: undefined, max: undefined, show: false},
        }
    },
    created(){
        this.resetSearchData()
        this.resetItemData()
        console.log(this.item)
        this.searchJSON=getSearchJSON(this.item)
        console.log(this.searchJSON)
        this.setupJSONdata()
        if(this.item.autoSearch)
            this.searchBtn()
        ipcRenderer.on(IPC.POE_ACTIVE,()=>{
            this.resetItemData()
        })
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
        itemILVL:{
            handler(value){
                if(!value.show || (_.isUndefined(value.min) && _.isUndefined(value.max))) return
                if(value.disabled) delete this.searchJSON.query.filters.misc_filters.filters.ilvl
                else this.searchJSON.query.filters.misc_filters.filters.ilvl={min: value.min, max: value.max}
                if(value.min==='') delete this.searchJSON.query.filters.misc_filters.filters.ilvl?.min
                if(value.max==='') delete this.searchJSON.query.filters.misc_filters.filters.ilvl?.max
            },
            deep: true
        },
        gemLVL:{
            handler(value){
                if(!value.show || (_.isUndefined(value.min) && _.isUndefined(value.max))) return
                if(value.disabled) delete this.searchJSON.query.filters.misc_filters.filters.gem_level
                else this.searchJSON.query.filters.misc_filters.filters.gem_level={min: value.min, max: value.max}
                if(value.min==='') delete this.searchJSON.query.filters.misc_filters.filters.gem_level?.min
                if(value.max==='') delete this.searchJSON.query.filters.misc_filters.filters.gem_level?.max
            },
            deep: true
        },
        itemQuality:{
            handler(value){
                if(!value.show || (_.isUndefined(value.min) && _.isUndefined(value.max))) return
                if(value.disabled) delete this.searchJSON.query.filters.misc_filters.filters.quality
                else this.searchJSON.query.filters.misc_filters.filters.quality={min: value.min, max: value.max}
                if(value.min==='') delete this.searchJSON.query.filters.misc_filters.filters.quality?.min
                if(value.max==='') delete this.searchJSON.query.filters.misc_filters.filters.quality?.max
            },
            deep: true
        },
        mapTier:{
            handler(value){
                if(!value.show || (_.isUndefined(value.min) && _.isUndefined(value.max))) return
                if(value.disabled) delete this.searchJSON.query.filters.map_filters.filters.map_tier
                else this.searchJSON.query.filters.map_filters.filters.map_tier={min: value.min, max: value.max}
                if(value.min==='') delete this.searchJSON.query.filters.map_filters.filters.map_tier?.min
                if(value.max==='') delete this.searchJSON.query.filters.map_filters.filters.map_tier?.max
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
        conquerorMapSelected: function(value){
            if(!value) return
            let foundMod=this.searchJSON.query.stats[0].filters.find(ele=>ele.id==="implicit.stat_2563183002")
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
            this.conquerorMapSelected=undefined
            this.raritySelected=undefined
            this.corruptedState=undefined
            this.identifyState=undefined
            this.twoWeekOffline = false
            this.isSearchByBaseType=true
            this.itemILVL={disabled: true, min: undefined, max: undefined, show: false}
            this.gemLVL={disabled: false, min: undefined, max: undefined, show: false}
            this.itemQuality={disabled: true, min: undefined, max: undefined, show: true}
            this.mapTier={disabled: true, min: undefined, max: undefined, show: false}
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
        setupJSONdata(){
            let temp=this.searchJSON.query.filters.misc_filters.filters.corrupted
            this.corruptedState = temp?.option
            // temp=this.searchJSON.query.filters.misc_filters.filters.identified
            // this.identifyState = temp?.option
            if(this.item.elderMap){
                this.elderMapSelected=this.elderMapOptions[this.item.elderMap.value.option-1]
            }
            if(this.item.conquerorMap){
                this.conquerorMapSelected=this.conquerorMapOptions[this.item.conquerorMap.value.option-1]
            }
            this.influencesSelected=_.intersectionBy(this.influencesOptions, this.searchJSON.query.stats[0].filters, 'id')
            this.searchJSON.query.stats[0].filters=this.searchJSON.query.stats[0].filters.filter(ele => ((!ele.id.endsWith('_influence')) || (ele.id.endsWith('_influence') && ele.text)))
            if(['普通', '魔法', '稀有'].includes(this.item.rarity)){
                this.raritySelected = this.rarityOptions[5]
            }
            else if(this.item.rarity==='傳奇'){
                this.raritySelected = this.rarityOptions[4]
            }
            else{
                this.raritySelected = this.rarityOptions[0]
            }

            if(this.searchJSON.query.filters.misc_filters.filters.ilvl) {
                this.itemILVL.show=true
                this.itemILVL.min=this.searchJSON.query.filters.misc_filters.filters.ilvl.min
                this.itemILVL.max=this.searchJSON.query.filters.misc_filters.filters.ilvl?.max
                this.itemILVL.disabled=this.item.rarity==='傳奇'
            }
            else if(this.searchJSON.query.filters.misc_filters.filters.gem_level) {
                this.gemLVL.show=true
                this.gemLVL.min=this.searchJSON.query.filters.misc_filters.filters.gem_level.min
                this.gemLVL.max=this.searchJSON.query.filters.misc_filters.filters.gem_level?.max
            }
            else if(this.searchJSON.query.filters.map_filters.filters.map_tier) {
                this.mapTier.show=true
                this.mapTier.min=this.searchJSON.query.filters.map_filters.filters.map_tier.min
                this.mapTier.max=this.searchJSON.query.filters.map_filters.filters.map_tier?.max
            }
            if(this.searchJSON.query.filters.misc_filters.filters.quality) {
                this.itemQuality.show=true
                this.itemQuality.min=this.searchJSON.query.filters.misc_filters.filters.quality.min
                this.itemQuality.max=this.searchJSON.query.filters.misc_filters.filters.quality?.max
            }
        
        },
        openBrowerView(){
            ipcRenderer.send(IPC.BROWSER_VIEW,`${this.leagueSelect}/${this.searchID}`)
            this.$emit("BrowerView")
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
            this.isSearched=true
            this.isSearching=false
        },300)
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
            return this.searchJSON.query.stats[0].filters.filter(ele => !(ele.id.endsWith('_influence') || ele.id.endsWith('stat_3624393862') || ele.id.endsWith('stat_2563183002')))
        },
        maxAmout(){
            return _.maxBy(this.searchResult, ele => ele.amount)
        },
    }
}

</script>
<style>
</style>