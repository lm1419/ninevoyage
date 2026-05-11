function signed(value) {
  return `${value >= 0 ? "+" : ""}${value || 0}`;
}

function renderHelp(content) {
  content.innerHTML = `
    <div class="sys-page">

      <div class="sys-section">
        <div class="sys-icon sys-icon--gold">¶</div>
        <div class="sys-body">
          <div class="sys-title">副本与探索</div>
          <div class="sys-desc">每个副本拥有独立路线长度、补给节点和 Boss 节点。进入副本后直接开始自由操作；到达副本终点会强制进入 Boss 战。<br>前进和后退各消耗 1 步时间。剩余时间不足以走到 Boss 时，系统会禁止后退。<br>副本内商店由当前副本定义，抵达对应步数后自动进入。</div>
        </div>
      </div>

      <div class="sys-sep"></div>

      <div class="sys-section">
        <div class="sys-icon sys-icon--steel">⚔</div>
        <div class="sys-body">
          <div class="sys-title">战斗</div>
          <div class="sys-desc">半即时战斗：玩家和敌人都会积攒行动槽，速度越高，行动槽增长越快；轻型装备和部分成长奖励都能提高速度。基础速度上限 18，最终速度上限 30。玩家槽满后可选择攻击、技能、道具或逃跑。<br>攻防动作会出现 QTE 判定，出招成功可提高伤害，免伤成功可降低受到的伤害。<br>伤害 = 伤害值 + 随机浮动，目标免伤会按百分比降低最终伤害。<br>主动技能消耗 MP，敌人每次行动按配置概率释放技能。普通战斗可逃跑，Boss 战不可。</div>
        </div>
      </div>

      <div class="sys-sep"></div>

      <div class="sys-section">
        <div class="sys-icon sys-icon--steel">☆</div>
        <div class="sys-body">
          <div class="sys-title">技能与状态</div>
          <div class="sys-desc">技能分为主动型和被动型；主动型技能分为战斗型与效果型。<br>技能可在技能页设定快捷释放。<br>中毒：回合开始掉血。流血：行动后掉血。眩晕：跳过一回合。<br>防御降低：降低防御力。易伤：固定增加受到的伤害。护盾：优先抵消伤害。伤害提升：提高造成的最终伤害。<br>战斗结束后临时增益清除。</div>
        </div>
      </div>

      <div class="sys-sep"></div>

      <div class="sys-section">
        <div class="sys-icon sys-icon--gold">☻</div>
        <div class="sys-body">
          <div class="sys-title">角色成长</div>
          <div class="sys-desc">最高 50 级，阶位依次为：旅人 → 侍从 → 骑士 → 冠卫 → 传奇。<br>升级永久提升最大 HP、伤害和免伤，并回满当前 HP。<br>等级上限由当前副本配置决定。<br>Boss 胜利获得永久属性成长；进入新副本时 HP 回满。<br>战斗胜利不恢复 HP，续航依赖背包道具和事件休整。</div>
        </div>
      </div>

      <div class="sys-sep"></div>

      <div class="sys-section">
        <div class="sys-icon sys-icon--steel">✦</div>
        <div class="sys-body">
          <div class="sys-title">道具与装备</div>
          <div class="sys-desc">背包无容量上限，同种道具自动叠加。部分道具战斗内外均可使用，部分仅限战斗。<br>装备分武器和护具，并按 Lv.1 到 Lv.6 划分数值阶梯；轻型偏速度，重型偏攻击或免伤，但可能降低速度。<br>轻甲免伤较低，重甲免伤较高。基础装备从商店购买，也可通过战斗和事件获得。战斗中不可更换装备。<br>道具和装备可在菜单-背包和装备页查看与管理。</div>
        </div>
      </div>

    </div>
  `;
}

