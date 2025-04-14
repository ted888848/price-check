/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

declare global {
  interface Window {
    ipc: typeof import('@/preload').ipc;
    store: typeof import('@/preload').store;
    proxyServer: typeof import('@/preload').proxyServer;
  }
}

export { }