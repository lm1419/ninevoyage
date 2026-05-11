function cloneEnemy(e) {
  return { ...e, hp: e.maxHp, speed: e.speed ?? defaultEnemySpeed(e, !!e.boss), tempSpeed: e.tempSpeed || 0 };
}

function defaultEnemySpeed(enemy, isBoss = false) {
  const bossPenalty = isBoss ? 1 : 0;
  return Math.max(7, Math.min(13, 10 - bossPenalty));
}

function getEnemy(id) {
  // 变量：enemy，当前战斗或待生成的敌人对象。
  const enemy = ENEMY_DB[id];
  if (!enemy) throw new Error(`Enemy not found: ${id}`);
  return { id, ...enemy };
}

function scaleEnemy(enemy, isBoss, step) {
  // 变量：rule，当前副本敌人等级规则。
  const rule = currentLevelRule();
  // 变量：level，当前角色、敌人或技能等级。
  const level = enemy.fixedLevel || (isBoss ? rule.bossLevel : randomEnemyLevel(rule, step));
  // 变量：diff，等级差或成长差值，用于缩放属性与经验。
  const diff = Math.max(0, level - rule.baseLevel);
  // 变量：growth，敌人或副本成长配置，用于计算属性提升。
  const growth = currentEnemyConfig().growth?.[isBoss ? "boss" : "normal"] || { hp: 0, atk: 0, damageReduction: 0, speed: 0 };
  const baseSpeed = enemy.speed ?? defaultEnemySpeed(enemy, isBoss);
  const scaled = {
    ...enemy,
    level,
    maxHp: Math.round(enemy.maxHp + diff * growth.hp),
    atk: Math.round(enemy.atk + diff * growth.atk),
    damageReduction: clamp((enemy.damageReduction || 0) + diff * (growth.damageReduction || 0), 0, 0.95),
    speed: Math.max(1, Math.round(baseSpeed + diff * (growth.speed || 0))),
  };
  return applyEnemyBalance(scaled, rule, isBoss);
}

function applyEnemyBalance(enemy, rule, isBoss) {
  const balance = rule.balance?.[isBoss ? "boss" : "normal"];
  if (!balance) return enemy;
  return {
    ...enemy,
    maxHp: Math.max(1, Math.round(enemy.maxHp * (balance.hp ?? 1))),
    atk: Math.max(1, Math.round(enemy.atk * (balance.atk ?? 1))),
    damageReduction: clamp((enemy.damageReduction || 0) * (balance.damageReduction ?? 1), 0, 0.95),
    speed: Math.max(1, Math.round(enemy.speed * (balance.speed ?? 1))),
  };
}

function randomEnemyLevel(rule, step) {
  // 变量：range，当前步数区间允许生成的敌人等级范围。
  const range = rule.ranges[stepInterval(step, rule.ranges)] || [
    rule.baseLevel,
    rule.levelCap,
  ];
  return randInt(range[0], range[1]);
}

function selectRandomEnemy(poolId, step) {
  // 变量：ids，敌人池中的敌人 id 列表。
  const ids = (currentDungeon()?.enemyIds || []).filter((id) =>
    isStepAvailable(enemySpawnConfig(id), step),
  );
  if (!ids.length) return null;
  // 变量：interval，当前步数所属区间，用于匹配敌人权重。
  const interval = stepInterval(step, currentLevelRule().ranges);
  // 变量：weighted，带生成权重的候选敌人列表。
  const weighted = ids
    .map((id) => {
      // 变量：enemy，当前战斗或待生成的敌人对象。
      const enemy = getEnemy(id);
      // 变量：weight，weight 的局部缓存值，用于让后续表达式更清晰。
      const weight = enemySpawnConfig(id)?.weights?.[interval] ?? 0;
      return { enemy, weight };
    })
    .filter((item) => item.weight > 0);
  // 变量：source，实际参与抽取的候选列表，权重为空时使用默认列表。
  const source = weighted.length
    ? weighted
    : ids.map((id) => ({ enemy: getEnemy(id), weight: 1 }));
  // 变量：total，候选权重总和，用于随机抽取。
  const total = source.reduce((sum, item) => sum + item.weight, 0);
  // 变量：roll，随机流程判定值，用于决定环境描述、事件或战斗。
  let roll = Math.random() * total;
  for (const item of source) {
    roll -= item.weight;
    if (roll <= 0) return item.enemy;
  }
  return source[source.length - 1].enemy;
}

function enemySpawnConfig(id, dungeon = currentDungeon()) {
  const config = dungeon?.enemySpawns?.[id];
  return config || {};
}

function stepInterval(step, ranges = currentLevelRule().ranges || {}) {
  const value = Number(step) || 0;
  const match = Object.keys(ranges).find((key) => {
    const [min, max] = key.split("-").map((part) => Number(part));
    if (!Number.isFinite(min) || !Number.isFinite(max)) return false;
    return value >= min && value < max;
  });
  return match || Object.keys(ranges)[0] || "0-100";
}

