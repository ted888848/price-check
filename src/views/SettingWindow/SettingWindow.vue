<template>
    <div class="absolute left-0 right-0 mx-auto bg-gray-700 text-center w-1/2 h-1/2 flex flex-col">
        <div class="flex items-center justify-center mt-5">
            <span class="text-xl text-white mr-2" >腳色名字:</span>
            <input class="shadow appearance-none border rounded py-1 px-2 text-gray-700 leading-tight" type="text" v-model="characterName">

        </div>
        <div class=" absolute bottom-4 mx-auto left-0 right-0 flex items-center justify-center ">
            <button class="px-3 py-1 rounded bg-green-500 mr-3" @click="save">確認</button>
            <button class="px-3 py-1 rounded bg-red-500" @click="cancel">取消</button>
        </div>
    </div>
</template>
<script>
import IPC from '@/ipc/ipcChannel'
import { ipcRenderer } from 'electron'

export default {
    data(){
        return {
            characterName: '',
        }
    },
    mounted(){
        this.characterName=ipcRenderer.sendSync(IPC.GET_CONFIG)
    },
    methods:{
        save(){
            ipcRenderer.send(IPC.SET_CONFIG, this.characterName)
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