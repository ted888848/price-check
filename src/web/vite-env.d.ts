/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import vSelect from 'vue-select'
declare module '@vue/runtime-core' {
  export interface GlobalComponents {
    FontAwesomeIcon: typeof FontAwesomeIcon;
    VSelect: typeof vSelect;
  }
}

declare global {
  interface Window {
    ipc: typeof import('@/preload').ipc;
    store: typeof import('@/preload').store;
    proxyServer: typeof import('@/preload').proxyServer;
  }
}