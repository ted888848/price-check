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

interface ImportMetaEnv {
  readonly VITE_URL_BASE: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare global {
  interface Window {
    electron: typeof import('@/preload/preload').api;
    apiStore: typeof import('@/preload/preload').storeApi;
  }
}