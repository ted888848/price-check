import IPC from '@/ipc'
import { APIitems, APImods, APIStatic } from './APIdata'
import { poeVersion, secondCurrency } from '.'
import { getModMatchRegex, getStrReg } from './regex'
import { match, P } from 'ts-pattern'
enum ParseResult {
  PARSE_SECTION_FAIL,
  PARSE_SECTION_SUCC,
  PARSE_SECTION_SKIP,
  PARSE_ITEM_SKIP
}
const parseFuns: (((itemParsed: ParsedItem, section: string[]) => ParseResult) | undefined)[] = [
  parseRGB,
  parseRequirement,
  parseSocket,
  parseItemLevel,
  parseInfluence,
  parseCorrupt,
  parseEnchantMod,
  parseImplicitMod,
  (poeVersion === '2' ? parseRuneMod : () => ParseResult.PARSE_SECTION_SKIP),
  parseIdentify,
  parseExplicitMod,
]
const defaultItemParsed: ParsedItem = Object.freeze({
  type: {
    text: '',
    searchByType: false
  },
  baseType: '',
  name: undefined,
  uniques: [],
  raritySearch: {
    value: '',
    label: ''
  },
  rarity: '',
  itemLevel: {
    search: false
  },
  isWeaponOrArmor: false,
  isCorrupt: false,
  stats: [],
  influences: [],
  quality: {
    search: false
  },
  autoSearch: false,
  searchExchange: {
    option: false, have: []
  },
  searchOnlineType: 'online',
  fetchCount: 20,
})
function getDefaultItemParsed(config: Config) {
  const itemParsed = structuredClone(defaultItemParsed)
  if (config.searchExchangePrefer === 'divine&(C or Ex)') {
    itemParsed.searchExchange.have = ['divine', secondCurrency]
  }
  else {
    itemParsed.searchExchange.have = [config.searchExchangePrefer]
  }
  return itemParsed
}
function findUnique(itemParsed: ParsedItem, type: Exclude<keyof ParsedAPIitems, 'gem'>, isFonded: { flag: boolean }): void {
  if (isFonded.flag) return
  let temp: ItemUniques[] = []
  for (const ele of APIitems[type]!.entries) {
    if (type !== 'gem' && ele.type === itemParsed.baseType) {
      temp = structuredClone(ele.unique ?? [])
      break
    }
  }
  if (temp.length) itemParsed.uniques = temp
  isFonded.flag = true
}
export function itemAnalyze(item: string) {
  const config = window.ipc.sendSync(IPC.GET_CONFIG)
  const itemParsed = getDefaultItemParsed(config)
  const itemArr = item.split(/\r?\n/)
  itemArr.pop()
  const itemSection: string[][] = [[]]
  itemArr.reduce((section, line) => {
    if (line !== '--------') {
      section?.push(line)
      return section
    }
    else {
      section = []
      itemSection.push(section)
      return section
    }
  }, itemSection[0])
  if (parseItemName(itemParsed, itemSection[0]!, itemSection) === ParseResult.PARSE_SECTION_FAIL) return null
  itemParsed.searchOnlineType = config.searchOnlineType ?? itemParsed.searchOnlineType
  itemSection.shift()
  const isFindUnique = {
    flag: false
  }
  match(itemParsed.type)
    .with({ option: P.string.startsWith('weapon') }, () => {
      findUnique(itemParsed, 'weapon', isFindUnique);
      parseWeapon(itemParsed, itemSection);
    })
    .with({ option: P.string.startsWith('armour') }, () => {
      findUnique(itemParsed, 'armour', isFindUnique);
      parseArmor(itemParsed, itemSection);
    })
    .with({ option: P.string.startsWith('flask') }, () => {
      findUnique(itemParsed, 'flask', isFindUnique);
      parseFlask(itemParsed, itemSection);
    })
    .with({ option: P.string.startsWith('accessory') }, () => {
      findUnique(itemParsed, 'accessory', isFindUnique);
      parseOtherHaveMods(itemParsed, itemSection);
    })
    .with({ option: P.string.startsWith('jewel') }, () => {
      parseJewel(itemParsed, itemSection);
      findUnique(itemParsed, 'jewel', isFindUnique);
    })
    .with({ option: P.string.startsWith('map') }, () => {
      findUnique(itemParsed, 'map', isFindUnique);
      parseMap(itemParsed, itemSection);
    })
    .with({ text: P.union('可堆疊通貨', '預兆', '地圖碎片', '遺鑰', '命運卡', '掘獄可堆疊有插槽通貨') }, ({ text }) => {
      let shouldSkip = false;
      if (text === '可堆疊通貨') {
        shouldSkip = parseBeastItem(itemParsed, itemSection);
      }
      if (!shouldSkip) {
        if (config.autoSearchStackableItems) itemParsed.autoSearch = true;
        parseAllfuns(itemParsed, itemSection);
      }
    })
    .with({ text: P.union('技能寶石', '輔助寶石') }, () => {
      parseGem(itemParsed, itemSection);
    })
    .with({ text: '探險日誌' }, () => {
      parseLogbook(itemParsed, itemSection);
    })
    .with({ text: '屍體' }, () => {
      itemParsed.autoSearch = true;
    })
    .with({ text: '聖物' }, () => {
      parseRelic(itemParsed, itemSection);
    })
    .with({ text: '接肢' }, () => {
      parseGraft(itemParsed, itemSection);
    })
    .with({ text: '契約書' }, () => {
      findUnique(itemParsed, 'heistmission', isFindUnique);
    })
  parseAllfuns(itemParsed, itemSection);
  const staticItem = APIStatic.find((ele: Static) => ele.text === itemParsed.baseType)
  if (staticItem) {
    itemParsed.itemID = staticItem.id
    itemParsed.searchExchange.option = true
  }
  parsePseudoEleResistance(itemParsed)
  if (itemParsed.rarity === '傳奇' && itemParsed.isIdentify === false && itemParsed.uniques.length === 1) {
    itemParsed.name = itemParsed.uniques[0]!.name
  }
  if (itemParsed.raritySearch.label === '傳奇' && itemParsed.name) itemParsed.autoSearch = true
  if (itemParsed.baseType === '阿茲瓦特史記') parseTemple(itemParsed, itemSection)

  return itemParsed
}
export function parseItemName(itemParsed: ParsedItem, section: string[], itemSection: string[][]) {
  if (!section[0]!.startsWith('物品種類:')) return ParseResult.PARSE_SECTION_FAIL
  if (section[2] === '你無法使用這項裝備，它的數值將被忽略') {
    section.pop()
    section.push(...(itemSection.splice(1, 1)[0]!))
  }
  const typeTrans = {
    爪: 'weapon.claw',
    匕首: 'weapon.dagger',
    法杖: 'weapon.wand',
    單手劍: 'weapon.onesword',
    細劍: 'weapon.onesword',
    單手斧: 'weapon.oneaxe',
    單手錘: 'weapon.onemace',
    權杖: 'weapon.sceptre',
    符紋匕首: 'weapon.runedagger',
    弓: 'weapon.bow',
    長杖: 'weapon.staff',
    雙手劍: 'weapon.twosword',
    雙手斧: 'weapon.twoaxe',
    雙手錘: 'weapon.twomace',
    魚竿: 'weapon.rod',
    征戰長杖: 'weapon.warstaff',
    長鋒: 'weapon.spear',
    長矛: 'weapon.spear',
    鏈錘: 'weapon.flail',
    魔符: 'weapon.talisman',
    細杖: 'weapon.warstaff',
    十字弓: 'weapon.crossbow',
    手套: 'armour.gloves',
    鞋子: 'armour.boots',
    胸甲: 'armour.chest',
    頭部: 'armour.helmet',
    箭袋: 'armour.quiver',
    盾: 'armour.shield',
    輕盾: 'armour.buckler',
    法器: 'armour.focus',
    項鍊: 'accessory.amulet',
    戒指: 'accessory.ring',
    腰帶: 'accessory.belt',
    永恆珠寶: 'jewel',
    珠寶: 'jewel',
    深淵珠寶: 'jewel',
    生命藥劑: 'flask',
    魔力藥劑: 'flask',
    複合藥劑: 'flask',
    功能藥劑: 'flask',
    飾品: 'accessory.trinket',
    地圖: 'map',
    輿圖地區升級道具: 'watchstone',
    記憶: 'memoryline',
    技能寶石: 'gem.activegem',
    咒語: 'azmeri.charm',
    不滅之火餘燼: undefined,
    接肢: 'graft',
    萃取物: 'tincture'
  } as const
  const rarityOptions = [{
    value: undefined,
    label: '任何'
  }, {
    value: 'normal',
    label: '普通'
  }, {
    value: 'magic',
    label: '魔法'
  }, {
    value: 'rare',
    label: '稀有'
  }, {
    value: 'unique',
    label: '傳奇'
  }, {
    value: 'nonunique',
    label: '非傳奇'
  }] as const
  // 物品種類
  const itemType = section[0]!.match(/物品種類: ([^\n]+)/)![1] as keyof typeof typeTrans
  itemParsed.type = {
    text: itemType, option: typeTrans[itemType], searchByType: false
  }
  section.shift()

  // 稀有度
  itemParsed.rarity = section[0]!.match(/稀有度: ([^\n]+)/)?.[1] ?? ''
  if (itemType === '不滅之火餘燼') {
    itemParsed.baseType = section[0]!
    return ParseResult.PARSE_SECTION_SUCC
  }
  if (['普通', '魔法', '稀有'].includes(itemParsed.rarity)) {
    itemParsed.raritySearch = rarityOptions[5]
  }
  else if (itemParsed.rarity === '傳奇') {
    itemParsed.raritySearch = rarityOptions[4]
  }
  else {
    itemParsed.raritySearch = rarityOptions[0]
  }
  section.shift()

  // 物品名稱與基底
  const itemTypeApi = itemParsed.type.option?.substring(0, itemParsed.type.option.indexOf('.')) as keyof typeof APIitems
  let itemNameLine = section.at(-1)?.replace(/(精良的|追憶之|Synthesised)\s/, '') ?? ''

  //把英文baseType轉成中文，看起來暫時不用
  // if (itemNameTranslation.length > 0) {
  //   itemNameLine = itemNameTranslation.find(ele => ele.us.toLocaleLowerCase() === itemNameLine.toLocaleLowerCase())?.lang ?? itemNameLine
  // }

  const apiBaseTypes = (APIitems[itemTypeApi]?.entries ?? Object.values(APIitems).flatMap(item => item.entries))
    .filter((entry) => {
      let sectionLine = itemNameLine
      if (!sectionLine) return false
      if (sectionLine.startsWith('精良的')) sectionLine = sectionLine.substring(4)
      if (sectionLine.startsWith('追憶之')) sectionLine = sectionLine.substring(4)
      if (sectionLine.startsWith('Synthesised')) sectionLine = sectionLine.substring(11)

      return entry.type === sectionLine || sectionLine?.endsWith(entry.type)
    }).map((entry) => (entry.type))

  APIStatic.forEach((entry) => {
    let sectionLine = itemNameLine
    if (!sectionLine) return
    if (entry.text === sectionLine) {
      apiBaseTypes.push(entry.text)
    }
  })

  let maxMatchLength = 0
  let apiBaseType: string | undefined = undefined
  apiBaseTypes?.forEach((entry) => {
    const matchLength = entry.length
    if (matchLength > maxMatchLength) {
      maxMatchLength = matchLength
      apiBaseType = entry
    }
  })

  if (itemType === '技能寶石') {
    itemParsed.baseType = section[0]!
    const transGemInfo = APIitems.gem.entries.find(ele => ele.trans?.some(({ text }) => text === itemParsed.baseType))
    if (transGemInfo) {
      itemParsed.transGem = {
        option: transGemInfo.type,
        discriminator: transGemInfo.trans!.find(g => g.text === itemParsed.baseType)!.disc
      }
    }
  }
  else if (apiBaseType) {
    itemParsed.baseType = apiBaseType
    const lastLine = section.at(-1)
    if (itemParsed.baseType !== lastLine) {
      itemParsed.name = lastLine?.replace(itemParsed.baseType, '')
    }
  }
  else {
    itemParsed.baseType = section.at(-1)!
  }
  section.pop()
  if (section.length > 0) {
    itemParsed.name = section.pop()
  }

  if (/^穢生\s|^Foulborn\s/.test(itemParsed.name || '')) {
    itemParsed.name = itemParsed.name?.replace(/穢生\s|Foulborn\s/, '')
    itemParsed.foulborn = true
  }

  //把英文傳奇名稱轉成中文
  // if (itemParsed.rarity === '傳奇' && itemNameTranslation.length > 0) {
  //   itemParsed.name = itemNameTranslation.find(ele => ele.type === 'Unique' && ele.us?.toLocaleLowerCase() === itemParsed.name?.toLocaleLowerCase())?.lang ?? itemParsed.name
  // }
  return ParseResult.PARSE_SECTION_SUCC
}


