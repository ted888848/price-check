import IPC from '@/ipc'
import { APIitems, APImods, APIStatic } from './APIdata'
import { isPOE2, poeVersion, secondCurrency } from '.'
import { getModMatchRegex, getStrReg, hasPossibilityReg, numberPatternWithNameGroup } from './regex'
import { match, P } from 'ts-pattern'
import { defaultItemParsed, NOT_MATCHED_ID, rarityOptions, typeTrans } from './const'
import { countBy, isUndefined } from 'lodash-es'
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
      this.parseMirrored.bind(this),
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
    const result: string[][] = [[]]
    itemArr.reduce((section, line) => {
      if (line !== '--------' && line) {
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

    this.itemSection = this.itemSection.filter(section => !section[0]?.startsWith("無形性:"))

    const firstSection = this.itemSection[0]
    if (!firstSection || this.parseFirstSection(firstSection) === ParseResult.PARSE_SECTION_FAIL) return null
    this.itemParsed.searchOnlineType = this.config.searchOnlineType ?? this.itemParsed.searchOnlineType
    this.itemSection.shift()
    let searchExchange = false
    match(this.itemParsed.type)
      .with({ option: P.string.startsWith('weapon') }, () => {
        this.findUnique('weapon')
        this.parseWeapon()
      })
      .with({ option: P.string.startsWith('armour') }, () => {
        this.findUnique('armour')
        this.parseArmor()
      })
      .with({ option: P.string.startsWith('flask') }, () => {
        this.findUnique('flask')
        this.parseFlask()
      })
      .with({ option: P.string.startsWith('accessory') }, () => {
        this.findUnique('accessory')
        this.parseOtherHaveMods()
      })
      .with({ option: P.string.startsWith('jewel') }, () => {
        this.parseJewel()
        this.findUnique('jewel')
      })
      .with({ option: P.string.startsWith('map') }, () => {
        this.findUnique('map')
        this.parseMap()
      })
      .with({ text: P.union('可堆疊通貨', '預兆', '地圖碎片', '遺鑰', '命運卡', '掘獄可堆疊有插槽通貨') }, () => {
        const isBeastItem = this.parseBeastItem()
        if (!isBeastItem) {
          if (this.config.autoSearchStackableItems) this.itemParsed.autoSearch = true
          this.parseAllfuns()
          searchExchange = true
        }
      })
      .with({ text: P.union('技能寶石', '輔助寶石') }, () => {
        this.parseGem()
      })
      .with({ text: '探險日誌' }, () => {
        this.parseLogbook()
      })
      .with({ text: '屍體' }, () => {
        this.itemParsed.autoSearch = true
      })
      .with({ text: '聖物' }, () => {
        this.parseRelic()
      })
      .with({ text: '接肢' }, () => {
        this.parseGraft()
      })
      .with({ text: '契約書' }, () => {
        this.findUnique('heistmission')
      })
      .with({ text: '臟器' }, () => {
        this.parseViscera()
      })
    this.parseAllfuns()
    this.parsePseudoEleResistance()

    const staticItem = APIStatic.find((ele: Static) => ele.text === this.itemParsed.baseType)
    if (staticItem && searchExchange) {
      this.itemParsed.itemID = staticItem.id
      this.itemParsed.searchExchange.option = true
    }

    if (this.itemParsed.rarity === '傳奇' && this.itemParsed.isIdentify === false && this.itemParsed.uniques.length === 1) {
      this.itemParsed.name = this.itemParsed.uniques[0]!.name
    }
    if (this.itemParsed.raritySearch.label === '傳奇' && this.itemParsed.name) this.itemParsed.autoSearch = true
    if (this.itemParsed.baseType === '阿茲瓦特史記') this.parseTemple()

    return this.itemParsed
  }

  private findUnique(type: Exclude<keyof ParsedAPIitems, 'gem'>): boolean {
    if (this.itemParsed.uniques.length > 0) return false
    const apiItem = APIitems[type]
    if (!apiItem) return false
    let temp: ItemUniques[] = []
    for (const ele of apiItem.entries) {
      if (type !== 'gem' && ele.type === this.itemParsed.baseType) {
        temp = structuredClone(ele.unique ?? [])
        break
      }
    }
    if (temp.length) this.itemParsed.uniques.push(...temp)
    return true
  }

  private parseFirstSection(section: string[]) {
    const header = section[0]
    if (!header?.startsWith('物品種類:')) return ParseResult.PARSE_SECTION_FAIL
    if (section[2] === '你無法使用這項裝備，它的數值將被忽略') {
      section.pop()
      const linkedSection = this.itemSection.splice(1, 1)[0]
      if (!linkedSection) return ParseResult.PARSE_SECTION_FAIL
      section.push(...linkedSection)
    }

    const itemTypeMatch = header.match(/物品種類: ([^\n]+)/)
    const itemType = itemTypeMatch?.[1] as keyof typeof typeTrans | undefined
    if (!itemType) return ParseResult.PARSE_SECTION_FAIL
    this.itemParsed.type = { text: itemType, option: typeTrans[itemType], searchByType: false }
    if (section.length < 3 && this.itemParsed.type.text !== '臟器') return ParseResult.PARSE_SECTION_FAIL
    section.shift()
    this.parseRarity(section)

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
        const transGem = transGemInfo.trans?.find(g => g.text === this.itemParsed.baseType)
        if (!transGem) return ParseResult.PARSE_SECTION_FAIL
        this.itemParsed.transGem = {
          option: transGemInfo.type,
          discriminator: transGem.disc
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

    if (itemNameLine.startsWith('卓越 ')) {
      this.itemParsed.isExcellenceItem = true
    }

    return ParseResult.PARSE_SECTION_SUCC
  }

  private parseRarity(section: string[]) {
    this.itemParsed.rarity = section[0]!.match(/稀有度: ([^\n]+)/)?.[1] ?? ''
    if (this.itemParsed.type.text === '不滅之火餘燼') {
      this.itemParsed.baseType = section[0]!
      return ParseResult.PARSE_SECTION_SUCC
    }
    if (this.itemParsed.type.text === '臟器') return ParseResult.PARSE_SECTION_SUCC

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
    section.shift()
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
    const sockets = section[0]!.replace(/R|G|B|W|S/g, '#')
    if (sockets.indexOf('#-#-#-#-#-#') > -1) {
      this.itemParsed.search6L = true
    }
    else if (['弓', '長杖', '雙手劍', '雙手斧', '雙手錘', '征戰長杖', '胸甲'].includes(this.itemParsed.type.text)) {
      this.itemParsed.search6L = false
    }

    if (isPOE2) {
      const count = countBy(sockets.split(''))['#']
      if (count) {
        this.itemParsed.socketCount = {
          min: count,
          max: count,
          search: !!this.itemParsed.isExcellenceItem
        }
      }
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

  private needFilterRegional(matchMods: ParsedAPIMod['entries']) {
    if (!this.itemParsed.isWeaponOrArmor) return false;
    if (!matchMods.find(ele => ele.text.endsWith(' (部分)'))) return false;
    if (this.itemParsed.type.option?.startsWith('armour') &&
      this.itemParsed.type.option !== 'armour.quiver' &&
      matchMods.some(ele => /閃避|護甲|能量護盾|保護/.test(ele.text))
    )
      return true;

    if (this.itemParsed.type.option?.startsWith('weapon') &&
      !matchMods.some(ele => /閃避|護甲|能量護盾|保護/.test(ele.text))
    )
      return true;
    return false;
  }
  private parseMod(section: string[], type: keyof ParsedAPIMods | 'mutated' | 'rune') {
    let modType = type
    const cleanSection = section.filter(line => !/^[{（].*[}）]( \(\w+\))?$/.test(line))
    const regSection = getStrReg(cleanSection, modType)
    if (modType === 'mutated' || modType === 'rune') modType = 'explicit'
    else modType = modType as keyof ParsedAPIMods
    if (!APImods[modType]) return ParseResult.PARSE_SECTION_FAIL
    const tempArr: ItemStat[] = []
    const notMatchMods: ItemStat[] = []

    for (let index = 0; index < regSection.length; index++) {
      const line = regSection[index]
      try {
        let matchMods = APImods[modType]?.entries.filter(mod => line.test(mod.text) || line.test(mod.text.replace(hasPossibilityReg, '')) || line.test(mod.text.split('\n').at(0) ?? ''))
        if (!matchMods?.length) {
          notMatchMods.push({ text: cleanSection[index], type: "未知", disabled: true, id: NOT_MATCHED_ID })
        }
        if (!matchMods || !matchMods.length) continue
        if (matchMods.length > 1) {
          matchMods = matchMods.filter(mod => !mod.text.endsWith('(古典)'))
          if (this.needFilterRegional(matchMods)) {
            matchMods = matchMods.filter(mod => mod.text.endsWith(' (部分)'))
          }
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
          return regSectionMultiLines.every((regSectionMultiLine, mi) => regSectionMultiLine.test(modMultiLine[mi] ?? '') || regSectionMultiLine.test(modMultiLine[mi]?.replace(hasPossibilityReg, '') ?? ''))
        })

        matchMods.forEach((_matchMod) => {
          const matchMod = structuredClone(_matchMod)
          const matchModMultiLineLength = matchMod.text.split('\n').length
          const matchReg = getModMatchRegex(matchMod.text)
          let regGroup = cleanSection.slice(index, index + matchModMultiLineLength).join('\n').match(matchReg)
          if (!regGroup && matchMod.text.match(hasPossibilityReg) && !line.source.match(hasPossibilityReg)) {
            regGroup = [line.source, '100']
          }
          regGroup?.shift()
          if (type === 'rune') {
            matchMod.id = matchMod.id.replace(/^explicit/, 'rune')
          }

          const isSearchWithEmptyValue = this.config.enableAutoEnableUniqueMods && this.itemParsed.raritySearch.value === 'unique' && matchMods.length === 1 && (type === 'explicit' || type === 'implicit')
          const baseOption: ItemStat = {
            ...matchMod,
            disabled: type === 'mutated' ? false : true,
            type: type === 'mutated' ? '穢生' : APImods[modType]?.type ?? type,
            searchWithEmptyValue: isSearchWithEmptyValue
          }
          if (regGroup?.length) {
            const diffSign = matchMod.text.match(/減少|增加|更多|更少/)?.[0] !== cleanSection[index]?.match(/減少|增加|更多|更少/)?.[0]
            let valueArr: string[] = [], lowerBoundArr: string[] = [], upperBoundArr: string[] = []
            regGroup.forEach((valueGroup) => {
              const valueMatch = valueGroup.match(numberPatternWithNameGroup)
              if (valueMatch?.groups) {
                valueArr.push(valueMatch.groups.value)
                lowerBoundArr.push(valueMatch.groups.lowerBound)
                upperBoundArr.push(valueMatch.groups.upperBound)
              }
            })
            const minValue = (diffSign ? -1 : 1) * (valueArr.reduce((pre, ele) => pre + Number(ele), 0) / valueArr.length)
            const lowerBound = (diffSign ? -1 : 1) * (lowerBoundArr.reduce((pre, ele) => pre + Number(ele), 0) / lowerBoundArr.length)
            const upperBound = (diffSign ? -1 : 1) * (upperBoundArr.reduce((pre, ele) => pre + Number(ele), 0) / upperBoundArr.length)
            tempArr.push({ value: { [diffSign ? 'max' : 'min']: minValue }, lowerBound, upperBound, ...baseOption })
          }
          else {
            tempArr.push({ ...baseOption })
          }
          index += matchModMultiLineLength - 1
        })
      }
      catch (e) {
        console.error(e)
      }
    }

    if (tempArr.length) {
      this.itemParsed.stats.push(...tempArr, ...notMatchMods)
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

  private parseVeiledMod(veiledSection: { line: string, advance: string }[]) {
    veiledSection.forEach(({ advance }) => {
      const veiledMod = advance.match(/{ .綴 "(.+)" }/)
      if (!veiledMod) return
      const matchMod = APImods.veiled?.entries.find(mod => mod.text === veiledMod[1])
      if (!matchMod) return
      this.itemParsed.stats.push({ ...matchMod, type: '隱匿', disabled: false })
    })
  }

  private parseExplicitMod(section: string[]) {
    if (!['魔法', '稀有', '傳奇'].includes(this.itemParsed.rarity)) return ParseResult.PARSE_SECTION_SKIP
    const explicitSection: string[] = [], fracturedSection: string[] = [], craftedSection: string[] = [], mutatedSection: string[] = [], veiledSection: { line: string, advance: string }[] = []
    let parsed = false
    let tempAdvanceLine = ''
    const advanceLineReg = /{ .+ }/
    for (let i = 0; i < section.length; i++) {
      const sectionLine = section[i]
      if (!sectionLine) continue
      if (/^（.*）$/.test(sectionLine)) continue;
      if (advanceLineReg.test(sectionLine)) {
        tempAdvanceLine = sectionLine
        continue
      }
      let j = i
      for (; j < section.length && !advanceLineReg.test(section[j]!); j++) {
        const line = section[j]
        if (!line) continue
        let type = line?.match(/fractured|crafted|mutated/)?.[0]
        if (tempAdvanceLine) {
          type = tempAdvanceLine?.startsWith('{ 已破裂') ? 'fractured' : tempAdvanceLine?.startsWith('{ 已大師工藝') ? 'crafted' : tempAdvanceLine?.startsWith('{ Foulborn') ? 'mutated' : type
        }

        match(type)
          .with('crafted', () => craftedSection.push(line))
          .with('fractured', () => fracturedSection.push(line))
          .with('mutated', () => mutatedSection.push(line))
          .otherwise(() => {
            if (line === '隱匿前綴' || line === '隱匿後綴') {
              veiledSection.push({ line, advance: tempAdvanceLine })
              return;
            }
            explicitSection.push(line)
          })
      }
      i = j - 1
      tempAdvanceLine = ''
    }

    if (craftedSection.length) parsed = this.parseMod(craftedSection, 'crafted') === ParseResult.PARSE_SECTION_SUCC || parsed
    if (fracturedSection.length) parsed = this.parseMod(fracturedSection, 'fractured') === ParseResult.PARSE_SECTION_SUCC || parsed
    if (explicitSection.length) parsed = this.parseMod(explicitSection, 'explicit') === ParseResult.PARSE_SECTION_SUCC || parsed
    if (mutatedSection.length) parsed = this.parseMod(mutatedSection, 'mutated') === ParseResult.PARSE_SECTION_SUCC || parsed
    if (veiledSection.length) this.parseVeiledMod(veiledSection)

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

  private parseMirrored(section: string[]) {
    if (!section.some(line => line === '已複製')) return ParseResult.PARSE_SECTION_SKIP
    this.itemParsed.isMirrored = true
    return ParseResult.PARSE_SECTION_SUCC
  }

  private parseCorrupt(section: string[]) {
    if (section[0]?.match(/^已汙染$/)) {
      this.itemParsed.isCorrupt = true
      return ParseResult.PARSE_SECTION_SUCC
    }
    if (section[0]?.match(/^二次汙染$/)) {
      this.itemParsed.isDoubleCorrupt = true
      return ParseResult.PARSE_SECTION_SUCC
    }
    return ParseResult.PARSE_SECTION_SKIP
  }

  private parseIdentify(section: string[]) {
    if (section[0]?.match(/^未鑑定(\(階級 \d\))?$/)) {
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
          eleRes += mod.value?.min ?? mod.value?.max ?? 0
          flag = true
        })
        .with(P.string.endsWith('stat_3441501978'), P.string.endsWith('stat_4277795662'), P.string.endsWith('stat_2915988346'), () => {
          eleRes += ((mod.value?.min ?? mod.value?.max ?? 0) * 2)
          flag = true
        })
        .with(P.string.endsWith('stat_2901986750'), () => {
          eleRes += ((mod.value?.min ?? mod.value?.max ?? 0) * 3)
          flag = true
        })
        .otherwise(() => { })
    })
    if (flag) {
      this.itemParsed.stats.push({ id: 'pseudo.pseudo_total_elemental_resistance', text: '+#% 元素抗性', type: '偽屬性', value: { min: eleRes }, disabled: true })
    }
  }

  private parseAllfuns(functions: ParseFun[] = this.parseFuns) {
    endFor:
    for (const fun of functions) {
      for (const section of this.itemSection) {
        if (!fun) continue
        const state = fun(section)
        if (state === ParseResult.PARSE_SECTION_SUCC) {
          this.itemSection.splice(this.itemSection.indexOf(section), 1)
          break
        }
        else if (state === ParseResult.PARSE_ITEM_SKIP) {
          break endFor
        }
      }
    }
  }

  private parseWeapon() {
    this.itemParsed.isWeaponOrArmor = true
    this.itemSection[0]?.forEach(line => {
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
    this.itemSection.shift()
    if (this.itemParsed.phyDamage && this.itemParsed.attackSpeed) this.itemParsed.pDPS = parseFloat((((this.itemParsed.phyDamage.min + this.itemParsed.phyDamage.max) / 2) * this.itemParsed.attackSpeed).toFixed(2))
    if (this.itemParsed.eleDamage && this.itemParsed.attackSpeed) this.itemParsed.eDPS = parseFloat((((this.itemParsed.eleDamage.min + this.itemParsed.eleDamage.max) / 2) * this.itemParsed.attackSpeed).toFixed(2))
    this.parseAllfuns()
  }

  private parseArmor() {
    this.itemParsed.isWeaponOrArmor = true
    this.itemSection[0]?.forEach(line => {
      let lineMatch: RegExpMatchArray | null
      if ((lineMatch = line.match(/品質: \+(\d+)%/))) this.itemParsed.quality.min = parseInt(lineMatch[1]!)
      else if ((lineMatch = line.match(/閃避值: (\d+)/))) this.itemParsed.evasion = parseInt(lineMatch[1]!)
      else if ((lineMatch = line.match(/護甲: (\d+)/))) this.itemParsed.armour = parseInt(lineMatch[1]!)
      else if ((lineMatch = line.match(/能量護盾: (\d+)/))) this.itemParsed.energyShield = parseInt(lineMatch[1]!)
    })
    this.itemSection.shift()
    this.parseAllfuns()
  }

  private parseClusterJewel() {
    const requirementSection = this.itemSection[0]
    if (!requirementSection) return
    if (this.parseRequirement(requirementSection) === ParseResult.PARSE_SECTION_SUCC) this.itemSection.shift()
    const ilvlSection = this.itemSection[0]
    const ilvlMatch = ilvlSection?.[0]?.match(/物品等級: (\d+)/)
    if (!ilvlMatch?.[1]) return
    const tempIlvl = parseInt(ilvlMatch[1])
    this.itemParsed.itemLevel = { min: tempIlvl >= 84 ? 84 : tempIlvl >= 75 ? 75 : tempIlvl >= 68 ? 68 : tempIlvl >= 50 ? 50 : 1, max: tempIlvl >= 84 ? 100 : tempIlvl >= 75 ? 83 : tempIlvl >= 68 ? 74 : tempIlvl >= 50 ? 67 : 49, search: true }
    this.itemSection.shift()
    if (this.itemParsed.rarity !== '傳奇') {
      const enchantSection = this.itemSection[0]
      if (!enchantSection) return
      this.parseEnchantMod(enchantSection.slice(0, 1))
      const nodeCountStat = this.itemParsed.stats[0]
      const nodeCountValue = nodeCountStat?.value
      if (!nodeCountValue || nodeCountValue.min === undefined) return
      match(this.itemParsed.baseType)
        .with('巨型星團珠寶', '小型星團珠寶', () => {
          nodeCountValue.max = nodeCountValue.min
        })
        .with('中型星團珠寶', () => {
          nodeCountValue.min = nodeCountValue.min === 6 ? 6 : 4
          nodeCountValue.max = nodeCountValue.min === 6 ? 6 : 5
        })
      let clusterType = enchantSection.find(ele => ele.startsWith('附加的小型天賦給予：'))
      if (!clusterType) return
      clusterType = clusterType.substring(0, clusterType.indexOf(' (enchant)'))
      const tempMod = APImods.enchant.entries.find(mod => mod.text.includes(clusterType))
      if (!tempMod) return
      this.itemParsed.stats.push({ ...tempMod, type: '附魔', disabled: false })
      this.itemParsed.stats.forEach(ele => ele.disabled = false)
      this.itemSection.shift()
    }
    this.parseAllfuns([this.parseCorrupt.bind(this), this.parseIdentify.bind(this), this.parseImplicitMod.bind(this), this.parseExplicitMod.bind(this)])
    this.itemParsed.autoSearch = true
  }

  // private parseForbiddenJewel(item: string[][]) {
  //   this.itemParsed.autoSearch = true
  //   for (const section of item) {
  //     if (this.parseCorrupt(section) === ParseResult.PARSE_SECTION_SUCC) continue
  //     const sectionMatch = section[0]!.match(/若禁忌(烈焰|血肉)上有符合的詞綴，配置 (.*)/)
  //     if (sectionMatch) {
  //       const type = sectionMatch[1]
  //       const passive = sectionMatch[2]!
  //       const matchStat = APImods.forbiddenJewel.entries.find(e => e.text.indexOf(type!) > -1)
  //       const matchPassive = matchStat?.option?.options.find(e => e.text === passive)
  //       this.itemParsed.stats.push({ id: matchStat!.id, text: matchStat!.text.replace('#', passive), value: { option: matchPassive?.id }, disabled: false })
  //     }
  //   }
  // }

  // private parseImpossibleEscape(item: string[][]) {
  //   this.itemParsed.autoSearch = true
  //   this.itemParsed.isCorrupt = true
  //   outer:
  //   for (const section of item) {
  //     for (const line of section) {
  //       const result = line.match(/天賦樹中在範圍(.+)內未連結的天賦仍然可以配置/)
  //       if (result) {
  //         const statDetail = APImods.explicit.mutiLines?.find(ele => ele.id === 'explicit.stat_2422708892')!
  //         const matchOption = statDetail.option?.options.find(ele => ele.text === result[1])
  //         this.itemParsed.stats.push({ id: statDetail.id, text: statDetail.text[0]!.replace('#', result[1]!), value: { option: matchOption?.id }, disabled: false })
  //         break outer
  //       }
  //     }
  //   }
  // }

  // private parseThreadOfHope(item: string[][]) {
  //   const parseRangeMod = (section: string[]) => {
  //     const mod = {
  //       id: 'explicit.stat_3642528642',
  //       text: '只會影響#範圍內的天賦',
  //       type: 'explicit',
  //       option: { options: [{ id: 1, text: '小' }, { id: 2, text: '中' }, { id: 3, text: '大' }, { id: 4, text: '非常大' }, { id: 5, text: '極大' }] }
  //     }
  //     const reg = new RegExp(`^${mod.text.replace('#', `(${mod.option.options.map(ele => ele.text).join('|')})`)}$`)
  //     this.parseExplicitMod(section)
  //     for (const line of section) {
  //       const match = line.match(reg)
  //       if (match) {
  //         const matchOption = mod.option?.options.find(ele => ele.text === match[1])
  //         this.itemParsed.stats.push({ id: mod.id, text: match[0], value: { option: matchOption?.id }, type: '隨機', disabled: false })
  //         return ParseResult.PARSE_SECTION_SUCC
  //       }
  //     }
  //     return ParseResult.PARSE_SECTION_SKIP
  //   }
  //   this.parseAllfuns([this.parseItemLevel.bind(this), this.parseCorrupt.bind(this), this.parseIdentify.bind(this), this.parseImplicitMod.bind(this), parseRangeMod])
  // }

  private parseOtherHaveMods() {
    if (this.itemParsed.name === '贗品．龍牙翱翔') {
      outer: for (const section of this.itemSection) {
        for (let index = 0; index < section.length; index++) {
          const match = section[index]!.match(/全部 ([^\s]+) 寶石等級 \+3/)
          if (match) section[index] = `全部 # 寶石等級 +${match[1]}`
        }
      }
    }
    this.parseAllfuns()
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

  private parseMap() {
    this.itemParsed.autoSearch = true
    const mapTier = this.itemParsed.baseType.match(/（階級 (\d{1,2})）/)
    if (mapTier) this.itemParsed.mapTier = { min: parseInt(mapTier[1]!), max: undefined, search: true }
    if (mapTier && this.itemParsed.raritySearch.value !== 'unique') this.itemParsed.type.searchByType = true
    const mapHeader = this.itemSection[0]
    if (!mapHeader) return
    mapHeader.forEach(line => {
      const completionMatch = line.match(/獎勵: 貼模 \((.+)\)/)
      if (completionMatch) this.itemParsed.map_completion_reward = completionMatch[1]
    })
    this.itemSection.shift()
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
    const parsedSections = new Set<string[]>()
    for (const section of this.itemSection) {
      for (const line of section) {
        if (line.includes('區域受到開創者的記憶影響')) {
          this.itemParsed.autoSearch = true
          this.itemParsed.memoryMap = true
        }
      }
    }
    this.itemSection = this.itemSection.filter(section => !parsedSections.has(section))
    if (this.itemParsed.map_completion_reward) {
      this.itemSection = this.itemSection.filter(section => !section[0]?.startsWith('怪物等級：'))
    }
    this.parseAllfuns()
    if (this.itemParsed.map_completion_reward) this.itemParsed.stats.forEach(stat => stat.disabled = false)
    this.itemParsed.stats.forEach(stat => {
      if (stat.type === '附魔') stat.disabled = false
      if (stat.id.startsWith('implicit.stat_3624393862') || stat.id.startsWith('implicit.stat_2563183002')) stat.disabled = false
    })
  }

  private parseGem() {
    this.itemParsed.autoSearch = true
    const gemHeader = this.itemSection[0]
    if (!gemHeader) return
    gemHeader.forEach(line => {
      let lineMatch: RegExpMatchArray | null
      if ((lineMatch = line.match(/等級: (\d+)/))) this.itemParsed.gemLevel = { min: parseInt(lineMatch[1]!), max: undefined, search: true }
      else if ((lineMatch = line.match(/品質: \+(\d+)%/))) this.itemParsed.quality = { min: parseInt(lineMatch[1]!), max: undefined, search: false }
    })
    this.itemParsed.quality.search = !(/啟蒙|賦予|增幅/.test(this.itemParsed.baseType))
    this.itemSection.shift()
    const parsedSections = new Set<string[]>()
    for (const section of this.itemSection.reverse()) {
      if (section[0]?.includes('瓦爾．')) {
        this.itemParsed.vaalVer = true
        this.itemParsed.vaalBaseType = section[0]
        parsedSections.add(section)
        continue
      }
      const isCorrupt = this.parseCorrupt(section) === ParseResult.PARSE_SECTION_SUCC
      const isImbued = this.parseMod(section, 'imbued') === ParseResult.PARSE_SECTION_SUCC
      if (isCorrupt || isImbued) parsedSections.add(section)
      if (isImbued) {
        const mod = this.itemParsed.stats.find(stat => stat.type === 'imbued')
        if (mod) {
          mod.disabled = false
          mod.type = '充能'
        }
      }
    }
    this.itemSection = this.itemSection.filter(section => !parsedSections.has(section))
    this.itemParsed.quality.search = !!(this.itemParsed.isCorrupt && this.itemParsed.quality.search)
  }

  private parseTemple() {
    this.itemSection.shift()
    const templeSection = this.itemSection[0]
    if (!templeSection) return
    this.itemSection[0] = templeSection.map(line => line.replace(/ \(階級 [123]\)/, ''))
    this.parseMod(this.itemSection[0], 'temple')
    this.itemParsed.stats = this.itemParsed.stats.filter(ele => ['多里亞尼之院', '腐敗之地', '祭祀之巔'].includes(ele.text as string)).map(ele => ({ ...ele, disabled: ele.text === '祭祀之巔' ? true : false }))
    this.itemParsed.autoSearch = true
  }

  private parseFlask() {
    this.itemSection[0]?.forEach(line => {
      const lineMatch = line.match(/品質: \+(\d+)%/)
      if (lineMatch) this.itemParsed.quality = { min: parseInt(lineMatch[1]!), max: undefined, search: true }
    })
    this.itemSection.shift()
    this.parseAllfuns()
  }

  private parseLogbook() {
    this.itemSection.shift()
    const itemLevelSection = this.itemSection[0]
    if (!itemLevelSection || this.parseItemLevel(itemLevelSection) !== ParseResult.PARSE_SECTION_SUCC) return
    this.itemSection.shift()
    const itemLevel = this.itemParsed.itemLevel
    if (!itemLevel || itemLevel.min === undefined) return
    itemLevel.min = Math.min(itemLevel.min, 83)
    const logbookTypes = { '破碎環之德魯伊': 'pseudo.pseudo_logbook_faction_druids', '黑鐮傭兵': 'pseudo.pseudo_logbook_faction_mercenaries', '聖杯之序': 'pseudo.pseudo_logbook_faction_order', '豔陽騎士': 'pseudo.pseudo_logbook_faction_knights' } as const
    const factionSections = new Set<string[]>()
    for (const section of this.itemSection) {
      if (section.length >= 2) {
        if (Object.keys(logbookTypes).includes(section[1]!)) {
          if (!this.itemParsed.stats.find(e => section[1] === e.text)) {
            this.itemParsed.stats.push({ id: logbookTypes[section[1] as keyof typeof logbookTypes], text: section[1]!, disabled: true })
          }
          factionSections.add(section)
        }
      }
    }
    this.itemSection = this.itemSection.filter(section => !factionSections.has(section))
  }

  private parseRGB(item: string[]) {
    for (const line of item) {
      if (line.startsWith('貼模傳奇')) {
        this.itemParsed.isRGB = false
        return ParseResult.PARSE_SECTION_SUCC
      }
    }
    return ParseResult.PARSE_SECTION_SKIP
  }

  private parseRelic() {
    const parsedSections = new Set<string[]>()
    for (const line of this.itemSection) {
      if (this.parseIdentify(line) === ParseResult.PARSE_SECTION_SUCC) {
        this.itemSection = this.itemSection.filter(section => section !== line)
        return
      }
      if (this.parseItemLevel(line) === ParseResult.PARSE_SECTION_SUCC) parsedSections.add(line)
    }
    this.itemSection.shift()
    const sanctumSection = this.itemSection[0]
    if (!sanctumSection) return
    if (this.parseMod(sanctumSection, 'sanctum') === ParseResult.PARSE_SECTION_SUCC) parsedSections.add(sanctumSection)
    this.itemSection = this.itemSection.filter(section => !parsedSections.has(section))
  }

  private parseBeastItem() {
    if (this.itemParsed.type.text !== "可堆疊通貨") return false
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

  private parseGraft() {
    this.parseAllfuns()
  }

  private parseTimelessJewel() {
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

  private parseJewel() {
    if (this.itemParsed.baseType.endsWith('星團珠寶')) {
      this.parseClusterJewel()
      return
    }
    let enableAllStats = false
    if (/^禁忌(血肉|烈焰)$/.test(this.itemParsed.name!)) {
      enableAllStats = true
    }
    else if (this.itemParsed.name === '逃脫不能') {
      enableAllStats = true
    }
    else if (this.itemParsed.name === '希望之絃') {
      this.itemSection.forEach(section => {
        section.forEach((line, index) => {
          const match = line.match(/(只會影響.+範圍內的天賦)/)
          if (match?.[1]) {
            section[index] = match[1]
          }
        })
      })
      enableAllStats = true
    }
    this.parseAllfuns()
    if (enableAllStats) this.itemParsed.stats.forEach(ele => ele.disabled = false)
    if (this.itemParsed.baseType === '永恆珠寶' && this.itemParsed.rarity === '傳奇') {
      this.parseTimelessJewel()
    }
  }
  private parseViscera() {
    this.parseAllfuns()
    this.itemParsed.stats.forEach(stat => {
      if (stat.type === '固定') {
        stat.disabled = false
        if (stat.lowerBound && stat.upperBound && stat.value) {
          const [lowerBound, upperBound] = [stat.lowerBound, stat.upperBound].sort((a, b) => a - b)
          stat.value.min = !isUndefined(stat.value.min) ? Math.max(stat.value.min, lowerBound) : lowerBound
          stat.value.max = upperBound

        }
      }
    })
    this.itemParsed.autoSearch = true
    if (this.itemParsed.itemLevel) this.itemParsed.itemLevel.search = false
  }
}

export function itemAnalyze(item: string) {
  return new ItemAnalyzer().analyze(item)
}

