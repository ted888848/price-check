import IPC from '@/ipc'
import { APIitems, APImods, APIStatic } from './APIdata'
import { poeVersion, secondCurrency } from '.'
import { getModMatchRegex, getStrReg } from './regex'
import { match, P } from 'ts-pattern'
import { defaultItemParsed, rarityOptions, typeTrans } from './const'
enum ParseResult {
  PARSE_SECTION_FAIL,
  PARSE_SECTION_SUCC,
  PARSE_SECTION_SKIP,
  PARSE_ITEM_SKIP
}
type ParseFun = (section: string[]) => ParseResult

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
class ItemAnalyzer {
  private config: Config
  private itemParsed: ParsedItem
  private itemSection: string[][] = []
  private readonly parseFuns: ParseFun[]

  constructor() {
    this.config = window.ipc.sendSync(IPC.GET_CONFIG)
    this.itemParsed = getDefaultItemParsed(this.config)
    this.parseFuns = [
      this.parseRGB.bind(this),
      this.parseRequirement.bind(this),
      this.parseSocket.bind(this),
      this.parseItemLevel.bind(this),
      this.parseInfluence.bind(this),
      this.parseCorrupt.bind(this),
      this.parseEnchantMod.bind(this),
      this.parseImplicitMod.bind(this),
      poeVersion === '2' ? this.parseRuneMod.bind(this) : () => ParseResult.PARSE_SECTION_SKIP,
      this.parseIdentify.bind(this),
      this.parseExplicitMod.bind(this),
    ]
  }

  private getItemSections(item: string) {
    const itemArr = item.split(/\r?\n/)
    itemArr.pop()
    const result: string[][] = [[]]
    itemArr.reduce((section, line) => {
      if (line !== '--------') {
        section?.push(line)
        return section
      }
      else {
        section = []
        result.push(section)
        return section
      }
    }, result[0])
    return result
  }

  analyze(item: string) {
    this.itemSection = this.getItemSections(item)

    if (this.parseFirstSection(this.itemSection[0]!) === ParseResult.PARSE_SECTION_FAIL) return null
    this.itemParsed.searchOnlineType = this.config.searchOnlineType ?? this.itemParsed.searchOnlineType
    this.itemSection.shift()
    match(this.itemParsed.type)
      .with({ option: P.string.startsWith('weapon') }, () => {
        this.findUnique('weapon')
        this.parseWeapon(this.itemSection)
      })
      .with({ option: P.string.startsWith('armour') }, () => {
        this.findUnique('armour')
        this.parseArmor(this.itemSection)
      })
      .with({ option: P.string.startsWith('flask') }, () => {
        this.findUnique('flask')
        this.parseFlask(this.itemSection)
      })
      .with({ option: P.string.startsWith('accessory') }, () => {
        this.findUnique('accessory')
        this.parseOtherHaveMods(this.itemSection)
      })
      .with({ option: P.string.startsWith('jewel') }, () => {
        this.parseJewel(this.itemSection)
        this.findUnique('jewel')
      })
      .with({ option: P.string.startsWith('map') }, () => {
        this.findUnique('map')
        this.parseMap(this.itemSection)
      })
      .with({ text: P.union('可堆疊通貨', '預兆', '地圖碎片', '遺鑰', '命運卡', '掘獄可堆疊有插槽通貨') }, ({ text }) => {
        let shouldSkip = false
        if (text === '可堆疊通貨') {
          shouldSkip = this.parseBeastItem(this.itemSection)
        }
        if (!shouldSkip) {
          if (this.config.autoSearchStackableItems) this.itemParsed.autoSearch = true
          this.parseAllfuns(this.itemSection)
        }
      })
      .with({ text: P.union('技能寶石', '輔助寶石') }, () => {
        this.parseGem(this.itemSection)
      })
      .with({ text: '探險日誌' }, () => {
        this.parseLogbook(this.itemSection)
      })
      .with({ text: '屍體' }, () => {
        this.itemParsed.autoSearch = true
      })
      .with({ text: '聖物' }, () => {
        this.parseRelic(this.itemSection)
      })
      .with({ text: '接肢' }, () => {
        this.parseGraft(this.itemSection)
      })
      .with({ text: '契約書' }, () => {
        this.findUnique('heistmission')
      })
    this.parseAllfuns(this.itemSection)
    this.parsePseudoEleResistance()

    const staticItem = APIStatic.find((ele: Static) => ele.text === this.itemParsed.baseType)
    if (staticItem) {
      this.itemParsed.itemID = staticItem.id
      this.itemParsed.searchExchange.option = true
    }

    if (this.itemParsed.rarity === '傳奇' && this.itemParsed.isIdentify === false && this.itemParsed.uniques.length === 1) {
      this.itemParsed.name = this.itemParsed.uniques[0]!.name
    }
    if (this.itemParsed.raritySearch.label === '傳奇' && this.itemParsed.name) this.itemParsed.autoSearch = true
    if (this.itemParsed.baseType === '阿茲瓦特史記') this.parseTemple(this.itemSection)

    return this.itemParsed
  }

  private findUnique(type: Exclude<keyof ParsedAPIitems, 'gem'>): boolean {
    if (this.itemParsed.uniques.length > 0) return false
    let temp: ItemUniques[] = []
    for (const ele of APIitems[type]!.entries) {
      if (type !== 'gem' && ele.type === this.itemParsed.baseType) {
        temp = structuredClone(ele.unique ?? [])
        break
      }
    }
    if (temp.length) this.itemParsed.uniques.push(...temp)
    return true
  }

