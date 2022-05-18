<template>
    <div v-if="windowShowHide" class="absolute top-0 left-0 m-0 w-screen h-screen bg-gray-400 bg-opacity-30" 
        @click.self="closeOverlay">
        <button class="absolute top-10 left-10 bg-blue-600 hover:bg-gray-900 rounded-xl px-1 py-0.5" 
            @click="settingWindowShow=!settingWindowShow"><font-awesome-icon icon="gear" class=" text-red-600 text-4xl"/></button>
        <button class="absolute top-28  left-10 bg-red-600 hover:bg-gray-900 rounded-xl px-1 py-0.5" 
            @click="reloadAPIdata"><font-awesome-icon icon="rotate" class=" text-blue-600 text-4xl"/></button>
        <setting-window  v-if="settingWindowShow" @close-settingWindow="closeSettingWindow" />
    </div>
</template>
<script>
import {ipcRenderer} from 'electron'
import IPC from '@/ipc/ipcChannel'
import SettingWindow from '../SettingWindow/SettingWindow.vue'
import Store from 'electron-store'
import { checkAPIdata } from '@/utility/setupAPI'
export default {
    // eslint-disable-next-line vue/multi-word-component-names
    name: 'overlay',
    components:{
        SettingWindow 
    },
    data(){
        return{
            windowShowHide: false,
            settingWindowShow: false
        }
    },
    created(){
        ipcRenderer.on(IPC.OVERLAY_SHOW,()=>{ this.windowShowHide=true })
        ipcRenderer.on(IPC.POE_ACTIVE,()=>{ 
            this.windowShowHide=false;
            this.closeSettingWindow()
        })
    },
    methods:{
        closeSettingWindow(){
            this.settingWindowShow = false
        },
        closeOverlay(){
            this.windowShowHide = false
            this.closeSettingWindow()
            ipcRenderer.send(IPC.FORCE_POE, true)
        },
        async reloadAPIdata(){
            let store=new Store()
            let configTemp=store.get('config')
            store.clear()
            store.set('config',configTemp)
            await checkAPIdata()
            this.$emit('reloadLeagues')
        }
    }

}
</script>