function parseRequirement(itemParsed: ParsedItem, section: string[]) {
  if (!section[0]?.startsWith('需求:')) return ParseResult.PARSE_SECTION_SKIP
  section.forEach(line => {
    let lineMatch: RegExpMatchArray | null
    if ((lineMatch = line.match(/^等級: (\d+)/))) {
      itemParsed.requireLevel = parseInt(lineMatch[1]!)
    }
    else if ((lineMatch = line.match(/^智慧: (\d+)/))) {
      itemParsed.requireInt = parseInt(lineMatch[1]!)
    }
    else if ((lineMatch = line.match(/^力量: (\d+)/))) {
      itemParsed.requireStr = parseInt(lineMatch[1]!)
    }
    else if ((lineMatch = line.match(/^敏捷: (\d+)/))) {
      itemParsed.requireDex = parseInt(lineMatch[1]!)
    }
  })
  return ParseResult.PARSE_SECTION_SUCC
}
function parseSocket(itemParsed: ParsedItem, section: string[]) {
  if (!section[0]?.startsWith('插槽')) return ParseResult.PARSE_SECTION_SKIP
  const sockets = section[0]!.replace(/R|G|B|W/g, '#')
  if (sockets.indexOf('#-#-#-#-#-#') > -1) {
    itemParsed.search6L = true
  }
  else if (['弓', '長杖', '雙手劍', '雙手斧', '雙手錘', '征戰長杖', '胸甲'].includes(itemParsed.type.text)) {
    itemParsed.search6L = false
  }
  return ParseResult.PARSE_SECTION_SUCC
}
function parseItemLevel(itemParsed: ParsedItem, section: string[]) {
  const sectionMatch = section[0]?.match(/^物品等級: (\d+)/)
  if (!sectionMatch) return ParseResult.PARSE_SECTION_SKIP
  const il = parseInt(sectionMatch[1]!)
  const maxModLevel = window.ipc.sendSync(IPC.GET_CONFIG).poeVersion === '1' ? 86 : 82
  itemParsed.itemLevel = {
    min: il > maxModLevel ? maxModLevel : il, max: undefined, search: itemParsed.rarity !== '傳奇'
  }
  return ParseResult.PARSE_SECTION_SUCC
}