  private parseFirstSection(section: string[]) {
    if (!section[0]!.startsWith('物品種類:')) return ParseResult.PARSE_SECTION_FAIL
    if (section[2] === '你無法使用這項裝備，它的數值將被忽略') {
      section.pop()
      section.push(...(this.itemSection.splice(1, 1)[0]!))
    }

    const itemType = section[0]!.match(/物品種類: ([^\n]+)/)![1] as keyof typeof typeTrans
    this.itemParsed.type = { text: itemType, option: typeTrans[itemType], searchByType: false }
    section.shift()
    this.parseRarity(section)
    section.shift()

    const itemTypeApi = this.itemParsed.type.option?.substring(0, this.itemParsed.type.option.indexOf('.')) as keyof typeof APIitems
    let itemNameLine = section.at(-1)?.replace(/(精良的|追憶之|Synthesised)\s/, '') ?? ''

    const apiBaseTypes = (APIitems[itemTypeApi]?.entries ?? Object.values(APIitems).flatMap(item => item.entries))
      .filter((entry) => {
        let sectionLine = itemNameLine
        if (!sectionLine) return false
        if (sectionLine.startsWith('精良的')) sectionLine = sectionLine.substring(4)
        if (sectionLine.startsWith('追憶之')) sectionLine = sectionLine.substring(4)
        if (sectionLine.startsWith('Synthesised')) sectionLine = sectionLine.substring(11)

        return entry.type === sectionLine || sectionLine?.endsWith(entry.type)
      }).map(entry => entry.type)

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
      this.itemParsed.baseType = section[0]!
      const transGemInfo = APIitems.gem.entries.find(ele => ele.trans?.some(({ text }) => text === this.itemParsed.baseType))
      if (transGemInfo) {
        this.itemParsed.transGem = {
          option: transGemInfo.type,
          discriminator: transGemInfo.trans!.find(g => g.text === this.itemParsed.baseType)!.disc
        }
      }
    }
    else if (apiBaseType) {
      this.itemParsed.baseType = apiBaseType
      const lastLine = section.at(-1)
      if (this.itemParsed.baseType !== lastLine) {
        this.itemParsed.name = lastLine?.replace(this.itemParsed.baseType, '')
      }
    }
    else {
      this.itemParsed.baseType = section.at(-1)!
    }
    section.pop()
    if (section.length > 0) {
      this.itemParsed.name = section.pop()
    }

    if (/^穢生\s|^Foulborn\s/.test(this.itemParsed.name || '')) {
      this.itemParsed.name = this.itemParsed.name?.replace(/穢生\s|Foulborn\s/, '')
      this.itemParsed.foulborn = true
    }

