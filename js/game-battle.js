const ACTION_GAUGE_MAX = 100;
const ACTION_GAUGE_BASE_SECONDS = 3.2;
const ACTION_TICK_MS = 80;
const QTE_TICK_MS = 34;
const QTE_RESULT_GRACE = 0.035;

let battleGaugeTimer = null;
let activeQte = null;
let qteTimer = null;

function startBattle(enemy, isBoss, options = {}) {
  state.mode = "battle";
  // 变量：scaledEnemy，按副本规则和步数缩放后的敌人实例。
  const scaledEnemy = scaleEnemy(enemy, isBoss, state.step);
  state.battle = {
    enemy: cloneEnemy(scaledEnemy),
    isBoss,
    special: options.special || null,
    noRun: !!options.noRun,
    skipBattleRewards: !!options.skipBattleRewards,
    settlementText: options.settlementText || "",
    onWin: options.onWin || null,
    enemySkillIds: options.enemySkillIds || scaledEnemy.skillIds || {},
    battleScript: cloneBattleScript(options.battleScript),
  };
  normalizeBattleActionState(state.battle, { reset: true });
  state.battle.enemy.skillCooldowns = {};
  state.battle.enemy.activeBuffs = [];
  state.battle.enemy.statuses = {};
  state.battle.enemy.tempDamageReduction = 0;
  if (isBoss && state.bossStun) {
    applyStatus(state.battle.enemy, "stun", { duration: 1 });
    state.bossStun = false;
  }
  // 应用战斗外使用消耗品暂存的减益
  if (state.preBattleEffects && state.preBattleEffects.length) {
    state.preBattleEffects.forEach(eff => {
      if (eff.type === "enemyStatus") {
        applyStatus(state.battle.enemy, eff.id, { duration: eff.duration });
      } else if (eff.type === "playerStatus") {
        applyStatus(state.player, eff.id, {
          value: eff.value,
          duration: eff.duration,
          skipDurationTicks: eff.skipDurationTicks,
        });
      }
    });
    state.preBattleEffects = [];
  }
  state.battle.runBonus = 0;
  ensureStatuses(state.player);
  state.player.skillCooldowns = {};
  state.player.tempAtk = state.player.tempAtk || 0;
  state.player.tempAtkRate = state.player.tempAtkRate || 0;
  state.player.tempDamageReduction = state.player.tempDamageReduction || 0;
  applyBattleStartPassiveTreasures();
  queueVisualAnimation("encounter");
  beginNarrative(
    options.introText ||
      (isBoss
      ? `【Boss 战】${scaledEnemy.name} Lv.${scaledEnemy.level} 阻断前路。`
      : `【遭遇战】${scaledEnemy.name} Lv.${scaledEnemy.level} 自阴影中扑来。`),
    () => {
      state.mode = "battle";
      render();
      startBattleGaugeLoop();
    },
    { className: isBoss ? "danger" : "warn", typewriter: true },
  );
}

function cloneBattleScript(script) {
  if (!script) return null;
  return {
    ...script,
    phaseIndex: 0,
    outroPlayed: false,
    phases: (script.phases || []).map((phase) => ({ ...phase })),
  };
}

function battleTimeNow() {
  return typeof performance !== "undefined" && performance.now
    ? performance.now()
    : Date.now();
}

function normalizeBattleActionState(battle = state.battle, options = {}) {
  if (!battle) return null;
  const prev = battle.action || {};
  const previousPhase =
    options.clearQte && ["qte", "resolving", "enemyReady"].includes(prev.phase)
      ? "charging"
      : prev.phase;
  battle.action = {
    playerGauge: options.reset ? 0 : clamp(prev.playerGauge || 0, 0, ACTION_GAUGE_MAX),
    enemyGauge: options.reset ? 0 : clamp(prev.enemyGauge || 0, 0, ACTION_GAUGE_MAX),
    phase: options.reset ? "charging" : previousPhase || "charging",
    lastTick: options.reset ? battleTimeNow() : prev.lastTick || battleTimeNow(),
  };
  if (options.reset || options.clearQte) battle.qte = null;
  return battle.action;
}

function battleActionState() {
  return normalizeBattleActionState(state.battle);
}

function stopBattleGaugeLoop() {
  if (!battleGaugeTimer) return;
  clearInterval(battleGaugeTimer);
  battleGaugeTimer = null;
}

function startBattleGaugeLoop() {
  if (!state.battle || state.mode !== "battle" || typing) return;
  const action = battleActionState();
  if (!action || action.phase !== "charging") return;
  if (battleGaugeTimer) return;
  action.lastTick = battleTimeNow();
  battleGaugeTimer = setInterval(advanceBattleGauges, ACTION_TICK_MS);
}

function clearBattleQte() {
  if (qteTimer) {
    clearInterval(qteTimer);
    qteTimer = null;
  }
  activeQte = null;
  if (state?.battle) state.battle.qte = null;
}

function battleGaugeGainPerSecond(speed) {
  return (ACTION_GAUGE_MAX / ACTION_GAUGE_BASE_SECONDS) * (Math.max(1, speed) / 10);
}

function advanceBattleGauges() {
  if (!state.battle || state.mode !== "battle" || typing) {
    stopBattleGaugeLoop();
    return;
  }
  const action = battleActionState();
  if (!action || action.phase !== "charging") {
    stopBattleGaugeLoop();
    return;
  }
  const now = battleTimeNow();
  const dt = Math.min(0.25, Math.max(0, (now - action.lastTick) / 1000));
  action.lastTick = now;
  action.playerGauge = clamp(
    action.playerGauge + battleGaugeGainPerSecond(totalSpeed()) * dt,
    0,
    ACTION_GAUGE_MAX,
  );
  action.enemyGauge = clamp(
    action.enemyGauge + battleGaugeGainPerSecond(enemySpeed(state.battle.enemy)) * dt,
    0,
    ACTION_GAUGE_MAX,
  );
  renderBattleHud();
  if (action.playerGauge >= ACTION_GAUGE_MAX || action.enemyGauge >= ACTION_GAUGE_MAX) {
    resolveReadyActionGauge();
  }
}

function resolveReadyActionGauge() {
  const action = battleActionState();
  if (!state.battle || !action || action.phase !== "charging") return;
  stopBattleGaugeLoop();
  const playerReady = action.playerGauge >= ACTION_GAUGE_MAX;
  const enemyReady = action.enemyGauge >= ACTION_GAUGE_MAX;
  const actor = playerReady && enemyReady
    ? totalSpeed() >= enemySpeed(state.battle.enemy) ? "player" : "enemy"
    : playerReady ? "player" : "enemy";
  if (actor === "player") {
    action.playerGauge = ACTION_GAUGE_MAX;
    action.phase = "playerReady";
    tickCooldowns(state.player.skillCooldowns);
    render();
    return;
  }
  action.enemyGauge = ACTION_GAUGE_MAX;
  action.phase = "enemyReady";
  tickCooldowns(state.battle.enemy.skillCooldowns);
  render();
  setTimeout(() => {
    if (!state.battle || state.mode !== "battle") return;
    const currentAction = battleActionState();
    if (currentAction?.phase !== "enemyReady") return;
    currentAction.phase = "resolving";
    enemyAct();
    if (!state.battle || state.mode !== "battle") return;
    if (battleActionState()?.phase === "scripted") {
      render();
      return;
    }
    checkPlayerAlive();
    render();
  }, 260);
}

function resumeBattleGaugeLoop() {
  if (!state.battle || state.mode !== "battle") return;
  const action = battleActionState();
  if (!action || action.phase !== "charging") return;
  if (action.playerGauge >= ACTION_GAUGE_MAX || action.enemyGauge >= ACTION_GAUGE_MAX) {
    resolveReadyActionGauge();
    return;
  }
  render();
  startBattleGaugeLoop();
}

function completeBattleAction(actor) {
  if (!state.battle) return;
  const action = battleActionState();
  if (!action) return;
  if (actor === "player") action.playerGauge = 0;
  if (actor === "enemy") action.enemyGauge = 0;
  action.phase = "charging";
  action.lastTick = battleTimeNow();
  resumeBattleGaugeLoop();
}