function formatPct(value) {
  return `${Math.round((value || 0) * 100)}%`;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function escapeAttr(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function skillNameTip(name, tip) {
  // 变量：safeTip，转义后的提示文本，安全写入 data-tip 属性。
  const safeTip = escapeAttr(tip);
  return `<span class="stat-tip skill-tip is-portal-tip" data-tip="${safeTip}">${escapeHtml(name)}</span>`;
}

function playerSkillTip(skill) {
  // 变量：cost，技能 MP 消耗文本。
  const cost = skill.cost ? `消耗 ${skill.cost} MP` : "不消耗 MP";
  // 变量：cooldown，技能剩余冷却回合数。
  const cooldown = skill.cooldown ? `冷却 ${skill.cooldown} 回合` : "无冷却";
  return `${skill.desc}（${cost}，${cooldown}）`;
}

function enemySkillTip(skill) {
  // 变量：cooldown，技能剩余冷却回合数。
  const cooldown = skill.cooldown ? `冷却 ${skill.cooldown} 回合` : "无冷却";
  return `${skill.desc}（${cooldown}）`;
}

function playerSkillName(skill) {
  return skillNameTip(skill.name, playerSkillTip(skill));
}

function enemySkillName(skill) {
  return skillNameTip(skill.name, enemySkillTip(skill));
}

function ensureSkillHoverCard() {
  // 变量：card，帮助页单张说明卡片。
  let card = document.querySelector(".skill-hover-card");
  if (!card) {
    card = document.createElement("div");
    card.className = "skill-hover-card";
    document.body.appendChild(card);
  }
  return card;
}

function showSkillHoverCard(target) {
  // 变量：tip，tip 的局部缓存值，用于让后续表达式更清晰。
  const tip = target.dataset.tip;
  if (!tip) return;
  // 变量：card，帮助页单张说明卡片。
  const card = ensureSkillHoverCard();
  card.textContent = tip;
  card.classList.add("active");
  // 变量：rect，rect 的局部缓存值，用于让后续表达式更清晰。
  const rect = target.getBoundingClientRect();
  // 变量：gap，gap 的局部缓存值，用于让后续表达式更清晰。
  const gap = 10;
  card.style.left = `${rect.left}px`;
  card.style.top = `${rect.bottom + gap}px`;
  // 变量：cardRect，悬浮提示卡尺寸，用于计算防溢出位置。
  const cardRect = card.getBoundingClientRect();
  // 变量：maxLeft，悬浮提示卡允许的最大 left 坐标。
  const maxLeft = window.innerWidth - cardRect.width - 12;
  // 变量：left，悬浮提示卡最终水平位置。
  const left = Math.max(12, Math.min(rect.left, maxLeft));
  // 变量：below，目标元素下方的候选提示位置。
  const below = rect.bottom + gap;
  // 变量：above，目标元素上方的候选提示位置。
  const above = rect.top - cardRect.height - gap;
  // 变量：top，悬浮提示卡最终垂直位置。
  const top =
    below + cardRect.height + 12 <= window.innerHeight
      ? below
      : Math.max(12, above);
  card.style.left = `${left}px`;
  card.style.top = `${top}px`;
}

function hideSkillHoverCard() {
  document.querySelector(".skill-hover-card")?.classList.remove("active");
}

let autoSaveTimer = null;
let autoSaveSuspended = false;
let lastAutoSaveSerialized = "";

function saveSlotKey(slotIndex) {
  return `${SAVE_SLOT_PREFIX}.${slotIndex + 1}`;
}

function normalizeSlotIndex(slotIndex) {
  const index = Number(slotIndex);
  if (!Number.isInteger(index)) return 0;
  return clamp(index, 0, SAVE_SLOT_COUNT - 1);
}

function parseSavePayload(raw, fallbackSavedAt = null) {
  if (!raw) return null;
  try {
    const payload = JSON.parse(raw);
    if (payload?.state) return payload;
    return {
      version: 1,
      savedAt: fallbackSavedAt,
      state: payload,
    };
  } catch (error) {
    return null;
  }
}

function readSaveSlot(slotIndex) {
  const index = normalizeSlotIndex(slotIndex);
  try {
    const raw = localStorage.getItem(saveSlotKey(index));
    const payload = parseSavePayload(raw);
    if (payload) return payload;
    if (index === 0) return parseSavePayload(localStorage.getItem(SAVE_KEY));
  } catch (error) {}
  return null;
}

function getLegacySaveSlots() {
  return Array.from({ length: SAVE_SLOT_COUNT }, (_, index) => {
    const payload = readSaveSlot(index);
    return {
      index,
      payload,
      savedAt: payload?.savedAt || null,
    };
  });
}

function getSaveSlots() {
  return getLegacySaveSlots();
}

function latestLegacySaveSlot() {
  return getLegacySaveSlots()
    .filter((slot) => slot.payload?.state)
    .sort((a, b) => Date.parse(b.savedAt || 0) - Date.parse(a.savedAt || 0))[0] || null;
}

function readStoredAutoSave() {
  try {
    return parseSavePayload(localStorage.getItem(AUTO_SAVE_KEY));
  } catch (error) {
    return null;
  }
}

function readAutoSave() {
  return readStoredAutoSave() || latestLegacySaveSlot()?.payload || null;
}

function writeAutoSave(savedState, savedAt = new Date().toISOString(), reason = "auto") {
  const payload = {
    version: 3,
    savedAt,
    reason,
    state: savedState,
  };
  try {
    localStorage.setItem(AUTO_SAVE_KEY, JSON.stringify(payload));
  } catch (error) {
    return null;
  }
  return payload;
}

function deleteAllGameSaves() {
  try {
    localStorage.removeItem(AUTO_SAVE_KEY);
    localStorage.removeItem(SAVE_KEY);
    for (let index = 0; index < SAVE_SLOT_COUNT; index += 1) {
      localStorage.removeItem(saveSlotKey(index));
    }
  } catch (error) {}
  lastAutoSaveSerialized = "";
  if (autoSaveTimer) {
    clearTimeout(autoSaveTimer);
    autoSaveTimer = null;
  }
  autoSaveSuspended = true;
}

function latestSaveSlot() {
  const payload = readAutoSave();
  return payload?.state
    ? { index: 0, payload, savedAt: payload.savedAt || null }
    : null;
}

function formatSaveTime(savedAt) {
  if (!savedAt) return "\u672a\u5b58\u6863";
  const date = new Date(savedAt);
  if (Number.isNaN(date.getTime())) return "\u65f6\u95f4\u672a\u77e5";
  return date.toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function saveSummary(savedState) {
  if (!savedState) return "\u7a7a\u6863\u4f4d";
  if (savedState.gameCleared || savedState.mode === "clear") {
    const level = savedState.player?.level || 1;
    const title = savedState.clearStats?.title || "\u5f11\u795e\u5c01\u5377";
    return `\u5377\u4e00\u5df2\u901a\u5173 \u00b7 Lv.${level} \u00b7 ${title}`;
  }
  const level = savedState.player?.level || 1;
  const dateText = typeof calendarDateText === "function"
    ? calendarDateText(savedState.calendar)
    : "";
  const ageText = typeof playerAge === "function"
    ? `${playerAge(savedState.calendar)}岁`
    : "";
  const timeText = [dateText, ageText].filter(Boolean).join(" · ");
  if (savedState.worldMode === "ally" || savedState.mode === "ally") {
    const townTitle = typeof getTown === "function"
      ? getTown(savedState.allyTownId || "oak_town")?.title
      : "橡树小镇";
    return `${townTitle || "橡树小镇"} · Lv.${level} · ${timeText || "休整中"}`;
  }
  const legacyDungeonIndex = savedState["chapter" + "Index"];
  const dungeonIndex = Number.isFinite(Number(savedState.dungeonIndex))
    ? Number(savedState.dungeonIndex)
    : Number(legacyDungeonIndex) || 0;
  const dungeon = DUNGEONS[dungeonIndex] || DUNGEONS[0];
  const step = savedState.step || 0;
  return `${dungeon?.title || "\u672a\u77e5\u526f\u672c"} · Lv.${level} · ${step}/${dungeon?.bossStep || 100}步 · ${timeText}`;
}

function createAutoSaveSnapshot() {
  if (!state || state._homeOnly || previewingOutcome) return null;
  const battlePhase = state.battle?.action?.phase || "";
  if (state.battle?.qte || ["qte", "resolving", "enemyReady", "scripted"].includes(battlePhase)) {
    return null;
  }
  const savedState = JSON.parse(JSON.stringify(state));
  delete savedState._levelUpFlash;
  savedState.visualQueue = [];
  if (savedState.battle?.action) {
    delete savedState.battle.action.lastTick;
  }
  return savedState;
}

function persistAutoSave(reason = "auto") {
  const savedState = createAutoSaveSnapshot();
  if (!savedState) return null;
  const serialized = JSON.stringify(savedState);
  if (serialized === lastAutoSaveSerialized) return readStoredAutoSave();
  const payload = writeAutoSave(savedState, new Date().toISOString(), reason);
  if (payload) lastAutoSaveSerialized = serialized;
  return payload;
}

function requestAutoSave(reason = "auto") {
  if (autoSaveSuspended || !state || state._homeOnly || previewingOutcome) return;
  clearTimeout(autoSaveTimer);
  autoSaveTimer = setTimeout(() => {
    autoSaveTimer = null;
    persistAutoSave(reason);
    if (typeof refreshHomeScreen === "function" && document.body.classList.contains("home-active")) {
      refreshHomeScreen();
    }
  }, 180);
}

function saveGame() {
  const payload = persistAutoSave("manual-compat");
  if (payload) addLine("\u8fdb\u5ea6\u5df2\u5199\u5165\u5b9e\u65f6\u5b58\u6863\u3002", "system");
  render();
}

function applyLoadedState(savedState) {
  autoSaveSuspended = true;
  cancelNarrative();
  if (typeof stopBattleGaugeLoop === "function") stopBattleGaugeLoop();
  if (typeof clearBattleQte === "function") clearBattleQte();
  state = savedState;
  delete state.codex;
  const legacyDungeonIndex = state["chapter" + "Index"];
  if (!Number.isFinite(Number(state.dungeonIndex)) && Number.isFinite(Number(legacyDungeonIndex))) {
    state.dungeonIndex = Number(legacyDungeonIndex);
  }
  delete state["chapter" + "Index"];
  const legacyRetryDungeonIndex = state._retryData?.["chapter" + "Index"];
  if (state._retryData && !Number.isFinite(Number(state._retryData.dungeonIndex)) && Number.isFinite(Number(legacyRetryDungeonIndex))) {
    state._retryData.dungeonIndex = Number(legacyRetryDungeonIndex);
    delete state._retryData["chapter" + "Index"];
  }
  state.worldMode = state.worldMode || (state.mode === "free" || state.mode === "battle" ? "dungeon" : "ally");
  state.unlockedDungeonIndex = clamp(
    Number(state.unlockedDungeonIndex ?? state.dungeonIndex ?? 0),
    0,
    DUNGEONS.length - 1,
  );
  if (state.worldMode === "ally" && !["shop", "battle"].includes(state.mode)) {
    state.mode = "ally";
    state.allyTownId = state.allyTownId || "oak_town";
    state.fixedSceneVisual = typeof currentTownSceneKey === "function" ? currentTownSceneKey() : "橡树小镇";
  }
  if (state.dungeonIndex >= DUNGEONS.length) {
    state.dungeonIndex = DUNGEONS.length - 1;
    state.step = 100;
    state.gameCleared = true;
    state.mode = "clear";
  }
  state.player.level = state.player.level || 1;
  state.player.name = normalizePlayerName(state.player.name);
  state.player.gender = normalizePlayerGender(state.player.gender);
  state.player.portrait = normalizePlayerPortrait(state.player.portrait, state.player.gender);
  state.calendar = typeof normalizeCalendar === "function"
    ? normalizeCalendar(state.calendar)
    : { elapsedDays: Math.max(0, Math.floor(Number(state.calendar?.elapsedDays) || 0)) };
  state.player.exp = state.player.exp || 0;
  state.player.baseDamageReduction = state.player.baseDamageReduction || 0;
  state.player.tempDamageReduction = state.player.tempDamageReduction || 0;
  state.player.dungeonDamageReduction = state.player.dungeonDamageReduction || 0;
  state.player.maxMp = state.player.maxMp || 30;
  state.player.mp = Math.min(state.player.maxMp, state.player.mp ?? state.player.maxMp);
  state.player.baseSpeed = Math.min(playerBaseSpeedCap(), state.player.baseSpeed || 10);
  state.inventory = state.inventory || {};
  Object.keys(state.inventory).forEach((id) => {
    if (!ITEM_DB[id]) delete state.inventory[id];
  });
  if ((state.inventory.primordialPill || 0) > 0 && !state.player.primordialSpeedApplied) {
    grantBaseSpeed(state, 1);
    state.player.primordialSpeedApplied = true;
  }
  state.player.tempSpeed = state.player.tempSpeed || 0;
  state.player.tempAtkRate = state.player.tempAtkRate || 0;
  delete state.player.skillPoints;
  delete state.player.maxSkillPoints;
  delete state.player.skillPointBonus;
  state.player.skills = state.player.skills || [];
  if (Array.isArray(state.player.skills)) {
    const obj = {};
    state.player.skills.forEach((sid) => {
      obj[sid] = 1;
    });
    state.player.skills = obj;
  }
  state.player.skillCooldowns = state.player.skillCooldowns || {};
  state.player.quickSkillId = state.player.quickSkillId || null;
  state.player.quickItemId = state.player.quickItemId || null;
  state.player.activeBuffs = state.player.activeBuffs || [];
  state.player.statuses = state.player.statuses || {};
  ensureStatuses(state.player);
  migrateSkills();
  state.equipments = state.equipments || { weapon: null, armor: null };
  state.ownedEquip = state.ownedEquip || [];
  state.generatedEquipment = state.generatedEquipment || {};
  state.ownedEquip = state.ownedEquip.filter((id) => getEquipment(id, state));
  state.equipmentDurability = state.equipmentDurability || {};
  state.ownedEquip.forEach((id) => {
    const maxDurability = Number(getEquipment(id, state)?.durability || 0);
    if (maxDurability > 0 && !Number.isFinite(Number(state.equipmentDurability[id]))) {
      state.equipmentDurability[id] = maxDurability;
    }
  });
  ["weapon", "armor"].forEach((slot) => {
    const id = state.equipments[slot];
    if (id && !getEquipment(id, state)) state.equipments[slot] = null;
  });
  state.shopStocks = state.shopStocks || {};
  state.monthlyTownJobs = state.monthlyTownJobs || {};
  if (state.monthlyTownJobs.oakTown && !state.monthlyTownJobs.oak_town) {
    state.monthlyTownJobs.oak_town = state.monthlyTownJobs.oakTown;
    delete state.monthlyTownJobs.oakTown;
  }
  state.monthlyGuildRumor = state.monthlyGuildRumor || null;
  if (state.monthlyGuildRumor?.reportId) state.monthlyGuildRumor = { oak_town: state.monthlyGuildRumor };
  state.monthlyTownBarRumor = state.monthlyTownBarRumor || null;
  if (state.monthlyTownBarRumor?.rumorId) state.monthlyTownBarRumor = { oak_town: state.monthlyTownBarRumor };
  state.activeTownWork = state.mode === "battle" && state.battle?.special === "townWork"
    ? state.activeTownWork || null
    : null;
  state.allyTownId = state.allyTownId || "oak_town";
  state.currentShopId = null;
  state.currentShopFilter = "";
  state.currentShopTitle = "";
  state.currentShopDesc = "";
  state.monthlyShopGoods = state.monthlyShopGoods || {};
  if (state.monthlyShopGoods.oakTownForge) {
    state.monthlyShopGoods.oak_town = state.monthlyShopGoods.oak_town || {};
    state.monthlyShopGoods.oak_town.forge = state.monthlyShopGoods.oak_town.forge || state.monthlyShopGoods.oakTownForge;
    delete state.monthlyShopGoods.oakTownForge;
  }
  state.townBarRumorIndex = Math.max(0, Number(state.townBarRumorIndex) || 0);
  state.expedition = state.expedition ? normalizeExpedition(state.expedition) : null;
  state.avoidEncounters = state.avoidEncounters || 0;
  state.preBattleEffects = state.preBattleEffects || [];
  state.player.tempAtk = state.player.tempAtk || 0;
  state.player.tempAtkRate = state.player.tempAtkRate || 0;
  state.player.tempDamageReduction = state.player.tempDamageReduction || 0;
  state.player.dungeonDamageReduction = state.player.dungeonDamageReduction || 0;
  state.player.tempSpeed = state.player.tempSpeed || 0;
  if (state.battle && typeof normalizeBattleActionState === "function") {
    normalizeBattleActionState(state.battle, { clearQte: true });
  }
  state.trapHalfDamage = !!(state.trapHalfDamage || state._trapHalfDmg);
  state.poisonImmune = !!(state.poisonImmune || state._poisonImmune);
  state.bossStun = !!(state.bossStun || state._bossStun);
  delete state._trapHalfDmg;
  delete state._poisonImmune;
  delete state._bossStun;
  delete state.hiddenUnlocked;
  state.settings = normalizeSettings({ ...(state.settings || {}), ...loadUserSettings() });
  state.visualQueue = [];
  if (typeof enterGameScreen === "function") enterGameScreen();
  closeMenu();
  closeShop();
  closeEventModal();
  render();
  lastAutoSaveSerialized = JSON.stringify(createAutoSaveSnapshot() || {});
  autoSaveSuspended = false;
  if (state.mode === "battle" && state.battle && typeof startBattleGaugeLoop === "function") {
    startBattleGaugeLoop();
  }
}

function loadGame(slotIndex = null) {
  const payload = slotIndex == null ? readAutoSave() : readSaveSlot(slotIndex);
  if (!payload?.state) {
    addLine("\u8fd8\u6ca1\u6709\u5b9e\u65f6\u5b58\u6863\u3002", "warn");
    return;
  }
  applyLoadedState(payload.state);
  addLine("\u5df2\u8bfb\u53d6\u5b9e\u65f6\u5b58\u6863\u3002", "system");
}

function confirmNewGame() {
  if (!window.confirm("\u786e\u5b9a\u8981\u91cd\u65b0\u5f00\u59cb\u5417\uff1f\u5f53\u524d\u5b9e\u65f6\u5b58\u6863\u4f1a\u88ab\u65b0\u65c5\u7a0b\u8986\u76d6\u3002")) return;
  closeMenu();
  if (typeof openCharacterSetupModal === "function") openCharacterSetupModal();
  else newGame();
}
function closeMenu() {
  if (state?.mode === "shop") {
    closeShop();
    return;
  }
  const modal = $("menuModal");
  if (typeof hideAboutInfoModal === "function") hideAboutInfoModal($("menuContent"));
  if (typeof closeMultiTabModal === "function") {
    closeMultiTabModal();
  }
  modal.classList.remove(
    "active",
    "modal--home-settings",
    "modal--home-about",
  );
  modal.dataset.menuMode = "";
  const title = $("menuTitle");
  if (title) title.textContent = "菜单";
  if (!state || state._homeOnly) {
    if (typeof refreshHomeScreen === "function") refreshHomeScreen();
    return;
  }
  render();
}

function closeShop() {
  const modal = $("menuModal");
  if (typeof hideAboutInfoModal === "function") hideAboutInfoModal($("menuContent"));
  if (typeof closeMultiTabModal === "function") {
    closeMultiTabModal();
  }
  modal.classList.remove(
    "active",
    "modal--home-settings",
    "modal--home-about",
  );
  modal.dataset.menuMode = "";
  $("menuTabs")?.classList.remove("tabs--hidden");
  const title = $("menuTitle");
  if (title) title.textContent = "菜单";
  const closeButton = $("closeMenu");
  if (closeButton) closeButton.textContent = "关闭";
  if (state.mode === "shop") state.mode = state.worldMode === "ally" ? "ally" : "free";
  state.currentShopId = null;
  state.currentShopFilter = "";
  state.currentShopTitle = "";
  state.currentShopDesc = "";
  if (state.worldMode === "ally") setChoices([]);
  render();
}

function queueVisualAnimation(kind) {
  state.visualQueue = state.visualQueue || [];
  state.visualQueue.push(kind);
}

function playQueuedVisualAnimations() {
  if (!state.visualQueue || !state.visualQueue.length) return;
  // 变量：queue，待播放的视觉动画队列快照。
  const queue = state.visualQueue.splice(0);
  queue.forEach((kind, index) => {
    setTimeout(() => playVisualAnimation(kind), index * 260);
  });
}

function playVisualAnimation(kind) {
  // 变量：frame，视觉画面容器，用于渲染场景或敌人插画效果。
  const frame = $("visualFrame");
  if (!frame) return;
  // 变量：classes，所有视觉动画 class 名，播放前统一清理。
  const classes = [
    "anim-encounter",
    "anim-player",
    "anim-enemy",
    "anim-victory",
    "anim-emphasis",
  ];
  frame.classList.remove(...classes);
  void frame.offsetWidth;
  frame.classList.add(`anim-${kind}`, "anim-emphasis");
  setTimeout(
    () => frame.classList.remove(`anim-${kind}`, "anim-emphasis"),
    kind === "victory" ? 760 : 460,
  );
}

function qteEffectOrigin(progress = 0.5) {
  const track = document.querySelector(".qte-box .qte-track");
  if (!track) {
    return { x: window.innerWidth / 2, y: window.innerHeight / 2 };
  }
  const rect = track.getBoundingClientRect();
  return {
    x: rect.left + rect.width * clamp(progress, 0, 1),
    y: rect.top + rect.height / 2,
  };
}

let qtePixiLoadPromise = null;
let qtePixiOverlay = null;
let qtePixiActiveTicker = null;
let qtePixiCleanupTimer = 0;
let qteCanvasRafId = 0;
const qtePerfectTextureCache = {
  pixiArray: null,
  pixiGlow: null,
  pixiWave: null,
  canvasArrays: new Map(),
  canvasGlow: null,
  canvasWave: null,
};

function loadPerfectQtePixi() {
  if (window.PIXI?.Application) return Promise.resolve(true);
  if (location.protocol === "file:") return Promise.resolve(false);
  if (qtePixiLoadPromise) return qtePixiLoadPromise;

  qtePixiLoadPromise = new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "js/vendor/pixi.min.js";
    script.async = true;
    script.onload = () => resolve(!!window.PIXI?.Application);
    script.onerror = () => resolve(false);
    document.head.appendChild(script);
  });
  return qtePixiLoadPromise;
}

function prewarmPerfectQtePixi() {
  if (location.protocol === "file:") return;
  setTimeout(() => {
    loadPerfectQtePixi();
  }, 300);
}

if (typeof window !== "undefined" && typeof document !== "undefined") {
  if (document.readyState === "complete") {
    prewarmPerfectQtePixi();
  } else {
    window.addEventListener("load", prewarmPerfectQtePixi, { once: true });
  }
}

function playPerfectQteEffect(progress = 0.5) {
  const origin = qteEffectOrigin(progress);
  const reduceMotion = !!window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
  if (!reduceMotion && location.protocol !== "file:") {
    loadPerfectQtePixi().then((ready) => {
      if (!ready) {
        playPerfectQteCanvasEffect(origin, reduceMotion);
        return;
      }
      try {
        playPerfectQtePixiEffect(origin);
      } catch (err) {
        console.warn("Pixi QTE effect fallback:", err);
        playPerfectQteCanvasEffect(origin, reduceMotion);
      }
    });
    return;
  }
  playPerfectQteCanvasEffect(origin, reduceMotion);
}

function playNormalQteEffect(progress = 0.5, rank = "success") {
  const origin = qteEffectOrigin(progress);
  const reduceMotion = !!window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
  document.querySelectorAll(".qte-normal-effect").forEach((node) => node.remove());

  const effect = document.createElement("div");
  effect.className = `qte-normal-effect qte-normal-effect--${rank === "miss" ? "miss" : "success"}`;
  effect.style.left = `${origin.x}px`;
  effect.style.top = `${origin.y}px`;
  effect.innerHTML = `
    <span class="qte-normal-effect__ring"></span>
    <span class="qte-normal-effect__spark"></span>
    <span class="qte-normal-effect__line"></span>
  `;
  document.body.appendChild(effect);

  setTimeout(
    () => effect.remove(),
    reduceMotion ? 300 : 520,
  );
}

function playPerfectQtePixiEffect(origin) {
  const overlay = getPerfectQtePixiOverlay();
  if (!overlay) return;
  const { app, width, height } = overlay;
  stopPerfectQtePixiEffect();

  const duration = 900;
  app.view.style.display = "block";
  app.view.style.opacity = "1";

  const maxRadius = Math.hypot(
    Math.max(origin.x, width - origin.x),
    Math.max(origin.y, height - origin.y),
  );
  const arrayRadius = Math.min(Math.max(width, height) * 0.36, 370);
  const root = new PIXI.Container();
  root.position.set(origin.x, origin.y);
  root.blendMode = PIXI.BLEND_MODES.ADD;

  const glow = new PIXI.Sprite(getPerfectQtePixiGlowTexture());
  glow.anchor.set(0.5);
  glow.blendMode = PIXI.BLEND_MODES.ADD;

  const waveTexture = getPerfectQtePixiWaveTexture();
  const waves = Array.from({ length: 3 }, () => {
    const wave = new PIXI.Sprite(waveTexture);
    wave.anchor.set(0.5);
    wave.blendMode = PIXI.BLEND_MODES.ADD;
    return wave;
  });

  const array = new PIXI.Sprite(getPerfectQtePixiArrayTexture(app, arrayRadius));
  array.anchor.set(0.5);
  array.blendMode = PIXI.BLEND_MODES.ADD;
  root.addChild(glow, ...waves, array);
  app.stage.addChild(root);

  const start = performance.now();
  const ticker = () => {
    const now = performance.now();
    const progress = clamp((now - start) / duration, 0, 1);
    const fade = progress < 0.76 ? 1 : 1 - (progress - 0.76) / 0.24;
    const alpha = clamp(fade, 0, 1);
    const appear = qteEaseOut(clamp(progress / 0.2, 0, 1));

    glow.alpha = 0.42 * alpha;
    glow.scale.set((Math.min(maxRadius, 760) / 390) * (0.72 + progress * 0.16));

    waves.forEach((wave, index) => {
      const phase = progress * 1.05 - index * 0.2;
      wave.visible = phase > 0 && phase <= 1;
      if (!wave.visible) return;
      const radius = qteEaseOut(phase) * maxRadius;
      const scale = Math.max(0.04, radius / 230);
      wave.scale.set(scale);
      wave.alpha = 0.24 * (1 - phase) * alpha;
    });

    array.alpha = alpha * clamp(progress / 0.13, 0, 1);
    array.rotation = -0.18 + progress * 0.36;
    array.scale.set(0.48 + appear * 0.52 + progress * 0.04);

    if (progress >= 1) {
      stopPerfectQtePixiEffect();
    }
  };
  qtePixiActiveTicker = ticker;
  app.ticker.add(ticker);
  app.start();
  qtePixiCleanupTimer = setTimeout(stopPerfectQtePixiEffect, duration + 160);
}

function getPerfectQtePixiOverlay() {
  if (!window.PIXI?.Application) return null;
  const width = window.innerWidth;
  const height = window.innerHeight;
  if (qtePixiOverlay?.app && !qtePixiOverlay.app.destroyed) {
    const app = qtePixiOverlay.app;
    if (qtePixiOverlay.width !== width || qtePixiOverlay.height !== height) {
      app.renderer.resize(width, height);
      qtePixiOverlay.width = width;
      qtePixiOverlay.height = height;
      qtePerfectTextureCache.pixiArray?.texture?.destroy(true);
      qtePerfectTextureCache.pixiArray = null;
    }
    return qtePixiOverlay;
  }

  const app = new PIXI.Application({
    width,
    height,
    resolution: 1,
    autoDensity: true,
    antialias: false,
    backgroundAlpha: 0,
    autoStart: false,
    powerPreference: "high-performance",
  });
  app.view.className = "qte-perfect-canvas";
  app.view.setAttribute("aria-hidden", "true");
  app.view.dataset.qtePixi = "true";
  app.view.style.display = "none";
  document.body.appendChild(app.view);
  qtePixiOverlay = { app, width, height };
  return qtePixiOverlay;
}

function stopPerfectQtePixiEffect() {
  const app = qtePixiOverlay?.app;
  if (!app || app.destroyed) return;
  if (qtePixiActiveTicker) {
    app.ticker.remove(qtePixiActiveTicker);
    qtePixiActiveTicker = null;
  }
  clearTimeout(qtePixiCleanupTimer);
  qtePixiCleanupTimer = 0;
  app.stage.removeChildren().forEach((child) => {
    child.destroy({ children: true, texture: false, baseTexture: false });
  });
  app.stop();
  app.view.style.display = "none";
}

function getPerfectQtePixiArrayTexture(app, radius) {
  const key = Math.round(radius);
  if (qtePerfectTextureCache.pixiArray?.key === key) {
    return qtePerfectTextureCache.pixiArray.texture;
  }
  qtePerfectTextureCache.pixiArray?.texture?.destroy(true);
  const padding = 24;
  const size = Math.ceil((radius + padding) * 2);
  const holder = new PIXI.Container();
  const array = createPerfectQtePixiArray(radius);
  array.position.set(size / 2, size / 2);
  holder.addChild(array);
  const texture = PIXI.RenderTexture.create({ width: size, height: size, resolution: 1 });
  app.renderer.render(holder, { renderTexture: texture, clear: true });
  holder.destroy({ children: true });
  qtePerfectTextureCache.pixiArray = { key, texture };
  return texture;
}

function getPerfectQtePixiGlowTexture() {
  if (!qtePerfectTextureCache.pixiGlow) {
    qtePerfectTextureCache.pixiGlow = PIXI.Texture.from(createPerfectQteGlowCanvas(768));
  }
  return qtePerfectTextureCache.pixiGlow;
}

function getPerfectQtePixiWaveTexture() {
  if (!qtePerfectTextureCache.pixiWave) {
    qtePerfectTextureCache.pixiWave = PIXI.Texture.from(createPerfectQteWaveCanvas(512));
  }
  return qtePerfectTextureCache.pixiWave;
}

function createPerfectQtePixiArray(radius) {
  const container = new PIXI.Container();
  const gfx = new PIXI.Graphics();
  gfx.blendMode = PIXI.BLEND_MODES.ADD;
  container.addChild(gfx);

  drawPixiRings(gfx, radius);
  drawPixiSpokes(gfx, radius, 48);
  drawPixiTicks(gfx, radius * 0.86, radius * 0.91, 144, 0);
  drawPixiTicks(gfx, radius * 0.58, radius * 0.63, 96, Math.PI / 96);
  drawPixiSigils(gfx, radius);
  drawPixiNodes(gfx, radius, 48);
  drawPixiGlyphs(gfx, radius, 24);
  drawPixiCore(gfx, radius);
  return container;
}

function drawPixiRings(gfx, radius) {
  [0.18, 0.31, 0.43, 0.56, 0.68, 0.78, 0.9, 1].forEach((ratio, index) => {
    const color = index % 3 === 0 ? 0xffeeb3 : index % 3 === 1 ? 0x9be7cd : 0x8cb2ff;
    const alpha = index % 3 === 0 ? 0.44 : index % 3 === 1 ? 0.3 : 0.16;
    gfx.lineStyle(index % 2 ? 0.7 : 1, color, alpha);
    gfx.drawCircle(0, 0, radius * ratio);
  });
}

function drawPixiSpokes(gfx, radius, count) {
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count;
    const inner = i % 3 === 0 ? radius * 0.14 : radius * 0.28;
    const outer = i % 4 === 0 ? radius * 0.93 : radius * 0.78;
    gfx.lineStyle(0.55, i % 2 ? 0x9be7cd : 0xffeeb3, i % 2 ? 0.16 : 0.18);
    gfx.moveTo(Math.cos(angle) * inner, Math.sin(angle) * inner);
    gfx.lineTo(Math.cos(angle) * outer, Math.sin(angle) * outer);
  }
}

