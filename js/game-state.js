// 变量：externalData，从 window 解构所有数据表，集中声明游戏运行依赖的静态配置。
const {
  STATUS_DB,
  ITEM_DB,
  EQUIPMENT_DB,
  PLAYER_SKILLS,
  ENEMY_SKILLS,
  ENEMY_DB,
  ENEMY_LEVEL_CONFIG,
  SHOP_DB,
  DUNGEONS,
  RANDOM_EVENTS,
  SCENE_VISUALS,
  ENEMY_VISUALS,
} = window;

// 变量：SAVE_KEY，浏览器 localStorage 的存档键名，用于区分本游戏的存档数据。
const SAVE_KEY = "endless-land.save.v1";
const AUTO_SAVE_KEY = `${SAVE_KEY}.autosave`;
const SAVE_SLOT_COUNT = 3;
const SAVE_SLOT_PREFIX = `${SAVE_KEY}.slot`;
const SETTINGS_KEY = "endless-land.settings.v1";
// 变量：GAME_META、GAME_DLC 与 GAME_UPDATES，关于页读取的游戏版本、已装载内容包和更新纪要。
window.GAME_META = {
  ...(window.GAME_META || {}),
  name: window.GAME_META?.name || "无尽之地",
  version: window.GAME_META?.version || "0.4.0",
  build: window.GAME_META?.build || "本地构建",
};
window.GAME_DLC = [
  {
    id: "endless-land",
    name: "游戏本体",
    version: "0.4.0",
    loaded: true,
    source: "内置",
    desc: "副本、副本、随机事件、敌人、商店、装备与场景视觉内容包，游戏本体。",
  },
  ...(Array.isArray(window.GAME_DLC) ? window.GAME_DLC : []),
];
window.GAME_UPDATES = [
  {
    version: "0.4.0",
    date: "2026-05-08",
    title: "关于页完善",
    items: [
      "当前版本号更新为 0.4.0。",
      "关于页新增以版本号为主体的更新纪要。",
      "更新纪要默认仅展示最新版本，历史版本可点击展开查看。",
    ],
  },
  {
    version: "0.4.0",
    date: "2026-05-08",
    title: "内容装载清单",
    items: [
      "关于页展示已装载内容包、副本、事件和商店统计。",
      "登记游戏本体内容包，便于后续追加 DLC 或扩展包。",
    ],
  },
  {
    version: "0.3.0",
    date: "2026-05-07",
    title: "战斗表现打磨",
    items: [
      "优化战斗画面中的敌方信息、血量和行动槽呈现。",
      "统一战斗内外按钮的视觉语言，减少界面跳变。",
    ],
  },
  {
    version: "0.2.0",
    date: "2026-05-06",
    title: "行旅系统扩展",
    items: [
      "补强副本行程线、商店节点和 Boss 前补给提示。",
      "扩展随机事件与事件插画呈现方式。",
      "设置页新增文字速度和事件呈现方式。",
    ],
  },
  {
    version: "0.1.0",
    date: "2026-05-05",
    title: "初始可玩版本",
    items: [
      "搭建副本关卡、自由探索、半即时战斗和存读档基础流程。",
      "接入背包、装备、技能和帮助菜单。",
      "完成西方奇幻暗色 UI 的基础视觉框架。",
    ],
  },
  ...(Array.isArray(window.GAME_UPDATES) ? window.GAME_UPDATES : []),
];
const GAME_META = window.GAME_META;
const GAME_DLC = window.GAME_DLC;
const GAME_UPDATES = window.GAME_UPDATES;
// 变量：$，DOM 快捷查询函数，按 id 获取页面元素。
const $ = (id) => document.getElementById(id);
// 变量：state，全局游戏状态对象，记录副本、玩家、战斗、背包和界面设置。
let state;
// 变量：typing，文本播放锁，阻止自由操作按钮在叙事未结束时出现。
let typing = false;
// 变量：narrative，当前文本队列，保存待播放文本、播放位置和完成回调。
let narrative = null;
// 变量：charTyping，逐字打字机状态，标记当前日志行是否仍在输出字符。
let charTyping = false;
// 变量：currentTypewriter，当前打字机计时器和目标节点，用于跳过或取消逐字输出。
let currentTypewriter = null;
// 变量：activeEventModal，当前弹窗事件上下文，保存事件数据、选择结果和关闭后的处理状态。
let activeEventModal = null;
// 变量：previewingOutcome，预兆之眼预览选项结果时的保护标记，避免试算写入日志。
let previewingOutcome = false;