function canPlayerAct() {
  return (
    state.mode === "battle" &&
    !!state.battle &&
    battleActionState()?.phase === "playerReady" &&
    !state.battle.qte &&
    !typing
  );
}

function battlePhaseText() {
  const phase = state.battle?.action?.phase || "charging";
  if (state.battle?.qte) return state.battle.qte.label || "判定中";
  if (phase === "playerReady") return "你可行动";
  if (phase === "scripted") return "龙息审判";
  if (phase === "enemyReady" || phase === "resolving") return "敌方行动";
  return "蓄势中";
}

function battleQteProgress() {
  if (!state.battle?.qte) return 0;
  if (!activeQte) return state.battle.qte.progress || 0;
  const phase = ((battleTimeNow() - activeQte.startedAt) % activeQte.duration) / activeQte.duration;
  return phase <= 0.5 ? phase * 2 : (1 - phase) * 2;
}

function useBattleQte() {
  return state.settings?.battleMode !== "auto";
}

function autoBattleResult(kind = "attack") {
  return {
    rank: "auto",
    label: "实时演算",
    damageMultiplier: kind === "defense" ? 0.85 : 1,
    preventStatus: false,
  };
}

function startBattleQte(config, onComplete) {
  if (!state.battle) return;
  stopBattleGaugeLoop();
  const action = battleActionState();
  if (action) action.phase = "qte";
  if (!useBattleQte()) {
    if (action) action.phase = "resolving";
    onComplete?.(autoBattleResult(config.kind || "attack"));
    return;
  }
  const startedAt = battleTimeNow();
  const duration = config.duration || 1400;
  // 变量：perfectWidth，完美判定占整条 QTE 条的比例。
  const perfectWidth = clamp(config.perfectWidth ?? 0.18, 0.01, 0.95);
  // 变量：perfectStart，完美判定起点。
  const perfectStart = config.perfectStart ?? (1 - perfectWidth) / 2;
  // 变量：perfectEnd，完美判定终点。
  const perfectEnd = config.perfectEnd ?? perfectStart + perfectWidth;
  activeQte = {
    ...config,
    onComplete,
    startedAt,
    duration,
    successStart: Math.min(config.successStart ?? 0.28, perfectStart),
    successEnd: Math.max(config.successEnd ?? 0.78, perfectEnd),
    perfectStart,
    perfectEnd,
  };
  state.battle.qte = {
    kind: config.kind || "attack",
    label: config.label || "判定",
    hint: config.hint || "按下判定键。",
    progress: 0,
    successStart: activeQte.successStart,
    successEnd: activeQte.successEnd,
    perfectStart: activeQte.perfectStart,
    perfectEnd: activeQte.perfectEnd,
  };
  render();
  qteTimer = setInterval(updateBattleQte, QTE_TICK_MS);
}

function updateBattleQte() {
  if (!state.battle?.qte || !activeQte) {
    clearBattleQte();
    return;
  }
  const progress = battleQteProgress();
  state.battle.qte.progress = progress;
  if (typeof renderBattleQteProgress !== "function" || !renderBattleQteProgress()) {
    renderBattleHud();
  }
}

function confirmBattleQte(event) {
  finishBattleQte(event);
}

function finishBattleQte() {
  if (!state.battle?.qte || !activeQte) return;
  const qte = activeQte;
  const { progress, result } = bestQteResult(qte);
  if (qteTimer) {
    clearInterval(qteTimer);
    qteTimer = null;
  }
  activeQte = null;
  state.battle.qte = { ...state.battle.qte, progress, result: result.label };
  const action = battleActionState();
  if (action) action.phase = "resolving";
  renderBattleHud();
  if (result.rank === "perfect") {
    playPerfectQteEffect(progress);
  } else {
    playNormalQteEffect(progress, result.rank);
  }
  state.battle.qte = null;
  qte.onComplete(result);
}

function qteDisplayedProgress() {
  const progress = Number(state.battle?.qte?.progress);
  return Number.isFinite(progress) ? clamp(progress, 0, 1) : battleQteProgress();
}

function qteRankScore(rank) {
  if (rank === "perfect") return 3;
  if (rank === "success") return 2;
  return 1;
}

function bestQteResult(qte) {
  const candidates = [qteDisplayedProgress(), battleQteProgress()];
  let best = {
    progress: candidates[0],
    result: qteResult(qte, candidates[0]),
  };
  candidates.slice(1).forEach((progress) => {
    const result = qteResult(qte, progress);
    if (qteRankScore(result.rank) > qteRankScore(best.result.rank)) {
      best = { progress, result };
    }
  });
  return best;
}

function qteInZone(progress, start, end, grace = QTE_RESULT_GRACE) {
  return progress >= start - grace && progress <= end + grace;
}

function qteResult(qte, progress) {
  if (qteInZone(progress, qte.perfectStart, qte.perfectEnd)) {
    return {
      rank: "perfect",
      label: "完美",
      damageMultiplier: qte.kind === "defense" ? 0.5 : 1.35,
      preventStatus: qte.kind === "defense",
    };
  }
  if (qteInZone(progress, qte.successStart, qte.successEnd)) {
    return {
      rank: "success",
      label: "成功",
      damageMultiplier: qte.kind === "defense" ? 0.72 : 1,
      preventStatus: false,
    };
  }
  return {
    rank: "miss",
    label: "失手",
    damageMultiplier: qte.kind === "defense" ? 1 : 0.5,
    preventStatus: false,
  };
}

function qteAttackText(qte) {
  if (!qte) return "";
  if (qte.rank === "auto") return "";
  if (qte.rank === "perfect") return "判定完美，剑势暴涨，";
  if (qte.rank === "success") return "";
  return "判定失手，气机受挫，";
}

function qteDefenseText(qte) {
  if (!qte) return "";
  if (qte.rank === "auto") return "";
  if (qte.rank === "perfect") return "你完美架开攻势，";
  if (qte.rank === "success") return "你及时守住门户，";
  return "你慢了半拍，";
}

function applyBattleStartPassiveTreasures() {
  for (const [id, count] of Object.entries(state.inventory)) {
    if (count <= 0) continue;
    const item = ITEM_DB[id];
    if (!item || !item.battleStart) continue;
    for (let i = 0; i < count; i++) item.battleStart(state);
  }
}

function applyBattleEndPassiveTreasures() {
  for (const [id, count] of Object.entries(state.inventory)) {
    if (count <= 0) continue;
    const item = ITEM_DB[id];
    if (!item || !item.battleEnd) continue;
    for (let i = 0; i < count; i++) item.battleEnd(state);
  }
}

function applyAfterPlayerAttackPassiveTreasures() {
  for (const [id, count] of Object.entries(state.inventory)) {
    if (count <= 0) continue;
    const item = ITEM_DB[id];
    if (!item || !item.afterPlayerAttack) continue;
    for (let i = 0; i < count; i++) {
      const msg = item.afterPlayerAttack(state);
      if (msg) addLine(msg, "reward");
    }
  }
}

function getSkillLevelData(skill, level) {
  if (!skill) return null;
  if (skill.levels && skill.levels.length) {
    // 变量：levelIndex，技能等级数组索引，用目标等级映射到对应等级配置。
    const levelIndex = Math.min(level, skill.levels.length) - 1;
    return { ...skill, ...skill.levels[levelIndex] };
  }
  return skill;
}

function resolveSkillValue(value, entity) {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    // 变量：match，百分比最大生命值表达式的解析结果。
    const match = value.match(/^(\d+)%maxHp$/);
    if (match)
      return Math.floor(((entity.maxHp || 0) * parseInt(match[1])) / 100);
  }
  return 0;
}

function upgradeGoldCost(currentLevel) {
  if (currentLevel === 1) return 50;
  return 50 * currentLevel;
}

