interface ItemMod{
  id: string
  text: string[] | string
  type: string
  value?: {
    min?: number
    max?: number
  }
  disable: boolean
}
export interface ItemInterface{
  baseType: string
  type: {
    text: string
    option?: string
    searchByType: boolean
  }
  name?: string
  uniques?: UniquesInterface[]
  raritySearch: {
    id: string | undefined
    label: string
  }
  rarity?: string
  itemLevel: {
    min?: number
    max?: number
    search: boolean
  }
  isWeaponOrArmor: boolean
  isCorrupt?: boolean
  isIdentify?: boolean
  quality: {
    min?: number
    max?: number
    search: boolean
  }
  enchant?: ItemMod[]
  implicit?: ItemMod[]
  explicit?: ItemMod[]
  fractured?: ItemMod[]
  crafted?: ItemMod[]
  pseudo?: ItemMod[]
  temple?: ItemMod[]
  influences?: ItemMod[]
  autoSearch: boolean
  searchTwoWeekOffline: boolean
  searchExchange: {
    option: boolean
    have: 'chaos' | 'divine'
  }
}

export interface UniquesInterface{
  text: string
  name: string
}