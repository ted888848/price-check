export interface itemInterface{
  baseType: string | undefined
  type: {
    text: string
    option: string
    searchByType: boolean
  } | undefined
  name: string | undefined
  uniques: []
  raritySearch: {
    id: string | undefined
    label: string
  } | undefined
  rarity: string | undefined
  itemLevel: {
    min: number | undefined
    max: number | undefined
    search: boolean
  } | undefined
  isWeaponOrArmor: boolean
  isCorrupt: boolean | undefined
  isIdentify: boolean | undefined
  quality: {
    min: number | undefined
    max: number | undefined
    search: boolean | undefined
  }
  enchant: Array<{
    id: string
  }>
}
let itemParsedSample: itemInterface = {
  type: undefined,
  baseType: undefined,
  name: undefined,
  uniques: [],
  raritySearch: undefined,
  rarity: undefined,
  itemLevel: undefined,
  isWeaponOrArmor: false,
  isCorrupt: false,
  isIdentify: undefined,
  quality: {
    min: undefined, max: undefined, search: false 
  },
  enchant: [],
  implicit: [],
  explicit: [],
  fractured: [],
  crafted: [],
  pseudo: [],
  temple: [],
  influences: [],
  autoSearch: false,
  searchTwoWeekOffline: false,
  searchExchange: {
    option: false, have: 'chaos' 
  }
}