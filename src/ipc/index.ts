const channels = {
  PRICE_CHECK_SHOW: 'priceCheck',
  OVERLAY_SHOW: 'overlay',
  FORCE_POE: 'forcePOE',
  POE_ACTIVE: 'poeActive',
  GET_CONFIG: 'getConfig',
  SET_CONFIG: 'setConfig',
  RELOAD_APIDATA: 'reloadAPIData',
} as const
export type Channel = typeof channels[keyof typeof channels];

// export interface IpcHandler extends Record<Channel, unknown> {
//   priceCheck: (itemString: string, windowPos: string) => void;
//   overlay: () => void;
//   forcePOE: () => void;
//   poeActive: () => void;
//   getConfig: () => Config;
//   setConfig: (config: Config) => void;
//   reloadAPIData: () => ({
//     status: true;
//   } | {
//     status: false; error: unknown;
//   });
// }
// export type IpcReturn<C extends Channel> = ReturnType<IpcHandler[C]>;
// export type IpcArgs<C extends Channel> = Parameters<IpcHandler[C]>;


export default channels