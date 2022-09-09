export interface IItemStat{
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
export interface IItem{
  baseType: string;
  type: {
    text: string;
    option?: string;
    searchByType: boolean;
  };
  name?: string;
  uniques?: IItemUniques[];
  raritySearch: {
    id: string | undefined;
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
  requireLevel?: number;
  requireInt?: number;
  requireStr?: number;
  requireDex?: number;
  isWeaponOrArmor: boolean;
  isCorrupt?: boolean;
  isIdentify?: boolean;
  isFractured?: boolean;
  isSynthesised?: boolean;
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
  [key: string]: any;
}

export interface IItemUniques{
  text: string;
  name: string;
}