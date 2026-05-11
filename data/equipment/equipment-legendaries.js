// Legendary equipment records. Legendary items do not use random affix pools.
window.EQUIPMENT_LEGENDARY_DB = {
  travelerSword: [
    {
      name: "星陨誓刃",
      slot: "weapon",
      rarity: "legendary",
      durability: 18,
      price: 240,
      affixes: [
        { name: "星陨锋芒", stat: "atk", value: 16, text: "攻击 +16" },
        { name: "踏风", stat: "speed", value: 3, text: "速度 +3" },
        { name: "龙鳞刻痕", stat: "damageReduction", value: 0.04, text: "免伤 +4%" },
      ],
      atk: 16,
      damageReduction: 0.04,
      speed: 3,
      desc: "陨星碎片锻成的誓约之刃，刃脊里仍有夜空坠落的回声。"
    },
  ],
  studdedJerkin: [
    {
      name: "不朽晨星甲",
      slot: "armor",
      rarity: "legendary",
      durability: 24,
      price: 300,
      affixes: [
        { name: "不坏", stat: "damageReduction", value: 0.12, text: "免伤 +12%" },
        { name: "守心", stat: "damageReduction", value: 0.06, text: "免伤 +6%" },
        { name: "稳步", stat: "speed", value: 1, text: "速度 +1" },
      ],
      atk: 0,
      damageReduction: 0.18,
      speed: 1,
      desc: "晨星教团失落的圣甲，甲叶合拢时像一座微光堡垒。"
    },
  ],
};
