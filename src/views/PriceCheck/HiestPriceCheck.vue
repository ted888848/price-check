<template>
    <div class="flex p-2 items-center justify-center" >
        <span class="mx-1 text-white hover:cursor-default">物品:</span>
        <selecter class="text-sm style-chooser flex-grow" :options="gemReplicaOptions"
        v-model="gemReplicaSelect" label="text"/>
    </div>
    <div class="flex p-2 items-center justify-center" >
        <span class="mx-1 text-white hover:cursor-default">相異品質:</span>
        <selecter class="text-sm style-chooser flex-grow" :options="gemAltQOptions"
        v-model="gemAltQSelect" label="label" :clearable="false" :searchable="false"/>
    </div>
    <div class="flex items-center justify-center py-1 hover:cursor-pointer" @click="twoWeekOffline=!twoWeekOffline">
            <span class="mx-1 text-white">2周離線</span>
            <i v-if="twoWeekOffline" class="fas fa-check-circle text-green-600 text-xl"></i>
            <i v-else class="fas fa-times-circle text-red-600 text-xl"></i>
        </div>
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
import Store from 'electron-store'
import { getDefaultSearchJSON, searchItem, fetchItem, getIsCounting } from '@/utility/tradeSide'
import _ from 'lodash' 
import { ipcRenderer, shell } from 'electron'
import IPC from '@/ipc/ipcChannel'
export default{
    name: "HiestPriceCheck",
    props: ["leagueSelect", "currencyImageUrl","exaltedToChaos"],
    setup(){
        const { rateTimeLimit } = getIsCounting()
        return { rateTimeLimit }
    },
    data(){
        return {
            gemReplicaOptions: [],
            gemReplicaSelect: undefined,
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
            gemAltQSelect: undefined,
            searchJSON: undefined,
            searchResult: [],
            isSearchFail: false,
            isSearched: false,
            searchTotal: 0,
            isSearching: false,
            searchID: '',
            twoWeekOffline: false,
        }
    },
    created(){
        this.resetSearchData()
        this.gemAltQSelect=this.gemAltQOptions[0]
        this.searchJSON=getDefaultSearchJSON()
        let store = new Store()
        this.gemReplicaOptions=store.get('HiestReward')
        this.twoWeekOffline=false

    },
    watch:{
        twoWeekOffline: function(value){
            if(value){
                this.searchJSON.query.filters.trade_filters.filters.indexed={ option: "2weeks" }
                this.searchJSON.query.status.option="any"
            }
            else{
                delete this.searchJSON.query.filters.trade_filters.filters.indexed
                this.searchJSON.query.status.option="online"
            }
        },
    },
    methods:{
        resetSearchData(){
            this.searchResult=[]
            this.isSearchFail=false
            this.isSearched=false
            this.searchTotal=0
            this.isSearching=false
            this.searchID=''
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
        searchBtn: _.debounce(async function(){
            this.resetSearchData()
            this.isSearching=true
            this.searchJSON.query.name=this.gemReplicaSelect.name
            this.searchJSON.query.type=this.gemReplicaSelect.type
            if(!this.gemReplicaSelect.name?.startsWith('贗品')){
               this.searchJSON.query.filters.misc_filters.filters.gem_alternate_quality={option: this.gemAltQSelect.value}
            }
            let temp = await searchItem(this.searchJSON,this.leagueSelect, true)
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
        maxAmout(){
            return _.maxBy(this.searchResult, ele => ele.amount)
        },
    }
}
</script>
<style>
</style>