function defaultSettings() {
  return {
    // 随机事件是否使用弹窗呈现；false 时改用日志选项。
    eventModal: true,
    // 战斗动作的结算方式：qte 为手动判定，auto 为实时演算。
    battleMode: "qte",
    // 文本逐字显示速度，设置页可切换。
    textSpeed: "normal",
    // 文本自动播放开关，只在文本播放状态生效。
    narrativeAuto: false,
    // 作弊菜单快捷入口：开启后点击主角名可直接打开作弊菜单。
  };
}

function normalizeSettings(settings = {}) {
  const merged = { ...defaultSettings(), ...settings };
  merged.eventModal = merged.eventModal !== false;
  if (!NARRATIVE_SPEED_OPTIONS.some((option) => option.id === merged.textSpeed)) {
    merged.textSpeed = "normal";
  }

  merged.narrativeAuto = !!merged.narrativeAuto;
  if (!["qte", "auto"].includes(merged.battleMode)) {
    merged.battleMode = "qte";
  }
  return merged;
}

function loadUserSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    return normalizeSettings(raw ? JSON.parse(raw) : {});
  } catch (error) {
    return defaultSettings();
  }
}

function saveUserSettings() {
  if (!state?.settings) return;
  state.settings = normalizeSettings(state.settings);
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(state.settings));
}

const CALENDAR_START_YEAR = 230;
const PLAYER_START_AGE = 18;
const DAYS_PER_MONTH = 30;
const MONTHS_PER_YEAR = 12;
const DAYS_PER_YEAR = DAYS_PER_MONTH * MONTHS_PER_YEAR;
const ALLY_FULL_REST_DAYS = 15;

function normalizeCalendar(calendar = {}) {
  const elapsedDays = Math.max(0, Math.floor(Number(calendar.elapsedDays) || 0));
  return { elapsedDays };
}

function calendarParts(calendar = state?.calendar) {
  const normalized = normalizeCalendar(calendar);
  const elapsed = normalized.elapsedDays;
  const year = CALENDAR_START_YEAR + Math.floor(elapsed / DAYS_PER_YEAR);
  const dayOfYear = elapsed % DAYS_PER_YEAR;
  const month = 1 + Math.floor(dayOfYear / DAYS_PER_MONTH);
  const day = 1 + (dayOfYear % DAYS_PER_MONTH);
  return { year, month, day, elapsedDays: elapsed };
}

function calendarDateText(calendar = state?.calendar) {
  const date = calendarParts(calendar);
  return `流亡历 ${date.year}年${date.month}月${date.day}日`;
}

function playerAge(calendar = state?.calendar) {
  return PLAYER_START_AGE + Math.floor(normalizeCalendar(calendar).elapsedDays / DAYS_PER_YEAR);
}

function advanceDate(days = 1, reason = "行动") {
  if (!state || previewingOutcome) return 0;
  const amount = Math.max(0, Math.floor(Number(days) || 0));
  if (!amount) return 0;
  state.calendar = normalizeCalendar(state.calendar);
  state.calendar.elapsedDays += amount;
  addLine(`【时间】${reason}耗去 ${amount} 天，当前：${calendarDateText()}。`, "system");
  return amount;
}

function allyFullRestDays() {
  return ALLY_FULL_REST_DAYS;
}

function estimateDungeonBossDays(dungeon = currentDungeon()) {
  return Math.max(1, Math.ceil(Number(dungeon?.bossStep || 100) || 100));
}

function rationCostForDays(days) {
  return Math.max(0, Math.ceil(Math.max(0, Number(days) || 0) / 10));
}