function playerBaseSpeedCap() {
  return 18;
}

function playerTotalSpeedCap() {
  return 30;
}

function grantBaseSpeed(s, amount = 1) {
  if (!s?.player || !amount) return 0;
  const before = s.player.baseSpeed || 12;
  const after = Math.min(playerBaseSpeedCap(), before + Math.max(0, amount));
  s.player.baseSpeed = after;
  return after - before;
}

function calcDamage(atk) {
  const base = Math.max(1, Math.floor(atk + randInt(-3, 4)));
  return { damage: base };
}

function grantExp(enemy, isBoss) {
  // 变量：cap，当前副本或全局等级上限。
  const cap = currentLevelCap();
  if (state.player.level >= cap) {
    state.player.exp = 0;
    return 0;
  }
  // 变量：exp，本次战斗获得或当前累计的经验值。
  const exp = calcEnemyExp(enemy, isBoss);
  state.player.exp += exp;
  // 变量：levelMessages，升级过程中产生的提示文本。
  const levelMessages = [];
  while (
    state.player.level < cap &&
    state.player.exp >= nextExp(state.player.level)
  ) {
    state.player.exp -= nextExp(state.player.level);
    levelMessages.push(levelUpPlayer());
  }
  if (state.player.level >= cap) state.player.exp = 0;
  levelMessages.forEach((msg) => addLine(msg, "reward"));
  return exp;
}

function calcEnemyExp(enemy, isBoss) {
  // 变量：cfg，当前数据表配置项，提供状态、经验或技能的规则参数。
  const cfg = ENEMY_LEVEL_CONFIG.exp;
  // 变量：level，当前角色、敌人或技能等级。
  const level = enemy.level || 1;
  // 变量：base，技能或经验等基础配置项，用于派生当前等级数据。
  const base = isBoss
    ? cfg.bossBase + level * cfg.bossPerLevel
    : cfg.normalBase + level * cfg.normalPerLevel;
  // 变量：diff，等级差或成长差值，用于缩放属性与经验。
  const diff = state.player.level - level;
  // 变量：rate，经验倍率或概率倍率。
  let rate = cfg.sameOrHigherRate;
  if (diff >= 6) rate = cfg.lowerSixPlusRate;
  else if (diff >= 3) rate = cfg.lowerThreeToFiveRate;
  else if (diff >= 1) rate = cfg.lowerOneToTwoRate;
  return Math.max(1, Math.floor(base * rate));
}

function levelUpPlayer() {
  // 变量：beforeRealm，升级前阶位名称，用于判断是否突破。
  const beforeRealm = realmName(state.player.level);
  state.player.level += 1;
  // 变量：hpGain，本次升级增加的最大生命值。
  const hpGain = 7 + (state.player.level % 5 === 0 ? 8 : 0);
  // 变量：atkGain，本次升级增加的基础攻击。
  const atkGain = 1 + (state.player.level % 10 === 0 ? 2 : 0);
  // 变量：defGain，本次升级增加的基础免伤。
  const defGain =
    (state.player.level % 2 === 0 ? 1 : 0) +
    (state.player.level % 10 === 0 ? 1 : 0);
  state.player.maxHp += hpGain;
  state.player.baseAtk += atkGain;
  state.player.baseDamageReduction = clamp((state.player.baseDamageReduction || 0) + defGain * 0.01, 0, 0.95);
  state.player.hp = state.player.maxHp;
  // 变量：afterRealm，升级后阶位名称。
  const afterRealm = realmName(state.player.level);
  // 变量：realmText，阶位变化提示文本。
  const realmText =
    beforeRealm !== afterRealm ? `，阶位突破至 ${afterRealm}` : "";
  state._levelUpFlash =
    beforeRealm !== afterRealm ? "realm-breakthrough" : "level-up";
  return `历练提升至 Lv.${state.player.level}${realmText}：最大 HP +${hpGain}，攻击 +${atkGain}，免伤 +${defGain}，HP 已回满。`;
}

function damagePlayer(s, amount) {
  if (s.trapHalfDamage) amount = Math.max(1, Math.floor(amount / 2));
  // 变量：dealt，实际扣除的伤害值，已考虑护盾和状态修正。
  applyDamage(s.player, amount);
  return "";
}

function healPlayer(s, amount) {
  // 变量：old，变化前数值，用于计算实际恢复或扣减量。
  const old = s.player.hp;
  s.player.hp = Math.min(s.player.maxHp, s.player.hp + amount);
  return `HP 恢复 ${s.player.hp - old}。`;
}

