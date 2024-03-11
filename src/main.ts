import { createApp } from 'vue'
import App from '@/App.vue'
// import './assets/tailwind.css'
import '@unocss/reset/tailwind.css'
import 'virtual:uno.css'
import './index.css'
const app = createApp(App)
import 'vue-select/dist/vue-select.css'
import vSelect from 'vue-select'
app.component('VSelect', vSelect)
app.mount('#app')
