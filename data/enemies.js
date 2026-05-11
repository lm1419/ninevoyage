// Enemy gameplay data.
window.ENEMY_LEVEL_CONFIG = {
  maxLevel: 50,
  exp: {
    normalBase: 18,
    normalPerLevel: 5,
    bossBase: 90,
    bossPerLevel: 12,
    sameOrHigherRate: 1,
    lowerOneToTwoRate: 0.65,
    lowerThreeToFiveRate: 0.3,
    lowerSixPlusRate: 0.05
  }
};

window.ENEMY_DB = {
  fieldRaider: {
    name: "荒原劫掠者",
    desc: "盘踞在旧商路边的劫掠者，熟悉草坡与废车之间的每一条退路。",
    maxHp: 82,
    atk: 14,
    damageReduction: 0.03,
    speed: 10,
    gold: 12,
    skillChance: 0.2,
    skillIds: { special: "evilClaw", guard: "shaArmor" }
  },
  leanWolf: {
    name: "瘦脊野狼",
    desc: "被饥饿逼近道路的野狼，速度很快，咬住机会就不松口。",
    maxHp: 68,
    atk: 13,
    damageReduction: 0.01,
    speed: 12,
    gold: 8,
    skillChance: 0.18,
    skillIds: { special: "evilClaw" }
  },
  mistGuardian: {
    name: "雾碑守卫",
    desc: "废弃界碑后的旧甲守卫，像是被原野深处的雾气重新叫醒。",
    maxHp: 265,
    atk: 24,
    damageReduction: 0.07,
    speed: 8,
    gold: 80,
    skillChance: 0.2,
    skillIds: { special: "mieDeng", guard: "shaArmor" },
    boss: true
  },
  townThug: {
    name: "滋事流氓",
    desc: "酒馆里喝红了眼的闹事者，拳脚粗野，却真会下死手。",
    maxHp: 38,
    atk: 8,
    damageReduction: 0.01,
    speed: 9,
    gold: 0,
    skillChance: 0.08,
    skillIds: { special: "evilClaw" },
    townWorkOnly: true
  },
  townBandit: {
    name: "摸门盗匪",
    desc: "趁夜靠近城门的盗匪，刀短步急，专挑守夜人困顿时动手。",
    maxHp: 48,
    atk: 10,
    damageReduction: 0.02,
    speed: 10,
    gold: 0,
    skillChance: 0.12,
    skillIds: { special: "evilClaw" },
    townWorkOnly: true
  },
  caravanRaider: {
    name: "商道劫匪",
    desc: "埋伏在旧商道边的劫匪，敢冲车队的人通常不缺狠劲。",
    maxHp: 62,
    atk: 12,
    damageReduction: 0.03,
    speed: 10,
    gold: 0,
    skillChance: 0.15,
    skillIds: { special: "evilClaw", guard: "shaArmor" },
    townWorkOnly: true
  }
};