function drawPixiTicks(gfx, inner, outer, count, offset) {
  for (let i = 0; i < count; i++) {
    const angle = offset + (Math.PI * 2 * i) / count;
    gfx.lineStyle(0.65, i % 5 === 0 ? 0xffeeb3 : 0x9be7cd, i % 5 === 0 ? 0.32 : 0.16);
    gfx.moveTo(Math.cos(angle) * inner, Math.sin(angle) * inner);
    gfx.lineTo(Math.cos(angle) * outer, Math.sin(angle) * outer);
  }
}

function drawPixiSigils(gfx, radius) {
  for (let i = 0; i < 5; i++) {
    const size = radius * (0.86 - i * 0.12);
    const angle = (Math.PI / 8) * i;
    drawPixiRotatedRect(gfx, size, angle, i % 2 ? 0x9be7cd : 0xffeeb3, i % 2 ? 0.2 : 0.18);
    drawPixiRotatedRect(gfx, size, angle + Math.PI / 4, i % 2 ? 0xffeeb3 : 0x9be7cd, 0.16);
  }
}

function drawPixiRotatedRect(gfx, size, angle, color, alpha) {
  const half = size / 2;
  const points = [
    [-half, -half],
    [half, -half],
    [half, half],
    [-half, half],
  ].map(([x, y]) => ({
    x: x * Math.cos(angle) - y * Math.sin(angle),
    y: x * Math.sin(angle) + y * Math.cos(angle),
  }));
  gfx.lineStyle(0.7, color, alpha);
  gfx.moveTo(points[0].x, points[0].y);
  points.slice(1).forEach((point) => gfx.lineTo(point.x, point.y));
  gfx.lineTo(points[0].x, points[0].y);
}

