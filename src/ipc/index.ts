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
} as const
export type Channel = typeof channels[keyof typeof channels];

type IpcPriceCheck = {
  name: 'priceCheck';
  handler: (itemString: string, windowPos: string) => void;
}
type IpcOverlay = {
  name: 'overlay';
  handler: () => void;
}
type IpcForcePOE = {
  name: 'forcePOE';
  handler: () => void;
}
type IpcPOEActive = {
  name: 'poeActive';
  handler: () => void;
}
type IpcGetConfig = {
  name: 'getConfig';
  handler: () => Config;
}
type IpcSetConfig = {
  name: 'setConfig';
  handler: (config: string) => void;
}
type IpcUpdateConfig = {
  name: 'updateConfig';
  handler: (config: string) => void;
}
type IpcReloadAPIData = {
  name: 'reloadAPIData';
  handler: () => ({
    status: true; error: never;
  } | {
    status: false; error: unknown;
  });
}

type IpcGetProxyPort = {
  name: 'getProxyPort';
  handler: () => number;
}
export type IpcEvent = IpcPriceCheck | IpcOverlay | IpcForcePOE | IpcPOEActive | IpcGetConfig | IpcSetConfig | IpcReloadAPIData | IpcGetProxyPort | IpcUpdateConfig;
export type IpcReturn<C extends Channel> = ReturnType<Extract<IpcEvent, { name: C }>['handler']>;
export type IpcArgs<C extends Channel> = Parameters<Extract<IpcEvent, { name: C }>['handler']>;

export default channels