function upgradeSkill(id) {
  // 变量：base，技能或经验等基础配置项，用于派生当前等级数据。
  const base = PLAYER_SKILLS[id];
  if (!base || !base.maxLevel) return;
  // 变量：currentLevel，玩家当前已掌握的技能等级。
  const currentLevel = state.player.skills[id] || 1;
  if (currentLevel >= base.maxLevel) return;
  // 变量：cost，技能升级所需金币数量。
  const cost = upgradeGoldCost(currentLevel);
  if (state.gold < cost) {
    addLine("金币不足，无法升级。", "warn");
    return;
  }
  state.gold -= cost;
  state.player.skills[id] = currentLevel + 1;
  // 变量：newData，升级后的技能等级数据，用于展示新效果。
  const newData = getSkillLevelData(base, currentLevel + 1);
  addLine(
    `技能「${base.name}」升到 Lv.${currentLevel + 1}。${newData.desc}`,
    "reward",
  );
  render();
  renderMenu("skill");
}

function knownPlayerSkills(s = state) {
  // 变量：skills，玩家已学习技能映射，用于渲染、升级和施放判定。
  const skills = s.player.skills || {};
  if (Array.isArray(skills)) {
    return skills
      .map((id) => {
        // 变量：base，技能或经验等基础配置项，用于派生当前等级数据。
        const base = PLAYER_SKILLS[id];
        if (!base || !base.name) return null;
        // 变量：data，当前配置项的详细数据，随上下文表示事件、技能或状态效果。
        const data = getSkillLevelData(base, 1);
        return { id, level: 1, ...data };
      })
      .filter(Boolean);
  }
  return Object.entries(skills)
    .map(([id, level]) => {
      // 变量：base，技能或经验等基础配置项，用于派生当前等级数据。
      const base = PLAYER_SKILLS[id];
      if (!base || !base.name) return null;
      // 变量：data，当前配置项的详细数据，随上下文表示事件、技能或状态效果。
      const data = getSkillLevelData(base, level);
      return { id, level, ...data };
    })
    .filter(Boolean);
}

function isActivePlayerSkill(skill) {
  return !!skill && skill.category === "active" && !!skill.kind;
}

function knownActivePlayerSkills(s = state) {
  return knownPlayerSkills(s).filter(isActivePlayerSkill);
}

function quickPlayerSkill(s = state) {
  const quickId = s.player.quickSkillId;
  if (!quickId) return null;
  // 变量：skill，当前施放的技能配置。
  const skill = knownActivePlayerSkills(s).find((item) => item.id === quickId);
  if (skill) return skill;
  s.player.quickSkillId = null;
  return null;
}

function ensureQuickPlayerSkill(s = state) {
  const quick = quickPlayerSkill(s);
  if (quick) return quick;
  // 变量：firstSkill，第一个已掌握的主动战斗技能，用于旧存档和首次学习时自动装备。
  const firstSkill = knownActivePlayerSkills(s)[0] || null;
  s.player.quickSkillId = firstSkill?.id || null;
  return firstSkill;
}

function setQuickPlayerSkill(id) {
  // 变量：skill，当前施放的技能配置。
  const skill = knownActivePlayerSkills().find((item) => item.id === id);
  if (!skill) {
    addLine("只能把已学会的主动战斗技能设为快捷释放。", "warn");
    return false;
  }
  state.player.quickSkillId = id;
  addLine(`已将「${skill.name}」设为快捷释放技能。`, "system");
  render();
  return true;
}

function cycleQuickPlayerSkill(direction) {
  // 变量：skills，玩家已学习技能映射，用于渲染、升级和施放判定。
  const skills = knownActivePlayerSkills();
  if (!skills.length) {
    addLine("还没有可以快捷释放的主动战斗技能。", "warn");
    return;
  }
  // 变量：currentIndex，当前快捷技能在主动技能列表中的位置。
  const currentIndex = Math.max(
    0,
    skills.findIndex((skill) => skill.id === state.player.quickSkillId),
  );
  // 变量：nextIndex，左右切换后的技能位置，首尾循环。
  const nextIndex = (currentIndex + direction + skills.length) % skills.length;
  state.player.quickSkillId = skills[nextIndex].id;
  render();
}

function canUsePlayerSkill(skill) {
  if (!skill || !isActivePlayerSkill(skill)) return false;
  const inBattle = state.mode === "battle";
  if (!inBattle && !skill.usableOutsideBattle) return false;
  if (inBattle && !canPlayerAct()) return false;
  // 变量：cooldown，技能剩余冷却回合数。
  const cooldown = state.player.skillCooldowns?.[skill.id] || 0;
  return (state.player.mp ?? state.player.maxMp ?? 30) >= (skill.cost || 0) && cooldown <= 0;
}

function useQuickPlayerSkill() {
  const skill = quickPlayerSkill();
  if (!skill) {
    addLine("还没有设置快捷释放技能。", "warn");
    return;
  }
  usePlayerSkill(skill.id);
}

function isBattleUsableConsumable(item) {
  return !!item && item.type === "consumable" && (item.scope === "any" || item.scope === "battle") && typeof item.use === "function";
}

function knownBattleQuickItems(s = state) {
  return Object.entries(s.inventory || {})
    .filter(([id, count]) => count > 0 && isBattleUsableConsumable(ITEM_DB[id]))
    .map(([id, count]) => ({ id, count, ...ITEM_DB[id] }));
}

function quickBattleItem(s = state) {
  const quickId = s.player.quickItemId;
  if (!quickId) return null;
  const item = knownBattleQuickItems(s).find((entry) => entry.id === quickId);
  if (item) return item;
  s.player.quickItemId = null;
  return null;
}

function ensureQuickBattleItem(s = state) {
  const quick = quickBattleItem(s);
  if (quick) return quick;
  const firstItem = knownBattleQuickItems(s)[0] || null;
  s.player.quickItemId = firstItem?.id || null;
  return firstItem;
}

function cycleQuickBattleItem(direction) {
  const items = knownBattleQuickItems();
  if (!items.length) {
    addLine("背包里没有可在战斗中快捷使用的道具。", "warn");
    return;
  }
  const currentIndex = Math.max(
    0,
    items.findIndex((item) => item.id === state.player.quickItemId),
  );
  const nextIndex = (currentIndex + direction + items.length) % items.length;
  state.player.quickItemId = items[nextIndex].id;
  render();
}

function canUseBattleQuickItem(item) {
  return !!item && state.mode === "battle" && canPlayerAct() && (state.inventory[item.id] || 0) > 0 && isBattleUsableConsumable(item);
}

function useQuickBattleItem() {
  const item = quickBattleItem();
  if (!item) {
    addLine("背包里没有可在战斗中快捷使用的道具。", "warn");
    return;
  }
  useItem(item.id);
}

function ensureStatuses(entity) {
  entity.statuses = entity.statuses || {};
  if (entity.poisoned) {
    entity.poisoned = false;
    applyStatus(entity, "poison", { duration: 3, silent: true });
  }
  return entity.statuses;
}

function applyStatus(entity, id, options = {}) {
  if (entity === state.player && id === "poison" && state.poisonImmune)
    return "";
  // 变量：cfg，当前数据表配置项，提供状态、经验或技能的规则参数。
  const cfg = STATUS_DB[id];
  if (!cfg || !entity) return "";
  // 变量：statuses，statuses 的局部缓存值，用于让后续表达式更清晰。
  const statuses = ensureStatuses(entity);
  // 变量：current，current 的局部缓存值，用于让后续表达式更清晰。
  const current = statuses[id] || { stacks: 0, duration: 0, value: cfg.value };
  // 变量：hadStatus，hadStatus 的局部缓存值，用于让后续表达式更清晰。
  const hadStatus = !!statuses[id];
  current.stacks = Math.min(
    cfg.maxStacks || 1,
    current.stacks + (options.stacks || 1),
  );
  current.duration = Math.max(
    current.duration || 0,
    options.duration || cfg.defaultDuration || 1,
  );
  if (cfg.stackValue === "add" && hadStatus) {
    current.value =
      (current.value || 0) + (options.value ?? cfg.value ?? 0);
  } else {
    current.value = options.value ?? current.value ?? cfg.value;
  }
  current.skipDurationTicks = Math.max(
    current.skipDurationTicks || 0,
    options.skipDurationTicks || 0,
  );
  statuses[id] = current;
  return options.silent
    ? ""
    : `${cfg.name}${current.stacks > 1 ? ` x${current.stacks}` : ""}`;
}

