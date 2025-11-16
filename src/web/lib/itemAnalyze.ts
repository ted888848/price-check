import IPC from '@/ipc'
import { APIitems, APImods, APIStatic } from './APIdata'
import { secondCurrency } from '.'
enum ParseResult {
  PARSE_SECTION_FAIL,
  PARSE_SECTION_SUCC,
  PARSE_SECTION_SKIP,
  PARSE_ITEM_SKIP
}
const parseFuns: (((section: string[]) => ParseResult) | undefined)[] = [
  parseRGB,
  parseRequirement,
  parseSocket,
  parseItemLevel,
  parseInfluence,
  parseCorrupt,
  parseEnchantMod,
  parseImplicitMod,
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
let itemParsed: ParsedItem
function findUnique(type: Exclude<keyof ParsedAPIitems, 'gem'>, isFonded: { flag: boolean }): void {
  if (isFonded.flag) return
  let temp: ItemUniques[] = []
  for (const ele of APIitems[type].entries) {
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
  itemParsed = getDefaultItemParsed(config)
  const itemArr = item.split(/\r?\n/)
  itemArr.pop()
  const itemSection: string[][] = [[]]
  itemArr.reduce((section, line) => {
    if (line !== '--------') {
      section.push(line)
      return section
    }
    else {
      section = []
      itemSection.push(section)
      return section
    }
  }, itemSection[0])
  if (parseItemName(itemSection[0], itemSection) === ParseResult.PARSE_SECTION_FAIL) return null
  itemParsed.searchOnlineType = config.searchOnlineType ?? itemParsed.searchOnlineType
  itemSection.shift()
  const isFindUnique = {
    flag: false
  }
  let skip = false
  switch (itemParsed.type.text) {
    case '爪':
    case '匕首':
    case '法杖':
    case '單手劍':
    case '細劍':
    case '單手斧':
    case '單手錘':
    case '權杖':
    case '符紋匕首':
    case '弓':
    case '長杖':
    case '雙手劍':
    case '雙手斧':
    case '雙手錘':
    case '魚竿':
    case '征戰長杖':
      findUnique('weapon', isFindUnique)
      parseWeapon(itemSection)
      break
    case '手套':
    case '鞋子':
    case '胸甲':
    case '頭部':
    case '盾':
    case '法器':
      findUnique('armour', isFindUnique)
      parseArmor(itemSection)
      break
    case '生命藥劑':
    case '魔力藥劑':
    case '複合藥劑':
    case '功能藥劑':
      findUnique('flask', isFindUnique)
      parseFlask(itemSection)
      break
    case '項鍊':
    case '戒指':
    case '腰帶':
      findUnique('accessory', isFindUnique)
    case '永恆珠寶':
    case '珠寶':
    case '深淵珠寶':
      parseJewel(itemSection)
      findUnique('jewel', isFindUnique)
      break
    case '箭袋':
    case '飾品':
    case '劫盜裝備':
    case '守望號令':
    case '記憶':
      parseOtherNeedMods(itemSection)
      break
    case '異界地圖':
      findUnique('map', isFindUnique)
      parseMap(itemSection)
      break
    case '契約書':
      findUnique('heistmission', isFindUnique)
    case '可堆疊通貨':
      skip = parseBeastItem(itemSection)
    case '預兆':
    case '地圖碎片':
    case '掘獄可堆疊有插槽通貨': {
      if (skip) break;
      itemParsed.autoSearch = true
      if (APIStatic.some((ele: Static) => ele.text === itemParsed.baseType)) {
        itemParsed.searchExchange.option = true
        // const searchExchangeDivine = config.searchExchangeDivine
        // itemParsed.searchExchange.have = ['divine', 'chaos']
      }
      break
    }
    case '技能寶石':
    case '輔助寶石':
      parseGem(itemSection)
      break
    case '探險日誌':
      parseLogbook(itemSection)
      break
    case '命運卡':
      itemParsed.searchOnlineType = 'online'
    case '遺鑰':
    case '屍體':
      itemParsed.autoSearch = true
      break
    case '聖物':
      parseRelic(itemSection)
      break
    case '咒語':
    case '其它':
    case '輿圖升級道具':
      break
    case '接肢':
      parseGraft(itemSection)
      break;
    default:
      parseAllfuns(itemSection)
      break
  }
  parsePseudoEleResistance()
  if (itemParsed.rarity === '傳奇' && itemParsed.isIdentify === false && itemParsed.uniques.length === 1) {
    itemParsed.name = itemParsed.uniques[0].name
  }
  if (itemParsed.raritySearch.label === '傳奇' && itemParsed.name) itemParsed.autoSearch = true
  if (itemParsed.baseType === '阿茲瓦特史記') parseTemple(itemSection)
  return itemParsed
}
function parseItemName(section: string[], itemSection: string[][]) {
  if (!section[0].startsWith('物品種類:')) return ParseResult.PARSE_SECTION_FAIL
  if (section[2] === '你無法使用這項裝備，它的數值將被忽略') {
    section.pop()
    section.push(...(itemSection.splice(1, 1)[0]))
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
    異界地圖: 'map',
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
  const itemType = section[0].match(/物品種類: ([^\n]+)/)![1] as keyof typeof typeTrans
  itemParsed.type = {
    text: itemType, option: typeTrans[itemType], searchByType: false
  }
  section.shift()

  // 稀有度
  itemParsed.rarity = section[0].match(/稀有度: ([^\n]+)/)?.[1] ?? ''
  if (itemType === '不滅之火餘燼') {
    itemParsed.baseType = section[0]
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
  const itemNameLine = section.at(-1)?.replace(/(精良的|追憶之)\s/, '') ?? ''
  const apiBaseTypes = (APIitems[itemTypeApi]?.entries ?? Object.values(APIitems).flatMap(item => item.entries))
    .filter((entry) => {
      let sectionLine = itemNameLine
      if (!sectionLine) return false
      if (sectionLine.startsWith('精良的')) sectionLine = sectionLine.substring(4)
      if (sectionLine.startsWith('追憶之')) sectionLine = sectionLine.substring(4)

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
    const matchLength = entry.length - itemNameLine!.replace(entry, '').length
    if (matchLength > maxMatchLength) {
      maxMatchLength = matchLength
      apiBaseType = entry
    }
  })

  if (itemType === '技能寶石') {
    itemParsed.baseType = section[0]
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

  if (itemParsed.name?.startsWith('穢生 ')) {
    itemParsed.name = itemParsed.name.replace('穢生 ', '')
    itemParsed.foulborn = true
  }

  return ParseResult.PARSE_SECTION_SUCC
}
function parseRequirement(section: string[]) {
  if (!section[0].startsWith('需求:')) return ParseResult.PARSE_SECTION_SKIP
  section.forEach(line => {
    let lineMatch: RegExpMatchArray | null
    if ((lineMatch = line.match(/^等級: (\d+)/))) {
      itemParsed.requireLevel = parseInt(lineMatch[1])
    }
    else if ((lineMatch = line.match(/^智慧: (\d+)/))) {
      itemParsed.requireInt = parseInt(lineMatch[1])
    }
    else if ((lineMatch = line.match(/^力量: (\d+)/))) {
      itemParsed.requireStr = parseInt(lineMatch[1])
    }
    else if ((lineMatch = line.match(/^敏捷: (\d+)/))) {
      itemParsed.requireDex = parseInt(lineMatch[1])
    }
  })
  return ParseResult.PARSE_SECTION_SUCC
}
function parseSocket(section: string[]) {
  if (!section[0].startsWith('插槽')) return ParseResult.PARSE_SECTION_SKIP
  const sockets = section[0].replace(/R|G|B|W/g, '#')
  if (sockets.indexOf('#-#-#-#-#-#') > -1) {
    itemParsed.search6L = true
  }
  else if (['弓', '長杖', '雙手劍', '雙手斧', '雙手錘', '征戰長杖', '胸甲'].includes(itemParsed.type.text)) {
    itemParsed.search6L = false
  }
  return ParseResult.PARSE_SECTION_SUCC
}
function parseItemLevel(section: string[]) {
  const sectionMatch = section[0].match(/^物品等級: (\d+)/)
  if (!sectionMatch) return ParseResult.PARSE_SECTION_SKIP
  const il = parseInt(sectionMatch[1])
  const maxModLevel = window.ipc.sendSync(IPC.GET_CONFIG).poeVersion === '1' ? 86 : 82
  itemParsed.itemLevel = {
    min: il > maxModLevel ? maxModLevel : il, max: undefined, search: itemParsed.rarity !== '傳奇'
  }
  return ParseResult.PARSE_SECTION_SUCC
}
function getStrReg(section: string[], type: string) {
  const retArr: RegExp[] = []
  section.forEach(line => {
    const indexOfType = line.indexOf(` (${type})`)
    line = indexOfType > -1 ? line.substring(0, indexOfType) : line
    line = line.replace(/[+-]?\d+(?:\.\d+)?/g, '__NUMBER__')
    line = line.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    retArr.push(new RegExp(`^${line.replace(/__NUMBER__/g, '[+-]?(\\d+|#)')
      .replace(/減少|增加/, "(?:減少|增加)")}( \\(部分\\))?$`))
  })
  return retArr
}
function parseMultilineMod(regSection: RegExp[], section: string[], type: keyof ParsedAPIMods | 'mutated') {
  const isMutated = type === 'mutated'
  type = isMutated ? 'explicit' : type as keyof ParsedAPIMods
  if (!APImods[type].mutiLines) return []
  const tempArr: ItemStat[] = []
  for (let i = 0; i < regSection.length; ++i) {
    try {
      const matchModList = APImods[type].mutiLines?.filter(s => regSection[i].test(s.text[0]))
      if (!matchModList) continue
      outer:
      for (const matchMod of matchModList) {
        let flag = true
        for (const index in matchMod.text) {
          if ((i + (+index)) >= regSection.length || !regSection[i + (+index)].test(matchMod.text[+index])) {
            flag = false
            break
          }
        }
        if (!flag) continue
        const matchReg = matchMod.text.map(mod => new RegExp(mod.replace(/[+-]?#/g, String.raw`[+-]?(\d+(?:\.\d+)?)`)
          .replace(' (部分)', '').replace(/減少|增加/, String.raw`(?:減少|增加)`)))
        let tempValue = 0
        let valueCount = 0
        for (const ind in matchReg) {
          const regGroup = section[i + (+ind)].match(matchReg[ind])
          if (!regGroup) continue outer
          regGroup.shift()
          if (regGroup.length) tempValue = regGroup.reduce((pre, ele) => { valueCount++; return pre + Number(ele) }, tempValue)
        }
        section.splice(i, matchMod.text.length)
        regSection.splice(i, matchMod.text.length)
        i -= matchMod.text.length
        i = i < 0 ? -1 : i
        if (tempValue)
          tempArr.push({
            ...matchMod,
            value: {
              min: tempValue / valueCount
            },
            disabled: isMutated ? false : true,
            type: isMutated ? '穢生' : APImods[type].type
          })
        else
          tempArr.push({
            ...matchMod, disabled: isMutated ? false : true, type: isMutated ? '穢生' : APImods[type].type
          })
      }
    }
    catch (e) {
      console.error(e)
    }
  }
  return tempArr
}
function parseMod(section: string[], type: keyof ParsedAPIMods | 'mutated') {
  const isMutated = type === 'mutated'
  const regSection = getStrReg(section, type)
  type = isMutated ? 'explicit' : type as keyof ParsedAPIMods
  const tempArr = parseMultilineMod(regSection, section, type)
  regSection.forEach((line, index) => {
    try {
      let matchMods = APImods[type].entries.filter(s => line.test(s.text))
      if (matchMods.length > 1) {
        if (itemParsed.isWeaponOrArmor && matchMods.find(ele => ele.text.endsWith(' (部分)')))
          matchMods = matchMods.filter(mod => mod.text.endsWith(' (部分)'))
        else {
          matchMods = matchMods.filter(mod => !mod.text.endsWith(' (部分)'))
          const regTemp = section[index].match(/增加|減少/)?.[0]
          if (regTemp)
            matchMods = matchMods.filter(mod => mod.text.includes(regTemp))
        }
      }
      if (!matchMods.length) return false
      matchMods.forEach((matchMod) => {
        const matchReg = new RegExp(matchMod.text.replace(/[+-]?#/g, String.raw`([+-]?\d+(?:\.\d+)?)`)
          .replace(' (部分)', '').replace(/減少|增加/, String.raw`(?:減少|增加)`))
        const regGroup = section[index].match(matchReg)
        regGroup?.shift()
        if (regGroup?.length) {
          const diffSign = matchMod.text.match(/減少|增加/)?.[0] !== section[index].match(/減少|增加/)?.[0]
          //數字前增加與減少不相等，把數字變負數
          const minValue = (diffSign ? -1 : 1) * (regGroup.reduce((pre, ele) => pre + Number(ele), 0) / regGroup.length)
          tempArr.push({
            ...matchMod,
            value: {
              [diffSign ? 'max' : 'min']: minValue,
            },
            disabled: isMutated ? false : true,
            type: isMutated ? '穢生' : APImods[type].type
          })
        }
        else {
          tempArr.push({
            ...matchMod, disabled: isMutated ? false : true, type: isMutated ? '穢生' : APImods[type].type
          })
        }
      })
    }
    catch (e) {
      console.error(e)
    }
  })
  if (tempArr.length) {
    itemParsed.stats.push(...tempArr)
    return ParseResult.PARSE_SECTION_SUCC
  }
  return ParseResult.PARSE_SECTION_SKIP
}
function parseEnchantMod(section: string[]) {
  if (!section.find(line => line.endsWith('(enchant)'))) return ParseResult.PARSE_SECTION_SKIP
  if (parseMod(section, 'enchant') === ParseResult.PARSE_SECTION_SUCC) return ParseResult.PARSE_SECTION_SUCC
  return ParseResult.PARSE_SECTION_FAIL
}
function parseImplicitMod(section: string[]) {
  if (!section.find(line => line.endsWith('(implicit)'))) return ParseResult.PARSE_SECTION_SKIP
  if (parseMod(section, 'implicit') === ParseResult.PARSE_SECTION_SUCC) return ParseResult.PARSE_SECTION_SUCC
  return ParseResult.PARSE_SECTION_FAIL
}
function parseExplicitMod(section: string[]) {
  if (!['魔法', '稀有', '傳奇'].includes(itemParsed.rarity)) return ParseResult.PARSE_SECTION_SKIP
  const explicitSection: string[] = [],
    fracturedSection: string[] = [],
    craftedSection: string[] = [],
    mutatedSection: string[] = []
  let parsed = false
  section.forEach(line => {
    const type = line.match(/fractured|crafted|mutated/)
    switch (type?.[0]) {
      case 'crafted':
        craftedSection.push(line)
        break
      case 'fractured':
        fracturedSection.push(line)
        break
      case 'mutated':
        mutatedSection.push(line)
        break
      default:
        line !== '隱匿前綴' && line !== '隱匿後綴' && explicitSection.push(line)
        break
    }
  })
  if (craftedSection.length) parsed = parseMod(craftedSection, 'crafted') === ParseResult.PARSE_SECTION_SUCC || parsed
  if (fracturedSection.length) parsed = parseMod(fracturedSection, 'fractured') === ParseResult.PARSE_SECTION_SUCC || parsed
  if (explicitSection.length) parsed = parseMod(explicitSection, 'explicit') === ParseResult.PARSE_SECTION_SUCC || parsed
  if (mutatedSection.length) parsed = parseMod(mutatedSection, 'mutated') === ParseResult.PARSE_SECTION_SUCC || parsed

  if (parsed) return ParseResult.PARSE_SECTION_SUCC
  return ParseResult.PARSE_SECTION_SKIP
}
function parseInfluence(section: string[]) {
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
function parseCorrupt(section: string[]) {
  if (section[0].match(/^已汙染$/)) {
    itemParsed.isCorrupt = true
    return ParseResult.PARSE_SECTION_SUCC
  }
  return ParseResult.PARSE_SECTION_SKIP
}
function parseIdentify(section: string[]) {
  if (section[0].match(/^未鑑定$/)) {
    itemParsed.isIdentify = false
    return ParseResult.PARSE_ITEM_SKIP
  }
  return ParseResult.PARSE_SECTION_SKIP
}
function parsePseudoEleResistance() {
  let eleRes = 0
  let flag = false
  itemParsed.stats.forEach(mod => {
    switch (true) {
      case mod.id.endsWith('stat_3372524247') || mod.id.endsWith('stat_1671376347') || mod.id.endsWith('stat_4220027924'):
        eleRes += mod.value!.min! ?? mod.value!.max ?? 0
        flag = true
        break
      case mod.id.endsWith('stat_3441501978') || mod.id.endsWith('stat_4277795662') || mod.id.endsWith('stat_2915988346'):
        eleRes += ((mod.value!.min! ?? mod.value!.max ?? 0) * 2)
        flag = true
        break
      case mod.id.endsWith('stat_2901986750'):
        eleRes += ((mod.value!.min! ?? mod.value!.max ?? 0) * 3)
        flag = true
        break
    }
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
function parseAllfuns(item: string[][], functions: typeof parseFuns = parseFuns) {
  endFor:
  for (const fun of functions) {
    for (const section of item) {
      if (!fun) continue
      const state = fun(section)
      if (state === ParseResult.PARSE_SECTION_SUCC) {
        item = item.filter(s => s !== section)
        break
      }
      else if (state === ParseResult.PARSE_ITEM_SKIP) {
        break endFor
      }
    }
  }
}
function parseWeapon(item: string[][]) {
  itemParsed.isWeaponOrArmor = true
  item[0].forEach(line => {
    let lineMatch: RegExpMatchArray | null
    if ((lineMatch = line.match(/品質: \+(\d+)%/))) {
      itemParsed.quality = {
        min: parseInt(lineMatch[1]), max: undefined, search: false
      }
    }
    else if ((lineMatch = line.match(/物理傷害: (\d+)(?:-|\s到\s)(\d+)/))) {
      itemParsed.phyDamage = {
        min: parseInt(lineMatch[1]),
        max: parseInt(lineMatch[2])
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
      itemParsed.critChance = parseFloat(lineMatch[1])
    }
    else if ((lineMatch = line.match(/每秒攻擊次數: (\d+\.?\d\d)/))) {
      itemParsed.attackSpeed = parseFloat(lineMatch[1])
    }
    else if ((lineMatch = line.match(/武器範圍: (\d+)/))) {
      itemParsed.weaponArea = parseInt(lineMatch[1])
    }
  })
  item.shift()
  if (itemParsed.phyDamage && itemParsed.attackSpeed) itemParsed.pDPS = parseFloat((((itemParsed.phyDamage.min + itemParsed.phyDamage.max) / 2) * itemParsed.attackSpeed).toFixed(2))
  if (itemParsed.eleDamage && itemParsed.attackSpeed) itemParsed.eDPS = parseFloat((((itemParsed.eleDamage.min + itemParsed.eleDamage.max) / 2) * itemParsed.attackSpeed).toFixed(2))
  parseAllfuns(item, parseFuns)
}
function parseArmor(item: string[][]) {
  itemParsed.isWeaponOrArmor = true
  item[0].forEach(line => {
    let lineMatch: RegExpMatchArray | null
    if ((lineMatch = line.match(/品質: \+(\d+)%/))) {
      itemParsed.quality.min = parseInt(lineMatch[1])
    }
    else if ((lineMatch = line.match(/閃避值: (\d+)/))) {
      itemParsed.evasion = parseInt(lineMatch[1])
    }
    else if ((lineMatch = line.match(/護甲: (\d+)/))) {
      itemParsed.armour = parseInt(lineMatch[1])
    }
    else if ((lineMatch = line.match(/能量護盾: (\d+)/))) {
      itemParsed.energyShield = parseInt(lineMatch[1])
    }
  })
  item.shift()
  parseAllfuns(item, parseFuns)
}
function parseClusterJewel(item: string[][]) {
  if (parseRequirement(item[0]) === ParseResult.PARSE_SECTION_SUCC) item.shift()
  const tempIlvl = parseInt(item[0][0].match(/物品等級: (\d+)/)![1])
  itemParsed.itemLevel = {
    min: tempIlvl >= 84 ? 84 : tempIlvl >= 75 ? 75 : tempIlvl >= 68 ? 68 : tempIlvl >= 50 ? 50 : 1,
    max: tempIlvl >= 84 ? 100 : tempIlvl >= 75 ? 83 : tempIlvl >= 68 ? 74 : tempIlvl >= 50 ? 67 : 49,
    search: true
  }
  item.shift()
  if (itemParsed.rarity !== '傳奇') {
    parseEnchantMod(item[0].slice(0, 2))
    switch (itemParsed.baseType) {
      case '巨型星團珠寶':
      case '小型星團珠寶':
        itemParsed.stats[0].value!.max = itemParsed.stats[0].value!.min
        break
      case '中型星團珠寶':
        itemParsed.stats[0].value!.min = itemParsed.stats[0].value!.min === 6 ? 6 : 4
        itemParsed.stats[0].value!.max = itemParsed.stats[0].value!.min === 6 ? 6 : 5
        break
    }
    let clusterType: string = item[0].find(ele => ele.startsWith('附加的小型天賦給予：'))!
    clusterType = clusterType.substring(10, clusterType.indexOf(' (enchant)'))
    let tempMod = APImods.clusterJewel.entries.find(mod => mod.text.includes(clusterType))
    if (tempMod!.text.endsWith('(古典)') && itemParsed.baseType === '小型星團珠寶') {
      const tempText = tempMod!.text.substring(0, tempMod!.text.length - 5)
      tempMod = APImods.clusterJewel.entries.reverse().find(mod => mod.text.includes(tempText))
    }
    itemParsed.stats.push({
      id: 'enchant.stat_3948993189',
      text: tempMod!.text.split('\n'),
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
  parseAllfuns(item, _parseFuns)
  itemParsed.autoSearch = true
}
function parseForbiddenJewel(item: string[][]) {
  itemParsed.autoSearch = true
  for (const section of item) {
    if (parseCorrupt(section) === ParseResult.PARSE_SECTION_SUCC) continue
    const sectionMatch = section[0].match(/若禁忌(烈焰|血肉)上有符合的詞綴，配置 (.*)/)
    if (sectionMatch) {
      const type = sectionMatch[1]
      const passive = sectionMatch[2]
      const matchStat = APImods.forbiddenJewel.entries.find(e => e.text.indexOf(type) > -1)
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
function parseImpossibleEscape(item: string[][]) {
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
          text: statDetail.text[0].replace('#', result[1]),
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
function parseThreadOfHope(item: string[][]) {
  function parseRangeMod(section: string[]) {
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
    if (parseExplicitMod(section) === ParseResult.PARSE_SECTION_SKIP) return ParseResult.PARSE_SECTION_SKIP
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
  parseAllfuns(item, parseFuns)
}
function parseOtherNeedMods(item: string[][]) {
  if (itemParsed.name === '贗品．龍牙翱翔') {
    outer: for (const section of item) {
      for (let index = 0; index < section.length; index++) {
        const match = section[index].match(/全部 ([^\s]+) 寶石等級 \+3/)
        if (match) {
          section[index] = `全部 # 寶石等級 +${match[1]}`
        }
      }
    }
  }
  parseAllfuns(item, parseFuns)
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
function parseMap(item: string[][]) {
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

  item[0].forEach(line => {
    const lineMatch = line.match(/地圖階級: (\d+)/)
    if (lineMatch) {
      itemParsed.mapTier = {
        min: parseInt(lineMatch[1]), max: undefined, search: true
      }
    }
    const completionMatch = line.match(/獎勵: 貼模 \((.+)\)/)
    if (completionMatch) {
      itemParsed.map_completion_reward = completionMatch[1]
    }
  })
  item.shift()
  switch (true) {
    case itemParsed.baseType.startsWith('凋落的'):
      itemParsed.baseType = itemParsed.baseType.substring(4)
      itemParsed.blightedMap = true
      itemParsed.type.searchByType = true
      break
    case itemParsed.baseType.startsWith('凋落蔓延的'):
      itemParsed.baseType = itemParsed.baseType.substring(6)
      itemParsed.UberBlightedMap = true
      itemParsed.type.searchByType = true
      break
    default:
      break
  }
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
    parseCorrupt, parseIdentify,
  ]
  if (itemParsed.map_completion_reward) {
    item = item.filter(section => !section[0].startsWith('怪物等級：'))
    parseFuns.push(parseExplicitMod)
  }
  parseAllfuns(item, parseFuns)
}
function parseGem(item: string[][]) {
  itemParsed.autoSearch = true

  item[0].forEach(line => {
    let lineMatch: RegExpMatchArray | null
    if ((lineMatch = line.match(/等級: (\d+)/))) {
      itemParsed.gemLevel = {
        min: parseInt(lineMatch[1]), max: undefined, search: true
      }
    }
    else if ((lineMatch = line.match(/品質: \+(\d+)%/))) {
      itemParsed.quality = {
        min: parseInt(lineMatch[1]), max: undefined, search: false
      }
    }
  })
  itemParsed.quality.search = !(/啟蒙|賦予|增幅/.test(itemParsed.baseType))
  item.shift()
  // let vaalLine: string
  // endFor:
  for (const section of item.reverse()) {
    if (section[0].includes('瓦爾．')) {
      itemParsed.vaalVer = true
      itemParsed.vaalBaseType = section[0]
      continue;
    }
    if (parseCorrupt(section) === ParseResult.PARSE_SECTION_SUCC) {

    }
  }
  itemParsed.quality.search = !!(itemParsed.isCorrupt && itemParsed.quality.search)
}
function parseTemple(item: string[][]) {
  item.shift()
  item[0] = item[0].map(line => line.replace(/ \(階級 [123]\)/, ''))
  parseMod(item[0], 'temple')
  itemParsed.stats = itemParsed.stats
    .filter(ele => ['多里亞尼之院', '腐敗之地', '祭祀之巔'].includes(ele.text as string))
    .map(ele => ({ ...ele, disabled: ele.text === '祭祀之巔' ? true : false }))
  itemParsed.autoSearch = true
}
function parseFlask(item: string[][]) {
  item[0].forEach(line => {
    const lineMatch = line.match(/品質: \+(\d+)%/)
    if (lineMatch) {
      itemParsed.quality = {
        min: parseInt(lineMatch[1]), max: undefined, search: true
      }
    }
  })
  item.shift()
  parseAllfuns(item, parseFuns)
}

function parseLogbook(item: string[][]) {
  item.shift()
  parseItemLevel(item[0])
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
      if (Object.keys(logbookTypes).includes(section[1])) {
        if (!itemParsed.stats.find(e => section[1] === e.text)) {
          itemParsed.stats.push({
            id: logbookTypes[section[1] as keyof typeof logbookTypes], text: section[1], disabled: true
          })
        }
        item = item.filter(s => s !== section)
      }
    }
  }
}

function parseRGB(item: string[]) {
  for (const line of item) {
    if (line.startsWith('貼模傳奇')) {
      itemParsed.isRGB = true
      return ParseResult.PARSE_SECTION_SUCC
    }
  }
  return ParseResult.PARSE_SECTION_SKIP
}

function parseRelic(item: string[][]) {
  for (const line of item) {
    if (parseIdentify(line) === ParseResult.PARSE_ITEM_SKIP) return
    parseItemLevel(line)
  }
  item.shift()
  parseMod(item[0], 'sanctum')
}


function parseBeastItem(item: string[][]) {
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

function parseGraft(itemSection: string[][]) {
  parseAllfuns(itemSection)
}

function parseTimelessJewel(item: string[][]) {

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
function parseJewel(item: string[][]) {
  if (itemParsed.baseType.endsWith('星團珠寶')) {
    parseClusterJewel(item)
    return
  }
  if (/^禁忌(血肉|烈焰)$/.test(itemParsed.name!)) {
    parseForbiddenJewel(item)
    return
  }
  if (itemParsed.name === '逃脫不能') {
    parseImpossibleEscape(item)
    return
  }
  if (itemParsed.name === '希望之絃') {
    parseThreadOfHope(item)
    return
  }
  parseAllfuns(item, parseFuns)
  if (itemParsed.baseType === '永恆珠寶' && itemParsed.rarity === '傳奇') {
    parseTimelessJewel(item)
  }
}