function parseMod(itemParsed: ParsedItem, section: string[], type: keyof ParsedAPIMods | 'mutated' | 'rune') {
  let modType = type
  const cleanSection = section.filter(line => !/{.*}/.test(line))
  const regSection = getStrReg(cleanSection, modType)
  if (modType === 'mutated' || modType === 'rune') {
    modType = 'explicit'
  }
  else {
    modType = modType as keyof ParsedAPIMods
  }
  if (!APImods[modType]) return ParseResult.PARSE_SECTION_FAIL
  let tempArr: ItemStat[] = []
  for (const [index, line] of regSection.entries()) {
    try {
      let matchMods = APImods[modType]?.entries
        .filter(mod => line.test(mod.text) || line.test(mod.text.split('\n').at(0) ?? ''))
      if (!matchMods || !matchMods.length) continue;

      if (matchMods.length > 1) {
        if (itemParsed.isWeaponOrArmor && itemParsed.type.option !== 'armour.quiver' && matchMods.find(ele => ele.text.endsWith(' (部分)')))
          matchMods = matchMods.filter(mod => mod.text.endsWith(' (部分)'))
        else {
          matchMods = matchMods.filter(mod => !mod.text.endsWith(' (部分)'))
          const sectionSign = Array.from(cleanSection[index]?.match(/增加|減少|更多|更少/g) ?? []).join('')
          if (sectionSign)
            matchMods = matchMods.filter(mod => Array.from(mod.text.match(/增加|減少|更多|更少/g) ?? []).join('') === sectionSign)
        }
      }

      matchMods = matchMods.filter(mod => {
        const modMultiLine = mod.text.split('\n')
        const modMultiLineLength = modMultiLine.length
        const regSectionMultiLines = regSection.slice(index, index + modMultiLineLength)

        if (regSectionMultiLines.length !== modMultiLineLength) return false
        return regSectionMultiLines
          .every((regSectionMultiLine, mi) => regSectionMultiLine.test(modMultiLine[mi] ?? ''))
      })
      if (!matchMods.length) continue
      matchMods.forEach((matchMod) => {
        const matchModMultiLineLength = matchMod.text.split('\n').length
        const matchReg = getModMatchRegex(matchMod.text)
        const regGroup = cleanSection.slice(index, index + matchModMultiLineLength).join('\n').match(matchReg)
        regGroup?.shift()
        if (type === 'rune') {
          matchMod.id = matchMod.id.replace(/^explicit/, 'rune')
        }
        const baseOption = {
          ...matchMod,
          disabled: type === 'mutated' ? false : true,
          type: type === 'mutated' ? '穢生' : APImods[modType]?.type ?? type
        }
        if (regGroup?.length) {
          const diffSign = matchMod.text.match(/減少|增加|更多|更少/)?.[0] !== cleanSection[index]?.match(/減少|增加|更多|更少/)?.[0]
          //數字前增加與減少不相等，把數字變負數
          const minValue = (diffSign ? -1 : 1) * (regGroup.reduce((pre, ele) => pre + Number(ele), 0) / regGroup.length)
          tempArr.push({
            value: {
              [diffSign ? 'max' : 'min']: minValue,
            },
            ...baseOption
          })
        }
        else {
          tempArr.push({ ...baseOption })
        }
      })
    }
    catch (e) {
      console.error(e)
    }
  }
  if (tempArr.length) {
    itemParsed.stats.push(...tempArr)
    return ParseResult.PARSE_SECTION_SUCC
  }
  return ParseResult.PARSE_SECTION_SKIP
}
function parseEnchantMod(itemParsed: ParsedItem, section: string[]) {
  if (!section.find(line => line.endsWith('(enchant)'))) return ParseResult.PARSE_SECTION_SKIP
  if (parseMod(itemParsed, section, 'enchant') === ParseResult.PARSE_SECTION_SUCC) return ParseResult.PARSE_SECTION_SUCC
  return ParseResult.PARSE_SECTION_FAIL
}
function parseImplicitMod(itemParsed: ParsedItem, section: string[]) {
  if (!section.find(line => /(\(implicit\)$)|\{\s.*固定詞綴.*\s\}/.test(line))) return ParseResult.PARSE_SECTION_SKIP
  if (parseMod(itemParsed, section, 'implicit') === ParseResult.PARSE_SECTION_SUCC) return ParseResult.PARSE_SECTION_SUCC
  return ParseResult.PARSE_SECTION_FAIL
}
function parseRuneMod(itemParsed: ParsedItem, section: string[]) {
  if (!section.find(line => line.endsWith(' (rune)'))) return ParseResult.PARSE_SECTION_SKIP
  if (parseMod(itemParsed, section, 'rune') === ParseResult.PARSE_SECTION_SUCC) return ParseResult.PARSE_SECTION_SUCC
  return ParseResult.PARSE_SECTION_FAIL
}
function parseExplicitMod(itemParsed: ParsedItem, section: string[]) {
  if (!['魔法', '稀有', '傳奇'].includes(itemParsed.rarity)) return ParseResult.PARSE_SECTION_SKIP
  const explicitSection: string[] = [],
    fracturedSection: string[] = [],
    craftedSection: string[] = [],
    mutatedSection: string[] = []
  let parsed = false
  let sectionModArr: string[] = []
  let sectionModTypeArr: string[] = [];
  section.forEach(line => {
    if (/{.*}/.test(line)) {
      sectionModTypeArr.push(line);
    }
    else {
      sectionModArr.push(line);
    }
  })
  for (let i = 0; i < sectionModArr.length; i++) {
    const line = sectionModArr[i] ?? '';
    let type = line?.match(/fractured|crafted|mutated/)?.[0]
    if (sectionModTypeArr[i]) {
      type = sectionModTypeArr[i]?.startsWith('{ 已破裂') ? 'fractured' :
        sectionModTypeArr[i]?.startsWith('{ 已大師工藝') ? 'crafted' :
          sectionModTypeArr[i]?.startsWith('{ Foulborn') ? 'mutated' : type
    }
    match(type)
      .with('crafted', () => craftedSection.push(line))
      .with('fractured', () => fracturedSection.push(line))
      .with('mutated', () => mutatedSection.push(line))
      .otherwise(() => {
        if (line !== '隱匿前綴' && line !== '隱匿後綴') explicitSection.push(line)
      })
  }

  if (craftedSection.length) parsed = parseMod(itemParsed, craftedSection, 'crafted') === ParseResult.PARSE_SECTION_SUCC || parsed
  if (fracturedSection.length) parsed = parseMod(itemParsed, fracturedSection, 'fractured') === ParseResult.PARSE_SECTION_SUCC || parsed
  if (explicitSection.length) parsed = parseMod(itemParsed, explicitSection, 'explicit') === ParseResult.PARSE_SECTION_SUCC || parsed
  if (mutatedSection.length) parsed = parseMod(itemParsed, mutatedSection, 'mutated') === ParseResult.PARSE_SECTION_SUCC || parsed

  if (parsed) return ParseResult.PARSE_SECTION_SUCC
  return ParseResult.PARSE_SECTION_SKIP
}
function parseInfluence(itemParsed: ParsedItem, section: string[]) {
  const influences = [{
    id: 'pseudo.pseudo_has_shaper_influence',
    text: '塑者之物',
    label: '塑者'
  }, {
    id: 'pseudo.pseudo_has_elder_influence',
    text: '尊師之物',
    label: '尊師'
  }, {
    id: 'pseudo.pseudo_has_crusader_influence',
    text: '聖戰軍王物品',
    label: '聖戰'
  }, {
    id: 'pseudo.pseudo_has_redeemer_influence',
    text: '救贖者物品',
    label: '救贖'
  }, {
    id: 'pseudo.pseudo_has_hunter_influence',
    text: '狩獵者物品',
    label: '狩獵'
  }, {
    id: 'pseudo.pseudo_has_warlord_influence',
    text: '總督軍物品',
    label: '督軍'
  }] as const
  for (const line of section) {
    if (line === '破裂之物') {
      itemParsed.isFractured = true
    }
    else if (line === '追憶之物') {
      itemParsed.isSynthesized = true
      break
    }
    const influence = influences.find(inf => inf.text === line)
    if (influence) itemParsed.influences.push(influence)
  }
  if (itemParsed.influences.length > 0) {
    return ParseResult.PARSE_SECTION_SUCC
  }
  return ParseResult.PARSE_SECTION_SKIP
}
function parseCorrupt(itemParsed: ParsedItem, section: string[]) {
  if (section[0]?.match(/^已汙染$/)) {
    itemParsed.isCorrupt = true
    return ParseResult.PARSE_SECTION_SUCC
  }
  return ParseResult.PARSE_SECTION_SKIP
}
function parseIdentify(itemParsed: ParsedItem, section: string[]) {
  if (section[0]?.match(/^未鑑定$/)) {
    itemParsed.isIdentify = false
    return ParseResult.PARSE_SECTION_SUCC
  }
  return ParseResult.PARSE_SECTION_SKIP
}
function parsePseudoEleResistance(itemParsed: ParsedItem) {
  let eleRes = 0
  let flag = false
  itemParsed.stats.forEach(mod => {
    match(mod.id)
      .with(P.string.endsWith('stat_3372524247'), P.string.endsWith('stat_1671376347'), P.string.endsWith('stat_4220027924'), () => {
        eleRes += mod.value!.min! ?? mod.value!.max ?? 0
        flag = true
      })
      .with(P.string.endsWith('stat_3441501978'), P.string.endsWith('stat_4277795662'), P.string.endsWith('stat_2915988346'), () => {
        eleRes += ((mod.value!.min! ?? mod.value!.max ?? 0) * 2)
        flag = true
      })
      .with(P.string.endsWith('stat_2901986750'), () => {
        eleRes += ((mod.value!.min! ?? mod.value!.max ?? 0) * 3)
        flag = true
      })
      .otherwise(() => { })
  })
  if (flag) {
    itemParsed.stats.push({
      id: 'pseudo.pseudo_total_elemental_resistance',
      text: '+#% 元素抗性',
      type: '偽屬性',
      value: {
        min: eleRes
      },
      disabled: true
    })
  }
}
function parseAllfuns(itemParsed: ParsedItem, item: string[][], functions: (((itemParsed: ParsedItem, section: string[]) => ParseResult) | undefined)[] = parseFuns) {
  endFor:
  for (const fun of functions) {
    for (const section of item) {
      if (!fun) continue
      const state = fun(itemParsed, section)
      if (state === ParseResult.PARSE_SECTION_SUCC) {
        item.splice(item.indexOf(section), 1)
        break
      }
      else if (state === ParseResult.PARSE_ITEM_SKIP) {
        break endFor
      }
    }
  }
}
function parseWeapon(itemParsed: ParsedItem, item: string[][]) {
  itemParsed.isWeaponOrArmor = true
  item[0]?.forEach(line => {
    let lineMatch: RegExpMatchArray | null
    if ((lineMatch = line.match(/品質: \+(\d+)%/))) {
      itemParsed.quality = {
        min: parseInt(lineMatch[1]!), max: undefined, search: false
      }
    }
    else if ((lineMatch = line.match(/物理傷害: (\d+)(?:-|\s到\s)(\d+)/))) {
      itemParsed.phyDamage = {
        min: parseInt(lineMatch[1]!),
        max: parseInt(lineMatch[2]!)
      }
    }
    else if ((lineMatch = line.match(/(?:元素|火焰|冰冷|閃電)傷害:(?: (\d+)(?:-|\s到\s)(\d+) \((?:augmented|fire|lightning|cold)\),?)(?: (\d+)(?:-|\s到\s)(\d+) \((?:augmented|fire|lightning|cold)\),?)?(?: (\d+)(?:-|\s到\s)(\d+) \((?:augmented|fire|lightning|cold)\))?/))) {
      lineMatch.shift()
      itemParsed.eleDamage = {
        min: lineMatch.reduce((pre, curr, index) => {
          if (curr && index % 2 == 0) return pre += parseInt(curr)
          return pre
        }, 0),
        max: lineMatch.reduce((pre, curr, index) => {
          if (curr && index % 2 == 1) return pre += parseInt(curr)
          return pre
        }, 0)
      }
    }
    else if ((lineMatch = line.match(/暴擊率: (\d+\.?\d\d)%/))) {
      itemParsed.critChance = parseFloat(lineMatch[1]!)
    }
    else if ((lineMatch = line.match(/每秒攻擊次數: (\d+\.?\d\d)/))) {
      itemParsed.attackSpeed = parseFloat(lineMatch[1]!)
    }
    else if ((lineMatch = line.match(/武器範圍: (\d+)/))) {
      itemParsed.weaponArea = parseInt(lineMatch[1]!)
    }
  })
  item.shift()
  if (itemParsed.phyDamage && itemParsed.attackSpeed) itemParsed.pDPS = parseFloat((((itemParsed.phyDamage.min + itemParsed.phyDamage.max) / 2) * itemParsed.attackSpeed).toFixed(2))
  if (itemParsed.eleDamage && itemParsed.attackSpeed) itemParsed.eDPS = parseFloat((((itemParsed.eleDamage.min + itemParsed.eleDamage.max) / 2) * itemParsed.attackSpeed).toFixed(2))
  parseAllfuns(itemParsed, item, parseFuns)
}
function parseArmor(itemParsed: ParsedItem, item: string[][]) {
  itemParsed.isWeaponOrArmor = true
  item[0]?.forEach(line => {
    let lineMatch: RegExpMatchArray | null
    if ((lineMatch = line.match(/品質: \+(\d+)%/))) {
      itemParsed.quality.min = parseInt(lineMatch[1]!)
    }
    else if ((lineMatch = line.match(/閃避值: (\d+)/))) {
      itemParsed.evasion = parseInt(lineMatch[1]!)
    }
    else if ((lineMatch = line.match(/護甲: (\d+)/))) {
      itemParsed.armour = parseInt(lineMatch[1]!)
    }
    else if ((lineMatch = line.match(/能量護盾: (\d+)/))) {
      itemParsed.energyShield = parseInt(lineMatch[1]!)
    }
  })
  item.shift()
  parseAllfuns(itemParsed, item, parseFuns)
}
function parseClusterJewel(itemParsed: ParsedItem, item: string[][]) {
  if (parseRequirement(itemParsed, item[0]!) === ParseResult.PARSE_SECTION_SUCC) item.shift()
  const tempIlvl = parseInt(item[0]![0]!.match(/物品等級: (\d+)/)![1]!)
  itemParsed.itemLevel = {
    min: tempIlvl >= 84 ? 84 : tempIlvl >= 75 ? 75 : tempIlvl >= 68 ? 68 : tempIlvl >= 50 ? 50 : 1,
    max: tempIlvl >= 84 ? 100 : tempIlvl >= 75 ? 83 : tempIlvl >= 68 ? 74 : tempIlvl >= 50 ? 67 : 49,
    search: true
  }
  item.shift()
  if (itemParsed.rarity !== '傳奇') {
    parseEnchantMod(itemParsed, item[0]!.slice(0, 2))
    match(itemParsed.baseType)
      .with('巨型星團珠寶', '小型星團珠寶', () => {
        itemParsed.stats[0]!.value!.min = itemParsed.stats[0]!.value!.max
      })
      .with('中型星團珠寶', () => {
        itemParsed.stats[0]!.value!.min = itemParsed.stats[0]!.value!.min === 6 ? 6 : 4
        itemParsed.stats[0]!.value!.max = itemParsed.stats[0]!.value!.min === 6 ? 6 : 5
      })
    let clusterType: string = item[0]!.find(ele => ele.startsWith('附加的小型天賦給予：'))!
    clusterType = clusterType.substring(10, clusterType.indexOf(' (enchant)'))
    let tempMod = APImods.clusterJewel.entries.find(mod => mod.text.includes(clusterType))
    if (tempMod!.text.endsWith('(古典)') && itemParsed.baseType === '小型星團珠寶') {
      const tempText = tempMod!.text.substring(0, tempMod!.text.length - 5)
      tempMod = APImods.clusterJewel.entries.reverse().find(mod => mod.text.includes(tempText))
    }
    itemParsed.stats.push({
      id: 'enchant.stat_3948993189',
      text: tempMod!.text,
      value: {
        option: Number(tempMod?.id)
      },
      type: '附魔',
      disabled: false
    })
    itemParsed.stats.forEach(ele => ele.disabled = false)
    item.shift()
  }
  const _parseFuns = [
    parseCorrupt,
    parseIdentify,
    parseImplicitMod,
    parseExplicitMod,
  ]
  parseAllfuns(itemParsed, item, _parseFuns)
  itemParsed.autoSearch = true
}
function parseForbiddenJewel(itemParsed: ParsedItem, item: string[][]) {
  itemParsed.autoSearch = true
  for (const section of item) {
    if (parseCorrupt(itemParsed, section) === ParseResult.PARSE_SECTION_SUCC) continue
    const sectionMatch = section[0]!.match(/若禁忌(烈焰|血肉)上有符合的詞綴，配置 (.*)/)
    if (sectionMatch) {
      const type = sectionMatch[1]
      const passive = sectionMatch[2]!
      const matchStat = APImods.forbiddenJewel.entries.find(e => e.text.indexOf(type!) > -1)
      const matchPassive = matchStat?.option?.options.find(e => e.text === passive)
      itemParsed.stats.push({
        id: matchStat!.id,
        text: matchStat!.text.replace('#', passive),
        value: {
          option: matchPassive?.id
        },
        disabled: false
      })
    }
  }
}
function parseImpossibleEscape(itemParsed: ParsedItem, item: string[][]) {
  itemParsed.autoSearch = true
  itemParsed.isCorrupt = true
  outer:
  for (const section of item) {
    for (const line of section) {
      const result = line.match(/天賦樹中在範圍(.+)內未連結的天賦仍然可以配置/)
      if (result) {
        const statDetail = APImods.explicit.mutiLines?.find(ele => ele.id === 'explicit.stat_2422708892')!
        const matchOption = statDetail.option?.options.find(ele => ele.text === result[1])
        itemParsed.stats.push({
          id: statDetail.id,
          text: statDetail.text[0]!.replace('#', result[1]!),
          value: {
            option: matchOption?.id
          },
          disabled: false
        })
        break outer
      }
    }
  }
}
function parseThreadOfHope(itemParsed: ParsedItem, item: string[][]) {
  function parseRangeMod(itemParsed: ParsedItem, section: string[]) {
    const mod = {
      'id': 'explicit.stat_3642528642',
      'text': '只會影響#範圍內的天賦',
      'type': 'explicit',
      'option': {
        'options': [
          {
            'id': 1,
            'text': '小'
          },
          {
            'id': 2,
            'text': '中'
          },
          {
            'id': 3,
            'text': '大'
          },
          {
            'id': 4,
            'text': '非常大'
          },
          {
            'id': 5,
            'text': '極大'
          }
        ]
      }
    }
    const reg = new RegExp(`^${mod.text.replace('#', `(${mod.option.options.map(ele => ele.text).join('|')})`)}$`)
    parseExplicitMod(itemParsed, section)
    for (const line of section) {
      const match = line.match(reg)
      if (match) {
        const matchOption = mod.option?.options.find(ele => ele.text === match[1])
        itemParsed.stats.push({
          id: mod.id,
          text: match[0],
          value: {
            option: matchOption?.id
          },
          type: '隨機',
          disabled: false
        })
        return ParseResult.PARSE_SECTION_SUCC
      }
    }
    return ParseResult.PARSE_SECTION_SKIP
  }
  const parseFuns = [parseItemLevel, parseCorrupt, parseIdentify, parseImplicitMod, parseRangeMod]
  parseAllfuns(itemParsed, item, parseFuns)
}
function parseOtherHaveMods(itemParsed: ParsedItem, item: string[][]) {
  if (itemParsed.name === '贗品．龍牙翱翔') {
    outer: for (const section of item) {
      for (let index = 0; index < section.length; index++) {
        const match = section[index]!.match(/全部 ([^\s]+) 寶石等級 \+3/)
        if (match) {
          section[index] = `全部 # 寶石等級 +${match[1]}`
        }
      }
    }
  }
  parseAllfuns(itemParsed, item, parseFuns)
  if (itemParsed.name === '贗品．龍牙翱翔') {
    itemParsed.stats.forEach(ele => {
      if (typeof ele.text === 'string' && ele.text.startsWith('全部 # 寶石等級')) {
        ele.disabled = false
      }
    })
  }
  if (itemParsed.type.option === 'memoryline') {
    itemParsed.stats.forEach(ele => ele.disabled = false)
    itemParsed.itemLevel && (itemParsed.itemLevel.search = false)
    itemParsed.autoSearch = true
  }
}
function parseMap(itemParsed: ParsedItem, item: string[][]) {
  itemParsed.autoSearch = true
  const elderMap = {
    id: 'implicit.stat_3624393862',
    text: '地圖被 # 佔據',
    type: 'implicit',
    options: [
      { value: 1, text: '異界．奴役', exchange: 'enslaver-map' },
      { value: 2, text: '異界．根除', exchange: 'eradicator-map' },
      { value: 3, text: '異界．干擾', exchange: 'constrictor-map' },
      { value: 4, text: '異界．淨化', exchange: 'purifier-map' }
    ]
  } as const
  const conquerorMap = {
    id: 'implicit.stat_2563183002',
    text: '地圖含有 # 的壁壘',
    type: 'implicit',
    options: [
      { value: 1, text: '巴倫', exchange: 'barans-map' },
      { value: 2, text: '維羅提尼亞', exchange: 'veritanias-map' },
      { value: 3, text: '奧赫茲明', exchange: 'al-hezmins-map' },
      { value: 4, text: '圖拉克斯', exchange: 'droxs-map' }
    ]
  } as const
  const mapTier = itemParsed.baseType.match(/（階級 (\d{1,2})）/)
  if (mapTier) {
    itemParsed.mapTier = {
      min: parseInt(mapTier[1]!), max: undefined, search: true
    }
  }
  if (mapTier && itemParsed.raritySearch.value !== 'unique') {
    itemParsed.type.searchByType = true
  }
  item[0]!.forEach(line => {
    const completionMatch = line.match(/獎勵: 貼模 \((.+)\)/)
    if (completionMatch) {
      itemParsed.map_completion_reward = completionMatch[1]
    }
  })
  item.shift()
  match(itemParsed.baseType)
    .with(P.string.startsWith('凋落的'), () => {
      itemParsed.baseType = itemParsed.baseType.substring(4)
      itemParsed.blightedMap = true
      itemParsed.type.searchByType = true
    })
    .with(P.string.startsWith('凋落蔓延的'), () => {
      itemParsed.baseType = itemParsed.baseType.substring(6)
      itemParsed.UberBlightedMap = true
      itemParsed.type.searchByType = true
    })
  for (const section of item) {
    for (const line of section) {
      if (!itemParsed.elderMap) {
        const elderMatch = elderMap.options.filter(ele => line.includes(`地圖被${ele.text}佔據`))[0]
        if (elderMatch) {
          const elderStat = {
            id: 'implicit.stat_3624393862',
            text: elderMatch.text,
            value: {
              option: elderMatch.value
            },
            disabled: false
          }
          // itemParsed.searchExchange.want = [elderMatch.exchange]
          // itemParsed.searchExchange.option = true
          itemParsed.elderMap = elderStat
          itemParsed.stats.push(elderStat)
          if (itemParsed.mapTier?.search) itemParsed.mapTier.search = false
          // itemParsed.type.searchByType = true
        }
      }

      if (!itemParsed.conquerorMap) {
        const conquerorMatch = conquerorMap.options.filter(ele => line.includes(`地圖含有${ele.text}的壁壘`))[0]
        if (conquerorMatch) {
          const conquerorStat = {
            id: 'implicit.stat_2563183002',
            text: conquerorMatch.text,
            value: {
              option: conquerorMatch.value
            },
            disabled: false
          }
          // itemParsed.searchExchange.want = [conquerorMatch.exchange]
          // itemParsed.searchExchange.option = true
          itemParsed.conquerorMap = conquerorStat
          itemParsed.stats.push(conquerorStat)
          if (itemParsed.mapTier?.search) itemParsed.mapTier.search = false
          itemParsed.type.searchByType = true
        }
      }

      if (line.includes('區域受到開創者的記憶影響')) {
        itemParsed.autoSearch = true
        itemParsed.memoryMap = true
      }
    }
  }
  const parseFuns = [
    parseCorrupt, parseIdentify, parseEnchantMod
  ]
  if (itemParsed.map_completion_reward) {
    item = item.filter(section => !section[0]!.startsWith('怪物等級：'))
    parseFuns.push(parseExplicitMod)
  }
  parseAllfuns(itemParsed, item, parseFuns)
  itemParsed.stats.forEach(stat => {
    if (stat.type === '附魔') {
      stat.disabled = false
    }
  })
}
function parseGem(itemParsed: ParsedItem, item: string[][]) {
  itemParsed.autoSearch = true

  item[0]!.forEach(line => {
    let lineMatch: RegExpMatchArray | null
    if ((lineMatch = line.match(/等級: (\d+)/))) {
      itemParsed.gemLevel = {
        min: parseInt(lineMatch[1]!), max: undefined, search: true
      }
    }
    else if ((lineMatch = line.match(/品質: \+(\d+)%/))) {
      itemParsed.quality = {
        min: parseInt(lineMatch[1]!), max: undefined, search: false
      }
    }
  })
  itemParsed.quality.search = !(/啟蒙|賦予|增幅/.test(itemParsed.baseType))
  item.shift()
  // let vaalLine: string
  // endFor:
  for (const section of item.reverse()) {
    if (section[0]?.includes('瓦爾．')) {
      itemParsed.vaalVer = true
      itemParsed.vaalBaseType = section[0]
      continue;
    }
    if (parseCorrupt(itemParsed, section) === ParseResult.PARSE_SECTION_SUCC) {

    }
    if (parseMod(itemParsed, section, 'imbued') === ParseResult.PARSE_SECTION_SUCC) {
      const mod = itemParsed.stats.find(stat => stat.type === 'imbued');
      if (mod) {
        mod.disabled = false;
        mod.type = "充能"
      }
    }
  }
  itemParsed.quality.search = !!(itemParsed.isCorrupt && itemParsed.quality.search)
}
function parseTemple(itemParsed: ParsedItem, item: string[][]) {
  item.shift()
  item[0] = item[0]!.map(line => line.replace(/ \(階級 [123]\)/, ''))
  parseMod(itemParsed, item[0], 'temple')
  itemParsed.stats = itemParsed.stats
    .filter(ele => ['多里亞尼之院', '腐敗之地', '祭祀之巔'].includes(ele.text as string))
    .map(ele => ({ ...ele, disabled: ele.text === '祭祀之巔' ? true : false }))
  itemParsed.autoSearch = true
}
function parseFlask(itemParsed: ParsedItem, item: string[][]) {
  item[0]?.forEach(line => {
    const lineMatch = line.match(/品質: \+(\d+)%/)
    if (lineMatch) {
      itemParsed.quality = {
        min: parseInt(lineMatch[1]!), max: undefined, search: true
      }
    }
  })
  item.shift()
  parseAllfuns(itemParsed, item, parseFuns)
}