function normalizeExpedition(expedition = {}) {
  const scroll = ["basic", "advanced"].includes(expedition.scroll) ? expedition.scroll : null;
  return {
    rationDays: Math.max(0, Math.floor(Number(expedition.rationDays) || 0)),
    scroll,
    startInventory: { ...(expedition.startInventory || {}) },
    startOwnedEquip: Array.isArray(expedition.startOwnedEquip) ? [...expedition.startOwnedEquip] : [],
    startGeneratedEquipment: Array.isArray(expedition.startGeneratedEquipment) ? [...expedition.startGeneratedEquipment] : [],
    gainedItems: { ...(expedition.gainedItems || {}) },
    gainedEquipment: Array.isArray(expedition.gainedEquipment) ? [...expedition.gainedEquipment] : [],
  };
}

function createExpeditionState(rationDays = 0, scroll = null) {
  return normalizeExpedition({
    rationDays,
    scroll,
    startInventory: JSON.parse(JSON.stringify(state.inventory || {})),
    startOwnedEquip: [...(state.ownedEquip || [])],
    startGeneratedEquipment: Object.keys(state.generatedEquipment || {}),
    gainedItems: {},
    gainedEquipment: [],
  });
}

const DEFAULT_PLAYER_NAME = "流亡者";
const PLAYER_GENDER_OPTIONS = {
  male: "男",
  female: "女",
};
const PLAYER_GENDER_PORTRAITS = {
  male: "assets/char/man1.png",
  female: "assets/char/woman1.png",
};

const PLAYER_GENDER_PORTRAIT_OPTIONS = {
  male: [
    "assets/char/duqinghuan1.jpg",
    ...[1, 2, 3, 4, 5, 6, 7, 9, 10, 11, 12].map((index) => `assets/char/man${index}.png`),
  ],
  female: [
    ...Array.from({ length: 12 }, (_, index) => `assets/char/woman${index + 1}.png`),
  ],
};


function normalizePlayerName(name) {
  const text = String(name || "").trim().replace(/\s+/g, " ");
  return text ? text.slice(0, 12) : DEFAULT_PLAYER_NAME;
}

function normalizePlayerGender(gender) {
  return Object.prototype.hasOwnProperty.call(PLAYER_GENDER_OPTIONS, gender)
    ? gender
    : "male";
}


function playerPortraitOptions(gender = state?.player?.gender) {
  const normalizedGender = normalizePlayerGender(gender);
  const options = PLAYER_GENDER_PORTRAIT_OPTIONS[normalizedGender] || [];
  return Array.from(new Set([
    PLAYER_GENDER_PORTRAITS[normalizedGender] || PLAYER_GENDER_PORTRAITS.male,
    ...options,
  ].filter(Boolean)));
}


function normalizePlayerPortrait(portrait, gender = state?.player?.gender) {
  const normalizedGender = normalizePlayerGender(gender);
  const options = playerPortraitOptions(normalizedGender);
  const normalizedPortrait = String(portrait || "").replace(/\\/g, "/");
  return options.includes(normalizedPortrait)
    ? normalizedPortrait
    : PLAYER_GENDER_PORTRAITS[normalizedGender] || PLAYER_GENDER_PORTRAITS.male;
}

function playerGenderLabel(gender = state?.player?.gender) {
  return PLAYER_GENDER_OPTIONS[normalizePlayerGender(gender)];
}

function normalizePlayerProfile(profile = {}) {
  const gender = normalizePlayerGender(profile.gender);
  return {
    name: normalizePlayerName(profile.name),
    gender,
    portrait: normalizePlayerPortrait(profile.portrait, gender),
  };
}

function playerDisplayName(targetState = state) {
  return normalizePlayerName(targetState?.player?.name);
}

function playerPortraitSrc(gender = state?.player?.gender, portrait = state?.player?.portrait) {
  return normalizePlayerPortrait(portrait, gender);
}

function expeditionScrollName(scroll = state?.expedition?.scroll) {
  if (scroll === "basic") return "紧急避险卷轴";
  if (scroll === "advanced") return "高阶紧急传送卷轴";
  return "无";
}