function drawPixiNodes(gfx, radius, count) {
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count;
    const ring = i % 3 === 0 ? 0.58 : i % 3 === 1 ? 0.7 : 0.82;
    const x = Math.cos(angle) * radius * ring;
    const y = Math.sin(angle) * radius * ring;
    gfx.lineStyle(0.7, 0xffeeb3, 0.32);
    gfx.drawCircle(x, y, i % 4 === 0 ? 3 : 2);
  }
}

function drawPixiGlyphs(gfx, radius, count) {
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count;
    const x = Math.cos(angle) * radius * (i % 2 ? 0.94 : 0.82);
    const y = Math.sin(angle) * radius * (i % 2 ? 0.94 : 0.82);
    const twist = angle + Math.PI / 2 + ((i * 73) % 360) * Math.PI / 180;
    const w = 20;
    const h = 14;
    gfx.lineStyle(0.75, 0xffeeb3, 0.3);
    drawPixiSmallRect(gfx, x, y, w, h, twist);
    gfx.lineStyle(0.6, 0x9be7cd, 0.22);
    drawPixiSegment(gfx, x, y, -6, 0, 6, 0, twist);
    drawPixiSegment(gfx, x, y, 0, -5, 0, 5, twist);
  }
}

function drawPixiSmallRect(gfx, cx, cy, width, height, angle) {
  const halfW = width / 2;
  const halfH = height / 2;
  const points = [
    [-halfW, -halfH],
    [halfW, -halfH],
    [halfW, halfH],
    [-halfW, halfH],
  ].map(([x, y]) => rotatePoint(cx, cy, x, y, angle));
  gfx.moveTo(points[0].x, points[0].y);
  points.slice(1).forEach((point) => gfx.lineTo(point.x, point.y));
  gfx.lineTo(points[0].x, points[0].y);
}