function hasStatus(entity, id) {
  ensureStatuses(entity);
  return !!entity.statuses[id];
}

function statusValue(entity, id) {
  // 变量：cfg，当前数据表配置项，提供状态、经验或技能的规则参数。
  const cfg = STATUS_DB[id];
  // 变量：status，status 的局部缓存值，用于让后续表达式更清晰。
  const status = ensureStatuses(entity)[id];
  if (!cfg || !status) return 0;
  return (status.value ?? cfg.value ?? 0) * (status.stacks || 1);
}

function eachStatus(entity, callback) {
  Object.entries(ensureStatuses(entity)).forEach(([id, status]) => {
    // 变量：cfg，当前数据表配置项，提供状态、经验或技能的规则参数。
    const cfg = STATUS_DB[id];
    if (cfg) callback(cfg, status, id);
  });
}

function statusInstanceValue(cfg, status) {
  return (status.value ?? cfg.value ?? 0) * (status.stacks || 1);
}

function statusText(entity) {
  return Object.entries(ensureStatuses(entity)).map(([id, status]) => {
    // 变量：cfg，当前数据表配置项，提供状态、经验或技能的规则参数。
    const cfg = STATUS_DB[id];
    if (!cfg) return id;
    // 变量：suffix，suffix 的局部缓存值，用于让后续表达式更清晰。
    const suffix =
      status.stacks > 1 ? `x${status.stacks}` : `${status.duration}回`;
    // 变量：valueText，固定数值类状态的补充显示文本。
    const valueText =
      cfg.modifyIncomingDamage === "add"
        ? `+${status.value ?? cfg.value ?? 0}`
        : "";
    return `${cfg.name}${valueText}${suffix}`;
  });
}

function purifyStatuses(entity) {
  // 变量：statuses，statuses 的局部缓存值，用于让后续表达式更清晰。
  const statuses = ensureStatuses(entity);
  // 变量：removed，removed 的局部缓存值，用于让后续表达式更清晰。
  const removed = [];
  Object.keys(statuses).forEach((id) => {
    if (STATUS_DB[id]?.type === "negative") {
      removed.push(STATUS_DB[id].name);
      delete statuses[id];
    }
  });
  entity.poisoned = false;
  return removed;
}

function tickStatusDurations(entity, kind = "all") {
  // 变量：statuses，statuses 的局部缓存值，用于让后续表达式更清晰。
  const statuses = ensureStatuses(entity);
  Object.entries(statuses).forEach(([id, status]) => {
    // 变量：cfg，当前数据表配置项，提供状态、经验或技能的规则参数。
    const cfg = STATUS_DB[id];
    if (!cfg) return;
    if (kind !== "all" && cfg.type !== kind) return;
    if (status.skipDurationTicks > 0) {
      status.skipDurationTicks -= 1;
      return;
    }
    if (status.duration == null) status.duration = cfg.defaultDuration || 1;
    status.duration -= 1;
    if (status.duration <= 0) delete statuses[id];
  });
}

function tickStatusDamage(entity, timing, label) {
  // 变量：statuses，statuses 的局部缓存值，用于让后续表达式更清晰。
  const statuses = ensureStatuses(entity);
  Object.entries(statuses).forEach(([id, status]) => {
    // 变量：cfg，当前数据表配置项，提供状态、经验或技能的规则参数。
    const cfg = STATUS_DB[id];
    if (cfg?.timing !== timing) return;
    // 变量：damage，damage 的局部缓存值，用于让后续表达式更清晰。
    const damage = Math.max(
      1,
      Math.floor((status.value ?? cfg.value ?? 1) * (status.stacks || 1)),
    );
    applyDamage(entity, damage, cfg.name);
    addLine(`${label}受${cfg.name}影响，损失 ${damage} HP。`, "danger");
  });
}

function applyDamage(entity, amount, source = "伤害", options = {}) {
  if (entity === state?.player && window.DEBUG_PLAYER_INVINCIBLE) return 0;
  let damage = Math.max(0, Math.floor(amount || 0));
  if (damage <= 0) return 0;
  damage = modifyIncomingDamageByStatuses(entity, damage);
  const reduction = Math.max(0, damageReductionFor(entity) - (options.ignoreDamageReduction || 0));
  damage = Math.max(1, Math.floor(damage * (1 - clamp(reduction, 0, 0.95))));
  damage = Math.max(1, Math.floor(damage * (options.finalDamageMultiplier || 1)));
  damage = absorbDamageByStatuses(entity, damage, source);
  entity.hp = Math.max(0, entity.hp - damage);
  return damage;
}

function modifyIncomingDamageByStatuses(entity, damage) {
  // 变量：result，result 的局部缓存值，用于让后续表达式更清晰。
  let result = damage;
  eachStatus(entity, (cfg, status) => {
    // 变量：value，待格式化、限制或转义的输入值。
    const value = statusInstanceValue(cfg, status);
    if (cfg.modifyIncomingDamage === "multiplyUp")
      result = Math.max(1, Math.floor(result * (1 + value)));
    if (cfg.modifyIncomingDamage === "multiplyDown")
      result = Math.max(0, Math.floor(result * (1 - value)));
    if (cfg.modifyIncomingDamage === "add")
      result = Math.max(0, Math.floor(result + value));
  });
  return result;
}

function absorbDamageByStatuses(entity, damage, source) {
  // 变量：remaining，remaining 的局部缓存值，用于让后续表达式更清晰。
  let remaining = damage;
  eachStatus(entity, (cfg, status, id) => {
    if (!cfg.absorbDamage || remaining <= 0) return;
    // 变量：absorb，absorb 的局部缓存值，用于让后续表达式更清晰。
    const absorb = Math.min(remaining, status.value || cfg.value || 0);
    status.value = (status.value || cfg.value || 0) - absorb;
    remaining -= absorb;
    if (absorb) addLine(`${cfg.name}抵消了 ${absorb} 点${source}。`, "system");
    if (status.value <= 0) delete entity.statuses[id];
  });
  return remaining;
}

function outgoingDamageMultiplierFor(entity) {
  let multiplier = 1;
  eachStatus(entity, (cfg, status) => {
    const value = statusInstanceValue(cfg, status);
    if (cfg.modifyOutgoingDamage === "multiplyUp") multiplier *= 1 + value;
    if (cfg.modifyOutgoingDamage === "multiplyDown") multiplier *= 1 - value;
  });
  return Math.max(0, multiplier);
}

function damageReductionFor(entity) {
  if (!entity) return 0;
  if (entity === state?.player) return totalDamageReduction();
  return modifiedDamageReduction((entity.damageReduction || 0) + (entity.tempDamageReduction || 0), entity);
}

function enemyDamageReduction() {
  return damageReductionFor(state.battle?.enemy);
}

function modifiedDamageReduction(base, entity) {
  // 变量：result，result 的局部缓存值，用于让后续表达式更清晰。
  let result = base;
  eachStatus(entity, (cfg, status) => {
    // 变量：value，待格式化、限制或转义的输入值。
    const value = statusInstanceValue(cfg, status);
    if (cfg.modifyDamageReduction === "multiplyDown") result *= 1 - value;
    if (cfg.modifyDamageReduction === "multiplyUp") result *= 1 + value;
    if (cfg.modifyDamageReduction === "add") result += value;
  });
  return clamp(result, 0, 0.95);
}

function tickCooldowns(cooldowns) {
  Object.keys(cooldowns || {}).forEach((id) => {
    cooldowns[id] = Math.max(0, cooldowns[id] - 1);
  });
}

function addTimedPlayerBuff(skill) {
  state.player[skill.stat] = (state.player[skill.stat] || 0) + skill.amount;
  state.player.activeBuffs = state.player.activeBuffs || [];
  state.player.activeBuffs.push({
    stat: skill.stat,
    amount: skill.amount,
    duration: skill.duration,
    name: skill.name,
  });
}