function parseLogbook(itemParsed: ParsedItem, item: string[][]) {
  item.shift()
  parseItemLevel(itemParsed, item[0]!)
  item.shift()
  itemParsed.itemLevel!.min = itemParsed.itemLevel!.min! > 83 ? 83 : itemParsed.itemLevel!.min
  const logbookTypes = {
    '破碎環之德魯伊': 'pseudo.pseudo_logbook_faction_druids',
    '黑鐮傭兵': 'pseudo.pseudo_logbook_faction_mercenaries',
    '聖杯之序': 'pseudo.pseudo_logbook_faction_order',
    '豔陽騎士': 'pseudo.pseudo_logbook_faction_knights',
  } as const
  for (const section of item) {
    if (section.length >= 2) {
      if (Object.keys(logbookTypes).includes(section[1]!)) {
        if (!itemParsed.stats.find(e => section[1] === e.text)) {
          itemParsed.stats.push({
            id: logbookTypes[section[1] as keyof typeof logbookTypes], text: section[1]!, disabled: true
          })
        }
        item = item.filter(s => s !== section)
      }
    }
  }
}

function parseRGB(itemParsed: ParsedItem, item: string[]) {
  for (const line of item) {
    if (line.startsWith('貼模傳奇')) {
      itemParsed.isRGB = true
      return ParseResult.PARSE_SECTION_SUCC
    }
  }
  return ParseResult.PARSE_SECTION_SKIP
}