function drawPixiSegment(gfx, cx, cy, x1, y1, x2, y2, angle) {
  const a = rotatePoint(cx, cy, x1, y1, angle);
  const b = rotatePoint(cx, cy, x2, y2, angle);
  gfx.moveTo(a.x, a.y);
  gfx.lineTo(b.x, b.y);
}

function rotatePoint(cx, cy, x, y, angle) {
  return {
    x: cx + x * Math.cos(angle) - y * Math.sin(angle),
    y: cy + x * Math.sin(angle) + y * Math.cos(angle),
  };
}

function drawPixiCore(gfx, radius) {
  const core = radius * 0.15;
  gfx.lineStyle(1, 0xffeeb3, 0.56);
  gfx.drawCircle(0, 0, core);
  drawPixiRotatedRect(gfx, core * 1.16, 0, 0x9be7cd, 0.32);
  drawPixiRotatedRect(gfx, core * 0.92, Math.PI / 4, 0xffeeb3, 0.28);
}

function createPerfectQteGlowCanvas(size) {
  const canvas = document.createElement("canvas");
  const center = size / 2;
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  const glow = ctx.createRadialGradient(center, center, 0, center, center, center);
  glow.addColorStop(0, "rgba(255, 244, 198, 0.28)");
  glow.addColorStop(0.32, "rgba(155, 231, 205, 0.11)");
  glow.addColorStop(0.66, "rgba(140, 178, 255, 0.055)");
  glow.addColorStop(1, "rgba(155, 231, 205, 0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, size, size);
  return canvas;
}

function createPerfectQteWaveCanvas(size) {
  const canvas = document.createElement("canvas");
  const center = size / 2;
  const radius = size * 0.43;
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  ctx.globalCompositeOperation = "lighter";
  ctx.lineCap = "round";
  ctx.lineWidth = 3;
  ctx.strokeStyle = "rgba(255, 238, 179, 0.34)";
  ctx.beginPath();
  ctx.arc(center, center, radius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.lineWidth = 1.4;
  ctx.strokeStyle = "rgba(155, 231, 205, 0.2)";
  ctx.beginPath();
  ctx.arc(center, center, radius * 0.965, 0, Math.PI * 2);
  ctx.stroke();
  return canvas;
}

function getPerfectQteCanvasArray(radius, reduceMotion) {
  const key = `${Math.round(radius)}:${reduceMotion ? 1 : 0}`;
  const cache = qtePerfectTextureCache.canvasArrays;
  if (cache.has(key)) return cache.get(key);

  const padding = reduceMotion ? 12 : 22;
  const size = Math.ceil((radius + padding) * 2);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  canvas.width = size;
  canvas.height = size;
  ctx.translate(size / 2, size / 2);
  ctx.globalCompositeOperation = "lighter";
  ctx.shadowColor = "rgba(255, 238, 179, 0.28)";
  ctx.shadowBlur = reduceMotion ? 0 : 4;
  drawPerfectQteRings(ctx, radius);
  drawPerfectQteSpokes(ctx, radius, reduceMotion ? 24 : 48);
  drawPerfectQteTicks(ctx, radius * 0.86, radius * 0.91, reduceMotion ? 72 : 144, 0);
  drawPerfectQteTicks(ctx, radius * 0.58, radius * 0.63, reduceMotion ? 48 : 96, Math.PI / 96);
  drawPerfectQteSigils(ctx, radius, reduceMotion);
  drawPerfectQteNodes(ctx, radius, reduceMotion ? 24 : 48, 0);
  drawPerfectQteGlyphs(ctx, radius, reduceMotion ? 12 : 24, 0);
  drawPerfectQteCore(ctx, radius);

  cache.set(key, canvas);
  while (cache.size > 4) {
    cache.delete(cache.keys().next().value);
  }
  return canvas;
}

function playPerfectQteCanvasEffect(origin, reduceMotion) {
  stopPerfectQtePixiEffect();
  if (qteCanvasRafId) {
    cancelAnimationFrame(qteCanvasRafId);
    qteCanvasRafId = 0;
  }
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d", { alpha: true });
  if (!ctx) return;
  document
    .querySelectorAll('.qte-perfect-canvas:not([data-qte-pixi="true"])')
    .forEach((node) => node.remove());

  const width = window.innerWidth;
  const height = window.innerHeight;
  const dpr = 1;
  const duration = reduceMotion ? 360 : 900;
  const minFrameMs = reduceMotion ? 120 : 1000 / 30;

  canvas.className = "qte-perfect-canvas";
  canvas.setAttribute("aria-hidden", "true");
  canvas.width = Math.max(1, Math.floor(width * dpr));
  canvas.height = Math.max(1, Math.floor(height * dpr));
  canvas.style.width = "100vw";
  canvas.style.height = "100vh";
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  document.body.appendChild(canvas);

  const startedAt =
    typeof performance !== "undefined" && performance.now
      ? performance.now()
      : Date.now();
  let lastDrawAt = 0;
  let rafId = 0;

  const draw = (now) => {
    const elapsed = now - startedAt;
    const progress = clamp(elapsed / duration, 0, 1);
    if (now - lastDrawAt >= minFrameMs || progress >= 1) {
      drawPerfectQteCanvas(ctx, {
        width,
        height,
        origin,
        progress,
        reduceMotion,
      });
      lastDrawAt = now;
    }
    if (progress < 1) {
      rafId = requestAnimationFrame(draw);
      qteCanvasRafId = rafId;
      return;
    }
    cancelAnimationFrame(rafId);
    qteCanvasRafId = 0;
    canvas.remove();
  };

  rafId = requestAnimationFrame(draw);
  qteCanvasRafId = rafId;
}

function drawPerfectQteCanvas(ctx, options) {
  const { width, height, origin, progress, reduceMotion } = options;
  const cx = origin.x;
  const cy = origin.y;
  const maxRadius = Math.hypot(
    Math.max(cx, width - cx),
    Math.max(cy, height - cy),
  );
  const arrayRadius = Math.min(Math.max(width, height) * 0.42, 460);
  const fade = progress < 0.78 ? 1 : 1 - (progress - 0.78) / 0.22;
  const alpha = clamp(fade, 0, 1);

  ctx.clearRect(0, 0, width, height);
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  drawPerfectQteGlow(ctx, cx, cy, maxRadius, width, height, alpha);
  drawPerfectQteRipples(ctx, cx, cy, maxRadius, progress, alpha, reduceMotion);
  drawPerfectQteArray(ctx, cx, cy, arrayRadius, progress, alpha, reduceMotion);
  ctx.restore();
}

function drawPerfectQteGlow(ctx, cx, cy, maxRadius, width, height, alpha) {
  if (!qtePerfectTextureCache.canvasGlow) {
    qtePerfectTextureCache.canvasGlow = createPerfectQteGlowCanvas(768);
  }
  const glow = qtePerfectTextureCache.canvasGlow;
  const size = Math.min(maxRadius * 1.32, 860);
  ctx.save();
  ctx.globalAlpha = 0.86 * alpha;
  ctx.drawImage(glow, cx - size / 2, cy - size / 2, size, size);
  ctx.restore();
}

function drawPerfectQteRipples(ctx, cx, cy, maxRadius, progress, alpha, reduceMotion) {
  if (!qtePerfectTextureCache.canvasWave) {
    qtePerfectTextureCache.canvasWave = createPerfectQteWaveCanvas(512);
  }
  const waveCanvas = qtePerfectTextureCache.canvasWave;
  const count = reduceMotion ? 2 : 3;
  for (let i = 0; i < count; i++) {
    const phase = progress * 1.05 - i * 0.2;
    if (phase <= 0 || phase > 1) continue;
    const radius = qteEaseOut(phase) * maxRadius;
    const size = Math.max(1, radius * 2);
    ctx.save();
    ctx.globalAlpha = 0.7 * (1 - phase) * alpha;
    ctx.drawImage(waveCanvas, cx - size / 2, cy - size / 2, size, size);
    ctx.restore();
  }
}

function drawPerfectQteArray(ctx, cx, cy, radius, progress, alpha, reduceMotion) {
  const appear = qteEaseOut(clamp(progress / 0.22, 0, 1));
  const arrayAlpha = alpha * clamp(progress / 0.16, 0, 1);
  const scale = 0.48 + appear * 0.52 + progress * 0.04;
  const rotation = -0.18 + progress * 0.36;
  const arrayCanvas = getPerfectQteCanvasArray(radius, reduceMotion);
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rotation);
  ctx.scale(scale, scale);
  ctx.globalAlpha = arrayAlpha;
  ctx.drawImage(arrayCanvas, -arrayCanvas.width / 2, -arrayCanvas.height / 2);
  ctx.restore();
}

function drawPerfectQteRings(ctx, radius) {
  const rings = [0.18, 0.31, 0.43, 0.56, 0.68, 0.78, 0.9, 1];
  rings.forEach((ratio, index) => {
    ctx.lineWidth = index % 2 ? 0.65 : 1;
    ctx.strokeStyle =
      index % 3 === 0
        ? "rgba(255, 238, 179, 0.46)"
        : index % 3 === 1
          ? "rgba(155, 231, 205, 0.32)"
          : "rgba(140, 178, 255, 0.18)";
    ctx.beginPath();
    ctx.arc(0, 0, radius * ratio, 0, Math.PI * 2);
    ctx.stroke();
  });
}

function drawPerfectQteSpokes(ctx, radius, count) {
  ctx.lineWidth = 0.55;
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count;
    const inner = i % 3 === 0 ? radius * 0.14 : radius * 0.28;
    const outer = i % 4 === 0 ? radius * 0.93 : radius * 0.78;
    ctx.strokeStyle = i % 2 ? "rgba(155, 231, 205, 0.16)" : "rgba(255, 238, 179, 0.18)";
    ctx.beginPath();
    ctx.moveTo(Math.cos(angle) * inner, Math.sin(angle) * inner);
    ctx.lineTo(Math.cos(angle) * outer, Math.sin(angle) * outer);
    ctx.stroke();
  }
}

