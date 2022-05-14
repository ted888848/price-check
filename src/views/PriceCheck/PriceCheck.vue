<template>
    <div v-if="windowShowHide" class="absolute top-0 left-0 w-screen h-screen priceCheckRoot bg-gray-400 bg-opacity-25" @click.self="closePriceCheck" >
        <div  class="bg-gray-900 priceCheck absolute h-full flex flex-col" :style="priceCheckPos">
            <div class="bg-gray-800 flex justify-center">
                <!-- <span class="text-white text-2xl font-bold absolute left-1 hover:cursor-default">普通查價 </span> -->
                <div class=" absolute left-1">
                    <selecter class="text-sm style-chooser style-chooser-inf text-center" :options="priceCheckOptions" v-model="currentPriceCheck" 
                    label="label" :searchable="false" :clearable="false" :reduce="option => option.value"/>
                </div>
                <div class="flex items-center ">
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
                <button class=" absolute right-1 text-white hover:text-red-500" @click="closePriceCheck">
                    <i class="fas fa-window-close fa-2x" ></i>
                </button>
            </div>
            <!-- <NormalPriceCheck :itemProp="item" @BrowerView="openBrowerView"></NormalPriceCheck> -->
            <selecter class=" text-base style-chooser text-center" v-model="leagueSelect" :options="leagues" :clearable="false" :searchable="false" />
            <component :is="currentPriceCheck" :itemProp="item" @BrowerView="openBrowerView" :leagueSelect="leagueSelect" :currencyImageUrl="currencyImageUrl"
                :exaltedToChaos="exaltedToChaos"></component>
        </div>
    </div>
</template>
<script>
import { ipcRenderer } from 'electron'
import IPC from '@/ipc/ipcChannel'
import { itemAnalyze } from '@/utility/itemAnalyze'
import Store from 'electron-store'
import { getExaltedToChaos, getIsCounting } from '@/utility/tradeSide'
import _ from 'lodash' 
import NormalPriceCheck from './NormalPriceCheck.vue'
import HiestPriceCheck from './HiestPriceCheck.vue'
export default {
    name: "PriceCheck",
    components:{
        NormalPriceCheck,
        HiestPriceCheck
    },
    setup(){
        const { rateTimeLimit } = getIsCounting()
        return { rateTimeLimit }
    },
    data(){
        return{
            priceCheckPos: {
                right: '0px',
            },
            currentPriceCheck: "NormalPriceCheck",
            priceCheckOptions: [{
                label: "普通查價",
                value: "NormalPriceCheck"
            }
            , {
                label: "劫盜查價",
                value: "HiestPriceCheck"
            }],
            windowShowHide: false,
            item: undefined,
            exaltedToChaos: 0,
            exaltedChaosImage: [],
            leagueSelect: undefined,
            currencyImageUrl: undefined,
            leagues: [],
        }
    },
    created(){
        ipcRenderer.on(IPC.PRICE_CHECK_SHOW,(e,clip, pos)=>{
            this.currentPriceCheck="NormalPriceCheck"
            this.priceCheckPos.right = pos
            this.windowShowHide=true
            this.item = itemAnalyze(clip)
        })
        ipcRenderer.on(IPC.POE_ACTIVE,()=>{
            this.windowShowHide=false
        })
        this.loadLeagues()
    },
    methods:{
        loadLeagues(){
            let store = new Store()
            this.leagues = store.get('Leagues')
            this.leagueSelect = this.leagues[0]
            this.currencyImageUrl = store.get('APICurrencyImageName')?.entries
            this.exaltedChaosImage=this.currencyImageUrl.filter(ele=>['exalted','chaos'].includes(ele.id)).map(ele=>({...ele,image: 'https://web.poe.garena.tw'+ele.image}))
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
        async reflashChaos(){
            this.exaltedToChaos=await getExaltedToChaos(this.leagueSelect)
        },
        openBrowerView(){
            this.priceCheckPos.right='0px'
        },
    },
    computed:{
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
    flex-grow: 0;
}

.style-chooser .vs__selected-options{
    display: flex;
    justify-content: center;
}
.style-chooser-inf .vs__selected-options{
    min-width: 100px;
    justify-content: start;
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