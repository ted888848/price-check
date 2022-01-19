import { createApp } from 'vue';
import App from './App.vue';
import '@fortawesome/fontawesome-free/css/all.css'
import './assets/tailwind.css'
const app = createApp(App);

import 'vue-select/dist/vue-select.css'
import vSelect from 'vue-select'
app.component('selecter',vSelect)

import VueCountdown from '@chenfengyuan/vue-countdown'
import path from 'path'
import fs from 'fs'
app.component(VueCountdown.name, VueCountdown)
// app.config.errorHandler = function(err){
//     const ipc=require('electron').ipcRenderer
//     ipc.send('vueError',err.name, err.message)
//     // eleApp.showErrorBox(err.name(),err.toString())
//     // let filePath=path.join(eleApp.getPath('userData'), 'errLog.log')
//     // fs.writeFileSync(filePath,err.toString(),fs.statSync(filePath).size)
// }
app.mount('#app');
