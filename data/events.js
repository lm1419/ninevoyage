// Random event data for the current Oak Town / wild field loop.
window.EVENT_DEFAULT_ILLUST = "assets/event/default.png";
window.EVENT_DEFAULT_WEIGHT = 10;

function ensureEventInventory(s) {
  s.inventory = s.inventory || {};
  return s.inventory;
}

function pushEventPreBattleEffect(s, effect) {
  s.preBattleEffects = s.preBattleEffects || [];
  s.preBattleEffects.push(effect);
}

function spendEventItem(s, id, amount = 1) {
  const inventory = ensureEventInventory(s);
  if ((inventory[id] || 0) < amount) return false;
  inventory[id] -= amount;
  return true;
}

function oakChoice(label, run, disabled = false) {
  return [label, run, disabled];
}

const oakRoadCache = choiceEvent(
  "路边补给箱",
  "旧商路边倒着一只被雨水泡胀的补给箱，锁扣已经松开，里面还有几包没受潮的药材。",
  [
    oakChoice("拿走能用的药材", s => {
      addItem(s, "apprenticeHealthPotion", 1);
      return "获得 学徒生命药剂 x1。";
    }),
    oakChoice("花时间仔细翻找", s => {
      s.timeLeft = Math.max(0, s.timeLeft - 2);
      s.gold += 16;
      addItem(s, "apprenticeManaPotion", 1);
      return "时间 -2，金币 +16，获得 学徒法力药剂 x1。";
    }),
  ],
  window.EVENT_DEFAULT_ILLUST,
  4
);
oakRoadCache.id = "oak-road-cache";
oakRoadCache.triggerTypes = ["inventory.gain", "resource.gain"];

const oakWolfTracks = choiceEvent(
  "草坡狼迹",
  "草坡上压着新鲜爪印，雾里传来低低的喘息。绕路会慢一些，追踪它们也许能抢到先手。",
  [
    oakChoice("绕开狼迹", s => {
      s.timeLeft = Math.max(0, s.timeLeft - 2);
      s.avoidEncounters = Math.max(s.avoidEncounters || 0, 3);
      return "时间 -2，接下来 3 步不会遭遇随机战斗。";
    }),
    oakChoice("反向追踪", s => {
      pushEventPreBattleEffect(s, { type: "enemyStatus", id: "vulnerable", duration: 2 });
      return "你提前摸清了猎物的位置。下一场战斗敌人开局获得易伤 2 回合。";
    }),
  ],
  window.EVENT_DEFAULT_ILLUST,
  4
);
oakWolfTracks.id = "oak-wolf-tracks";
oakWolfTracks.triggerTypes = ["route.avoidBattle", "battle.nextEnemyStatus"];

const oakAbandonedCart = choiceEvent(
  "废车残货",
  "一辆货车陷在泥里，车轴断裂，帆布下露出几只破木箱。箱底有血迹，也有硬币声。",
  [
    oakChoice("撬开木箱", s => {
      damagePlayer(s, 6);
      s.gold += 24;
      return "机关割伤了手臂，HP -6，金币 +24。";
    }),
    oakChoice("用药水交换安全", s => {
      if (!spendEventItem(s, "apprenticeHealthPotion", 1)) return "缺少学徒生命药剂，没能完成交换。";
      s.gold += 34;
      return "消耗 学徒生命药剂 x1，金币 +34。";
    }, s => (s.inventory?.apprenticeHealthPotion || 0) < 1),
  ],
  window.EVENT_DEFAULT_ILLUST,
  3
);
oakAbandonedCart.id = "oak-abandoned-cart";
oakAbandonedCart.triggerTypes = ["resource.gain", "inventory.cost"];

const oakFogMarker = choiceEvent(
  "雾中界碑",
  "废弃界碑半埋在土里，碑面渗出冷雾。靠近它时，你听见盔甲在看不见的地方轻轻摩擦。",
  [
    oakChoice("稳住呼吸穿过去", s => {
      applyStatus(s.player, "shield", { value: 16, duration: 3 });
      return "获得 16 点护盾，持续 3 回合。";
    }),
    oakChoice("敲击界碑引开守卫", s => {
      s.timeLeft = Math.max(0, s.timeLeft - 3);
      pushEventPreBattleEffect(s, { type: "enemyStatus", id: "stun", duration: 1 });
      return "时间 -3，下一场战斗敌人开局眩晕 1 回合。";
    }),
  ],
  window.EVENT_DEFAULT_ILLUST,
  3
);
oakFogMarker.id = "oak-fog-marker";
oakFogMarker.triggerTypes = ["status.playerPositive", "battle.nextEnemyStatus"];

window.EVENT_DB = {
  "oak-road-cache": oakRoadCache,
  "oak-wolf-tracks": oakWolfTracks,
  "oak-abandoned-cart": oakAbandonedCart,
  "oak-fog-marker": oakFogMarker,
};

window.RANDOM_EVENTS = { commonSkills: [] };
