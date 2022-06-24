<template>
    <div class="absolute left-0 right-0 mx-auto bg-gray-700 text-center w-1/2 h-1/2">
        <div v-if="isLoading" class="text-white text-center w-full h-full flex items-center justify-center">
            <i class="fas fa-sync fa-spin text-9xl "></i>
        </div>
        <div v-else class="flex flex-col">
            <div class="flex items-center justify-center mt-5">
                <span class="text-xl text-white mr-2">腳色名字:</span>
                <input class="shadow appearance-none border rounded py-1 px-2 text-gray-700 leading-tight" type="text" v-model="config.characterName">
            </div>
            <div class="flex items-center justify-center mt-5" @click="config.searchExchangeExalted = !config.searchExchangeExalted">
                <span class="text-xl text-white mr-2">可堆疊通貨優先使用崇高:</span>
                <font-awesome-icon v-if="config.searchExchangeExalted" icon="circle-check" class="text-green-600 text-lg"/>
                <font-awesome-icon v-else icon="circle-xmark" class="text-red-600 text-lg"/>
            </div>
            <div class=" absolute bottom-4 mx-auto left-0 right-0 flex items-center justify-center ">
                <button class="px-3 py-1 rounded bg-green-500 mr-3" @click="save">確認</button>
                <button class="px-3 py-1 rounded bg-red-500" @click="cancel">取消</button>
            </div>
        </div>
    </div>
</template>
<script>
import IPC from '@/ipc/ipcChannel'
import { ipcRenderer } from 'electron'
import _ from 'lodash'
export default {
    data(){
        return {
            characterName: '',
            config: undefined,
            isLoading: true,
        }
    },
    mounted(){
        this.isLoading=true
        ipcRenderer.invoke(IPC.GET_CONFIG)
        .then(data=>{
            this.config=_.cloneDeep(data)
            this.isLoading=false
        })
    },
    methods:{
        save(){
            ipcRenderer.send(IPC.SET_CONFIG, _.cloneDeep(this.config))
            this.$emit('close-settingWindow')
        },
        cancel(){
            this.$emit('close-settingWindow')
        }
    },
    computed:{
    }
}
</script>