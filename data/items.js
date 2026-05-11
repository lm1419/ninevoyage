// 道具数据。消耗品使用后消失；宝物放在背包中持续生效。
window.ITEM_DB = {
  apprenticeHealthPotion: {
    name: "学徒生命药剂",
    type: "consumable",
    consumableType: "生命药剂",
    theme: "health",
    scope: "any",
    price: 14,
    flavor: "学徒随身备着的小瓶红药，火候浅，却足够把危险从喉口推回去一点。",
    desc: "恢复 20% 最大 HP。",
    use: s => healPlayerPercent(s, 0.2)
  },
  apprenticeManaPotion: {
    name: "学徒魔法药剂",
    type: "consumable",
    consumableType: "魔法药剂",
    theme: "mana",
    scope: "any",
    price: 14,
    flavor: "瓶中蓝光像被压低的星火，入口微凉，让干涸的法力重新流动。",
    desc: "恢复 20% 最大 MP。",
    use: s => restorePlayerMpPercent(s, 0.2)
  },
  apprenticePowerPotion: {
    name: "学徒力量药剂",
    type: "consumable",
    consumableType: "状态药剂",
    theme: "status",
    scope: "any",
    price: 16,
    flavor: "瓶中药液泛着浅绿微光，像把一口尚未驯服的力气封在掌心。",
    desc: "战斗中使用：最终伤害 +10%，持续 3 回合。战斗外使用：下场战斗最终伤害 +5%，持续 3 回合。",
    use: s => {
      const value = s.battle?.enemy ? 0.1 : 0.05;
      if (s.battle?.enemy) {
        applyStatus(s.player, "finalDamageUp", { value, duration: 3, skipDurationTicks: 1 });
        return "药力涌入臂腕，最终伤害提升 10%，持续 3 回合。";
      }
      s.preBattleEffects = s.preBattleEffects || [];
      s.preBattleEffects.push({ type: "playerStatus", id: "finalDamageUp", value, duration: 3 });
      return "药力先藏入筋骨，下场战斗最终伤害提升 5%，持续 3 回合。";
    }
  },
  wardIncense: {
    name: "隐匿之尘",
    type: "consumable",
    consumableType: "一般消耗品",
    scope: "any",
    price: 36,
    flavor: "细尘落在衣角便没入纹理，连呼吸声都像被夜色轻轻收走。",
    desc: "接下来 10 步不会遭遇随机战斗。",
    use: s => {
      s.avoidEncounters = 10;
      return "隐匿之尘融入衣角，接下来 10 步不会遭遇随机战斗。";
    }
  },
  primordialPill: {
    name: "原初余烬",
    type: "passive",
    scope: "any",
    flavor: "从陨星圣匣中剥落的一枚温热余烬，内里仍回响着创世熔炉的低鸣。把它贴近胸口时，血脉、骨甲与步伐都会被古老火种轻轻重铸。",
    desc: "宝物。永久提升 HP +1、攻击 +1、免伤 +1%、速度 +1。",
    onAcquire: s => {
      s.player.maxHp += 1;
      s.player.hp += 1;
      s.player.baseAtk += 1;
      s.player.baseDamageReduction = clamp((s.player.baseDamageReduction || 0) + 0.01, 0, 0.95);
      grantBaseSpeed(s, 1);
      s.player.primordialSpeedApplied = true;
    }
  }
};
