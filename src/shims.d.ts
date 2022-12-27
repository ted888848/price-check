/* eslint-disable @typescript-eslint/ban-types */
declare module '*.vue'{
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

declare const __static: string
declare type ArrayValueType<T> = T extends (infer E)[] ? E : never