function drawPerfectQteTicks(ctx, inner, outer, count, offset) {
  ctx.lineWidth = 0.7;
  for (let i = 0; i < count; i++) {
    const angle = offset + (Math.PI * 2 * i) / count;
    ctx.strokeStyle = i % 5 === 0 ? "rgba(255, 238, 179, 0.34)" : "rgba(155, 231, 205, 0.18)";
    ctx.beginPath();
    ctx.moveTo(Math.cos(angle) * inner, Math.sin(angle) * inner);
    ctx.lineTo(Math.cos(angle) * outer, Math.sin(angle) * outer);
    ctx.stroke();
  }
}

function drawPerfectQteSigils(ctx, radius, reduceMotion) {
  const count = reduceMotion ? 3 : 5;
  for (let i = 0; i < count; i++) {
    const size = radius * (0.86 - i * 0.12);
    ctx.save();
    ctx.rotate((Math.PI / 8) * i);
    ctx.lineWidth = 0.75;
    ctx.strokeStyle = i % 2 ? "rgba(155, 231, 205, 0.22)" : "rgba(255, 238, 179, 0.2)";
    ctx.strokeRect(-size / 2, -size / 2, size, size);
    ctx.rotate(Math.PI / 4);
    ctx.strokeRect(-size / 2, -size / 2, size, size);
    ctx.restore();
  }
}

