// 技能数据。玩家技能仅分为主动型和被动型；主动型再分战斗型与效果型。
window.PLAYER_SKILLS = {
  sunderStrike: {
    name: "破甲一击",
    category: "active",
    kind: "combat",
    maxLevel: 3,
    levels: [
      {
        cost: 5,
        desc: "造成 105% 最终伤害的一击，使敌人的防御力 -10%，持续 3 回合。",
        multiplier: 1.05,
        applyStatus: { target: "enemy", id: "breakDamageReduction", value: -0.1, duration: 3 },
      },
      {
        cost: 5,
        desc: "造成 110% 最终伤害的一击，使敌人的防御力 -15%，持续 3 回合。",
        multiplier: 1.1,
        applyStatus: { target: "enemy", id: "breakDamageReduction", value: -0.15, duration: 3 },
      },
      {
        cost: 0,
        desc: "不消耗 MP，造成 110% 最终伤害的一击，使敌人的防御力 -15%，持续 3 回合。",
        multiplier: 1.1,
        applyStatus: { target: "enemy", id: "breakDamageReduction", value: -0.15, duration: 3 },
      },
    ],
  },
  battleFocus: {
    name: "战意鼓舞",
    category: "active",
    kind: "effect",
    maxLevel: 3,
    levels: [
      {
        cost: 10,
        desc: "我方攻击增加 10%，持续 2 回合。",
        buffs: [{ stat: "tempAtkRate", amount: 0.1, duration: 2 }],
      },
      {
        cost: 10,
        desc: "我方攻击增加 10%，持续 3 回合，可在战斗外使用，但持续时间降为 2 回合。",
        usableOutsideBattle: true,
        outsideDuration: 2,
        buffs: [{ stat: "tempAtkRate", amount: 0.1, duration: 3 }],
      },
      {
        cost: 10,
        desc: "我方攻击增加 15%，持续 3 回合，可在战斗外使用。",
        usableOutsideBattle: true,
        buffs: [{ stat: "tempAtkRate", amount: 0.15, duration: 3 }],
      },
    ],
  },
  fleetEscape: {
    name: "疾退本能",
    category: "passive",
    passive: true,
    desc: "被动技能。逃跑概率增加 20%。",
  },
};

window.ENEMY_SKILLS = {
  evilClaw: {
    name: "邪爪",
    type: "instant",
    desc: "造成 145% 攻击伤害；命中后使目标流血，持续 3 回合。",
    multiplier: 1.45,
    applyStatus: { target: "player", id: "bleed", duration: 3 },
  },
  shaArmor: {
    name: "煞甲",
    type: "buff",
    cooldown: 4,
    desc: "免伤提升 20%，持续 2 回合。",
    damageReductionRate: 0.2,
    duration: 2,
  },
  mieDeng: {
    name: "灭灯式",
    type: "intent",
    desc: "造成 180% 攻击伤害；命中后使目标中毒，持续 3 回合。",
    multiplier: 1.8,
    applyStatus: { target: "player", id: "poison", duration: 3 },
  }
};