    return ParseResult.PARSE_SECTION_SUCC
  }

  private parseRarity(section: string[]) {
    this.itemParsed.rarity = section[0]!.match(/稀有度: ([^\n]+)/)?.[1] ?? ''
    if (this.itemParsed.type.text === '不滅之火餘燼') {
      this.itemParsed.baseType = section[0]!
      return ParseResult.PARSE_SECTION_SUCC
    }

    match({ rarity: this.itemParsed.rarity, isPoe2: poeVersion === '2' })
      .with({ isPoe2: true }, () => {
        this.itemParsed.raritySearch = rarityOptions.find(option => option.label === this.itemParsed.rarity) ?? rarityOptions[5]
      })
      .with({ rarity: P.union('普通', '魔法', '稀有') }, () => {
        this.itemParsed.raritySearch = rarityOptions[5]
      })
      .with({ rarity: '傳奇' }, () => {
        this.itemParsed.raritySearch = rarityOptions[4]
      })
      .otherwise(() => {
        this.itemParsed.raritySearch = rarityOptions[0]
      })
    return ParseResult.PARSE_SECTION_SUCC
  }

  private parseRequirement(section: string[]) {
    if (!section[0]?.startsWith('需求:')) return ParseResult.PARSE_SECTION_SKIP
    section.forEach(line => {
      let lineMatch: RegExpMatchArray | null
      if ((lineMatch = line.match(/^等級: (\d+)/))) this.itemParsed.requireLevel = parseInt(lineMatch[1]!)
      else if ((lineMatch = line.match(/^智慧: (\d+)/))) this.itemParsed.requireInt = parseInt(lineMatch[1]!)
      else if ((lineMatch = line.match(/^力量: (\d+)/))) this.itemParsed.requireStr = parseInt(lineMatch[1]!)
      else if ((lineMatch = line.match(/^敏捷: (\d+)/))) this.itemParsed.requireDex = parseInt(lineMatch[1]!)
    })
    return ParseResult.PARSE_SECTION_SUCC
  }

  private parseSocket(section: string[]) {
    if (!section[0]?.startsWith('插槽')) return ParseResult.PARSE_SECTION_SKIP
    const sockets = section[0]!.replace(/R|G|B|W/g, '#')
    if (sockets.indexOf('#-#-#-#-#-#') > -1) {
      this.itemParsed.search6L = true
    }
    else if (['弓', '長杖', '雙手劍', '雙手斧', '雙手錘', '征戰長杖', '胸甲'].includes(this.itemParsed.type.text)) {
      this.itemParsed.search6L = false
    }
    return ParseResult.PARSE_SECTION_SUCC
  }

  private parseItemLevel(section: string[]) {
    const sectionMatch = section[0]?.match(/^物品等級: (\d+)/)
    if (!sectionMatch) return ParseResult.PARSE_SECTION_SKIP
    const il = parseInt(sectionMatch[1]!)
    const maxModLevel = this.config.poeVersion === '1' ? 86 : 82
    this.itemParsed.itemLevel = { min: il > maxModLevel ? maxModLevel : il, max: undefined, search: this.itemParsed.rarity !== '傳奇' }
    return ParseResult.PARSE_SECTION_SUCC
  }

  private parseMod(section: string[], type: keyof ParsedAPIMods | 'mutated' | 'rune') {
    let modType = type
    const cleanSection = section.filter(line => !/{.*}/.test(line))
    const regSection = getStrReg(cleanSection, modType)
    if (modType === 'mutated' || modType === 'rune') modType = 'explicit'
    else modType = modType as keyof ParsedAPIMods
    if (!APImods[modType]) return ParseResult.PARSE_SECTION_FAIL

    const tempArr: ItemStat[] = []
    for (const [index, line] of regSection.entries()) {
      try {
        let matchMods = APImods[modType]?.entries.filter(mod => line.test(mod.text) || line.test(mod.text.split('\n').at(0) ?? ''))
        if (!matchMods || !matchMods.length) continue

        if (matchMods.length > 1) {
          if (this.itemParsed.isWeaponOrArmor && this.itemParsed.type.option !== 'armour.quiver' && matchMods.find(ele => ele.text.endsWith(' (部分)')))
            matchMods = matchMods.filter(mod => mod.text.endsWith(' (部分)'))
          else {
            matchMods = matchMods.filter(mod => !mod.text.endsWith(' (部分)'))
            const sectionSign = Array.from(cleanSection[index]?.match(/增加|減少|更多|更少/g) ?? []).join('')
            if (sectionSign) {
              matchMods = matchMods.filter(mod => Array.from(mod.text.match(/增加|減少|更多|更少/g) ?? []).join('') === sectionSign)
            }
          }
        }

        matchMods = matchMods.filter(mod => {
          const modMultiLine = mod.text.split('\n')
          const modMultiLineLength = modMultiLine.length
          const regSectionMultiLines = regSection.slice(index, index + modMultiLineLength)
          if (regSectionMultiLines.length !== modMultiLineLength) return false
          return regSectionMultiLines.every((regSectionMultiLine, mi) => regSectionMultiLine.test(modMultiLine[mi] ?? ''))
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
          const baseOption: ItemStat = {
            ...matchMod,
            disabled: type === 'mutated' ? false : true,
            type: type === 'mutated' ? '穢生' : APImods[modType]?.type ?? type
          }
          if (regGroup?.length) {
            const diffSign = matchMod.text.match(/減少|增加|更多|更少/)?.[0] !== cleanSection[index]?.match(/減少|增加|更多|更少/)?.[0]
            const minValue = (diffSign ? -1 : 1) * (regGroup.reduce((pre, ele) => pre + Number(ele), 0) / regGroup.length)
            tempArr.push({ value: { [diffSign ? 'max' : 'min']: minValue }, ...baseOption })
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
      this.itemParsed.stats.push(...tempArr)
      return ParseResult.PARSE_SECTION_SUCC
    }
    return ParseResult.PARSE_SECTION_SKIP
  }

  private parseEnchantMod(section: string[]) {
    if (!section.find(line => line.endsWith('(enchant)'))) return ParseResult.PARSE_SECTION_SKIP
    return this.parseMod(section, 'enchant') === ParseResult.PARSE_SECTION_SUCC ? ParseResult.PARSE_SECTION_SUCC : ParseResult.PARSE_SECTION_FAIL
  }

  private parseImplicitMod(section: string[]) {
    if (!section.find(line => /(\(implicit\)$)|\{\s.*固定詞綴.*\s\}/.test(line))) return ParseResult.PARSE_SECTION_SKIP
    return this.parseMod(section, 'implicit') === ParseResult.PARSE_SECTION_SUCC ? ParseResult.PARSE_SECTION_SUCC : ParseResult.PARSE_SECTION_FAIL
  }

  private parseRuneMod(section: string[]) {
    if (!section.find(line => line.endsWith(' (rune)'))) return ParseResult.PARSE_SECTION_SKIP
    return this.parseMod(section, 'rune') === ParseResult.PARSE_SECTION_SUCC ? ParseResult.PARSE_SECTION_SUCC : ParseResult.PARSE_SECTION_FAIL
  }

  private parseExplicitMod(section: string[]) {
    if (!['魔法', '稀有', '傳奇'].includes(this.itemParsed.rarity)) return ParseResult.PARSE_SECTION_SKIP
    const explicitSection: string[] = [], fracturedSection: string[] = [], craftedSection: string[] = [], mutatedSection: string[] = []
    let parsed = false
    const sectionModArr: string[] = []
    const sectionModTypeArr: string[] = []
    section.forEach(line => {
      if (/{.*}/.test(line)) sectionModTypeArr.push(line)
      else sectionModArr.push(line)
    })
    for (let i = 0; i < sectionModArr.length; i++) {
      const line = sectionModArr[i] ?? ''
      let type = line?.match(/fractured|crafted|mutated/)?.[0]
      if (sectionModTypeArr[i]) {
        type = sectionModTypeArr[i]?.startsWith('{ 已破裂') ? 'fractured' : sectionModTypeArr[i]?.startsWith('{ 已大師工藝') ? 'crafted' : sectionModTypeArr[i]?.startsWith('{ Foulborn') ? 'mutated' : type
      }
      match(type)
        .with('crafted', () => craftedSection.push(line))
        .with('fractured', () => fracturedSection.push(line))
        .with('mutated', () => mutatedSection.push(line))
        .otherwise(() => {
          if (line !== '隱匿前綴' && line !== '隱匿後綴') explicitSection.push(line)
        })
    }

    if (craftedSection.length) parsed = this.parseMod(craftedSection, 'crafted') === ParseResult.PARSE_SECTION_SUCC || parsed
    if (fracturedSection.length) parsed = this.parseMod(fracturedSection, 'fractured') === ParseResult.PARSE_SECTION_SUCC || parsed
    if (explicitSection.length) parsed = this.parseMod(explicitSection, 'explicit') === ParseResult.PARSE_SECTION_SUCC || parsed
    if (mutatedSection.length) parsed = this.parseMod(mutatedSection, 'mutated') === ParseResult.PARSE_SECTION_SUCC || parsed

    return parsed ? ParseResult.PARSE_SECTION_SUCC : ParseResult.PARSE_SECTION_SKIP
  }

  private parseInfluence(section: string[]) {
    const influences = [{ id: 'pseudo.pseudo_has_shaper_influence', text: '塑者之物', label: '塑者' }, { id: 'pseudo.pseudo_has_elder_influence', text: '尊師之物', label: '尊師' }, { id: 'pseudo.pseudo_has_crusader_influence', text: '聖戰軍王物品', label: '聖戰' }, { id: 'pseudo.pseudo_has_redeemer_influence', text: '救贖者物品', label: '救贖' }, { id: 'pseudo.pseudo_has_hunter_influence', text: '狩獵者物品', label: '狩獵' }, { id: 'pseudo.pseudo_has_warlord_influence', text: '總督軍物品', label: '督軍' }] as const
    for (const line of section) {
      if (line === '破裂之物') this.itemParsed.isFractured = true
      else if (line === '追憶之物') {
        this.itemParsed.isSynthesized = true
        break
      }
      const influence = influences.find(inf => inf.text === line)
      if (influence) this.itemParsed.influences.push(influence)
    }
    return this.itemParsed.influences.length > 0 ? ParseResult.PARSE_SECTION_SUCC : ParseResult.PARSE_SECTION_SKIP
  }

  private parseCorrupt(section: string[]) {
    if (section[0]?.match(/^已汙染$/)) {
      this.itemParsed.isCorrupt = true
      return ParseResult.PARSE_SECTION_SUCC
    }
    return ParseResult.PARSE_SECTION_SKIP
  }

  private parseIdentify(section: string[]) {
    if (section[0]?.match(/^未鑑定$/)) {
      this.itemParsed.isIdentify = false
      return ParseResult.PARSE_SECTION_SUCC
    }
    return ParseResult.PARSE_SECTION_SKIP
  }

  private parsePseudoEleResistance() {
    let eleRes = 0
    let flag = false
    this.itemParsed.stats.forEach(mod => {
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
      this.itemParsed.stats.push({ id: 'pseudo.pseudo_total_elemental_resistance', text: '+#% 元素抗性', type: '偽屬性', value: { min: eleRes }, disabled: true })
    }
  }

  private parseAllfuns(item: string[][], functions: ParseFun[] = this.parseFuns) {
    endFor:
    for (const fun of functions) {
      for (const section of item) {
        if (!fun) continue
        const state = fun(section)
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

  private parseWeapon(item: string[][]) {
    this.itemParsed.isWeaponOrArmor = true
    item[0]?.forEach(line => {
      let lineMatch: RegExpMatchArray | null
      if ((lineMatch = line.match(/品質: \+(\d+)%/))) {
        this.itemParsed.quality = { min: parseInt(lineMatch[1]!), max: undefined, search: false }
      }
      else if ((lineMatch = line.match(/物理傷害: (\d+)(?:-|\s到\s)(\d+)/))) {
        this.itemParsed.phyDamage = { min: parseInt(lineMatch[1]!), max: parseInt(lineMatch[2]!) }
      }
      else if ((lineMatch = line.match(/(?:元素|火焰|冰冷|閃電)傷害:(?: (\d+)(?:-|\s到\s)(\d+) \((?:augmented|fire|lightning|cold)\),?)(?: (\d+)(?:-|\s到\s)(\d+) \((?:augmented|fire|lightning|cold)\),?)?(?: (\d+)(?:-|\s到\s)(\d+) \((?:augmented|fire|lightning|cold)\))?/))) {
        lineMatch.shift()
        this.itemParsed.eleDamage = {
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
        this.itemParsed.critChance = parseFloat(lineMatch[1]!)
      }
      else if ((lineMatch = line.match(/每秒攻擊次數: (\d+\.?\d\d)/))) {
        this.itemParsed.attackSpeed = parseFloat(lineMatch[1]!)
      }
      else if ((lineMatch = line.match(/武器範圍: (\d+)/))) {
        this.itemParsed.weaponArea = parseInt(lineMatch[1]!)
      }
    })
    item.shift()
    if (this.itemParsed.phyDamage && this.itemParsed.attackSpeed) this.itemParsed.pDPS = parseFloat((((this.itemParsed.phyDamage.min + this.itemParsed.phyDamage.max) / 2) * this.itemParsed.attackSpeed).toFixed(2))
    if (this.itemParsed.eleDamage && this.itemParsed.attackSpeed) this.itemParsed.eDPS = parseFloat((((this.itemParsed.eleDamage.min + this.itemParsed.eleDamage.max) / 2) * this.itemParsed.attackSpeed).toFixed(2))
    this.parseAllfuns(item)
  }

  private parseArmor(item: string[][]) {
    this.itemParsed.isWeaponOrArmor = true
    item[0]?.forEach(line => {
      let lineMatch: RegExpMatchArray | null
      if ((lineMatch = line.match(/品質: \+(\d+)%/))) this.itemParsed.quality.min = parseInt(lineMatch[1]!)
      else if ((lineMatch = line.match(/閃避值: (\d+)/))) this.itemParsed.evasion = parseInt(lineMatch[1]!)
      else if ((lineMatch = line.match(/護甲: (\d+)/))) this.itemParsed.armour = parseInt(lineMatch[1]!)
      else if ((lineMatch = line.match(/能量護盾: (\d+)/))) this.itemParsed.energyShield = parseInt(lineMatch[1]!)
    })
    item.shift()
    this.parseAllfuns(item)
  }

  private parseClusterJewel(item: string[][]) {
    if (this.parseRequirement(item[0]!) === ParseResult.PARSE_SECTION_SUCC) item.shift()
    const tempIlvl = parseInt(item[0]![0]!.match(/物品等級: (\d+)/)![1]!)
    this.itemParsed.itemLevel = { min: tempIlvl >= 84 ? 84 : tempIlvl >= 75 ? 75 : tempIlvl >= 68 ? 68 : tempIlvl >= 50 ? 50 : 1, max: tempIlvl >= 84 ? 100 : tempIlvl >= 75 ? 83 : tempIlvl >= 68 ? 74 : tempIlvl >= 50 ? 67 : 49, search: true }
    item.shift()
    if (this.itemParsed.rarity !== '傳奇') {
      this.parseEnchantMod(item[0]!.slice(0, 2))
      match(this.itemParsed.baseType)
        .with('巨型星團珠寶', '小型星團珠寶', () => {
          this.itemParsed.stats[0]!.value!.min = this.itemParsed.stats[0]!.value!.max
        })
        .with('中型星團珠寶', () => {
          this.itemParsed.stats[0]!.value!.min = this.itemParsed.stats[0]!.value!.min === 6 ? 6 : 4
          this.itemParsed.stats[0]!.value!.max = this.itemParsed.stats[0]!.value!.min === 6 ? 6 : 5
        })
      let clusterType: string = item[0]!.find(ele => ele.startsWith('附加的小型天賦給予：'))!
      clusterType = clusterType.substring(10, clusterType.indexOf(' (enchant)'))
      let tempMod = APImods.clusterJewel.entries.find(mod => mod.text.includes(clusterType))
      if (tempMod!.text.endsWith('(古典)') && this.itemParsed.baseType === '小型星團珠寶') {
        const tempText = tempMod!.text.substring(0, tempMod!.text.length - 5)
        tempMod = APImods.clusterJewel.entries.reverse().find(mod => mod.text.includes(tempText))
      }
      this.itemParsed.stats.push({ id: 'enchant.stat_3948993189', text: tempMod!.text, value: { option: Number(tempMod?.id) }, type: '附魔', disabled: false })
      this.itemParsed.stats.forEach(ele => ele.disabled = false)
      item.shift()
    }
    this.parseAllfuns(item, [this.parseCorrupt.bind(this), this.parseIdentify.bind(this), this.parseImplicitMod.bind(this), this.parseExplicitMod.bind(this)])
    this.itemParsed.autoSearch = true
  }

  private parseForbiddenJewel(item: string[][]) {
    this.itemParsed.autoSearch = true
    for (const section of item) {
      if (this.parseCorrupt(section) === ParseResult.PARSE_SECTION_SUCC) continue
      const sectionMatch = section[0]!.match(/若禁忌(烈焰|血肉)上有符合的詞綴，配置 (.*)/)
      if (sectionMatch) {
        const type = sectionMatch[1]
        const passive = sectionMatch[2]!
        const matchStat = APImods.forbiddenJewel.entries.find(e => e.text.indexOf(type!) > -1)
        const matchPassive = matchStat?.option?.options.find(e => e.text === passive)
        this.itemParsed.stats.push({ id: matchStat!.id, text: matchStat!.text.replace('#', passive), value: { option: matchPassive?.id }, disabled: false })
      }
    }
  }

  private parseImpossibleEscape(item: string[][]) {
    this.itemParsed.autoSearch = true
    this.itemParsed.isCorrupt = true
    outer:
    for (const section of item) {
      for (const line of section) {
        const result = line.match(/天賦樹中在範圍(.+)內未連結的天賦仍然可以配置/)
        if (result) {
          const statDetail = APImods.explicit.mutiLines?.find(ele => ele.id === 'explicit.stat_2422708892')!
          const matchOption = statDetail.option?.options.find(ele => ele.text === result[1])
          this.itemParsed.stats.push({ id: statDetail.id, text: statDetail.text[0]!.replace('#', result[1]!), value: { option: matchOption?.id }, disabled: false })
          break outer
        }
      }
    }
  }

  private parseThreadOfHope(item: string[][]) {
    const parseRangeMod = (section: string[]) => {
      const mod = {
        id: 'explicit.stat_3642528642',
        text: '只會影響#範圍內的天賦',
        type: 'explicit',
        option: { options: [{ id: 1, text: '小' }, { id: 2, text: '中' }, { id: 3, text: '大' }, { id: 4, text: '非常大' }, { id: 5, text: '極大' }] }
      }
      const reg = new RegExp(`^${mod.text.replace('#', `(${mod.option.options.map(ele => ele.text).join('|')})`)}$`)
      this.parseExplicitMod(section)
      for (const line of section) {
        const match = line.match(reg)
        if (match) {
          const matchOption = mod.option?.options.find(ele => ele.text === match[1])
          this.itemParsed.stats.push({ id: mod.id, text: match[0], value: { option: matchOption?.id }, type: '隨機', disabled: false })
          return ParseResult.PARSE_SECTION_SUCC
        }
      }
      return ParseResult.PARSE_SECTION_SKIP
    }
    this.parseAllfuns(item, [this.parseItemLevel.bind(this), this.parseCorrupt.bind(this), this.parseIdentify.bind(this), this.parseImplicitMod.bind(this), parseRangeMod])
  }

  private parseOtherHaveMods(item: string[][]) {
    if (this.itemParsed.name === '贗品．龍牙翱翔') {
      outer: for (const section of item) {
        for (let index = 0; index < section.length; index++) {
          const match = section[index]!.match(/全部 ([^\s]+) 寶石等級 \+3/)
          if (match) section[index] = `全部 # 寶石等級 +${match[1]}`
        }
      }
    }
    this.parseAllfuns(item)
    if (this.itemParsed.name === '贗品．龍牙翱翔') {
      this.itemParsed.stats.forEach(ele => {
        if (typeof ele.text === 'string' && ele.text.startsWith('全部 # 寶石等級')) {
          ele.disabled = false
        }
      })
    }
    if (this.itemParsed.type.option === 'memoryline') {
      this.itemParsed.stats.forEach(ele => ele.disabled = false)
      this.itemParsed.itemLevel && (this.itemParsed.itemLevel.search = false)
      this.itemParsed.autoSearch = true
    }
  }

  private parseMap(item: string[][]) {
    this.itemParsed.autoSearch = true
    const elderMap = { id: 'implicit.stat_3624393862', text: '地圖被 # 佔據', type: 'implicit', options: [{ value: 1, text: '異界．奴役', exchange: 'enslaver-map' }, { value: 2, text: '異界．根除', exchange: 'eradicator-map' }, { value: 3, text: '異界．干擾', exchange: 'constrictor-map' }, { value: 4, text: '異界．淨化', exchange: 'purifier-map' }] } as const
    const conquerorMap = { id: 'implicit.stat_2563183002', text: '地圖含有 # 的壁壘', type: 'implicit', options: [{ value: 1, text: '巴倫', exchange: 'barans-map' }, { value: 2, text: '維羅提尼亞', exchange: 'veritanias-map' }, { value: 3, text: '奧赫茲明', exchange: 'al-hezmins-map' }, { value: 4, text: '圖拉克斯', exchange: 'droxs-map' }] } as const
    const mapTier = this.itemParsed.baseType.match(/（階級 (\d{1,2})）/)
    if (mapTier) this.itemParsed.mapTier = { min: parseInt(mapTier[1]!), max: undefined, search: true }
    if (mapTier && this.itemParsed.raritySearch.value !== 'unique') this.itemParsed.type.searchByType = true
    item[0]!.forEach(line => {
      const completionMatch = line.match(/獎勵: 貼模 \((.+)\)/)
      if (completionMatch) this.itemParsed.map_completion_reward = completionMatch[1]
    })
    item.shift()
    match(this.itemParsed.baseType)
      .with(P.string.startsWith('凋落的'), () => {
        this.itemParsed.baseType = this.itemParsed.baseType.substring(4)
        this.itemParsed.blightedMap = true
        this.itemParsed.type.searchByType = true
      })
      .with(P.string.startsWith('凋落蔓延的'), () => {
        this.itemParsed.baseType = this.itemParsed.baseType.substring(6)
        this.itemParsed.UberBlightedMap = true
        this.itemParsed.type.searchByType = true
      })
    for (const section of item) {
      for (const line of section) {
        if (!this.itemParsed.elderMap) {
          const elderMatch = elderMap.options.filter(ele => line.includes(`地圖被${ele.text}佔據`))[0]
          if (elderMatch) {
            const elderStat = { id: 'implicit.stat_3624393862', text: elderMatch.text, value: { option: elderMatch.value }, disabled: false }
            this.itemParsed.elderMap = elderStat
            this.itemParsed.stats.push(elderStat)
            if (this.itemParsed.mapTier?.search) this.itemParsed.mapTier.search = false
          }
        }

        if (!this.itemParsed.conquerorMap) {
          const conquerorMatch = conquerorMap.options.filter(ele => line.includes(`地圖含有${ele.text}的壁壘`))[0]
          if (conquerorMatch) {
            const conquerorStat = { id: 'implicit.stat_2563183002', text: conquerorMatch.text, value: { option: conquerorMatch.value }, disabled: false }
            this.itemParsed.conquerorMap = conquerorStat
            this.itemParsed.stats.push(conquerorStat)
            if (this.itemParsed.mapTier?.search) this.itemParsed.mapTier.search = false
            this.itemParsed.type.searchByType = true
          }
        }

        if (line.includes('區域受到開創者的記憶影響')) {
          this.itemParsed.autoSearch = true
          this.itemParsed.memoryMap = true
        }
      }
    }
    const parseFuns = [this.parseCorrupt.bind(this), this.parseIdentify.bind(this), this.parseEnchantMod.bind(this)]
    if (this.itemParsed.map_completion_reward) {
      item = item.filter(section => !section[0]!.startsWith('怪物等級：'))
      parseFuns.push(this.parseExplicitMod.bind(this))
    }
    this.parseAllfuns(item, parseFuns)
    this.itemParsed.stats.forEach(stat => {
      if (stat.type === '附魔') stat.disabled = false
    })
  }

  private parseGem(item: string[][]) {
    this.itemParsed.autoSearch = true
    item[0]!.forEach(line => {
      let lineMatch: RegExpMatchArray | null
      if ((lineMatch = line.match(/等級: (\d+)/))) this.itemParsed.gemLevel = { min: parseInt(lineMatch[1]!), max: undefined, search: true }
      else if ((lineMatch = line.match(/品質: \+(\d+)%/))) this.itemParsed.quality = { min: parseInt(lineMatch[1]!), max: undefined, search: false }
    })
    this.itemParsed.quality.search = !(/啟蒙|賦予|增幅/.test(this.itemParsed.baseType))
    item.shift()
    for (const section of item.reverse()) {
      if (section[0]?.includes('瓦爾．')) {
        this.itemParsed.vaalVer = true
        this.itemParsed.vaalBaseType = section[0]
        continue
      }
      if (this.parseCorrupt(section) === ParseResult.PARSE_SECTION_SUCC) {
      }
      if (this.parseMod(section, 'imbued') === ParseResult.PARSE_SECTION_SUCC) {
        const mod = this.itemParsed.stats.find(stat => stat.type === 'imbued')
        if (mod) {
          mod.disabled = false
          mod.type = '充能'
        }
      }
    }
    this.itemParsed.quality.search = !!(this.itemParsed.isCorrupt && this.itemParsed.quality.search)
  }

  private parseTemple(item: string[][]) {
    item.shift()
    item[0] = item[0]!.map(line => line.replace(/ \(階級 [123]\)/, ''))
    this.parseMod(item[0], 'temple')
    this.itemParsed.stats = this.itemParsed.stats.filter(ele => ['多里亞尼之院', '腐敗之地', '祭祀之巔'].includes(ele.text as string)).map(ele => ({ ...ele, disabled: ele.text === '祭祀之巔' ? true : false }))
    this.itemParsed.autoSearch = true
  }

  private parseFlask(item: string[][]) {
    item[0]?.forEach(line => {
      const lineMatch = line.match(/品質: \+(\d+)%/)
      if (lineMatch) this.itemParsed.quality = { min: parseInt(lineMatch[1]!), max: undefined, search: true }
    })
    item.shift()
    this.parseAllfuns(item)
  }

  private parseLogbook(item: string[][]) {
    item.shift()
    this.parseItemLevel(item[0]!)
    item.shift()
    this.itemParsed.itemLevel!.min = this.itemParsed.itemLevel!.min! > 83 ? 83 : this.itemParsed.itemLevel!.min
    const logbookTypes = { '破碎環之德魯伊': 'pseudo.pseudo_logbook_faction_druids', '黑鐮傭兵': 'pseudo.pseudo_logbook_faction_mercenaries', '聖杯之序': 'pseudo.pseudo_logbook_faction_order', '豔陽騎士': 'pseudo.pseudo_logbook_faction_knights' } as const
    for (const section of item) {
      if (section.length >= 2) {
        if (Object.keys(logbookTypes).includes(section[1]!)) {
          if (!this.itemParsed.stats.find(e => section[1] === e.text)) {
            this.itemParsed.stats.push({ id: logbookTypes[section[1] as keyof typeof logbookTypes], text: section[1]!, disabled: true })
          }
          item = item.filter(s => s !== section)
        }
      }
    }
  }

  private parseRGB(item: string[]) {
    for (const line of item) {
      if (line.startsWith('貼模傳奇')) {
        this.itemParsed.isRGB = true
        return ParseResult.PARSE_SECTION_SUCC
      }
    }
    return ParseResult.PARSE_SECTION_SKIP
  }

  private parseRelic(item: string[][]) {
    for (const line of item) {
      if (this.parseIdentify(line) === ParseResult.PARSE_SECTION_SUCC) return
      this.parseItemLevel(line)
    }
    item.shift()
    this.parseMod(item[0]!, 'sanctum')
  }

  private parseBeastItem(_item: string[][]) {
    let isBeastItem = false
    APIitems['monster']?.entries.forEach(monster => {
      if (monster.type === this.itemParsed.baseType) {
        isBeastItem = true
      }
    })
    if (isBeastItem) {
      this.itemParsed.autoSearch = true
      this.itemParsed.searchExchange.option = false
      return true
    }
    return false
  }

  private parseGraft(itemSection: string[][]) {
    this.parseAllfuns(itemSection)
  }

  private parseTimelessJewel(_item: string[][]) {
    this.itemParsed.autoSearch = true
    let statsList: { id: string, text: string, type: string }[] = []
    if (this.itemParsed.name === '致命的驕傲') {
      statsList = [{ id: 'explicit.pseudo_timeless_jewel_rakiata', text: '拉其塔指揮領導超過 # 戰士', type: '隨機' }, { id: 'explicit.pseudo_timeless_jewel_kaom', text: '岡姆指揮領導超過 # 戰士', type: '隨機' }, { id: 'explicit.pseudo_timeless_jewel_akoya', text: '阿寇亞指揮領導超過 # 戰士', type: '隨機' }, { id: 'explicit.pseudo_timeless_jewel_kiloava', text: '基洛瓦指揮領導超過 # 戰士', type: '隨機' }]
    }
    else if (this.itemParsed.name === '輝煌的虛榮') {
      statsList = [{ id: 'explicit.pseudo_timeless_jewel_xibaqua', text: '浸泡在以賽巴昆之名獻祭的 # 條生命中', type: '隨機' }, { id: 'explicit.pseudo_timeless_jewel_doryani', text: '浸泡在以多里亞尼之名獻祭的 # 條生命中', type: '隨機' }, { id: 'explicit.pseudo_timeless_jewel_ahuana', text: '浸泡在以阿呼阿娜之名獻祭的 # 條生命中', type: '隨機' }, { id: 'explicit.pseudo_timeless_jewel_zerphi', text: '浸泡在以澤佛伊之名獻祭的 # 條生命中', type: '隨機' }]
    }
    else if (this.itemParsed.name === '殘酷的紀律') {
      statsList = [{ id: 'explicit.pseudo_timeless_jewel_asenath', text: '# 位部屬宣誓服從於安賽娜絲的血脈', type: 'explicit' }, { id: 'explicit.pseudo_timeless_jewel_balbala', text: '# 位部屬宣誓服從於巴爾巴拉的血脈', type: 'explicit' }, { id: 'explicit.pseudo_timeless_jewel_nasima', text: '# 位部屬宣誓服從於納西瑪的血脈', type: 'explicit' }, { id: 'explicit.pseudo_timeless_jewel_deshret', text: '# 位部屬宣誓服從於迪虛瑞特的血脈', type: 'explicit' }]
    }
    else if (this.itemParsed.name === '優雅的高傲') {
      statsList = [{ id: 'explicit.pseudo_timeless_jewel_cadiro', text: '授銜 # 個硬幣以紀念卡迪羅', type: 'explicit' }, { id: 'explicit.pseudo_timeless_jewel_caspiro', text: '授銜 # 個硬幣以紀念卡斯皮羅', type: 'explicit' }, { id: 'explicit.pseudo_timeless_jewel_victario', text: '授銜 # 個硬幣以紀念維多里奧', type: 'explicit' }, { id: 'explicit.pseudo_timeless_jewel_chitus', text: '授銜 # 個硬幣以紀念切特斯', type: 'explicit' }]
    }
    else if (this.itemParsed.name === '激進的信仰') {
      statsList = [{ id: 'explicit.pseudo_timeless_jewel_dominus', text: '為了讚美 # 名受到神主轉化的人們所雕刻', type: 'explicit' }, { id: 'explicit.pseudo_timeless_jewel_avarius', text: '為了讚美 # 名受到聖宗伊爾莉斯轉化的人們所雕刻', type: 'explicit' }, { id: 'explicit.pseudo_timeless_jewel_maxarius', text: '為了禮讚 # 名受到聖宗瑪薩里歐斯感化的信眾所雕刻', type: 'explicit' }, { id: 'explicit.pseudo_timeless_jewel_venarius', text: '為了讚美 # 名受到聖宗維那利斯轉化的人們所雕刻', type: 'explicit' }]
    }

    const statsListId = statsList.map(ele => ele.id)
    const statAlreadyIn = this.itemParsed.stats.find(ele => statsListId.includes(ele.id))
    if (!statAlreadyIn) return
    statAlreadyIn.disabled = false
    if (statAlreadyIn.value) statAlreadyIn.value.max = statAlreadyIn.value.min
    this.itemParsed.stats.splice(1, 0, ...statsList.filter(ele => ele.id !== statAlreadyIn?.id).map((ele) => ({ ...ele, disabled: true, value: statAlreadyIn.value ? { min: statAlreadyIn.value.min, max: statAlreadyIn.value.min } : undefined })))
  }

  private parseJewel(item: string[][]) {
    if (this.itemParsed.baseType.endsWith('星團珠寶')) {
      this.parseClusterJewel(item)
      return
    }
    if (/^禁忌(血肉|烈焰)$/.test(this.itemParsed.name!)) {
      this.parseForbiddenJewel(item)
      return
    }
    if (this.itemParsed.name === '逃脫不能') {
      this.parseImpossibleEscape(item)
      return
    }
    if (this.itemParsed.name === '希望之絃') {
      this.parseThreadOfHope(item)
      return
    }
    this.parseAllfuns(item)
    if (this.itemParsed.baseType === '永恆珠寶' && this.itemParsed.rarity === '傳奇') {
      this.parseTimelessJewel(item)
    }
  }
}

export function itemAnalyze(item: string) {
  return new ItemAnalyzer().analyze(item)
}