function recordExpeditionGain(kind, id, count = 1) {
  if (!state || state.worldMode !== "dungeon" || !state.expedition || previewingOutcome) return;
  state.expedition = normalizeExpedition(state.expedition);
  if (kind === "item") {
    state.expedition.gainedItems[id] = (state.expedition.gainedItems[id] || 0) + Math.max(1, count);
  }
  if (kind === "equipment" && id && !state.expedition.gainedEquipment.includes(id)) {
    state.expedition.gainedEquipment.push(id);
  }
}

function consumeExpeditionRations(days = 1) {
  if (!state || state.worldMode !== "dungeon" || !state.expedition) return true;
  const amount = Math.max(0, Math.floor(Number(days) || 0));
  if (!amount) return true;
  state.expedition = normalizeExpedition(state.expedition);
  if (state.expedition.rationDays >= amount) {
    state.expedition.rationDays -= amount;
    return true;
  }
  state.expedition.rationDays = 0;
  gameOver("干粮耗尽，你没能在荒野里撑到下一处火光。");
  return false;
}

function expeditionGainEntries() {
  const expedition = normalizeExpedition(state?.expedition);
  const equipment = expedition.gainedEquipment
    .filter((id) => (state.ownedEquip || []).includes(id) || state.equipments?.weapon === id || state.equipments?.armor === id)
    .map((id) => ({ kind: "equipment", id, count: 1, name: getEquipment(id, state)?.name || id }));
  const items = Object.entries(expedition.gainedItems || {})
    .map(([id, count]) => ({
      kind: "item",
      id,
      count: Math.min(Math.max(0, count), Math.max(0, (state.inventory?.[id] || 0) - (expedition.startInventory?.[id] || 0))),
      name: ITEM_DB[id]?.name || id,
    }))
    .filter((entry) => entry.count > 0);
  return [...equipment, ...items];
}

function keepAdvancedScrollEntries(entries, keepLimit = 3) {
  const keep = [];
  let remaining = keepLimit;
  for (const entry of entries) {
    if (remaining <= 0) break;
    const count = Math.min(entry.count || 1, remaining);
    keep.push({ ...entry, count });
    remaining -= count;
  }
  return keep;
}

function trimExpeditionGains(keepEntries = []) {
  const expedition = normalizeExpedition(state.expedition);
  const keepItems = {};
  const keepEquipment = new Set();
  keepEntries.forEach((entry) => {
    if (entry.kind === "item") keepItems[entry.id] = (keepItems[entry.id] || 0) + entry.count;
    if (entry.kind === "equipment") keepEquipment.add(entry.id);
  });

  Object.entries(expedition.gainedItems || {}).forEach(([id, gained]) => {
    const baseline = expedition.startInventory?.[id] || 0;
    const keep = keepItems[id] || 0;
    const current = state.inventory?.[id] || 0;
    state.inventory[id] = Math.max(0, Math.min(current, baseline + keep));
  });

  const removeEquipment = new Set((expedition.gainedEquipment || []).filter((id) => !keepEquipment.has(id)));
  state.ownedEquip = (state.ownedEquip || []).filter((id) => !removeEquipment.has(id));
  ["weapon", "armor"].forEach((slot) => {
    if (removeEquipment.has(state.equipments?.[slot])) state.equipments[slot] = null;
  });
  removeEquipment.forEach((id) => {
    delete state.equipmentDurability?.[id];
    if (!expedition.startGeneratedEquipment.includes(id)) delete state.generatedEquipment?.[id];
  });
}

function useExpeditionReturnScroll() {
  if (!state?.expedition?.scroll || state.worldMode !== "dungeon") return;
  if (!["free", "shopChoice"].includes(state.mode) || typing) {
    addLine("当前无法使用回城卷轴。", "warn");
    render();
    return;
  }
  const expedition = normalizeExpedition(state.expedition);
  const entries = expeditionGainEntries();
  const keepEntries = expedition.scroll === "advanced" ? keepAdvancedScrollEntries(entries, 3) : [];
  trimExpeditionGains(keepEntries);
  const keptText = keepEntries.length
    ? `保留：${keepEntries.map((entry) => `${entry.name}${entry.kind === "item" && entry.count > 1 ? ` x${entry.count}` : ""}`).join("、")}。`
    : "本次副本所得已全部舍弃。";
  const returnName = (typeof townIntroText === "function" && townIntroText("returnName")) || "橡树小镇";
  addLine(`你撕开${expeditionScrollName(expedition.scroll)}，传送回${returnName}。${keptText}`, "system");
  enterAlly({ fromDungeon: true });
}