function applySelfBuffs(skill) {
  if (skill.buffs) {
    skill.buffs.forEach((b) => {
      const duration = !state.battle && skill.usableOutsideBattle
        ? skill.outsideDuration || b.duration
        : b.duration;
      addTimedPlayerBuff({ ...skill, ...b, duration });
    });
  } else if (skill.stat) {
    addTimedPlayerBuff(skill);
  }
}

function tickPlayerBuffs() {
  state.player.activeBuffs = (state.player.activeBuffs || []).filter((buff) => {
    if (buff.duration == null) buff.duration = 1;
    buff.duration -= 1;
    if (buff.duration > 0) return true;
    state.player[buff.stat] = (state.player[buff.stat] || 0) - buff.amount;
    addLine(`${buff.name} 的余势散去。`, "system");
    return false;
  });
}

function tickEnemyBuffs() {
  // 变量：enemy，当前战斗或待生成的敌人对象。
  const enemy = state.battle?.enemy;
  if (!enemy) return;
  enemy.activeBuffs = (enemy.activeBuffs || []).filter((buff) => {
    if (buff.duration == null) buff.duration = 1;
    buff.duration -= 1;
    if (buff.duration > 0) return true;
    enemy[buff.stat] = (enemy[buff.stat] || 0) - buff.amount;
    addLine(`${enemy.name} 的${buff.name}散去。`, "system");
    return false;
  });
}

function nextBattleScriptPhase() {
  const battle = state.battle;
  const script = battle?.battleScript;
  if (!battle || !script || battleActionState()?.phase === "scripted") return false;
  const phases = script.phases || [];
  return phases[script.phaseIndex || 0] || null;
}

function tryTriggerBattleScriptDeath() {
  const battle = state.battle;
  const script = battle?.battleScript;
  if (!battle || !script || state.player.hp > 0) return false;
  if ((script.trigger || "playerDeath") !== "playerDeath") return false;
  const phase = nextBattleScriptPhase();
  if (!phase) return false;
  triggerBattleScriptPhase(phase);
  return true;
}

function holdBattleScriptEnemyDefeat() {
  const battle = state.battle;
  const script = battle?.battleScript;
  if (!battle || !script || (script.trigger || "playerDeath") !== "playerDeath")
    return false;
  if (!nextBattleScriptPhase() || battle.enemy.hp > 0) return false;
  const holdPct = script.enemyLastStandPct ?? 0.08;
  battle.enemy.hp = Math.max(1, Math.floor(battle.enemy.maxHp * holdPct));
  addLine(
    script.enemyLastStandText ||
      `${battle.enemy.name} 的龙鳞碎成潮光，又在风暴里重新聚拢。试炼尚未结束，它要亲手看见你还能不能再站起来。`,
    "danger",
  );
  const action = battleActionState();
  if (action) {
    action.playerGauge = 0;
    action.enemyGauge = ACTION_GAUGE_MAX;
    action.phase = "charging";
    action.lastTick = battleTimeNow();
  }
  render();
  resolveReadyActionGauge();
  return true;
}

function triggerBattleScriptPhase(phase) {
  const battle = state.battle;
  if (!battle) return;
  const script = battle.battleScript;
  script.phaseIndex = (script.phaseIndex || 0) + 1;
  stopBattleGaugeLoop();
  clearBattleQte();
  const action = battleActionState();
  if (action) action.phase = "scripted";
  render();
  beginNarrative(
    phase.text,
    () => {
      state.player.hp = 0;
      addLine(
        `【${phase.killName || "脚本击倒"}】${phase.killLog || "流亡者被击倒，HP 归 0。"}`,
        "danger",
      );
      reviveFromBattleScriptPhase(phase);
    },
    { allowSkip: true, typewriter: phase.typewriter !== false },
  );
}

function reviveFromBattleScriptPhase(phase) {
  if (!state.battle) {
    const revivePct = phase.revivePct ?? 0.5;
    state.player.hp = Math.max(
      1,
      Math.floor((state.player.maxHp || 1) * revivePct),
    );
    addLine("【意志未灭】流亡者从断息边缘挣回一口气。", "reward");
    render();
    return;
  }
  const script = state.battle.battleScript || {};
  const revivePct = script.revivePct ?? 0.5;
  const reviveHp = Math.max(1, Math.floor((state.player.maxHp || 1) * revivePct));
  state.player.hp = reviveHp;
  addLine(
    `【意志未灭】${script.stackName || "守心"} ${script.phaseIndex}/${(script.phases || []).length}，流亡者以半血复起。`,
    "reward",
  );
  render();
  beginNarrative(
    phase.reviveText,
    () => {
      if (!state.battle) return;
      if (phase.finishBattle) {
        winCustomBattle();
        return;
      }
      const action = battleActionState();
      if (action) {
        action.playerGauge = 0;
        action.enemyGauge = 0;
        action.phase = "charging";
        action.lastTick = battleTimeNow();
      }
      state.mode = "battle";
      render();
      startBattleGaugeLoop();
    },
    { allowSkip: true, typewriter: phase.typewriter !== false },
  );
}

function winCustomBattle() {
  stopBattleGaugeLoop();
  clearBattleQte();
  const battle = state.battle;
  if (!battle) return;
  const enemy = battle.enemy;
  const script = battle.battleScript;
  addLine(`你通过了 ${enemy.name} 的审判。`, "reward");
  queueVisualAnimation("victory");

  const finish = () => {
    const onWin = battle.onWin;
    endBattle(false);
    if (onWin) {
      onWin();
    } else {
      state.mode = "free";
      render();
    }
  };
  const settle = () => {
    const rewardText =
      battle.settlementText ||
      (battle.skipBattleRewards
        ? "【战斗结算】审判完成。"
        : `【战斗结算】${grantBattleRewards(enemy, battle.isBoss).join("；")}。`);
    beginNarrative(rewardText, finish, { className: "reward" });
  };
  if (script?.outro && !script.outroPlayed) {
    script.outroPlayed = true;
    beginNarrative(script.outro, settle, {
      allowSkip: true,
      typewriter: script.typewriter !== false,
    });
  } else {
    settle();
  }
  render();
}

function finishPlayerAction(options = {}) {
  if (!state.battle) return;
  if (!options.skipAfterActionDamage) {
    tickStatusDamage(state.player, "afterAction", "你");
    if (state.player.hp <= 0) {
      if (tryTriggerBattleScriptDeath()) return;
      checkPlayerAlive();
      if (!state.battle || state.player.hp <= 0) return;
    }
    tickStatusDurations(state.player, "negative");
    tickStatusDurations(state.battle.enemy, "positive");
    tickEnemyBuffs();
  }
  if (holdBattleScriptEnemyDefeat()) return;
  if (state.battle.enemy.hp <= 0) return winBattle();
  completeBattleAction("player");
}

function beginPlayerAction() {
  if (!state.battle) return false;
  if (!canPlayerAct()) {
    addLine("行动槽尚未蓄满，暂时无法出手。", "warn");
    return false;
  }
  const action = battleActionState();
  if (action) action.phase = "resolving";
  stopBattleGaugeLoop();
  tickStatusDamage(state.player, "turnStart", "你");
  if (state.player.hp <= 0) {
    if (tryTriggerBattleScriptDeath()) return false;
    checkPlayerAlive();
    if (state.battle) completeBattleAction("player");
    return false;
  }
  if (hasStatus(state.player, "stun")) {
    delete state.player.statuses.stun;
    addLine("你被眩晕压住身形，本回合无法行动。", "warn");
    completeBattleAction("player");
    return false;
  }
  return true;
}

function playerAttack() {
  // 变量：battle，当前战斗上下文，包含敌人、Boss 标记和逃跑加成。
  const battle = state.battle;
  if (!battle) return;
  if (!beginPlayerAction()) return;
  startBattleQte(
    {
      kind: "attack",
      label: "剑锋判定",
      hint: "游标往返时，在亮区按下判定。",
      duration: 1400,
    },
    resolvePlayerAttack,
  );
}