function drawPerfectQteNodes(ctx, radius, count, progress) {
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + progress * 0.28;
    const ring = i % 3 === 0 ? 0.58 : i % 3 === 1 ? 0.7 : 0.82;
    const x = Math.cos(angle) * radius * ring;
    const y = Math.sin(angle) * radius * ring;
    ctx.lineWidth = 0.7;
    ctx.strokeStyle = "rgba(255, 238, 179, 0.34)";
    ctx.beginPath();
    ctx.arc(x, y, i % 4 === 0 ? 3 : 2, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function drawPerfectQteGlyphs(ctx, radius, count, progress) {
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count - progress * 0.18;
    const x = Math.cos(angle) * radius * (i % 2 ? 0.94 : 0.82);
    const y = Math.sin(angle) * radius * (i % 2 ? 0.94 : 0.82);
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle + Math.PI / 2 + ((i * 73) % 360) * Math.PI / 180);
    ctx.lineWidth = 0.75;
    ctx.strokeStyle = "rgba(255, 238, 179, 0.32)";
    ctx.strokeRect(-10, -7, 20, 14);
    ctx.strokeStyle = "rgba(155, 231, 205, 0.24)";
    ctx.beginPath();
    ctx.moveTo(-6, 0);
    ctx.lineTo(6, 0);
    ctx.moveTo(0, -5);
    ctx.lineTo(0, 5);
    ctx.stroke();
    ctx.restore();
  }
}