function createInitialState(playerProfile = {}) {
  const profile = normalizePlayerProfile(playerProfile);
  return {
    // 顶层游玩场景：ally 为友邦类据点，dungeon 为副本探索。
    worldMode: "ally",
    unlockedDungeonIndex: 0,
    // 当前副本索引，对应 DUNGEONS 数组位置。
    dungeonIndex: 0,
    // 当前副本内已经推进的步数，终点由副本 bossStep 定义。
    step: 0,
    // 当前副本剩余行动时间，前进和后退都会消耗。
    timeLeft: DUNGEONS[0].timeLimit,
    // 当前游戏模式，决定按钮渲染和操作入口。
    mode: "ally",
    // 兼容旧存档的副本标记记录。固定副本事件已移除。
    triggered: {},
    // 是否已经完成最终通关，用于终局状态判断。
    gameCleared: false,
    calendar: normalizeCalendar(),
    // 玩家角色的长期成长、战斗资源和异常状态。
    player: {
      // 主角显示名称。
      name: profile.name,
      gender: profile.gender,
      portrait: profile.portrait,
      // 主角当前等级，影响阶位、升级和敌人经验收益。
      level: 1,
      // 当前等级已累计经验。
      exp: 0,
      // 最大生命值，升级、成长奖励和治疗上限都会读取。
      maxHp: 30,
      // 当前生命值，归零时进入战败流程。
      hp: 30,
      maxMp: 30,
      mp: 30,
      // 裸装基础攻击，升级和成长奖励会永久提高。
      baseAtk: 5,
      // 裸装基础免伤，升级和成长奖励会永久提高。
      baseDamageReduction: 0,
      // 裸装基础速度，影响半即时战斗中行动槽积攒速度。
      baseSpeed: 10,
      // 当前战斗或事件给予的临时攻击加成。
      tempAtk: 0,
      // 当前战斗或事件给予的百分比攻击加成。
      tempAtkRate: 0,
      // 当前战斗或事件给予的临时免伤加成。
      tempDamageReduction: 0,
      // 当前战斗或道具给予的临时速度加成。
      tempSpeed: 0,
      // 副本内持续的免伤加成，进入新副本时清空。
      dungeonDamageReduction: 0,
      // 已学会的玩家技能映射，键为技能 id，值为等级。
      skills: {},
      // 当前快捷释放的主动战斗技能 id。
      quickSkillId: null,
      // 当前快捷使用的战斗消耗品 id。
      quickItemId: null,
      // 玩家技能冷却回合映射，键为技能 id，值为剩余回合。
      skillCooldowns: {},
      // 玩家身上的临时战斗增益列表。
      activeBuffs: [],
      // 玩家状态映射，如中毒、流血、护盾、眩晕等。
      statuses: {},
      // 旧版中毒布尔字段，保留用于存档兼容。
      poisoned: false,
    },
    // 当前持有金币，用于商店购买和部分事件交易。
    gold: 9999,
    // 背包物品数量映射，键为物品 id，值为数量。
    inventory: {},
    // 当前穿戴装备 id，按武器和护具槽位记录。
    equipments: { weapon: null, armor: null },
    // 已获得装备 id 列表，用于装备页和商店去重。
    ownedEquip: [],
    // 装备当前耐久度映射，键为装备 id，值为剩余耐久。
    equipmentDurability: {},
    // 随机生成装备实例，键为实例 id，值为完整装备数据。
    generatedEquipment: {},
    // 当前战斗上下文；非战斗状态为 null。
    battle: null,
    // 等待播放的视觉动画队列。
    visualQueue: [],
    expedition: null,
    // 各商店库存状态，按商店 id 和商品键保存剩余数量。
    shopStocks: {},
    // 小镇月度委托板状态，按月份缓存本月刷出的工作。
    monthlyTownJobs: {},
    // 小镇行会每月刷新的密报状态，保存当月固定出现的密报。
    monthlyGuildRumor: null,
    // 橡木酒馆每月刷新的吧台耳语状态，保存当月固定出现的传闻。
    monthlyTownBarRumor: null,
    // 当前正在执行的城镇工作，风险战斗胜利后用它恢复剩余天数。
    activeTownWork: null,
    // 当前打开的商店 id，关闭商店后清空。
    currentShopId: null,
    // 当前所在小镇 id，用于选择小镇元数据、商店、副本入口和城镇状态缓存。
    allyTownId: "oak_town",
    // 当前主城焦点设施；为空时停留在当前小镇广场。
    allyFocus: null,
    // 旧版酒馆传闻轮换索引，保留用于存档兼容。
    townBarRumorIndex: 0,
    // 剩余避战步数，由避邪类道具或事件写入。
    avoidEncounters: 0,
    // 陷阱伤害减半标记，由随机事件写入，副本开始时重置。
    trapHalfDamage: false,
    // 中毒免疫标记，由随机事件写入，副本开始时重置。
    poisonImmune: false,
    // Boss 开场眩晕标记，由随机事件写入，下一场 Boss 战消耗。
    bossStun: false,
    // 战斗外使用消耗品时暂存的敌方减益，在下次战斗开始时施加。
    preBattleEffects: [],
    // 玩家偏好设置，不直接影响数值规则。
    settings: loadUserSettings(),
  };
}