function resolvePlayerAttack(qte) {
  // 变量：battle，当前战斗上下文，包含敌人、Boss 标记和逃跑加成。
  const battle = state.battle;
  if (!battle) return;
  // 变量：atk，本次伤害计算使用的攻击值。
  const atk = Math.max(
    1,
    Math.floor(totalAtk() * (qte?.damageMultiplier || 1)),
  );
  // 变量：hit，一次攻击的伤害结果。
  const hit = calcDamage(atk, enemyDamageReduction());  // 变量：dealt，实际扣除的伤害值，已考虑护盾和状态修正。
  const dealt = applyDamage(battle.enemy, hit.damage, "剑锋", {
    finalDamageMultiplier: outgoingDamageMultiplierFor(state.player),
  });
  if (typeof playGameSfx === "function") playGameSfx("attack");
  // 变量：line，line 的局部缓存值，用于让后续表达式更清晰。
  let line = `${qteAttackText(qte)}你挥剑斩向 ${battle.enemy.name}，造成 ${dealt} 点伤害。`;  addLine(line, "");
  applyAfterPlayerAttackPassiveTreasures();
  queueVisualAnimation("player");
  finishPlayerAction();
}

function usePlayerSkill(id) {
  // 变量：base，技能或经验等基础配置项，用于派生当前等级数据。
  const base = PLAYER_SKILLS[id];
  // 变量：battle，当前战斗上下文，包含敌人、Boss 标记和逃跑加成。
  const battle = state.battle;
  if (!base) return;
  state.player.skillCooldowns = state.player.skillCooldowns || {};
  // 变量：skills，玩家已学习技能映射，用于渲染、升级和施放判定。
  const skills = state.player.skills || {};
  if (!(Array.isArray(skills) ? skills.includes(id) : id in skills)) {
    addLine("你还没有学会这门技能。", "warn");
    return;
  }
  // 变量：level，当前角色、敌人或技能等级。
  const level = Array.isArray(skills) ? 1 : skills[id] || 1;
  // 变量：skill，当前施放的技能配置。
  const skill = getSkillLevelData(base, level);
  if (!isActivePlayerSkill(skill)) {
    addLine("被动技能无法主动施展。", "warn");
    return;
  }
  if (!battle && !skill.usableOutsideBattle) {
    addLine("这门技能只能在战斗中施展。", "warn");
    return;
  }
  const mpCost = skill.cost || 0;
  if ((state.player.mp ?? state.player.maxMp ?? 30) < mpCost) {
    addLine(`MP 不足，${skill.name} 需要 ${mpCost} MP。`, "warn");
    return;
  }
  if (state.player.skillCooldowns[id] > 0) {
    addLine(
      `${skill.name} 尚需 ${state.player.skillCooldowns[id]} 回合冷却。`,
      "warn",
    );
    return;
  }
  if (battle && !beginPlayerAction()) return;
  state.player.mp = Math.max(0, (state.player.mp ?? state.player.maxMp ?? 30) - mpCost);
  state.player.skillCooldowns[id] = skill.cooldown || 0;
  if (skill.kind === "effect") {
    applySelfBuffs(skill);
    applySkillStatus(skill);
    applySkillRunBonus(skill);
    if (typeof playGameSfx === "function") playGameSfx("buff");
    addHtmlLine(
      `你施展「${playerSkillName(skill)}」。${escapeHtml(skill.desc)}`,
      "reward",
    );
    queueVisualAnimation("player");
    if (battle) finishPlayerAction();
    else render();
    closeMenu();
    return;
  }
  closeMenu();
  startBattleQte(
    {
      kind: "attack",
      label: `${skill.name}判定`,
      hint: "游标往返时，在亮区按下判定。",
      duration: 1400,
    },
    (qte) => resolvePlayerDamageSkill(skill, qte),
  );
}

function resolvePlayerDamageSkill(skill, qte) {
  // 变量：battle，当前战斗上下文，包含敌人、Boss 标记和逃跑加成。
  const battle = state.battle;
  if (!battle) return;
  // 变量：hit，一次攻击的伤害结果。
  const hit = calcDamage(
    totalAtk() * (skill.multiplier || 1) * (qte?.damageMultiplier || 1),
    0,
  );  // 变量：dealt，实际扣除的伤害值，已考虑护盾和状态修正。
  const dealt = applyDamage(battle.enemy, hit.damage, skill.name, {
    ignoreDamageReduction: skill.ignoreDamageReduction || 0,
    finalDamageMultiplier: outgoingDamageMultiplierFor(state.player),
  });
  if (typeof playGameSfx === "function") playGameSfx("skillSlash");  addHtmlLine(
    `${escapeHtml(qteAttackText(qte))}你施展「${playerSkillName(skill)}」，造成 ${dealt} 点伤害。${escapeHtml(swordHpText)}`,
    "",
  );
  applySkillStatus(skill);
  applySkillRunBonus(skill);
  applySelfBuffs(skill);
  if (skill.purify) {
    // 变量：removed，removed 的局部缓存值，用于让后续表达式更清晰。
    const removed = purifyStatuses(state.player);
    addLine(
      removed.length
        ? `净化解除：${removed.join("、")}。`
        : "净化流过经脉，没有负面状态需要解除。",
      "system",
    );
  }
  if (skill.healMissing) {
    // 变量：heal，heal 的局部缓存值，用于让后续表达式更清晰。
    const heal = Math.max(
      1,
      Math.floor((state.player.maxHp - state.player.hp) * skill.healMissing),
    );
    addLine(healPlayer(state, heal), "reward");
  }
  queueVisualAnimation("player");
  finishPlayerAction();
}

function applySkillStatus(skill) {
  // 变量：data，当前配置项的详细数据，随上下文表示事件、技能或状态效果。
  const data = skill.applyStatus;
  if (!data || !state.battle) return;
  // 变量：target，状态或技能效果的作用目标。
  const target = data.target === "player" ? state.player : state.battle.enemy;
  // 变量：resolvedValue，解析后的技能数值，支持固定值和最大生命百分比写法。
  const resolvedValue = resolveSkillValue(data.value, target);
  // 变量：text，状态、帮助或事件中用于显示的文本内容。
  const text = applyStatus(target, data.id, { ...data, value: resolvedValue });
  if (text)
    addLine(
      `${data.target === "player" ? "你" : state.battle.enemy.name}获得状态：${text}。`,
      data.target === "player" ? "system" : "danger",
    );
}

function applySkillRunBonus(skill) {
  if (!skill.runBonus || !state.battle || state.battle.isBoss) return;
  state.battle.runBonus = Math.min(
    0.4,
    (state.battle.runBonus || 0) + skill.runBonus,
  );
  addLine(
    `退路已明，本场逃跑成功率提升至 ${formatPct(runChance())}。`,
    "system",
  );
}

function scheduleEnemyTurn() {
  if (!state.battle) return;
  const action = battleActionState();
  if (!action) return;
  action.enemyGauge = ACTION_GAUGE_MAX;
  action.phase = "charging";
  resolveReadyActionGauge();
}

function finishEnemyAction(enemy, options = {}) {
  if (!state.battle) return;
  if (!options.skipAfterActionDamage) {
    tickStatusDamage(enemy, "afterAction", enemy.name);
    if (enemy.hp <= 0) return winBattle();
    tickStatusDurations(enemy, "negative");
    tickStatusDurations(state.player, "positive");
    tickPlayerBuffs();
  }
  if (state.player.hp <= 0) {
    if (tryTriggerBattleScriptDeath()) return;
    checkPlayerAlive();
    if (!state.battle) return;
  }
  queueVisualAnimation("enemy");
  completeBattleAction("enemy");
}

function enemyBattleSkillId(kind, fallback) {
  const ids = state.battle?.enemySkillIds || {};
  if (kind === "special") return ids.special || ids.instant || ids.intent || fallback;
  return ids[kind] || fallback;
}

function enemyBattleSkill(kind, fallback) {
  const id = enemyBattleSkillId(kind, fallback);
  return ENEMY_SKILLS[id] || ENEMY_SKILLS[fallback];
}

function enemySkillChance(enemy = state.battle?.enemy) {
  return clamp(Number(enemy?.skillChance ?? 0.2), 0, 1);
}