function healPlayerPercent(s, pct) {
  // 变量：amount，本次治疗、伤害、加成或资源变化的数量。
  const amount = Math.max(1, Math.floor(s.player.maxHp * pct));
  return healPlayer(s, amount);
}

function restorePlayerMp(s, amount) {
  const maxMp = s.player.maxMp || 30;
  const old = s.player.mp ?? maxMp;
  s.player.mp = Math.min(maxMp, old + amount);
  return `MP 恢复 ${s.player.mp - old}。`;
}

function restorePlayerMpPercent(s, pct) {
  const maxMp = s.player.maxMp || 30;
  const amount = Math.max(1, Math.floor(maxMp * pct));
  return restorePlayerMp(s, amount);
}

function addItem(s, id, n = 1) {
  const prev = s.inventory[id] || 0;
  s.inventory[id] = prev + n;
  if (s === state) recordExpeditionGain("item", id, n);
  addLine(`获得 ${ITEM_DB[id].name} x${n}。`, "reward");
  if (prev <= 0 && ITEM_DB[id]?.onAcquire) ITEM_DB[id].onAcquire(s);
  return "";
}

function addEquipment(s, id) {
  const finalId = isEquipmentBase(id) ? createEquipmentInstance(id, s) : id;
  const equipment = getEquipment(finalId, s);
  if (!equipment) return null;
  if (!s.ownedEquip.includes(finalId)) s.ownedEquip.push(finalId);
  if (s === state) recordExpeditionGain("equipment", finalId, 1);
  s.equipmentDurability = s.equipmentDurability || {};
  if (equipment.durability && !s.equipmentDurability[finalId]) {
    s.equipmentDurability[finalId] = equipment.durability;
  }
  addLine(`获得装备：${equipment.name}。`, "reward");
  return finalId;
}

function applyRewards(rewards) {
  if (rewards.item) addItem(state, rewards.item, rewards.count || 1);
  if (rewards.equipment) addEquipment(state, rewards.equipment);
  if (rewards.skill) addSkill(state, rewards.skill);
  if (rewards.skills) rewards.skills.forEach((id) => addSkill(state, id));
  if (rewards.speed) {
    const gained = grantBaseSpeed(state, rewards.speed);
    addLine(
      gained > 0
        ? `步法精进：速度 +${gained}。`
        : `步法已臻当前极限：基础速度上限 ${playerBaseSpeedCap()}。`,
      "reward",
    );
  }
}

function addSkill(s, id) {
  // 变量：base，技能或经验等基础配置项，用于派生当前等级数据。
  const base = PLAYER_SKILLS[id];
  if (!base) return;
  s.player.skills = s.player.skills || {};
  if (Array.isArray(s.player.skills)) {
    if (s.player.skills.includes(id)) return;
    // 变量：obj，技能旧存档迁移后的对象映射。
    const obj = {};
    s.player.skills.forEach((sid) => {
      obj[sid] = 1;
    });
    obj[id] = 1;
    s.player.skills = obj;
  } else {
    if (id in s.player.skills) return;
    s.player.skills[id] = 1;
  }
  // 变量：skill，当前施放的技能配置。
  const skill = getSkillLevelData(base, 1);
  // 变量：autoQuick，首次获得主动战斗技能时是否自动设为快捷释放。
  const autoQuick = isActivePlayerSkill(skill) && !quickPlayerSkill(s);
  if (autoQuick) s.player.quickSkillId = id;
  addHtmlLine(
    `学会技能「${playerSkillName(skill)}」。${autoQuick ? "已自动设为快捷释放。" : ""}`,
    "reward",
  );
}

function migrateSkills() {
  state.player.skills = state.player.skills || {};
  state.player.skills = Object.fromEntries(
    Object.entries(state.player.skills)
      .filter(([id]) => PLAYER_SKILLS[id])
      .map(([id, level]) => {
        const maxLevel = PLAYER_SKILLS[id]?.maxLevel || 1;
        return [id, clamp(Number(level) || 1, 1, maxLevel)];
      }),
  );
  Object.keys(PLAYER_SKILLS).forEach((id) => {
    if (!(id in state.player.skills)) state.player.skills[id] = 1;
  });
  ensureQuickPlayerSkill(state);
}

function applyGrowth(g) {
  if (!g) return;
  state.player.maxHp += g.hp || 0;
  state.player.baseAtk += g.atk || 0;
  state.player.baseDamageReduction = clamp((state.player.baseDamageReduction || 0) + (g.damageReduction || 0), 0, 0.95);
  const speedGain = grantBaseSpeed(state, g.speed || 0);
  state.player.hp = state.player.maxHp;
  if (g.hp || g.atk || g.damageReduction || g.speed)
    addLine(
      `Boss 战后成长：HP +${g.hp || 0}，攻击 +${g.atk || 0}，免伤 +${g.damageReduction || 0}，速度 +${speedGain}。`,
      "reward",
    );
}

