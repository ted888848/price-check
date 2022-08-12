import { ipcRenderer } from 'electron'
import IPC from '@/ipc/ipcChannel'
import { APIitems, APImods } from './setupAPI'
import { cloneDeep } from 'lodash-es'

const PARSE_SECTION_FAIL = 0, PARSE_SECTION_SUCC = 1, PARSE_SECTION_SKIP = 2, PARSE_ITEM_SKIP = 3
let itemParsedSample = {
	type: undefined,
	baseType: undefined,
	name: undefined,
	uniques: undefined,
	raritySearch: undefined,
	rarity: undefined,
	itemLevel: undefined,
	isWeaponOrArmor: false,
	isCorrupt: false,
	isIdentify: undefined,
	quality: { min: undefined, max: undefined, search: false },
	autoSearch: true,
	searchTwoWeekOffline: false,
	searchExchange: { option: false, have: 'chaos' }
}
let itemParsed = cloneDeep(itemParsedSample)
let parseFuns = [
	parseRequirement,
	parseSocket,
	parseItemLevel,
	parseInfluence,
	parseCorrupt,
	parseImplicitMod,
	parseIdentify,
	parseEnchantMod,
	parseExplicitMod,
]
function findUnique(type, isFinded) {
	if (isFinded.flag) return null
	let temp = []
	for (let ele of APIitems[type].entries) {
		if (ele.type === itemParsed.baseType) {
			temp = [...ele.unique]
			break
		}
	}
	if (temp.length) itemParsed.uniques = temp
	isFinded.flag = true
}
export function itemAnalyze(item) {
	itemParsed = cloneDeep(itemParsedSample)
	let itemArr = item.split(/\r?\n/)
	itemArr.pop()
	let itemSection = [[]]
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
	if (parseItemName(itemSection[0], itemSection) === PARSE_SECTION_FAIL) return null
	itemSection.shift()
	let isFindUnique = { flag: false }
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
			findUnique('weapons', isFindUnique)
			parseWeapon(itemSection)
			break;
		case '手套':
		case '鞋子':
		case '胸甲':
		case '頭部':
		case '盾':
			findUnique('armour', isFindUnique)
			parseArmor(itemSection)
			break
		case '生命藥劑':
		case '魔力藥劑':
		case '複合藥劑':
		case '功能藥劑':
			findUnique('flasks', isFindUnique)
			parseFlask(itemSection)
			break
		case '項鍊':
		case '戒指':
		case '腰帶':
			findUnique('accessories', isFindUnique)
		//falls through
		case '永恆珠寶':
		case '珠寶':
		case '深淵珠寶':
			findUnique('jewels', isFindUnique)
		//falls through
		case '輿圖升級道具':
		//falls through
		case '箭袋':
		case '飾品':
		case '劫盜裝備':
		case '守望號令':
			parseOtherNeedMods(itemSection)
			break
		case '異界地圖':
			findUnique('maps', isFindUnique)
			parseMap(itemSection)
			break
		case '契約書':
			findUnique('heistmission', isFindUnique)
		//falls through
		case '可堆疊通貨':
		case '地圖碎片':
		case '掘獄可堆疊有插槽通貨': {
			itemParsed.searchExchange.option = true
			let searchExchangeExalted = ipcRenderer.sendSync(IPC.GET_CONFIG).searchExchangeExalted
			itemParsed.searchExchange.have = searchExchangeExalted ? 'exalted' : 'chaos'
			break
		}
		case '主動技能寶石':
		case '輔助技能寶石':
			parseGem(itemSection)
			break
		case '探險日誌':
			parseLogbook(itemSection)
			break
		case '命運卡':
		case '其它':
			break
		default:
			break
	}
	parsePseudoEleResistance()
	if (itemParsed.raritySearch.label === '傳奇' && itemParsed.name) itemParsed.autoSearch = true
	if (itemParsed.baseType === '阿茲瓦特史記') parseTample(itemSection)
	else if (itemParsed.baseType === '充能的羅盤') parseWatchstone(itemSection)
	return cloneDeep(itemParsed)
}
function parseItemName(section, itemSection) {
	if (!section[0].startsWith('物品種類:')) return PARSE_SECTION_FAIL
	if (section[2] === "你無法使用這項裝備，它的數值將被忽略") {
		section.pop()
		section.push(...(itemSection.splice(1, 1)[0]))
	}
	let typeTrans = {
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
		手套: 'armour.gloves',
		鞋子: 'armour.boots',
		胸甲: 'armour.chest',
		頭部: 'armour.helmet',
		箭袋: 'armour.quiver',
		盾: 'armour.shield',
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
		守望號令: 'sentinel'
	}
	let rarityOptions = [
		{
			id: undefined,
			label: "任何"
		},
		{
			id: 'normal',
			label: "普通"
		},
		{
			id: 'magic',
			label: "魔法"
		},
		{
			id: 'rare',
			label: "稀有"
		},
		{
			id: 'unique',
			label: "傳奇"
		},
		{
			id: 'nonunique',
			label: "非傳奇"
		},
	]
	let temp = section[0].match(/物品種類: ([^\n]+)/)[1]
	itemParsed.type = { text: temp, option: typeTrans?.[temp], searchByType: false }
	itemParsed.rarity = section[1].match(/稀有度: ([^\n]+)/)[1]

	if (['普通', '魔法', '稀有'].includes(itemParsed.rarity)) {
		itemParsed.raritySearch = rarityOptions[5]
	}
	else if (itemParsed.rarity === '傳奇') {
		itemParsed.raritySearch = rarityOptions[4]
	}
	else {
		itemParsed.raritySearch = rarityOptions[0]
	}
	if (section.length >= 4) {
		itemParsed.name = section[2]
		if (section[3].startsWith('追憶之')) section[3] = section[3].substring(4)
		itemParsed.baseType = section[3]
	}
	else {
		if (section[2].startsWith('精良的')) section[2] = section[2].substring(4)
		if (section[2].startsWith('追憶之')) section[2] = section[2].substring(4)
		if (itemParsed.rarity === '魔法') {
			let tempName = section[2]
			let index = tempName.indexOf('之')
			if (index > -1) {
				itemParsed.baseType = tempName.substring(index + 1)
				itemParsed.name = tempName.substring(0, index + 1)
			}
			else {
				index = tempName.indexOf('的')
				itemParsed.baseType = tempName.substring(index + 1)
				itemParsed.name = tempName.substring(0, index + 1)
			}
		}
		else {
			itemParsed.baseType = section[2]
		}
	}
	return PARSE_SECTION_SUCC
}
function parseRequirement(section) { //true = suss
	if (!section[0].startsWith('需求:')) return PARSE_SECTION_SKIP
	section.forEach(line => {
		if (line.startsWith('等級:')) {
			itemParsed.requireLevel = parseInt(line.match(/等級: (\d+)/)[1], 10)
		}
		else if (line.startsWith('智慧:')) {
			itemParsed.requireInt = parseInt(line.match(/智慧: (\d+)/)[1], 10)
		}
		else if (line.startsWith('力量:')) {
			itemParsed.requireStr = parseInt(line.match(/力量: (\d+)/)[1], 10)
		}
		else if (line.startsWith('敏捷:')) {
			itemParsed.requireDex = parseInt(line.match(/敏捷: (\d+)/)[1], 10)
		}
	})
	return PARSE_SECTION_SUCC
}
function parseSocket(section) {
	if (!section[0].startsWith('插槽')) return PARSE_SECTION_SKIP
	let sockets = section[0].replace(/R|G|B|W/g, '#')
	if (sockets.indexOf('#-#-#-#-#-#') > -1) {
		itemParsed.search6L = true
	}
	return PARSE_SECTION_SUCC
}
function parseItemLevel(section) {
	if (!section[0].startsWith('物品等級:')) return PARSE_SECTION_SKIP
	let il = parseInt(section[0].match(/物品等級: (\d+)/)[1])
	itemParsed.itemLevel = { min: il > 86 ? 86 : il, max: undefined, search: itemParsed.rarity !== '傳奇' }
	return PARSE_SECTION_SUCC
}
function getStrReg(section, type) {
	let retArr = []
	section.forEach(line => {
		let _line = line.substring(0, line.indexOf(` (${type})`))
		_line = _line ? _line : line
		retArr.push(new RegExp(String.raw`^${_line.replace(/[+-]?\d+(\.\d+)?/g, String.raw`[+-]?(\d+|#)`).replace(/減少|增加/, String.raw`(?:減少|增加)`)}( \(部分\))?$`))
	})
	return retArr
}
function parseMutilineMod(regSection, section, type) {
	if (!APImods[type].mutiLines) return
	let temp = []
	for (let i = 0; i < regSection.length; ++i) {
		let matchMod = APImods[type].mutiLines.filter(s => regSection[i].test(s.text[0]))
		outer:
		for (let mMod of matchMod) {
			let flag = true
			for (let index in mMod.text) {
				if ((i + (+index)) >= regSection.length || !regSection[i + (+index)].test(mMod.text[+index])) {
					flag = false
					break
				}
			}
			if (flag) {
				let matchReg = mMod.text.map(mod => new RegExp(mod.replace(/#/g, String.raw`[+-]?(\d+(?:\.\d+)?)`).replace(' (部分)', '').replace(/減少|增加/, String.raw`(?:減少|增加)`)))
				let tempGroup = { ...mMod }
				let tempValue = 0
				let valueCount = 0
				for (let ind in matchReg) {
					let regGroup = section[i + (+ind)].match(matchReg[ind])
					if (!regGroup) continue outer
					regGroup.shift()
					if (regGroup.length) tempValue = regGroup.reduce((pre, ele) => { valueCount++; return pre + Number(ele) }, tempValue)
				}
				section.splice(i, tempGroup.text.length)
				regSection.splice(i, tempGroup.text.length)
				i -= tempGroup.text.length
				i = i < 0 ? -1 : i
				if (tempValue)
					temp.push({ ...tempGroup, value: { min: tempValue / valueCount }, disabled: true })
				else
					temp.push({ ...tempGroup, disabled: true })
			}
		}
	}
	if (temp.length) {
		itemParsed[type] = temp
	}
}
function parseMod(section, type) {
	let regSection = getStrReg(section, type)
	parseMutilineMod(regSection, section, type)
	let temp = []
	regSection.forEach((line, index) => {
		let matchMod = APImods[type].entries.filter(s => line.test(s.text))
		if (matchMod.length > 1) {
			if (itemParsed.isWeaponOrArmor && matchMod.find(ele => ele.text.endsWith(' (部分)')))
				matchMod = matchMod.filter(mod => mod.text.endsWith(' (部分)'))
			else {
				matchMod = matchMod.filter(mod => !mod.text.endsWith(' (部分)'))
				let regTemp = section[index].match(/增加|減少/)?.[0]
				if (regTemp)
					matchMod = matchMod.filter(mod => mod.text.includes(regTemp))
			}
		}
		if (!matchMod.length) return false
		let matchReg = new RegExp(matchMod[0].text.replace(/#/g, String.raw`([+-]?\d+(?:\.\d+)?)`).replace(' (部分)', '').replace(/減少|增加/, String.raw`(?:減少|增加)`))
		let regGroup = section[index].match(matchReg)
		regGroup?.shift()
		let isDisabled = !(type === 'enchant')
		if (regGroup?.length) temp.push({ ...matchMod[0], value: { min: regGroup.reduce((pre, ele) => pre + Number(ele), 0) / regGroup.length }, disabled: isDisabled })
		else temp.push({ ...matchMod[0], disabled: isDisabled })
		if (temp[temp.length - 1].value && (matchMod[0].text.match(/減少|增加/)?.[0] !== section[index].match(/減少|增加/)?.[0]))
			temp[temp.length - 1].value.min = -temp[temp.length - 1].value.min
	})
	if (temp.length) {
		if (!itemParsed[type]) itemParsed[type] = []
		itemParsed[type] = temp.concat(itemParsed[type])
		return PARSE_SECTION_SUCC
	}
	else {
		return PARSE_SECTION_SKIP
	}
}
function parseEnchantMod(section) {
	if (!section.find(line => line.endsWith('(enchant)'))) return PARSE_SECTION_SKIP
	if (parseMod(section, 'enchant') === PARSE_SECTION_SUCC) return PARSE_SECTION_SUCC
	return PARSE_SECTION_FAIL
}
function parseImplicitMod(section) {
	if (!section.find(line => line.endsWith('(implicit)'))) return PARSE_SECTION_SKIP
	if (parseMod(section, 'implicit') === PARSE_SECTION_SUCC) return PARSE_SECTION_SUCC
	return PARSE_SECTION_FAIL
}
function parseExplicitMod(section) {
	if (itemParsed !== '魔法' || itemParsed !== '稀有' || itemParsed !== '傳奇') PARSE_SECTION_SKIP
	let explicitSection = [],
		fracturedSection = [],
		craftedSection = []
	let parsed = false
	section.forEach(line => {
		let type = line.match(/fractured|crafted/)
		switch (type?.[0]) {
			case 'crafted':
				craftedSection.push(line)
				break
			case 'fractured':
				fracturedSection.push(line)
				break
			default:
				explicitSection.push(line)
				break
		}
	})
	if (craftedSection.length) parsed = parseMod(craftedSection, 'crafted') === PARSE_SECTION_SUCC || parsed
	if (fracturedSection.length) parsed = parseMod(fracturedSection, 'fractured') === PARSE_SECTION_SUCC || parsed
	explicitSection = explicitSection.filter(line => line !== '隱匿前綴' && line !== '隱匿後綴')
	if (explicitSection.length) parsed = parseMod(explicitSection, 'explicit') === PARSE_SECTION_SUCC || parsed
	if (parsed) return PARSE_SECTION_SUCC
	else return PARSE_SECTION_SKIP
}
function parseInfluence(section) {
	let influences = [
		{
			text: "破裂之物"
		},
		{
			text: "追憶之物"
		},
		{
			id: "pseudo.pseudo_has_shaper_influence",
			text: "塑者之物",
			label: "塑者"
		},
		{
			id: "pseudo.pseudo_has_elder_influence",
			text: "尊師之物",
			label: "尊師"
		},
		{
			id: "pseudo.pseudo_has_crusader_influence",
			text: "聖戰軍王物品",
			label: "聖戰"
		},
		{
			id: "pseudo.pseudo_has_redeemer_influence",
			text: "救贖者物品",
			label: "救贖"
		},
		{
			id: "pseudo.pseudo_has_hunter_influence",
			text: "狩獵者物品",
			label: "狩獵"
		},
		{
			id: "pseudo.pseudo_has_warlord_influence",
			text: "總督軍物品",
			label: "督軍"
		}]
	let tempInfluences = []
	section.forEach(line => {
		let influence = influences.find(inf => inf.text === line)
		if (influence?.text === '破裂之物') itemParsed.isFractured = true
		else if (influence?.text === '追憶之物') itemParsed.isSynthesised = true
		else if (influence) tempInfluences.push(influence)
	})
	if (tempInfluences.length) {
		itemParsed.influences = tempInfluences
		return PARSE_SECTION_SUCC
	}
	else {
		return PARSE_SECTION_SKIP
	}
}
function parseCorrupt(section) {
	if (section[0].match(/^已汙染$/)) {
		itemParsed.isCorrupt = true
		return PARSE_SECTION_SUCC
	}
	else {
		return PARSE_SECTION_SKIP
	}
}
function parseIdentify(section) {
	if (section[0].match(/^未鑑定$/)) {
		itemParsed.isIdentify = false
		return PARSE_ITEM_SKIP
	}
	else {
		return PARSE_SECTION_SKIP
	}
}
function parsePseudoEleResistance() {
	let eleRes = 0
	function fun(arr) {
		arr.forEach(mod => {
			switch (true) {
				case mod.id.endsWith('stat_3372524247') || mod.id.endsWith('stat_1671376347') || mod.id.endsWith('stat_4220027924'):
					eleRes += mod.value.min
					break
				case mod.id.endsWith('stat_3441501978') || mod.id.endsWith('stat_4277795662') || mod.id.endsWith('stat_2915988346'):
					eleRes += (mod.value.min * 2)
					break
				case mod.id.endsWith('stat_2901986750'):
					eleRes += (mod.value.min * 3)
					break
			}
		})
	}
	if (itemParsed.implicit) fun(itemParsed.implicit)
	if (itemParsed.explicit) fun(itemParsed.explicit)
	if (itemParsed.fractured) fun(itemParsed.fractured)
	if (itemParsed.crafted) fun(itemParsed.crafted)
	if (eleRes) {
		itemParsed.pseudo = {
			id: "pseudo.pseudo_total_elemental_resistance",
			text: "+#% 元素抗性",
			type: "偽屬性",
			value: { min: eleRes },
			disabled: true
		}
	}
}
function parseAllfuns(item) {
	for (let fun of parseFuns) {
		let state
		for (let section of item) {
			state = fun(section)
			if (state === PARSE_SECTION_SUCC) {
				item = item.filter(s => s !== section)
				break
			}
			else if (state === PARSE_ITEM_SKIP) {
				break
			}
		}
		if (state === PARSE_ITEM_SKIP) break
	}
}
function parseWeapon(item) {
	itemParsed.isWeaponOrArmor = true
	itemParsed.autoSearch = false
	item[0].forEach(line => { //parse Damage Section
		if (line.startsWith('品質: ')) {
			itemParsed.quality = { min: parseInt(line.match(/品質: \+(\d+)%/)[1]), max: undefined, search: true }
		}
		else if (line.startsWith('物理傷害: ')) {
			let phyDamage = { min: 0, max: 0 }
			phyDamage.min = parseInt(line.match(/物理傷害: (\d+)-(\d+)/)[1], 10)
			phyDamage.max = parseInt(line.match(/物理傷害: (\d+)-(\d+)/)[2], 10)
			itemParsed.phyDamage = { ...phyDamage }
		}
		else if (line.startsWith('元素傷害: ')) {
			let eleDamage = { min: 0, max: 0 }
			eleDamage.min = parseInt(line.match(/元素傷害: (\d+)-(\d+)/)[1], 10)
			eleDamage.max = parseInt(line.match(/元素傷害: (\d+)-(\d+)/)[2], 10)
			itemParsed.eleDamage = { ...eleDamage }
		}
		else if (line.startsWith('暴擊率: ')) {
			itemParsed.critChance = parseFloat(line.match(/暴擊率: (\d+\.?\d\d)%/)[1])
		}
		else if (line.startsWith('每秒攻擊次數: ')) {
			itemParsed.attackSpeed = parseFloat(line.match(/每秒攻擊次數: (\d+\.?\d\d)/)[1])
		}
		else if (line.startsWith('武器範圍: ')) {
			itemParsed.weaponArea = parseInt(line.match(/武器範圍: (\d+)/)[1])
		}
	})
	item.shift()
	if (itemParsed.phyDamage) itemParsed.pDPS = parseFloat(((itemParsed.phyDamage.min + itemParsed.phyDamage.max) / 2 * itemParsed.attackSpeed).toFixed(2))
	if (itemParsed.eleDamage) itemParsed.eDPS = parseFloat(((itemParsed.eleDamage.min + itemParsed.eleDamage.max) / 2 * itemParsed.attackSpeed).toFixed(2))
	parseAllfuns(item)
}
function parseArmor(item) {
	itemParsed.isWeaponOrArmor = true
	itemParsed.autoSearch = false
	item[0].forEach(line => { //parse Damage Section
		if (line.startsWith('品質: ')) {
			itemParsed.quality.min = parseInt(line.match(/品質: \+(\d+)%/)[1])
		}
		else if (line.startsWith('閃避值: ')) {
			itemParsed.evasion = parseInt(line.match(/閃避值: (\d+)/)[1])
		}
		else if (line.startsWith('護甲: ')) {
			itemParsed.armour = parseInt(line.match(/護甲: (\d+)/)[1])
		}
		else if (line.startsWith('能量護盾: ')) {
			itemParsed.energyShield = parseInt(line.match(/能量護盾: (\d+)/)[1])
		}
	})
	item.shift()
	parseAllfuns(item)
}
function parseClusterJewel(item) {
	if (parseRequirement(item[0]) === PARSE_SECTION_SUCC) item.shift()
	let temp = parseInt(item[0][0].match(/物品等級: (\d+)/)[1])
	itemParsed.itemLevel = temp >= 84 ? 84 : temp >= 75 ? 75 : temp >= 68 ? 68 : temp >= 50 ? 50 : 1
	item.shift()
	// enchant
	if (itemParsed.rarity !== '傳奇') {
		parseEnchantMod(item[0].slice(0, 2))
		// if(parseEnchantMod(item[0].slice(0, 2))===PARSE_SECTION_SUCC) item[0].splice(0,2)
		switch (itemParsed.baseType) {
			case '巨型星團珠寶':
			case '小型星團珠寶':
				itemParsed.enchant[0].value.max = itemParsed.enchant[0].value.min
				break
			case '中型星團珠寶':
				temp = itemParsed.enchant[0].value.min
				itemParsed.enchant[0].value.min = temp === 6 ? 6 : 4
				itemParsed.enchant[0].value.max = temp === 6 ? 6 : 5
				break
		}
		temp = item[0].find(ele => ele.startsWith('附加的小型天賦給予：'))
		temp = temp.substring(10, temp.indexOf(' (enchant)'))
		temp = APImods.clusterJewel.entries.find(mod => mod.text.includes(temp))
		if (temp.text.endsWith('(古典)') && itemParsed.baseType === '小型星團珠寶') {
			let tempText = temp.text.substring(0, temp.text.length - 5)
			console.log(tempText)
			temp = APImods.clusterJewel.entries.reverse().find(mod => mod.text.includes(tempText))
		}

		itemParsed.enchant.push({ id: "enchant.stat_3948993189", text: temp.text.split('\n'), value: { option: temp.id }, type: '附魔', disabled: false })
		itemParsed.enchant.forEach(ele => ele.disabled = false)
		item.shift()
	}
	let _parseFuns = [
		parseCorrupt,
		parseIdentify,
		parseImplicitMod,
		parseExplicitMod,
	]
	for (let fun of _parseFuns) {
		let state
		for (let section of item) {
			state = fun(section)
			if (state === PARSE_SECTION_SUCC) {
				item = item.filter(s => s !== section)
				break
			}
			else if (state === PARSE_ITEM_SKIP) {
				break
			}
		}
		if (state === PARSE_ITEM_SKIP) break
	}
}
function parseForbiddenJewel(item) {
	for (let section of item) {
		if (parseCorrupt(section) === PARSE_SECTION_SUCC) continue;
		if (/^若禁忌(烈焰|血肉)上有符合的詞綴，配置/.test(section[0])) {
			let match = section[0].match(/若禁忌(烈焰|血肉)上有符合的詞綴，配置 (.*)/)
			if (!match) return
			let type = match[1]
			let passive = match[2]
			let matchStat = APImods.forbiddenJewel.entries.find(e => e.text.indexOf(type) > -1)
			console.log(matchStat)
			let matchPassive = matchStat.option.options.find(e => e.text === passive)
			console.log(matchPassive)
			itemParsed.explicit = [{ id: matchStat.id, text: matchStat.text.replace('#', passive), value: { option: matchPassive.id }, disabled: false }]

		}
	}
}
function parseWatchstone(item) {
	itemParsed.autoSearch = true
	console.log(item)
	for (let section of item) {
		console.log(section)
		for (let index in section) {
			if (section[index].startsWith('你地圖中')) {
				section[index] = section[index].replace(/你地圖中[有的]?\s?/, '')
			}
		}
		console.log(section)
		if (parseEnchantMod(section) === PARSE_SECTION_SUCC)
			return
	}
}
function parseOtherNeedMods(item) {
	itemParsed.autoSearch = false
	if (itemParsed.baseType.endsWith('星團珠寶')) {
		parseClusterJewel(item)
		return
	}
	else if (itemParsed.baseType.endsWith("虛空石")) {
		parseWatchstone(item)
		return
	}
	else if (/^禁忌(血肉|烈焰)$/.test(itemParsed.name)) {
		parseForbiddenJewel(item)
		return
	}
	parseAllfuns(item)
	if (itemParsed.type?.option === 'sentinel') {
		delete itemParsed.isCorrupt
	}
}
function parseMap(item) {
	itemParsed.autoSearch = false
	let elderMap = {
		id: "implicit.stat_3624393862",
		text: "地圖被 # 佔據",
		type: "implicit",
		options: [
			{
				id: 1,
				text: "異界．奴役"
			},
			{
				id: 2,
				text: "異界．根除"
			},
			{
				id: 3,
				text: "異界．干擾"
			},
			{
				id: 4,
				text: "異界．淨化"
			}
		]
	}
	let conquerorMap = {
		id: "implicit.stat_2563183002",
		text: "地圖含有 # 的壁壘",
		type: "implicit",
		options: [
			{
				id: 1,
				text: "巴倫"
			},
			{
				id: 2,
				text: "維羅提尼亞"
			},
			{
				id: 3,
				text: "奧赫茲明"
			},
			{
				id: 4,
				text: "圖拉克斯"
			}
		]
	}
	item[0].forEach(line => {
		if (line.startsWith('地圖階級: ')) {
			itemParsed.mapTier = { min: parseInt(line.match(/地圖階級: (\d+)/)[1]), max: undefined, search: true }
		}
	})
	item.shift()
	switch (true) {
		case itemParsed.baseType.startsWith('凋落的'):
			itemParsed.baseType = itemParsed.baseType.substring(4)
			itemParsed.blightedMap = true
			break
		case itemParsed.baseType.startsWith('凋落蔓延的'):
			itemParsed.baseType = itemParsed.baseType.substring(6)
			itemParsed.UberBlightedMap = true
			break
		default:
			break
	}
	for (let section of item) {
		if (section[0].includes('區域被異界尊師控制') && section.length > 1) {
			let match = elderMap.options.filter(ele => section[1].includes(`地圖被${ele.text}佔據`))[0]
			if (match) {
				itemParsed.type.searchByType = true
				itemParsed.autoSearch = true
				itemParsed.elderMap = {
					id: "implicit.stat_3624393862",
					value: { option: match.id },
					disabled: false
				}
			}
		}
		else if (section[0].startsWith('地圖含有') && section.length > 1) {
			let match = conquerorMap.options.filter(ele => section[0].includes(`地圖含有${ele.text}的壁壘`))[0]
			if (match) {
				itemParsed.type.searchByType = true
				itemParsed.autoSearch = true
				itemParsed.conquerorMap = {
					id: "implicit.stat_2563183002",
					value: { option: match.id },
					disabled: false
				}
			}
		}
	}
	for (let section of item) {
		parseCorrupt(section)
		if (parseIdentify(section) === PARSE_ITEM_SKIP) break
	}
}
function parseGem(item) {
	itemParsed.autoSearch = true
	let isAltQ = false
	let altQTrans = {
		異常的: 1,
		相異的: 2,
		幻影的: 3
	}
	item[0].forEach(line => {
		if (line.startsWith('等級: ')) {
			itemParsed.gemLevel = { min: parseInt(line.match(/等級: (\d+)/)[1]), max: undefined, search: true }
		}
		else if (line.startsWith('品質: ')) {
			itemParsed.quality = { min: parseInt(line.match(/品質: \+(\d+)%/)[1]), max: undefined, search: true }

		}
		else if (line.startsWith('替代品質')) {
			isAltQ = true
		}
	})
	item.shift()
	let vaalLine
	for (let section of item.reverse()) {
		if (parseCorrupt(section) === PARSE_SECTION_SUCC) {
			for (section of item) {
				if (section[0].includes('瓦爾．')) {
					itemParsed.vaalVer = true
					vaalLine = section[0]
					break
				}
			}
			if (itemParsed.vaalVer) break
		}
	}
	if (isAltQ) {
		if (itemParsed.vaalVer) {
			itemParsed.altQType = altQTrans[vaalLine.slice(0, 3)]
			itemParsed.baseType = vaalLine.substring(4)
		}
		else {
			itemParsed.altQType = altQTrans[itemParsed.baseType.slice(0, 3)]
			itemParsed.baseType = itemParsed.baseType.substring(4)
		}
	}
	else {
		if (itemParsed.vaalVer) {
			itemParsed.baseType = vaalLine
		}
		itemParsed.altQType = 0
	}

}
function parseTample(item) {
	itemParsed.autoSearch = false
	item.shift()
	item[0] = item[0].map(line => line.replace(/ \(階級 [123]\)/, ''))
	parseMod(item[0], 'temple')
	itemParsed.temple = itemParsed.temple.filter(ele => ['多里亞尼之院', '腐敗之地', '祭祀之巔'].includes(ele.text))
	itemParsed.temple.forEach(ele => {
		delete ele.option
		ele.value = { option: 1 }
	})
}
function parseFlask(item) {
	itemParsed.autoSearch = false
	item[0].forEach(line => {
		if (line.startsWith('品質: ')) {
			itemParsed.quality = { min: parseInt(line.match(/品質: \+(\d+)%/)[1]), max: undefined, search: true }
		}
	})
	item.shift()
	parseAllfuns(item)
}

function parseLogbook(item) {
	itemParsed.autoSearch = false
	item.shift()
	parseItemLevel(item[0])
	item.shift()
	itemParsed.itemLevel = itemParsed.itemLevel > 83 ? 83 : itemParsed.itemLevel
	let logbookTypes = {
		'破碎環之德魯伊': 'pseudo.pseudo_logbook_faction_druids',
		'黑鐮傭兵': 'pseudo.pseudo_logbook_faction_mercenaries',
		'聖杯之序': 'pseudo.pseudo_logbook_faction_order',
		'豔陽騎士': 'pseudo.pseudo_logbook_faction_knights',
	}
	for (let section of item) {
		if (section.length >= 2) {
			if (Object.keys(logbookTypes).includes(section[1])) {
				itemParsed.explicit = itemParsed.explicit ?? []
				if (!itemParsed.explicit.find(e => section[1] === e.text)) {
					itemParsed.explicit.push({ id: logbookTypes[section[1]], text: section[1], disabled: true })
				}
				item = item.filter(s => s !== section)
			}
		}
	}

}