function enemyAct() {
  // 变量：enemy，当前战斗或待生成的敌人对象。
  const enemy = state.battle?.enemy;
  if (!enemy) return;
  tickStatusDamage(enemy, "turnStart", enemy.name);
  if (enemy.hp <= 0) return winBattle();
  if (hasStatus(enemy, "stun")) {
    delete enemy.statuses.stun;
    addLine(`${enemy.name} 被眩晕困住，本回合无法行动。`, "system");
    tickStatusDurations(enemy, "negative");
    completeBattleAction("enemy");
    return;
  }
  const specialSkill = enemyBattleSkill("special", state.battle.isBoss ? "mieDeng" : "evilClaw");
  if (specialSkill && Math.random() < enemySkillChance(enemy)) {
    // 变量：skill，当前施放的技能配置。
    const skill = specialSkill;
    resolveEnemyDamageAction({
      skill,
      source: skill.name,
      qteLabel: `免伤「${skill.name}」`,
      attackValue: enemy.atk * (skill.multiplier || 1),
      html: true,
      hitText: (hit, dealt, qte) =>
        `${escapeHtml(qteDefenseText(qte))}${escapeHtml(enemy.name)} 释放「${enemySkillName(skill)}」，${escapeHtml(playerDisplayName())}受到 ${dealt} 点伤害。`,
      applyStatus: true,
    });
    return;
  }
  if (!state.battle.isBoss && !enemy.tempDamageReduction && Math.random() < 0.18) {
    // 变量：skill，当前施放的技能配置。
    const skill = enemyBattleSkill("guard", "shaArmor");
    // 变量：amount，本次治疗、伤害、加成或资源变化的数量。
    const amount = Math.max(0.01, (enemy.damageReduction || 0) * skill.damageReductionRate);
    enemy.tempDamageReduction = (enemy.tempDamageReduction || 0) + amount;
    enemy.activeBuffs = enemy.activeBuffs || [];
    enemy.activeBuffs.push({
      stat: "tempDamageReduction",
      amount,
      duration: skill.duration,
      name: skill.name,
    });
    addHtmlLine(
      `${escapeHtml(enemy.name)} 结起「${enemySkillName(skill)}」，免伤暂时提升。`,
      "danger",
    );
    finishEnemyAction(enemy, { skipAfterActionDamage: true });
    return;
  }
  resolveEnemyDamageAction({
    source: "反击",
    qteLabel: "免伤反击",
    attackValue: enemy.atk,
    hitText: (hit, dealt, qte) =>
      `${qteDefenseText(qte)}${enemy.name} 反击，${playerDisplayName()}受到 ${dealt} 点伤害。`,
  });
}

function resolveEnemyDamageAction(config) {
  // 变量：enemy，当前战斗或待生成的敌人对象。
  const enemy = state.battle?.enemy;
  if (!enemy) return;
  // 变量：hit，一次攻击的伤害结果。
  const hit = calcDamage(config.attackValue, totalDamageReduction());
  const mitigatedDamage = hit.damage;
  // 变量：dealt，实际扣除的伤害值，已考虑护盾和状态修正。
  const dealt = applyDamage(state.player, mitigatedDamage, config.source || "反击");
  const text = config.hitText(hit, dealt, null);
  if (config.html) {
    addHtmlLine(text, "danger");
  } else {
    addLine(text, "danger");
  }
  if (config.applyStatus && config.skill?.applyStatus) {
    applyEnemySkillStatus(config.skill);
  }
  finishEnemyAction(enemy);
}

function applyEnemySkillStatus(skill) {
  // 变量：data，当前配置项的详细数据，随上下文表示事件、技能或状态效果。
  const data = skill.applyStatus;
  if (!data || !state.battle) return;
  // 变量：target，状态或技能效果的作用目标。
  const target = data.target === "enemy" ? state.battle.enemy : state.player;
  // 变量：text，状态、帮助或事件中用于显示的文本内容。
  const text = applyStatus(target, data.id, data);
  if (text)
    addLine(
      `${data.target === "enemy" ? state.battle.enemy.name : "你"}获得状态：${text}。`,
      data.target === "enemy" ? "system" : "danger",
    );
}

function tryRun() {
  if (!state.battle || state.battle.isBoss || state.battle.noRun) return;
  if (!beginPlayerAction()) return;
  if (Math.random() < runChance()) {
    addLine("你借风撤身，成功脱离战斗。", "system");
    endBattle(true);
    render();
  } else {
    addLine("撤退失败，敌人追上来了。", "danger");
    finishPlayerAction();
  }
}

function runChance() {
  // 变量：skills，玩家已学习技能映射，用于渲染、升级和施放判定。
  const skills = state.player.skills || {};
  // 变量：passive，passive 的局部缓存值，用于让后续表达式更清晰。
  const passive = (
    Array.isArray(skills)
      ? skills.includes("fleetEscape")
      : "fleetEscape" in skills
  )
    ? 0.2
    : 0;
  return clamp(0.5 + passive + (state.battle?.runBonus || 0), 0, 0.95);
}

function winBattle() {
  stopBattleGaugeLoop();
  clearBattleQte();
  // 变量：battle，当前战斗上下文，包含敌人、Boss 标记和逃跑加成。
  const battle = state.battle;
  if (battle?.onWin) {
    winCustomBattle();
    return;
  }
  // 变量：enemy，当前战斗或待生成的敌人对象。
  const enemy = battle.enemy;
  addLine(`你击败了 ${enemy.name}。`, "reward");
  queueVisualAnimation("victory");
  // 变量：rewards，战斗结算生成的奖励文案列表。
  const rewards = grantBattleRewards(enemy, battle.isBoss);
  // 变量：rewardText，战斗结算文本，作为日志行播放。
  const rewardText = `【战斗结算】${rewards.join("；")}。`;
  if (battle.isBoss) {
    beginNarrative(
      rewardText,
      () => {
        endBattle(false);
        finishBossDungeon();
      },
      { className: "reward" },
    );
  } else {
    beginNarrative(
      rewardText,
      () => {
        endBattle(true);
        render();
      },
      { className: "reward" },
    );
  }
  render();
}

function playClearArchive(dungeon) {
  clearTimeout(window.clearArchiveReturnTimer);
  clearInterval(window.clearArchiveTickTimer);
  window.clearArchiveReturnTimer = 0;
  window.clearArchiveTickTimer = 0;
  state.gameCleared = true;
  state.mode = "clearArchive";
  state.fixedSceneVisual = null;
  state.clearStats = buildClearStats();
  state.clearArchive = { ready: true };
  setChoices([]);
  render();
}

function archiveClearRun() {
  if (state?.mode !== "clearArchive") return;
  clearTimeout(window.clearArchiveReturnTimer);
  clearInterval(window.clearArchiveTickTimer);
  window.clearArchiveReturnTimer = 0;
  window.clearArchiveTickTimer = 0;
  state.mode = "clear";
  state.fixedSceneVisual = null;
  state.clearArchive = null;
  const savedState = JSON.parse(JSON.stringify(state));
  writeAutoSave(savedState, new Date().toISOString(), "clear-archive");
  showHomeScreen();
}

function buildClearStats() {
  const player = state.player || {};
  const equipmentIds = new Set([...(state.ownedEquip || [])]);
  Object.values(state.equipments || {}).forEach((id) => id && equipmentIds.add(id));
  const bossTotal = DUNGEONS.filter((dungeon) => !!dungeon.boss).length;
  const title = clearArchiveTitle({
    bossTotal,
    bossDefeated: bossTotal,
    hp: player.hp || 0,
    maxHp: player.maxHp || 0,
    gold: state.gold || 0,
  });
  return {
    title,
    level: player.level || 1,
    realm: realmName(player.level || 1),
    hp: player.hp || 0,
    maxHp: player.maxHp || 0,
    atk: totalAtk(),
    damageReduction: totalDamageReduction(),
    speed: totalSpeed(),
    gold: state.gold || 0,
    dungeonsDone: DUNGEONS.length,
    dungeonsTotal: DUNGEONS.length,
    bossDefeated: bossTotal,
    bossTotal,
    equipmentCount: equipmentIds.size,
    equipmentTotal: Object.keys(EQUIPMENT_DB || {}).length,
    itemKinds: Object.values(state.inventory || {}).filter((count) => count > 0).length,
  };
}