function parseRelic(itemParsed: ParsedItem, item: string[][]) {
  for (const line of item) {
    if (parseIdentify(itemParsed, line) === ParseResult.PARSE_SECTION_SUCC) return
    parseItemLevel(itemParsed, line)
  }
  item.shift()
  parseMod(itemParsed, item[0]!, 'sanctum')
}


function parseBeastItem(itemParsed: ParsedItem, _item: string[][]) {
  let isBeastItem = false
  APIitems['monster']?.entries.forEach(monster => {
    if (monster.type === itemParsed.baseType) {
      isBeastItem = true
    }
  })
  if (isBeastItem) {
    itemParsed.autoSearch = true
    itemParsed.searchExchange.option = false
    return true
  }
  return false
}

function parseGraft(itemParsed: ParsedItem, itemSection: string[][]) {
  parseAllfuns(itemParsed, itemSection)
}

function parseTimelessJewel(itemParsed: ParsedItem, _item: string[][]) {

  itemParsed.autoSearch = true
  let statsList: { id: string, text: string, type: string }[] = []
  if (itemParsed.name === '致命的驕傲') {
    statsList = [
      {
        "id": "explicit.pseudo_timeless_jewel_rakiata",
        "text": "拉其塔指揮領導超過 # 戰士",
        "type": "隨機"
      },
      {
        "id": "explicit.pseudo_timeless_jewel_kaom",
        "text": "岡姆指揮領導超過 # 戰士",
        "type": "隨機"
      }, {
        "id": "explicit.pseudo_timeless_jewel_akoya",
        "text": "阿寇亞指揮領導超過 # 戰士",
        "type": "隨機"
      }, {
        "id": "explicit.pseudo_timeless_jewel_kiloava",
        "text": "基洛瓦指揮領導超過 # 戰士",
        "type": "隨機"
      },
    ]
  }
  else if (itemParsed.name === '輝煌的虛榮') {
    statsList = [
      {
        "id": "explicit.pseudo_timeless_jewel_xibaqua",
        "text": "浸泡在以賽巴昆之名獻祭的 # 條生命中",
        "type": "隨機"
      }, {
        "id": "explicit.pseudo_timeless_jewel_doryani",
        "text": "浸泡在以多里亞尼之名獻祭的 # 條生命中",
        "type": "隨機"
      }, {
        "id": "explicit.pseudo_timeless_jewel_ahuana",
        "text": "浸泡在以阿呼阿娜之名獻祭的 # 條生命中",
        "type": "隨機"
      }, {
        "id": "explicit.pseudo_timeless_jewel_zerphi",
        "text": "浸泡在以澤佛伊之名獻祭的 # 條生命中",
        "type": "隨機"
      },
    ]
  }
  else if (itemParsed.name === '殘酷的紀律') {
    statsList = [{
      "id": "explicit.pseudo_timeless_jewel_asenath",
      "text": "# 位部屬宣誓服從於安賽娜絲的血脈",
      "type": "explicit"
    }, {
      "id": "explicit.pseudo_timeless_jewel_balbala",
      "text": "# 位部屬宣誓服從於巴爾巴拉的血脈",
      "type": "explicit"
    }, {
      "id": "explicit.pseudo_timeless_jewel_nasima",
      "text": "# 位部屬宣誓服從於納西瑪的血脈",
      "type": "explicit"
    }, {
      "id": "explicit.pseudo_timeless_jewel_deshret",
      "text": "# 位部屬宣誓服從於迪虛瑞特的血脈",
      "type": "explicit"
    },
    ]
  }
  else if (itemParsed.name === '優雅的高傲') {
    statsList = [
      {
        "id": "explicit.pseudo_timeless_jewel_cadiro",
        "text": "授銜 # 個硬幣以紀念卡迪羅",
        "type": "explicit"
      }, {
        "id": "explicit.pseudo_timeless_jewel_caspiro",
        "text": "授銜 # 個硬幣以紀念卡斯皮羅",
        "type": "explicit"
      }, {
        "id": "explicit.pseudo_timeless_jewel_victario",
        "text": "授銜 # 個硬幣以紀念維多里奧",
        "type": "explicit"
      }, {
        "id": "explicit.pseudo_timeless_jewel_chitus",
        "text": "授銜 # 個硬幣以紀念切特斯",
        "type": "explicit"
      },
    ]
  }
  else if (itemParsed.name === '激進的信仰') {
    statsList = [
      {
        "id": "explicit.pseudo_timeless_jewel_dominus",
        "text": "為了讚美 # 名受到神主轉化的人們所雕刻",
        "type": "explicit"
      }, {
        "id": "explicit.pseudo_timeless_jewel_avarius",
        "text": "為了讚美 # 名受到聖宗伊爾莉斯轉化的人們所雕刻",
        "type": "explicit"
      }, {
        "id": "explicit.pseudo_timeless_jewel_maxarius",
        "text": "為了禮讚 # 名受到聖宗瑪薩里歐斯感化的信眾所雕刻",
        "type": "explicit"
      }, {
        "id": "explicit.pseudo_timeless_jewel_venarius",
        "text": "為了讚美 # 名受到聖宗維那利斯轉化的人們所雕刻",
        "type": "explicit"
      },
    ]
  }

  const statsListId = statsList.map(ele => ele.id)
  const statAlreadyIn = itemParsed.stats.find(ele => statsListId.includes(ele.id))
  if (!statAlreadyIn) return
  statAlreadyIn.disabled = false;
  if (statAlreadyIn.value)
    statAlreadyIn.value.max = statAlreadyIn.value.min
  itemParsed.stats.splice(1, 0, ...statsList.filter(ele => ele.id !== statAlreadyIn?.id).map((ele) => ({
    ...ele,
    disabled: true,
    value: statAlreadyIn.value ?
      { min: statAlreadyIn.value.min, max: statAlreadyIn.value.min } :
      undefined
  })))

}
function parseJewel(itemParsed: ParsedItem, item: string[][]) {
  if (itemParsed.baseType.endsWith('星團珠寶')) {
    parseClusterJewel(itemParsed, item)
    return
  }
  if (/^禁忌(血肉|烈焰)$/.test(itemParsed.name!)) {
    parseForbiddenJewel(itemParsed, item)
    return
  }
  if (itemParsed.name === '逃脫不能') {
    parseImpossibleEscape(itemParsed, item)
    return
  }
  if (itemParsed.name === '希望之絃') {
    parseThreadOfHope(itemParsed, item)
    return
  }
  parseAllfuns(itemParsed, item, parseFuns)
  if (itemParsed.baseType === '永恆珠寶' && itemParsed.rarity === '傳奇') {
    parseTimelessJewel(itemParsed, item)
  }
}

