import { createApp } from 'vue';
import App from './App.vue';
import '@fortawesome/fontawesome-free/css/all.css'
import './assets/tailwind.css'
const app = createApp(App);

import 'vue-select/dist/vue-select.css'
import vSelect from 'vue-select'
app.component('selecter',vSelect)


app.mount('#app');
