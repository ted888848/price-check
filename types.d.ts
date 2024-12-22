declare type ArrayValueType<T> = T extends (infer E)[] ? E : never
interface HeistReward {
  name?: string;
  type: string;
  text: string;
  trans?: {
    text: string;
    disc: string;
  }[];
}
interface Item {
  id: string;
  label: string;
  entries: {
    type: string;
    text: string;
    unique?: ItemUniques[];
  }[];
}
interface ItemGem {
  id: 'gems';
  label: string;
  entries: {
    type: string;
    text: string;
    trans?: {
      text: string;
      disc: string;
    }[];
  }[];
}


interface ParsedAPIitems {
  accessory: Item;
  armour: Item;
  card: Item;
  currency: Item;
  flask: Item;
  gem: ItemGem;
  jewel: Item;
  map: Item;
  weapon: Item;
  watchstones: Item;
  heistequipment: Item;
  heistmission: Item;
  logbook: Item;
  [key: string]: Item;
}
interface ParsedAPIMod {
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
interface ParsedAPIMods {
  pseudo: ParsedAPIMod;
  explicit: ParsedAPIMod;
  implicit: ParsedAPIMod;
  fractured: ParsedAPIMod;
  enchant: ParsedAPIMod;
  crafted: ParsedAPIMod;
  temple: ParsedAPIMod;
  clusterJewel: ParsedAPIMod;
  forbiddenJewel: ParsedAPIMod;
  sanctum: ParsedAPIMod;
  necropolis: ParsedAPIMod;
}
interface Static {
  id: string;
  text: string;
  image?: string;
}
interface ItemStat {
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
interface ParsedItem {
  baseType: string;
  type: {
    text: string;
    option?: string;
    searchByType: boolean;
  };
  name?: string;
  uniques: ItemUniques[];
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
  stats: ItemStat[];
  influences: ItemStat[];
  elderMap?: ItemStat;
  conquerorMap?: ItemStat;
  autoSearch: boolean;
  searchTwoWeekOffline: boolean;
  searchExchange: {
    option: boolean;
    have: string[];
    want?: string[];
  };
  search6L?: boolean;
  isRGB?: boolean;
  onlyChaos?: boolean;
  transGem?: {
    discriminator: string;
    option: string;
  };
  // [key: string]: any;
}

interface ItemUniques {
  text: string;
  name: string;
}
type hotkeyType = 'type-in-chat'
type POEVersion = '1' | '2'
interface Config {
  characterName: string;
  searchExchangePrefer: 'divine&chaos' | 'chaos' | 'divine';
  POESESSID: string;
  searchTwoWeekOffline: boolean;
  priceCheckHotkey: string;
  settingHotkey: string;
  shortcuts: {
    hotkey: string;
    type: hotkeyType;
    outputText: string;
  }[];
  league: string;
  poeVersion: POEVersion;
}

interface APIStaticItem {
  id: string;
  label: null | string;
  entries: {
    id: string;
    text: string;
    image?: string;
  }[];
}
interface APIStatic {
  result: APIStaticItem[];
}
interface APIItems {
  result: APIItem[];
}

interface APIItem {
  id: string;
  label: string;
  entries: {
    name?: string;
    type: string;
    text: string;
    flags?: {
      unique: boolean;
    };
    disc?: 'alt_x' | 'alt_y' | 'atlasofworlds' | 'blighted' | 'original' | 'theawakening' | 'uberblighted' | 'warfortheatlas';
  }[];
}
type StatsID = 'crafted' | 'crucible' | 'delve' | 'enchant' | 'explicit' | 'fractured' | 'implicit' | 'pseudo' | 'sanctum' | 'scourge' | 'ultimatum' | 'veiled' | 'necropolis';
interface APIStats {
  result: APIStatsItem[];
}

interface APIStatsItem {
  id: StatsID;
  label: string;
  entries: {
    id: string;
    text: string;
    type: StatsID;
    option?: {
      options: {
        id: number;
        text: string;
      }[];
    };
  }[];
}

interface APILeagues {
  result: {
    id: string;
    realm: string;
    text: string;
  }[];
}