function clearArchiveTitle(stats) {
  if (stats.hp > 0 && stats.hp <= Math.max(1, Math.floor(stats.maxHp * 0.12))) return "极限通关";
  if (stats.gold >= 800) return "富足收官";
  if (stats.bossDefeated >= stats.bossTotal) return "Boss 全破";
  return "流程完成";
}

function grantBattleRewards(enemy, isBoss) {
  // 变量：rewards，战斗结算生成的奖励文案列表。
  const rewards = [];
  // 变量：rewardCfg，战斗奖励平衡配置，提供金币、经验和掉落倍率。
  const rewardCfg = currentEnemyConfig().rewards || {};
  // 变量：goldRate，金币奖励倍率，普通战斗和 Boss 战不同。
  const goldRate = isBoss
    ? rewardCfg.bossGoldMultiplier ?? 1
    : rewardCfg.normalGoldMultiplier ?? 1;
  // 变量：gold，当前获得或持有的金币数量。
  const gold = Math.max(1, Math.floor((enemy.gold || 0) * goldRate));
  if (gold) {
    state.gold += gold;
    rewards.push(`金币 +${gold}`);
  }
  // 变量：exp，本次战斗获得或当前累计的经验值。
  const exp = grantExp(enemy, isBoss);
  rewards.push(exp > 0 ? `经验 +${exp}` : `经验已达本副本上限`);
  // 变量：dropChance，战斗道具掉落概率。
  const dropChance = isBoss
    ? rewardCfg.bossItemDropChance || 0
    : rewardCfg.normalItemDropChance || 0;
  if (Math.random() < dropChance) {
    // 变量：id，当前数据表条目的唯一标识。
    const id = pick(isBoss ? rewardCfg.bossDropPool || [] : rewardCfg.normalDropPool || []);
    if (!id) return rewards;
    state.inventory[id] = (state.inventory[id] || 0) + 1;
    recordExpeditionGain("item", id, 1);
    rewards.push(`掉落 ${ITEM_DB[id].name} x1`);
  }
  if (!isBoss) grantRareEquipmentDrop(rewards, rewardCfg);
  if (isBoss) {
    // 变量：g，当前副本配置，供后续逻辑读取。
    const g = currentDungeon().growth || {};
    state.player.maxHp += g.hp || 0;
    state.player.baseAtk += g.atk || 0;
    state.player.baseDamageReduction = clamp((state.player.baseDamageReduction || 0) + (g.damageReduction || 0), 0, 0.95);
    const speedGain = grantBaseSpeed(state, g.speed || 0);
    if (g.hp || g.atk || g.damageReduction || g.speed)
      rewards.push(
        `永久成长 HP +${g.hp || 0} / 攻击 +${g.atk || 0} / 免伤 +${g.damageReduction || 0} / 速度 +${speedGain}`,
      );
  }
  return rewards;
}

function grantRareEquipmentDrop(rewards, rewardCfg) {
  const chance = rewardCfg.normalEquipmentDropChance || 0;
  if (chance <= 0 || Math.random() >= chance) return;
  const dropPool = rewardCfg.normalEquipmentDropPool || [];
  state.ownedEquip = state.ownedEquip || [];
  const candidates = dropPool.filter(
    (id) => getEquipment(id) && (isEquipmentBase(id) || !state.ownedEquip.includes(id)),
  );
  if (!candidates.length) return;
  const baseId = pick(candidates);
  const id = isEquipmentBase(baseId) ? createEquipmentInstance(baseId, state) : baseId;
  const equipment = getEquipment(id);
  if (!equipment) return;
  state.ownedEquip.push(id);
  recordExpeditionGain("equipment", id, 1);
  state.equipmentDurability = state.equipmentDurability || {};
  if (equipment.durability) {
    state.equipmentDurability[id] = equipment.durability;
  }
  rewards.push(`装备掉落 ${equipment.name}`);
}

function finishBossDungeon() {
  state.battle = null;
  state.fixedSceneVisual = null;
  if (state.dungeonIndex < DUNGEONS.length - 1) {
    state.unlockedDungeonIndex = Math.max(state.unlockedDungeonIndex || 0, state.dungeonIndex + 1);
    state.mode = "dungeonEnd";
    setChoices([]);
    setActions([
      {
        label: "返回友邦",
        onClick: () => enterAlly({ fromDungeon: true }),
        className: "primary",
      },
      {
        label: "继续下个副本",
        onClick: () => openDungeonPrepModal(state.dungeonIndex + 1),
      },
    ]);
  } else {
    playClearArchive(currentDungeon());
    return;
  }
  render();
}

function endBattle(backToFree) {
  stopBattleGaugeLoop();
  clearBattleQte();
  reduceEquippedDurability();
  applyBattleEndPassiveTreasures();
  state.battle = null;
  state.player.tempAtk = 0;
  state.player.tempAtkRate = 0;
  state.player.tempDamageReduction = 0;
  state.player.tempSpeed = 0;
  state.player.skillCooldowns = {};
  state.player.activeBuffs = [];
  state.player.statuses = {};
  state.player.poisoned = false;
  if (backToFree) state.mode = "free";
}

function reduceEquippedDurability() {
  if (!state.battle) return;
  state.equipmentDurability = state.equipmentDurability || {};
  ["weapon", "armor"].forEach((slot) => {
    const id = state.equipments?.[slot];
    const equipment = getEquipment(id);
    if (!equipment?.durability) return;
    const current = Number.isFinite(Number(state.equipmentDurability[id]))
      ? Number(state.equipmentDurability[id])
      : equipment.durability;
    const next = Math.max(0, current - 1);
    state.equipmentDurability[id] = next;
    addLine(`${equipment.name} 耐久 -1（${next}/${equipment.durability}）。`, "system");
    if (next <= 0) {
      state.equipments[slot] = null;
      addLine(`${equipment.name} 耐久耗尽，已自动卸下。`, "warn");
    }
  });
}

function gameOver(reason) {
  stopBattleGaugeLoop();
  clearBattleQte();
  if (typeof deleteAllGameSaves === "function") deleteAllGameSaves();
  state.mode = "gameover";
  state.battle = null;
  state.activeTownWork = null;
  state.allyFocus = null;
  document.querySelector(".ally-town-menu")?.remove();
  document.querySelector(".ally-town-overlay")?.remove();
  document.querySelector(".ally-town-hover-tip")?.remove();
  const resultText = `【游戏结束】${reason} 篝火已远，这段旅程在荒野里沉入尘土。`;
  setChoices([]);
  setActions([]);
  if (typeof openResultEventModal !== "function") {
    addLine(resultText, "danger");
    render();
    window.setTimeout(() => {
      if (typeof showHomeScreen === "function") showHomeScreen();
    }, 1200);
    return;
  }
  openResultEventModal({
    kicker: "终局",
    title: "旅程终止",
    desc: "营火的光被黑暗吞没，背囊落在尘土里。所有未走完的路，都停在这一刻。",
    illustration: "assets/event/town/dead.png",
    result: () => resultText,
    resultChoiceLabel: "终局结果",
    emptyResultText: "旅程已经结束。",
    closeLabel: "回到主菜单",
    logTone: "danger",
    skipDefaultClose: true,
    onClose: () => {
      if (typeof showHomeScreen === "function") showHomeScreen();
    },
  });
}

function checkPlayerAlive() {
  if (state.player.hp <= 0) {
    if (state.battle?.battleScript && battleActionState()?.phase === "scripted")
      return;
    if (tryTriggerBattleScriptDeath()) return;
    if (state.battle?.defeatToOne) {
      state.player.hp = 1;
      addLine("圣盾微光及时托住你的心脉。演武失败，HP 被扣至 1，但冒险尚未结束。", "warn");
      endBattle(true);
      render();
      return;
    }
    gameOver(`${playerDisplayName()}倒下，最后的火光渐渐熄灭。`);
  }
}
