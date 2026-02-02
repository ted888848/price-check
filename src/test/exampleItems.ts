export default {
  "items": [
    {
      "name": "魔血",
      "text": "物品種類: 腰帶\n稀有度: 傳奇\n魔血\n重革腰帶\n--------\n需求:\n等級: 44\n--------\n物品等級: 84\n--------\n雷霆增加 18% 光環效果 (implicit)\n--------\n+41 敏捷\n+21% 火焰抗性\n+24% 冰冷抗性\n魔法功能藥劑不能使用\n最左邊 2 的魔法功能藥劑持續套用它的藥劑效果至你身上\n魔法功能藥劑效果不能被移除\n--------\n權力的河流流過你的血管。\n--------\n已汙染\n--------\n備註: ~b/o 110 divine\n",
      "result": {
        type: { text: '腰帶', option: 'accessory.belt', searchByType: false },
        baseType: '重革腰帶',
        name: '魔血',
        raritySearch: { value: 'unique', label: '傳奇' },
        rarity: '傳奇',
        itemLevel: { min: 84, max: undefined, search: false },
        isWeaponOrArmor: false,
        isCorrupt: true,
        stats: [
          {
            id: 'implicit.stat_2181791238',
            text: '雷霆增加 #% 光環效果',
            type: '固定',
            value: { min: 18 },
            disabled: true
          },
          {
            id: 'explicit.stat_3261801346',
            text: '+# 敏捷',
            type: '隨機',
            value: { min: 41 },
            disabled: true
          },
          {
            id: 'explicit.stat_3372524247',
            text: '+#% 火焰抗性',
            type: '隨機',
            value: { min: 21 },
            disabled: true
          },
          {
            id: 'explicit.stat_4220027924',
            text: '+#% 冰冷抗性',
            type: '隨機',
            value: { min: 24 },
            disabled: true
          },
          {
            id: 'explicit.stat_3986704288',
            text: '魔法功能藥劑不能使用',
            type: '隨機',
            disabled: true
          },
          {
            id: 'explicit.stat_2388347909',
            text: '最左邊 # 的魔法功能藥劑持續套用它的藥劑效果至你身上',
            type: '隨機',
            value: { min: 2 },
            disabled: true
          },
          {
            id: 'explicit.stat_344389721',
            text: '魔法功能藥劑效果不能被移除',
            type: '隨機',
            disabled: true
          },
          {
            id: 'pseudo.pseudo_total_elemental_resistance',
            text: '+#% 元素抗性',
            type: '偽屬性',
            value: { min: 45 },
            disabled: true
          }
        ],
        influences: [],
        quality: { search: false },
      }
    },
    {
      name: "破裂手套",
      "text": "物品種類: 手套\n稀有度: 稀有\n禍害 護掌\n聖騎士手套\n--------\n品質: +20% (augmented)\n護甲: 472 (augmented)\n能量護盾: 111 (augmented)\n--------\n需求:\n等級: 84\n力量: 80\n智慧: 155\n--------\n插槽: B-B-R-B \n--------\n物品等級: 86\n--------\n0.2% 物理傷害偷取生命 (implicit)\n+10% 物理持續傷害加成 (implicit)\n--------\n+114 最大生命 (fractured)\n插槽中的寶石有 16% 更多攻擊與施放速度\n+52 敏捷\n+8 最大能量護盾\n增加 20% 生命回復率\n+12 最大魔力\n增加 71% 護甲與能量護盾 (crafted)\n卓烙總督物品\n吞噬天地物品\n--------\n破裂之物\n",
      result: {
        "type": {
          "text": "手套",
          "option": "armour.gloves",
          "searchByType": false
        },
        "baseType": "聖騎士手套",
        "name": "禍害 護掌",
        "uniques": [],
        "raritySearch": {
          "value": "nonunique",
          "label": "非傳奇"
        },
        "rarity": "稀有",
        "itemLevel": {
          "min": 86,
          "search": true
        },
        "isWeaponOrArmor": true,
        "isCorrupt": false,
        "stats": [
          {
            "id": "implicit.stat_3764265320",
            "text": "#% 物理傷害偷取生命",
            "type": "固定",
            "value": {
              "min": 0.2
            },
            "disabled": true
          },
          {
            "id": "implicit.stat_2508100173",
            "text": "#% 物理傷害偷取生命",
            "type": "固定",
            "value": {
              "min": 0.2
            },
            "disabled": true
          },
          {
            "id": "implicit.stat_1314617696",
            "text": "+#% 物理持續傷害加成",
            "type": "固定",
            "value": {
              "min": 10
            },
            "disabled": true
          },
          {
            "id": "crafted.stat_3321629045",
            "text": "增加 #% 護甲與能量護盾 (部分)",
            "type": "工藝",
            "value": {
              "min": 71
            },
            "disabled": true
          },
          {
            "id": "fractured.stat_3299347043",
            "text": "+# 最大生命",
            "type": "破裂",
            "value": {
              "min": 114
            },
            "disabled": true
          },
          {
            "id": "explicit.stat_346351023",
            "text": "插槽中的寶石有 #% 更多攻擊與施放速度",
            "type": "隨機",
            "value": {
              "min": 16
            },
            "disabled": true
          },
          {
            "id": "explicit.stat_3261801346",
            "text": "+# 敏捷",
            "type": "隨機",
            "value": {
              "min": 52
            },
            "disabled": true
          },
          {
            "id": "explicit.stat_4052037485",
            "text": "+# 最大能量護盾 (部分)",
            "type": "隨機",
            "value": {
              "min": 8
            },
            "disabled": true
          },
          {
            "id": "explicit.stat_44972811",
            "text": "增加 #% 生命回復率",
            "type": "隨機",
            "value": {
              "min": 20
            },
            "disabled": true
          },
          {
            "id": "explicit.stat_1050105434",
            "text": "+# 最大魔力",
            "type": "隨機",
            "value": {
              "min": 12
            },
            "disabled": true
          }
        ],
        "influences": [],
        "quality": {
          "search": false,
          "min": 20
        },
        "autoSearch": false,
        "armour": 472,
        "energyShield": 111,
        "requireLevel": 84,
        "requireStr": 80,
        "requireInt": 155,
        "isFractured": true
      }
    },
    {
      name: '瓦爾版2120收割',
      text: "物品種類: 技能寶石\n稀有度: 寶石\n收割\n--------\n法術, 物理, 範圍效果, 持續時間, 瓦爾\n等級: 21（最高等級）\n消耗: 47 生命\n施放時間: 0.80 秒\n暴擊率: 6.00%\n附加傷害效用: 210%\n品質: +20% (augmented)\n--------\n需求:\n等級: 72\n力量: 100\n智慧: 70\n--------\n一把血腥鐮刀橫掃指定區域，對敵人造成物理傷害和物理持續傷害減益效果。若敵人存活，你會獲得 1 顆血腥球，會增加技能傷害和消耗。玩家最多有 5 顆血腥球。\n--------\n造成 1066 至 1599 物理傷害\n每秒造成 2251.9 基礎物理傷害\n+1.00 秒基礎持續時間\n法術傷害同時影響此技能的持續傷害效果\n若此技能擊中敵人且無人死亡，獲得 1 顆血腥球\n被此技能減益效果影響時，有敵人死亡時失去 1 顆血腥球\n每顆血腥球消耗 20% 更多生命\n每顆血腥球造成 20% 更多傷害\n--------\n瓦爾．收割\n--------\n每次施放所需靈魂: 25\n可儲存 1 次\n停止獲得靈魂: 8 秒\n施放時間: 0.80 秒\n暴擊率: 6.00%\n附加傷害效用: 480%\n--------\n一把血腥鐮刀橫掃指定區域，物理傷害擊中敵人。在它們下方留下沸騰之血一段時間，並造成物理持續傷害。同時在二階持續時間給予最大血腥球加成。\n--------\n造成 2458 至 3687 物理傷害\n每秒造成 4416.7 基礎物理傷害\n+5.00 秒基礎持續時間\n基礎額外效果持續時間 8.00 秒\n法術傷害同時影響此技能的持續傷害效果\n技能效果持續時間詞綴同時影響此技能的停止獲得靈魂\n沸騰之血的效果持續 2 秒\n每顆血腥球造成 +5% 更多傷害\n獲得 +4 最大血腥球\n獲得最大上限血腥球\n--------\n將其放置於物品上同樣顏色的插槽來獲得這項技能。點擊右鍵從插槽中取出。\n--------\n已汙染\n",
      result: {
        "type": {
          "text": "技能寶石",
          "option": "gem.activegem",
          "searchByType": false
        },
        "baseType": "收割",
        "uniques": [],
        "raritySearch": {
          "label": "任何"
        },
        "rarity": "寶石",
        "itemLevel": {
          "search": false
        },
        "isWeaponOrArmor": false,
        "isCorrupt": true,
        "stats": [],
        "influences": [],
        "quality": {
          "min": 20,
          "search": true
        },
        "autoSearch": true,
        "searchExchange": {
          "option": false,
          "have": [
            "divine",
            "chaos"
          ]
        },
        "gemLevel": {
          "min": 21,
          "search": true
        },
        "vaalVer": true,
        "vaalBaseType": "瓦爾．收割"
      }
    },
    {
      name: '瓦爾多圖',
      text: '物品種類: 異界地圖\n稀有度: 稀有\n封鎖的 絕境\n神主居所\n--------\n地圖階級: 17\n獎勵: 貼模 (生機之記)\n物品數量: +110% (augmented)\n怪物群大小: +28% (augmented)\n品質: +20% (augmented)\n--------\n掉落地圖有機率轉化至:\n塑界者地圖: 9% (augmented)\n尊師地圖: 12% (augmented)\n征服者地圖: 21% (augmented)\n傳奇地圖: 5% (augmented)\n聖甲蟲: 20% (augmented)\n--------\n物品等級: 100\n--------\n怪物等級：84\n--------\n只能在 2 米內有玩家時，才可以對怪物造成傷害\n玩家的光線範圍詞綴同時套用至此範圍\n區域含有恐懼\n怪物擊中時擊殺生命低於 20% 的東西\n每個裝備中的物品，玩家造成 10% 更少傷害\n每件召喚物主人裝備的物品，玩家的召喚物造成 10% 更少傷害\n區域中死亡的玩家被送入虛空\n區域中所有魔法和普通怪物全都在 1 個聚魂中\n--------\n在個人地圖裝置使用此物品前往該地圖。地圖只能被使用一次。擊敗地圖中 90% 的敵人，包含稀有和傳奇敵人，才能獲得獎勵。此區域不被你輿圖天賦樹影響，且不能透過地圖裝置增強。\n--------\n不可調整的\n--------\n貼模 (眾星．紫晶)\n',
      result: {
        "type": {
          "text": "異界地圖",
          "option": "map",
          "searchByType": false
        },
        "baseType": "神主居所",
        "name": "封鎖的 絕境",
        "uniques": [],
        "raritySearch": {
          "value": "nonunique",
          "label": "非傳奇"
        },
        "rarity": "稀有",
        "itemLevel": {
          "search": false
        },
        "isWeaponOrArmor": false,
        "isCorrupt": false,
        "stats": [
          {
            "id": "explicit.stat_3791071930",
            "text": [
              "只能在 # 米內有玩家時，才可以對怪物造成傷害",
              "玩家的光線範圍詞綴同時套用至此範圍"
            ],
            "type": "隨機",
            "value": {
              "min": 2
            },
            "disabled": true
          },
          {
            "id": "explicit.stat_758191285",
            "text": "區域含有恐懼",
            "type": "隨機",
            "disabled": true
          },
          {
            "id": "explicit.stat_822476873",
            "text": "怪物擊中時擊殺生命低於 20% 的東西",
            "type": "隨機",
            "disabled": true
          },
          {
            "id": "explicit.stat_1095765106",
            "text": "區域中死亡的玩家被送入虛空",
            "type": "隨機",
            "disabled": true
          },
          {
            "id": "explicit.stat_3458622626",
            "text": "區域中所有魔法和普通怪物全都在 1 個聚魂中",
            "type": "隨機",
            "disabled": true
          }
        ],
        "influences": [],
        "quality": {
          "search": false
        },
        "autoSearch": true,
        "searchExchange": {
          "option": false,
          "have": [
            "divine",
            "chaos"
          ]
        },
        "mapTier": {
          "min": 17,
          "search": true
        },
        "map_completion_reward": "生機之記"
      }
    },
    {
      name: "尊師殺手圖",
      text: '物品種類: 異界地圖\n稀有度: 稀有\n蹂躪 密境\n硫磺荒漠\n--------\n地圖階級: 16\n物品數量: +68% (augmented)\n物品稀有度: +30% (augmented)\n怪物群大小: +19% (augmented)\n品質: +19% (augmented)\n--------\n物品等級: 85\n--------\n怪物等級：83\n--------\n地圖含有巴倫的壁壘 (implicit)\n物品數量以 20% 它的值增加巴倫掉落獎勵的總量 (implicit)\n--------\n魔法怪物增加 28%\n增加 24% 稀有怪物的數量\n玩家被元素要害詛咒\n+25% 怪物的混沌抗性\n+40% 怪物的元素抗性\n--------\n透過個人的地圖裝置來使用這張地圖以前往異界探險。每張地圖只能被使用一次。\n',
      result: {
        "type": {
          "text": "異界地圖",
          "option": "map",
          "searchByType": true
        },
        "baseType": "硫磺荒漠",
        "name": "蹂躪 密境",
        "uniques": [],
        "raritySearch": {
          "value": "nonunique",
          "label": "非傳奇"
        },
        "rarity": "稀有",
        "itemLevel": {
          "search": false
        },
        "isWeaponOrArmor": false,
        "isCorrupt": false,
        "stats": [
          {
            "id": "implicit.stat_2563183002",
            "text": "巴倫",
            "value": {
              "option": 1
            },
            "disabled": false
          }
        ],
        "influences": [],
        "quality": {
          "search": false
        },
        "autoSearch": true,
        "searchExchange": {
          "option": false,
          "have": [
            "divine",
            "chaos"
          ]
        },
        "mapTier": {
          "min": 16,
          "search": false
        },
        "conquerorMap": {
          "id": "implicit.stat_2563183002",
          "text": "巴倫",
          "value": {
            "option": 1
          },
          "disabled": false
        }
      }
    }
  ]
}