function newGame(playerProfile = {}) {
  cancelNarrative();
  closeEventModal();
  if (typeof stopBattleGaugeLoop === "function") stopBattleGaugeLoop();
  if (typeof clearBattleQte === "function") clearBattleQte();
  if (typeof enterGameScreen === "function") enterGameScreen();
  state = createInitialState(playerProfile);
  clearLog();
  enterAlly({ intro: true });
}

function normalizeWorldState() {
  state.worldMode = state.worldMode === "ally" ? "ally" : "dungeon";
  state.unlockedDungeonIndex = clamp(
    Number(state.unlockedDungeonIndex ?? state.dungeonIndex ?? 0),
    0,
    DUNGEONS.length - 1,
  );
}

function enterAlly(options = {}) {
  normalizeWorldState();
  state.worldMode = "ally";
  state.mode = "ally";
  state.allyTownId = state.allyTownId || "oak_town";
  state.battle = null;
  state.expedition = null;
  state.fixedSceneVisual = typeof currentTownSceneKey === "function" ? currentTownSceneKey() : "橡树小镇";
  state.currentShopId = null;
  state.allyFocus = null;
  state.player.tempAtk = 0;
  state.player.tempAtkRate = 0;
  state.player.tempDamageReduction = 0;
  state.player.tempSpeed = 0;
  state.player.skillCooldowns = {};
  state.player.activeBuffs = [];
  setChoices([]);
  setActions([]);
  if (options.intro) {
    addLine((typeof townIntroText === "function" && townIntroText("enter")) || "你抵达橡树小镇。", "system");
  } else if (options.fromDungeon) {
    addLine((typeof townIntroText === "function" && townIntroText("returnFromDungeon")) || "副本气息散去，你回到了小镇。", "system");
  }
  render();
}

function enterDungeon(index = state.dungeonIndex) {
  const nextIndex = clamp(Number(index || 0), 0, state.unlockedDungeonIndex || 0);
  state.worldMode = "dungeon";
  state.expedition = state.expedition ? normalizeExpedition(state.expedition) : createExpeditionState(0, null);
  state.fixedSceneVisual = null;
  state.allyFocus = null;
  startDungeon(nextIndex);
}