function drawPerfectQteCore(ctx, radius) {
  const core = radius * 0.15;
  ctx.lineWidth = 1;
  ctx.strokeStyle = "rgba(255, 238, 179, 0.58)";
  ctx.beginPath();
  ctx.arc(0, 0, core, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = "rgba(155, 231, 205, 0.34)";
  ctx.strokeRect(-core * 0.58, -core * 0.58, core * 1.16, core * 1.16);
  ctx.rotate(Math.PI / 4);
  ctx.strokeRect(-core * 0.46, -core * 0.46, core * 0.92, core * 0.92);
}

function qteEaseOut(value) {
  return 1 - Math.pow(1 - clamp(value, 0, 1), 3);
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function weightedPick(arr) {
  if (!arr.length) return null;
  const total = arr.reduce((sum, item) => {
    const weight = Number(item?.weight ?? window.EVENT_DEFAULT_WEIGHT ?? 10);
    return sum + Math.max(0, weight);
  }, 0);
  if (total <= 0) return pick(arr);
  let roll = Math.random() * total;
  for (const item of arr) {
    roll -= Math.max(0, Number(item?.weight ?? window.EVENT_DEFAULT_WEIGHT ?? 10));
    if (roll < 0) return item;
  }
  return arr[arr.length - 1];
}

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
