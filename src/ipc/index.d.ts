// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../../types.d.ts" />
interface IPCEventMap {
  'priceCheck': (...args: [string, string]) => void;
  'overlay': () => void;
  'forcePOE': () => void;
  'poeActive': () => void;
  'getConfig': () => Config;
  'setConfig': (config: string) => void;
  'updateConfig': (config: string) => void;
  'reloadAPIData': () => ({
    status: true;
    error: never;
  } | {
    status: false;
    error: unknown;
  });
  'getProxyPort': () => number;
}
export type Channel = keyof IPCEventMap;
export type IPCListener<T extends Channel> = (event: Electron.IpcRendererEvent, listener: IPCEventMap[T]) => void;
export type IpcArgs<T extends Channel> = Parameters<IPCEventMap[T]>;
export type IpcReturn<T extends Channel> = ReturnType<IPCEventMap[T]>;
export declare const channels: {
  readonly PRICE_CHECK_SHOW: 'priceCheck';
  readonly OVERLAY_SHOW: 'overlay';
  readonly FORCE_POE: 'forcePOE';
  readonly POE_ACTIVE: 'poeActive';
  readonly GET_CONFIG: 'getConfig';
  readonly SET_CONFIG: 'setConfig';
  readonly UPDATE_CONFIG: 'updateConfig';
  readonly RELOAD_APIDATA: 'reloadAPIData';
  readonly GET_PROXY_PORT: 'getProxyPort';
}
export default channels
