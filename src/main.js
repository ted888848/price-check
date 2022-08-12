import { createApp } from 'vue';
import App from './App.vue';
import './assets/tailwind.css'
import { library } from '@fortawesome/fontawesome-svg-core'
import { fas } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
const app = createApp(App);
library.add(fas)
import 'vue-select/dist/vue-select.css'
import vSelect from 'vue-select'
// eslint-disable-next-line vue/multi-word-component-names
app.component('vSelect', vSelect)
app.component('FontAwesomeIcon', FontAwesomeIcon)

app.mount('#app');
