interface TemplateItemsSchema {
  [key: string]: {
    source: string;
    match: Omit<Partial<ParsedItem>, "uniques" | "onlyChaosOrExalted">;
  };
}

export const itemTemplateRaw: TemplateItemsSchema = {
  普通頭盔: {
    source: `物品種類: 頭部
稀有度: 普通
強化巨盔
--------
護甲: 145
能量護盾: 29
--------
需求:
等級: 53
力量: 59
智慧: 59
--------
插槽: B 
--------
物品等級: 72
`,
    match: {
      type: {
        text: "頭部",
        option: "armour.helmet",
        searchByType: false,
      },
      baseType: "強化巨盔",
      raritySearch: {
        value: "nonunique",
        label: "非傳奇",
      },
      rarity: "普通",
      itemLevel: {
        min: 72,
        search: true,
      },
      isWeaponOrArmor: true,
      isCorrupt: false,
      stats: [],
      influences: [],
      quality: {
        search: false,
      },
      autoSearch: false,
      searchExchange: {
        option: false,
        have: ["divine", "chaos"],
      },
      searchOnlineType: "securable",
      fetchCount: 20,
      armour: 145,
      energyShield: 29,
      requireLevel: 53,
      requireStr: 59,
      requireInt: 59,
    },
  },
  魔法腰帶: {
    source: `物品種類: 腰帶
稀有度: 魔法
刷新之雲朵之冥河腰帶
--------
需求:
等級: 28
--------
插槽: A 
--------
物品等級: 85
--------
{ 固定詞綴 }
有 1 個深淵插槽 — 無法使用的值
（只有深淵珠寶可以放置於深淵插槽中）
--------
{ 前綴 "刷新之"(階層：4)— 生命 }
增加 17(17-22)% 藥劑生命恢復率
{ 後綴 "雲朵之"(階層：8)— 元素,閃電,抗性 }
+11(6-11)% 閃電抗性
`,
    match: {
      type: {
        text: "腰帶",
        option: "accessory.belt",
        searchByType: false,
      },
      baseType: "冥河腰帶",
      name: "刷新之雲朵之",
      raritySearch: {
        value: "nonunique",
        label: "非傳奇",
      },
      rarity: "魔法",
      itemLevel: {
        min: 85,
        search: true,
      },
      isWeaponOrArmor: false,
      isCorrupt: false,
      stats: [
        {
          value: {
            min: 1,
          },
          id: "implicit.stat_3527617737",
          text: "有 # 個深淵插槽",
          type: "固定",
          disabled: true,
        },
        {
          value: {
            min: 11,
          },
          id: "explicit.stat_1671376347",
          text: "+#% 閃電抗性",
          type: "隨機",
          disabled: true,
        },
        {
          value: {
            min: 17,
          },
          id: "explicit.stat_51994685",
          text: "增加 #% 藥劑生命恢復率",
          type: "隨機",
          disabled: true,
        },
        {
          id: "pseudo.pseudo_total_elemental_resistance",
          text: "+#% 元素抗性",
          type: "偽屬性",
          value: {
            min: 11,
          },
          disabled: true,
        },
      ],
      influences: [],
      quality: {
        search: false,
      },
      autoSearch: false,
      searchExchange: {
        option: false,
        have: ["divine", "chaos"],
      },
      searchOnlineType: "securable",
      fetchCount: 20,
      requireLevel: 28,
    },
  },
  稀有吞噬灼烙衣服: {
    source: `物品種類: 胸甲
稀有度: 稀有
苦痛 幽影
神聖鎖甲
--------
品質: +20% (augmented)
護甲: 3254 (augmented)
能量護盾: 682 (augmented)
--------
需求:
等級: 84
力量: 173
敏捷: 111
智慧: 173
--------
插槽: B-G-R-B-R-B 
--------
物品等級: 84
--------
{ 灼烙總督固定詞綴 (低階)— 光環 }
增加 10(9-10)% 你技能的非詛咒光環效果
{ 吞噬天地固定詞綴 (高階) }
6% 攻擊傷害格擋率
--------
{ 前綴 "巨靈的"(階層：2)— 防禦,護甲,能量護盾 }
增加 37(33-38)% 護甲與能量護盾
增加 15(14-15)% 暈眩恢復和格擋恢復
{ 前綴 "鼓舞的"(階層：2)— 防禦,護甲,能量護盾 }
增加 97(92-100)% 護甲與能量護盾
{ 前綴 "虔誠的"(階層：1)— 防禦,護甲,能量護盾 }
+335(301-375) 點護甲
+77(73-80) 最大能量護盾
{ 後綴 "保護者之"(階層：2)— 物理 }
7% 額外物理傷害減免
{ 後綴 "暴風之"(階層：6)— 元素,閃電,抗性 }
+20(18-23)% 閃電抗性
{ 已大師工藝 後綴 "工藝之"— 防禦,能量護盾 }
當 6 公尺內的有稀有或傳奇敵人時，每秒回復 150 能量護盾
卓烙總督物品
吞噬天地物品
`,
    match: {
      type: {
        text: "胸甲",
        option: "armour.chest",
        searchByType: false,
      },
      baseType: "神聖鎖甲",
      name: "苦痛 幽影",
      raritySearch: {
        value: "nonunique",
        label: "非傳奇",
      },
      rarity: "稀有",
      itemLevel: {
        min: 84,
        search: true,
      },
      isWeaponOrArmor: true,
      isCorrupt: false,
      stats: [
        {
          value: {
            min: 10,
          },
          lowerBound: 9,
          upperBound: 10,
          id: "implicit.stat_1880071428",
          text: "增加 #% 你技能的非詛咒光環效果",
          type: "固定",
          disabled: true,
          searchWithEmptyValue: false,
        },
        {
          value: {
            min: 6,
          },
          id: "implicit.stat_1702195217",
          text: "+#% 攻擊傷害格擋率",
          type: "固定",
          disabled: true,
          searchWithEmptyValue: false,
        },
        {
          value: {
            min: 6,
          },
          id: "implicit.stat_2530372417",
          text: "#% 攻擊傷害格擋率",
          type: "固定",
          disabled: true,
          searchWithEmptyValue: false,
        },
        {
          value: {
            min: 150,
          },
          id: "crafted.stat_2238019079",
          text: "當 6 公尺內的有稀有或傳奇敵人時，每秒回復 # 能量護盾",
          type: "工藝",
          disabled: true,
          searchWithEmptyValue: false,
        },
        {
          value: {
            min: 37,
          },
          lowerBound: 33,
          upperBound: 38,
          id: "explicit.stat_3321629045",
          text: "增加 #% 護甲與能量護盾 (部分)",
          type: "隨機",
          disabled: true,
          searchWithEmptyValue: false,
        },
        {
          value: {
            min: 15,
          },
          lowerBound: 14,
          upperBound: 15,
          id: "explicit.stat_2511217560",
          text: "增加 #% 暈眩恢復和格擋恢復",
          type: "隨機",
          disabled: true,
          searchWithEmptyValue: false,
        },
        {
          value: {
            min: 97,
          },
          lowerBound: 92,
          upperBound: 100,
          id: "explicit.stat_3321629045",
          text: "增加 #% 護甲與能量護盾 (部分)",
          type: "隨機",
          disabled: true,
          searchWithEmptyValue: false,
        },
        {
          value: {
            min: 335,
          },
          lowerBound: 301,
          upperBound: 375,
          id: "explicit.stat_3484657501",
          text: "+# 點護甲 (部分)",
          type: "隨機",
          disabled: true,
          searchWithEmptyValue: false,
        },
        {
          value: {
            min: 77,
          },
          lowerBound: 73,
          upperBound: 80,
          id: "explicit.stat_4052037485",
          text: "+# 最大能量護盾 (部分)",
          type: "隨機",
          disabled: true,
          searchWithEmptyValue: false,
        },
        {
          value: {
            min: 7,
          },
          id: "explicit.stat_3771516363",
          text: "#% 額外物理傷害減免",
          type: "隨機",
          disabled: true,
          searchWithEmptyValue: false,
        },
        {
          value: {
            min: 20,
          },
          lowerBound: 18,
          upperBound: 23,
          id: "explicit.stat_1671376347",
          text: "+#% 閃電抗性",
          type: "隨機",
          disabled: true,
          searchWithEmptyValue: false,
        },
        {
          id: "pseudo.pseudo_total_elemental_resistance",
          text: "+#% 元素抗性",
          type: "偽屬性",
          value: {
            min: 20,
          },
          disabled: true,
        },
      ],
      influences: [],
      quality: {
        search: false,
        min: 20,
      },
      autoSearch: false,
      searchExchange: {
        option: false,
        have: ["divine", "chaos"],
      },
      searchOnlineType: "securable",
      fetchCount: 20,
      armour: 3254,
      energyShield: 682,
      requireLevel: 84,
      requireStr: 173,
      requireDex: 111,
      requireInt: 173,
      search6L: true,
    },
  },
  穢生魔血: {
    source: `物品種類: 腰帶
稀有度: 傳奇
穢生 魔血
重革腰帶
--------
品質 (能力值詞綴): +20% (augmented)
--------
需求:
等級: 44
--------
物品等級: 80
--------
{ 固定詞綴— 能力  — 增加 20% }
+35(25-35) 力量
--------
{ 傳奇詞綴— 能力  — 增加 20% }
+44(30-50) 敏捷
{ 傳奇詞綴— 元素,火焰,抗性 }
+19(15-25)% 火焰抗性
{ 傳奇詞綴— 元素,冰冷,抗性 }
+16(15-25)% 冰冷抗性
{ 傳奇詞綴 }
魔法功能藥劑不能使用
{ 傳奇詞綴 }
魔法功能藥劑效果不能被移除
{ Foulborn Unique Modifier }
最右邊4(2-4)的魔法功能藥劑持續套用它的藥劑效果至你身上
--------
權力的河流流過你的血管。
`,
    match: {
      type: {
        text: "腰帶",
        option: "accessory.belt",
        searchByType: false,
      },
      baseType: "重革腰帶",
      name: "魔血",
      raritySearch: {
        value: "unique",
        label: "傳奇",
      },
      rarity: "傳奇",
      itemLevel: {
        min: 80,
        search: false,
      },
      isWeaponOrArmor: false,
      isCorrupt: false,
      stats: [
        {
          value: {
            min: 35,
          },
          lowerBound: 25,
          upperBound: 35,
          id: "implicit.stat_4080418644",
          text: "+# 力量",
          type: "固定",
          disabled: false,
          searchWithEmptyValue: true,
        },
        {
          value: {
            min: 44,
          },
          lowerBound: 30,
          upperBound: 50,
          id: "explicit.stat_3261801346",
          text: "+# 敏捷",
          type: "隨機",
          disabled: false,
          searchWithEmptyValue: true,
        },
        {
          value: {
            min: 19,
          },
          lowerBound: 15,
          upperBound: 25,
          id: "explicit.stat_3372524247",
          text: "+#% 火焰抗性",
          type: "隨機",
          disabled: false,
          searchWithEmptyValue: true,
        },
        {
          value: {
            min: 16,
          },
          lowerBound: 15,
          upperBound: 25,
          id: "explicit.stat_4220027924",
          text: "+#% 冰冷抗性",
          type: "隨機",
          disabled: false,
          searchWithEmptyValue: true,
        },
        {
          id: "explicit.stat_3986704288",
          text: "魔法功能藥劑不能使用",
          type: "隨機",
          disabled: false,
          searchWithEmptyValue: true,
        },
        {
          id: "explicit.stat_344389721",
          text: "魔法功能藥劑效果不能被移除",
          type: "隨機",
          disabled: false,
          searchWithEmptyValue: true,
        },
        {
          value: {
            min: 4,
          },
          lowerBound: 2,
          upperBound: 4,
          id: "explicit.stat_2651470813",
          text: "最右邊#的魔法功能藥劑持續套用它的藥劑效果至你身上",
          type: "穢生",
          disabled: false,
          searchWithEmptyValue: false,
        },
        {
          id: "pseudo.pseudo_total_elemental_resistance",
          text: "+#% 元素抗性",
          type: "偽屬性",
          value: {
            min: 35,
          },
          disabled: true,
        },
      ],
      influences: [],
      quality: {
        search: false,
      },
      autoSearch: true,
      searchExchange: {
        option: false,
        have: ["divine", "chaos"],
      },
      searchOnlineType: "securable",
      fetchCount: 20,
      foulborn: true,
      requireLevel: 44,
    },
  },
  無法使用的細劍: {
    source: `物品種類: 細劍
稀有度: 魔法
追憶之 升級的華麗細劍
--------
單手劍
物理傷害: 28-51
暴擊率: 5.50%
每秒攻擊次數: 1.60
武器距離: 1.4 米
--------
需求:
等級: 64
力量: 21
敏捷: 167 (unmet)
智慧: 21
--------
插槽: W-W W 
--------
物品等級: 78
--------
{ 固定詞綴— 寶石 }
此物品插槽中寶石品質 +6(4-6)%
--------
{ 已大師工藝 前綴 "升級的"— 寶石 }
此物品插槽中寶石品質 +8(7-8)%
--------
追憶之物
`,
    match: {
      type: {
        text: "細劍",
        option: "weapon.onesword",
        searchByType: false,
      },
      baseType: "華麗細劍",
      name: "追憶之 升級的",
      raritySearch: {
        value: "nonunique",
        label: "非傳奇",
      },
      rarity: "魔法",
      itemLevel: {
        min: 78,
        search: true,
      },
      isWeaponOrArmor: true,
      isCorrupt: false,
      stats: [
        {
          value: {
            min: 6,
          },
          id: "implicit.stat_3828613551",
          text: "此物品插槽中寶石品質 +#%",
          type: "固定",
          disabled: true,
        },
        {
          value: {
            min: 8,
          },
          id: "crafted.stat_3828613551",
          text: "此物品插槽中寶石品質 +#%",
          type: "工藝",
          disabled: true,
        },
      ],
      influences: [],
      quality: {
        search: false,
      },
      autoSearch: false,
      searchExchange: {
        option: false,
        have: ["divine", "chaos"],
      },
      searchOnlineType: "securable",
      fetchCount: 20,
      phyDamage: {
        min: 28,
        max: 51,
      },
      critChance: 5.5,
      attackSpeed: 1.6,
      pDPS: 63.2,
      requireLevel: 64,
      requireStr: 21,
      requireDex: 167,
      requireInt: 21,
      isSynthesized: true,
    },
  },
  尊師弓: {
    source: `物品種類: 弓
稀有度: 稀有
冷酷 渴望
直弓
--------
弓
品質: +20% (augmented)
物理傷害: 29-115 (augmented)
元素傷害: 14-27 (augmented), 14-288 (augmented)
暴擊率: 7.26% (augmented)
每秒攻擊次數: 1.25
--------
需求:
等級: 60
敏捷: 125 (unmet)
--------
插槽: G B-G-G-G R 
--------
物品等級: 85
--------
{ 前綴 "電震的"(階層：4)— 傷害,元素,閃電,攻擊 }
附加 14(14-20) 至 288(281-327) 閃電傷害
{ 前綴 "冷凍的"(階層：9)— 傷害,元素,冰冷,攻擊 }
附加 14(12-17) 至 27(26-30) 冰冷傷害
{ 前綴 "尊師的"(階層：2)— 物理,攻擊,異常狀態 }
使用此武器的擊中 +46(43-50)% 流血持續傷害加成
{ 後綴 "暈眩之"(階層：4) }
增加 18(16-20)% 敵人暈眩時間
{ 後綴 "復生之"(階層：4)— 生命,攻擊 }
每擊中一個敵人，獲得 18(15-18) 生命
{ 後綴 "刺穿之"(階層：4)— 攻擊,暴擊 }
增加 21(20-24)% 暴擊率
--------
尊師之物
`,
    match: {
      type: {
        text: "弓",
        option: "weapon.bow",
        searchByType: false,
      },
      baseType: "直弓",
      name: "冷酷 渴望",
      raritySearch: {
        value: "nonunique",
        label: "非傳奇",
      },
      rarity: "稀有",
      itemLevel: {
        min: 85,
        search: true,
      },
      isWeaponOrArmor: true,
      isCorrupt: false,
      stats: [
        {
          value: {
            min: 20.5,
          },
          id: "explicit.stat_1037193709",
          text: "附加 # 至 # 冰冷傷害 (部分)",
          type: "隨機",
          disabled: true,
        },
        {
          value: {
            min: 151,
          },
          id: "explicit.stat_3336890334",
          text: "附加 # 至 # 閃電傷害 (部分)",
          type: "隨機",
          disabled: true,
        },
        {
          value: {
            min: 21,
          },
          id: "explicit.stat_2375316951",
          text: "增加 #% 暴擊率",
          type: "隨機",
          disabled: true,
        },
        {
          value: {
            min: 18,
          },
          id: "explicit.stat_821021828",
          text: "每擊中一個敵人，獲得 # 生命",
          type: "隨機",
          disabled: true,
        },
        {
          value: {
            min: 18,
          },
          id: "explicit.stat_2517001139",
          text: "增加 #% 敵人暈眩時間",
          type: "隨機",
          disabled: true,
        },
        {
          value: {
            min: 46,
          },
          id: "explicit.stat_951608773",
          text: "使用此武器的擊中 +#% 流血持續傷害加成",
          type: "隨機",
          disabled: true,
        },
      ],
      influences: [
        {
          id: "pseudo.pseudo_has_elder_influence",
          text: "尊師之物",
          label: "尊師",
        },
      ],
      quality: {
        min: 20,
        search: false,
      },
      autoSearch: false,
      searchExchange: {
        option: false,
        have: ["divine", "chaos"],
      },
      searchOnlineType: "securable",
      fetchCount: 20,
      phyDamage: {
        min: 29,
        max: 115,
      },
      eleDamage: {
        min: 28,
        max: 315,
      },
      critChance: 7.26,
      attackSpeed: 1.25,
      pDPS: 90,
      eDPS: 214.38,
      requireLevel: 60,
      requireDex: 125,
      search6L: false,
    },
  },
  輔助寶石: {
    source: `物品種類: 輔助寶石
稀有度: 寶石
集中效應輔助
--------
輔助, 範圍效果
等級: 20（最高等級）
消耗和保留加成: 140%
品質: +20% (augmented)
--------
需求:
等級: 70
智慧: 111
--------
輔助任何範圍效果的技能，不管技能是否造成傷害。
--------
被輔助的技能造成 39% 更多範圍傷害
被輔助的技能有 30% 更少範圍效果

來自品質的額外效果：
被輔助的技能增加 10(0-10)% 範圍傷害
--------
這是一顆輔助寶石。它並不會為你的角色增加能力數值，但會強化與其連結的技能寶石。將其放置於物品上同樣顏色的插槽並連結想要強化的技能寶石。點擊右鍵從插槽中取出。
`,
    match: {
      type: {
        text: "輔助寶石",
        searchByType: false,
      },
      baseType: "集中效應輔助",
      raritySearch: {
        label: "任何",
      },
      rarity: "寶石",
      itemLevel: {
        search: false,
      },
      isWeaponOrArmor: false,
      isCorrupt: false,
      stats: [],
      influences: [],
      quality: {
        min: 20,
        search: false,
      },
      autoSearch: true,
      searchExchange: {
        option: false,
        have: ["divine", "chaos"],
      },
      searchOnlineType: "securable",
      fetchCount: 20,
      gemLevel: {
        min: 20,
        search: true,
      },
      requireLevel: 70,
      requireInt: 111,
    },
  },
  已汙染技能寶石: {
    source: `物品種類: 技能寶石
稀有度: 寶石
重盾衝鋒
--------
攻擊, 近戰, 範圍效果, 位移, 快行, 物理
等級: 20（最高等級）
消耗: 10 魔力
攻擊時間: 0.50 秒
暴擊率: 5.00%
攻擊傷害: 基礎的 100%
品質: +23% (augmented)
--------
需求:
等級: 70
力量: 155
--------
向一個區域或目標衝鋒，將路線上的敵人推開並持續在你前方區域造成副手傷害。衝鋒距離越遠，造成的傷害越高，並且擊暈敵人的機率越高。
--------
252至378基礎副手物理傷害
盾牌上每15護甲或閃避值增加8至12物理傷害
到達最大衝鋒距離時，增加 75% 暈眩門檻降低
（造成暈眩所需的傷害量代表暈眩門檻）
最大衝擊距離擊中時造成 100% 更多傷害
增加 109% 移動速度

來自品質的額外效果：
增加 23(0-20)% 移動速度
--------
將其放置於物品上的插槽來獲得這項技能。點擊右鍵從插槽中取出。
--------
已汙染
`,
    match: {
      type: {
        text: "技能寶石",
        option: "gem.activegem",
        searchByType: false,
      },
      baseType: "重盾衝鋒",
      raritySearch: {
        label: "任何",
      },
      rarity: "寶石",
      itemLevel: {
        search: false,
      },
      isWeaponOrArmor: false,
      isCorrupt: true,
      stats: [],
      influences: [],
      quality: {
        min: 23,
        search: true,
      },
      autoSearch: true,
      searchExchange: {
        option: false,
        have: ["divine", "chaos"],
      },
      searchOnlineType: "securable",
      fetchCount: 20,
      gemLevel: {
        min: 20,
        search: true,
      },
      requireLevel: 70,
      requireStr: 155,
    },
  },
  神聖石: {
    source: `物品種類: 可堆疊通貨
稀有度: 通貨
神聖石
--------
堆疊數量: 1 / 20
--------
重置一件物品上隨機詞綴的數值
--------
右鍵點擊此物品，再左鍵點擊一件魔法、稀有或傳奇物品來使用。
`,
    match: {
      type: {
        text: "可堆疊通貨",
        searchByType: false,
      },
      baseType: "神聖石",
      raritySearch: {
        label: "任何",
      },
      rarity: "通貨",
      itemLevel: {
        search: false,
      },
      isWeaponOrArmor: false,
      isCorrupt: false,
      stats: [],
      influences: [],
      quality: {
        search: false,
      },
      autoSearch: false,
      searchExchange: {
        option: true,
        have: ["divine", "chaos"],
      },
      searchOnlineType: "securable",
      fetchCount: 20,
      itemID: "divine",
    },
  },
  T16: {
    source: `物品種類: 地圖
稀有度: 稀有
曲空禮拜
地圖（階級 16）
--------
輿圖掉落物: +61% (augmented)
物品稀有度: +36% (augmented)
怪物群大小: +23% (augmented)
--------
物品等級: 85
--------
怪物等級：83
--------
{ 前綴 "裂化的"(階層：1) }
怪物發射 2 額外投射物
{ 前綴 "導電的"(階層：1)— 傷害,物理,元素,閃電 }
怪物造成 110(90-110)% 額外物理傷害視為閃電
{ 前綴 "反抗者的"(階層：1) }
增加 29(20-30)% 稀有怪物的數量
{ 後綴 "耐久之"(階層：1) }
怪物擊中時獲得 1 顆耐力球
--------
透過個人的地圖裝置來使用這張地圖以前往這個階級或更低的該地圖。每張地圖只能被使用一次。
`,
    match: {
      type: {
        text: "地圖",
        option: "map",
        searchByType: true,
      },
      baseType: "地圖（階級 16）",
      name: "曲空禮拜",
      raritySearch: {
        value: "nonunique",
        label: "非傳奇",
      },
      rarity: "稀有",
      itemLevel: {
        min: 85,
        search: true,
      },
      isWeaponOrArmor: false,
      isCorrupt: false,
      stats: [
        {
          value: {
            min: 2,
          },
          id: "explicit.stat_1309819744",
          text: "怪物發射 # 額外投射物",
          type: "隨機",
          disabled: true,
          searchWithEmptyValue: false,
        },
        {
          value: {
            min: 110,
          },
          lowerBound: 90,
          upperBound: 110,
          id: "explicit.stat_3416853625",
          text: "怪物造成 #% 額外物理傷害視為閃電",
          type: "隨機",
          disabled: true,
          searchWithEmptyValue: false,
        },
        {
          value: {
            min: 29,
          },
          lowerBound: 20,
          upperBound: 30,
          id: "explicit.stat_3126771445",
          text: "增加 #% 稀有怪物的數量",
          type: "隨機",
          disabled: true,
          searchWithEmptyValue: false,
        },
        {
          value: {
            min: 100,
          },
          id: "explicit.stat_687813731",
          text: "怪物擊中時有 #% 機率獲得 1 顆耐力球",
          type: "隨機",
          disabled: true,
          searchWithEmptyValue: false,
        },
        {
          value: {
            min: 100,
          },
          id: "explicit.stat_3707756896",
          text: "怪物擊中時有 #% 機率獲得 1 顆耐力球",
          type: "隨機",
          disabled: true,
          searchWithEmptyValue: false,
        },
      ],
      influences: [],
      quality: {
        search: false,
      },
      autoSearch: true,
      searchExchange: {
        option: false,
        have: ["divine", "chaos"],
      },
      searchOnlineType: "securable",
      fetchCount: 20,
      mapTier: {
        min: 16,
        search: true,
      },
    },
  },
  釋界門票: {
    source: `物品種類: 地圖碎片
稀有度: 普通
釋界之令
--------
聽從釋界的要求是愚蠢的。
但不照做也是愚蠢的。
--------
在個人地圖裝置使用此物品開啟前往無悲憫與同情之地的時空之門。僅可被使用一次。在檢視你的輿圖時，右鍵點擊此物品以定位其所在。
`,
    match: {
      type: {
        text: "地圖碎片",
        searchByType: false,
      },
      baseType: "釋界之令",
      raritySearch: {
        value: "nonunique",
        label: "非傳奇",
      },
      rarity: "普通",
      itemLevel: {
        search: false,
      },
      isWeaponOrArmor: false,
      isCorrupt: false,
      stats: [],
      influences: [],
      quality: {
        search: false,
      },
      autoSearch: false,
      searchExchange: {
        option: true,
        have: ["divine", "chaos"],
      },
      searchOnlineType: "securable",
      fetchCount: 20,
      itemID: "the-mavens-writ",
    },
  },
  巨型星團: {
    source: `物品種類: 珠寶
稀有度: 稀有
邪風 裂毀者
巨型星團珠寶
--------
需求:
等級: 54
--------
物品等級: 83
--------
附加 8 個天賦 (enchant)
（ 附加的天賦點不會被其它珠寶視為範圍內 ） (enchant)
（ 所有附加的天賦點都為小型，除非有特條件 ） (enchant)
2 個附加的天賦為珠寶插槽 (enchant)
附加的小型天賦給予：法杖攻擊增加 12% 擊中和異常狀態傷害 (enchant)
（天賦點不是指核心、專精、關鍵天賦或珠寶插槽，而是小的天賦點） (enchant)
--------
{ 前綴 "顯著的"(階層：1)— 傷害,攻擊,暴擊 }
1 個附加的天賦為機會主義福斯雷 — 無法使用的值
{ 前綴 "顯著的"(階層：1)— 物理,攻擊,異常狀態 }
1 個附加的天賦為惡毒穿刺 — 無法使用的值
{ 後綴 "顯著之"(階層：1)— 傷害,攻擊,速度 }
1 個附加的天賦為武術英勇 — 無法使用的值
{ 後綴 "北方民族之"(階層：3)— 元素,冰冷,抗性 }
附加的小天賦給予：+3(2-3)% 冰冷抗性
--------
放置於天賦樹已配置的巨型珠寶插槽中。附加的天賦點不與珠寶範圍互動。點擊右鍵從插槽中移除。
`,
    match: {
      type: {
        text: "珠寶",
        option: "jewel",
        searchByType: false,
      },
      baseType: "巨型星團珠寶",
      name: "邪風 裂毀者",
      raritySearch: {
        value: "nonunique",
        label: "非傳奇",
      },
      rarity: "稀有",
      itemLevel: {
        min: 75,
        max: 83,
        search: true,
      },
      isWeaponOrArmor: false,
      isCorrupt: false,
      stats: [
        {
          disabled: false,
          id: "enchant.stat_3086156145",
          text: "附加 # 個天賦",
          type: "附魔",
          value: {
            max: 8,
            min: 8,
          },
        },
        {
          disabled: false,
          id: "enchant.stat_3948993189|5",
          text: "附加的小型天賦給予：法杖攻擊增加 12% 擊中和異常狀態傷害",
          type: "附魔",
        },
        {
          value: {
            min: 3,
          },
          id: "explicit.stat_2709692542",
          text: "附加的小天賦給予：+#% 冰冷抗性",
          type: "隨機",
          disabled: true,
        },
        {
          id: "explicit.stat_1152182658",
          text: "1 個附加的天賦為武術英勇",
          type: "隨機",
          disabled: true,
        },
        {
          id: "explicit.stat_4281625943",
          text: "1 個附加的天賦為機會主義福斯雷",
          type: "隨機",
          disabled: true,
        },
        {
          id: "explicit.stat_567971948",
          text: "1 個附加的天賦為惡毒穿刺",
          type: "隨機",
          disabled: true,
        },
      ],
      influences: [],
      quality: {
        search: false,
      },
      autoSearch: true,
      searchExchange: {
        option: false,
        have: ["divine", "chaos"],
      },
      searchOnlineType: "securable",
      fetchCount: 20,
      requireLevel: 54,
    },
  },
  通牒雕刻命運卡: {
    source: `物品種類: 其它
稀有度: 通貨
最後通牒雕刻
--------
挑戰: 站在符文上
區域等級: 83
需求獻祭: 鐵骨心腸 x2
獎勵: 翻倍獻祭的命運卡
--------
極凍 IV
(許多冰凍的膿瘡會持續出現冰緩你，當你靠近時迅速爆炸，若他們擊中冰凍)
耗力圖騰
(無敵的圖騰增強友方和敵人，更快速和強力的物理傷害加成，但使敵人每秒承受 10% 他們最大生命和能量護盾的物理傷害)
縮小範圍
(玩家有 60% 更少範圍效果和投射物速度)
增益效果失效加速
(玩家身上的增益效果失效加快 5 倍)
魔力消耗的閃電傷害
(承受 1000% 魔力消耗的閃電傷害)
奸詐光環
(你影響友方的光環同時影響敵人)
抗性怪物
(怪物 +50% 全部抗性)
虹吸怪物
(怪物擊中移除 10% 目前能量護盾和魔力)
增加 20% 怪物傷害
70% 更多怪物生命
--------
可以使用於個人地圖裝置以開啟前往試煉大師地盤的傳送門，並完成他的挑戰。挑戰開始時傳送門就會關閉。在檢視你的輿圖時，右鍵點擊此物品以定位其所在。
`,
    match: {
      type: {
        text: "其它",
        searchByType: false,
      },
      baseType: "最後通牒雕刻",
      raritySearch: {
        label: "任何",
      },
      rarity: "通貨",
      itemLevel: {
        search: false,
      },
      isWeaponOrArmor: false,
      isCorrupt: false,
      stats: [],
      influences: [],
      quality: {
        search: false,
      },
      autoSearch: true,
      searchExchange: {
        option: false,
        have: ["divine", "chaos"],
      },
      searchOnlineType: "securable",
      fetchCount: 20,
      inscribed: {
        requirementItem: "鐵骨心腸",
        rewardItem: "翻倍獻祭的命運卡",
        searchRequirementItem: true,
      },
    },
  },
} satisfies TemplateItemsSchema;

export type TTemplateItems = typeof itemTemplateRaw;
