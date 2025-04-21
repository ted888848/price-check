interface IPCEventMap {
  'priceCheck': (...args: [string, string]) => void;
  'overlay': () => void;
  'forcePOE': () => void;
  'poeActive': () => void;
  'getConfig': () => Config;
  'setConfig': (config: string) => void;
  'updateConfig': (config: string) => void;
  'reloadAPIData': () => ({
    status: true; error: never;
  } | {
    status: false; error: unknown;
  });
  'getProxyPort': () => number;
}
export type Channel = keyof IPCEventMap;

export type IpcArgs<T extends Channel> = Parameters<IPCEventMap[T]>;
export type IPCListener<T extends Channel> = (event: Electron.IpcRendererEvent, ...args: IpcArgs<T>) => void;
export type IpcReturn<T extends Channel> = ReturnType<IPCEventMap[T]>;

export const channels = {
  PRICE_CHECK_SHOW: 'priceCheck',
  OVERLAY_SHOW: 'overlay',
  FORCE_POE: 'forcePOE',
  POE_ACTIVE: 'poeActive',
  GET_CONFIG: 'getConfig',
  SET_CONFIG: 'setConfig',
  UPDATE_CONFIG: 'updateConfig',
  RELOAD_APIDATA: 'reloadAPIData',
  GET_PROXY_PORT: 'getProxyPort',
} as const satisfies Record<string, Channel>
export default channels