function allyFullRest() {
  const restDays = allyFullRestDays();
  let timeResult = { elapsed: 0, transitionDelay: 0 };
  if (typeof advanceTownDate === "function") {
    timeResult = advanceTownDate(restDays, "在篝火旁歇息");
  } else {
    advanceDate(restDays, "休息");
  }
  state.player.hp = state.player.maxHp;
  state.player.mp = state.player.maxMp || 30;
  state.player.tempAtk = 0;
  state.player.tempAtkRate = 0;
  state.player.tempDamageReduction = 0;
  state.player.tempSpeed = 0;
  state.player.dungeonDamageReduction = 0;
  state.player.skillCooldowns = {};
  state.player.activeBuffs = [];
  state.player.statuses = {};
  state.player.poisoned = false;
  state.avoidEncounters = 0;
  state.trapHalfDamage = false;
  state.poisonImmune = false;
  state.bossStun = false;
  setChoices([]);
  const showRestResult = () => {
    if (typeof openResultEventModal !== "function") {
      addLine("休息点的火光压住暗伤：属性已回满，异常状态已解除。", "reward");
      render();
      return;
    }
    openResultEventModal({
      kicker: "篝火营地",
      title: "火光疗愈",
      desc: "篝火重新烧旺，温热的光沿着护具缝隙渗进来。你把武器横在膝前，听见旧伤与疲惫一点点安静下去。",
      illustration: "assets/event/town/fire-healthy.png",
      result: "休息点的火光压住暗伤：属性已回满，异常状态已解除。",
      resultChoiceLabel: "篝火恢复",
      emptyResultText: "篝火仍在安静燃烧。",
      closeMode: "ally",
      logTone: "reward",
    });
  };
  if (typeof afterTownTimeFlow === "function") {
    afterTownTimeFlow(timeResult, showRestResult);
  } else {
    showRestResult();
  }
}

function currentDungeon() {
  return DUNGEONS[state.dungeonIndex] || DUNGEONS[0];
}

function currentEnemyConfig() {
  return currentDungeon()?.enemyConfig || {};
}

function currentLevelRule() {
  return currentEnemyConfig().levelRule || {
    levelCap: 1,
    baseLevel: 1,
    bossLevel: 1,
    ranges: { "0-100": [1, 1] },
  };
}

function currentLevelCap() {
  return Math.min(currentEnemyConfig().maxLevel || ENEMY_LEVEL_CONFIG.maxLevel, currentLevelRule().levelCap);
}

function currentDungeonShops(dungeon = currentDungeon()) {
  return Array.isArray(dungeon?.shops) ? dungeon.shops : [];
}

function ensureDungeonShopRegistered(shop) {
  if (!shop?.id) return null;
  SHOP_DB[shop.id] = {
    ...shop,
    dungeonId: currentDungeon()?.id || shop.dungeonId,
  };
  return SHOP_DB[shop.id];
}

function resetDungeonShops() {
  state.shopStocks = state.shopStocks || {};
  currentDungeonShops().forEach((shop) => {
    if (!shop.id) return;
    ensureDungeonShopRegistered(shop);
    const shopId = shop.id;
    delete state.shopStocks[shopId];
  });
  state.currentShopId = null;
}

function startDungeon(index) {
  state.worldMode = "dungeon";
  state.dungeonIndex = index;
  if (typeof syncGameMainMusicTrack === "function") syncGameMainMusicTrack();
  if (typeof playGameMainMusic === "function") playGameMainMusic();
  // 变量：dungeon，当前副本配置，提供标题、时间限制和敌人池。
  const dungeon = currentDungeon();
  state.step = 0;
  state.timeLeft = dungeon.timeLimit;
  resetDungeonShops();
  state.player.hp = state.player.maxHp;
  state.player.mp = state.player.maxMp || 30;
  state.player.tempAtk = 0;
  state.player.tempAtkRate = 0;
  state.player.tempDamageReduction = 0;
  state.player.tempSpeed = 0;
  state.player.dungeonDamageReduction = 0;
  state.player.statuses = {};
  state.player.poisoned = false;
  state.avoidEncounters = 0;
  state.trapHalfDamage = false;
  state.poisonImmune = false;
  state.bossStun = false;
  setActions([]);
  setChoices([]);
  const isRetry =
    state._retryData &&
    state._retryData.dungeonIndex === index;
  if (isRetry) {
    state._retryData = null;
    state.mode = "free";
    state.triggered = {};
    addLine(`【${dungeon.title}】—— 重新挑战。`, "system");
    addLine("自由操作开始。前路百步。", "system");
    render();
    return;
  }
  state._retryData = null;
  state.triggered = {};
  state.mode = "free";
  addLine(`【${dungeon.title}】`, "system");
  addLine("自由操作开始。前路百步。", "system");
  render();
}
