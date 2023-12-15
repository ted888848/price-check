declare type ArrayValueType<T> = T extends (infer E)[] ? E : never
interface IHeistReward {
  name?: string;
  type: string;
  text: string;
  trans?: {
    text: string;
    disc: string;
  }[]
}
interface IAPIItemsItem {
  id: string;
  label: string;
  entries: {
    type: string;
    text: string;
    unique: IItemUniques[];
  }[];
}
interface IAPIGemsItem {
  label: 'gems';
  entries: {
    type: string;
    text: string;
    trans: {
      text: string;
      disc: string;
    }[]
  }[]
}
interface IIPCChannel {
  PRICE_CHECK_SHOW: 'priceCheck';
  OVERLAY_SHOW: 'overlay';
  FORCE_POE: 'forcePOE';
  POE_ACTIVE: 'poeActive';
  GET_CONFIG: 'getConfig';
  SET_CONFIG: 'setConfig';
  RELOAD_APIDATA: 'reloadAPIData';
  GET_COOKIE: 'getCookie';
}


interface IAPIitems {
  accessories: IAPIItemsItem;
  armour: IAPIItemsItem;
  cards: IAPIItemsItem;
  currency: IAPIItemsItem;
  flasks: IAPIItemsItem;
  gems: IAPIGemsItem;
  jewels: IAPIItemsItem;
  maps: IAPIItemsItem;
  weapons: IAPIItemsItem;
  watchstones: IAPIItemsItem;
  heistequipment: IAPIItemsItem;
  heistmission: IAPIItemsItem;
  logbook: IAPIItemsItem;
}
interface IAPIModsMod {
  label: string;
  type: string;
  entries: {
    id: string;
    text: string;
    option?: {
      options: {
        id: number;
        text: string;
      }[];
    };
  }[];
  mutiLines?: {
    id: string;
    text: string[];
    option?: {
      options: {
        id: number;
        text: string;
      }[];
    };
  }[];
}
interface IAPIMods {
  pseudo: IAPIModsMod;
  explicit: IAPIModsMod;
  implicit: IAPIModsMod;
  fractured: IAPIModsMod;
  enchant: IAPIModsMod;
  crafted: IAPIModsMod;
  temple: IAPIModsMod;
  clusterJewel: IAPIModsMod;
  forbiddenJewel: IAPIModsMod;
  sanctum: IAPIModsMod;
}
interface IStatic {
  id: string;
  text: string;
  image: string;
}
interface IItemStat {
  id: string;
  text: string[] | string;
  type?: string;
  min?: number;
  max?: number;
  disabled?: boolean;
  value?: {
    min?: number;
    max?: number;
    option?: number;
  };
}
interface IItem {
  baseType: string;
  type: {
    text: string;
    option?: string;
    searchByType: boolean;
  };
  name?: string;
  uniques: IItemUniques[];
  raritySearch: {
    value: string | undefined;
    label: string;
  };
  rarity: string;
  itemLevel?: {
    min?: number;
    max?: number;
    search: boolean;
  };
  mapTier?: {
    min?: number;
    max?: number;
    search: boolean;
  };
  gemLevel?: {
    min?: number;
    max?: number;
    search: boolean;
  };
  altQType?: number;
  vaalVer?: boolean;
  requireLevel?: number;
  requireInt?: number;
  requireStr?: number;
  requireDex?: number;
  isWeaponOrArmor: boolean;
  isCorrupt?: boolean;
  isIdentify?: boolean;
  isFractured?: boolean;
  isSynthesized?: boolean;
  blightedMap?: boolean;
  UberBlightedMap?: boolean;
  quality: {
    min?: number;
    max?: number;
    search: boolean;
  };
  phyDamage?: {
    min: number;
    max: number;
  };
  eleDamage?: {
    min: number;
    max: number;
  };
  pDPS?: number;
  eDPS?: number;
  evasion?: number;
  armour?: number;
  energyShield?: number;
  critChance?: number;
  attackSpeed?: number;
  weaponArea?: number;
  stats: IItemStat[];
  influences: IItemStat[];
  elderMap?: IItemStat;
  conquerorMap?: IItemStat;
  autoSearch: boolean;
  searchTwoWeekOffline: boolean;
  searchExchange: {
    option: boolean;
    have: 'chaos' | 'divine';
  };
  search6L?: boolean;
  isRGB?: boolean;
  onlyChaos?: boolean;
  transGem?: {
    discriminator: string;
    option: string
  };
  // [key: string]: any;
}

interface IItemUniques {
  text: string;
  name: string;
}
type hotkeyType = 'type-in-chat'

interface IConfig {
  characterName: string;
  searchExchangeDivine: boolean;
  POESESSID: string;
  searchTwoWeekOffline: boolean;
  priceCheckHotkey: string;
  settingHotkey: string;
  shortcuts: {
    hotkey: string;
    type: hotkeyType;
    outputText: string;
  }[];
}