const NARRATIVE_SPEED_OPTIONS = [
  { id: "slow", label: "慢", delay: 36 },
  { id: "normal", label: "标准", delay: 22 },
  { id: "fast", label: "快", delay: 10 },
  { id: "instant", label: "瞬时", delay: 0 },
];

let narrativeAutoTimer = null;
let currentTypewriterLine = null;

function beginNarrative(lines, done, options = {}) {
  clearNarrativeAutoTimer();
  typing = true;
  narrative = { typewriter: true, lines: toLines(lines), index: 0, done, ...options };
  render();
  continueNarrative();
}

function continueNarrative() {
  clearNarrativeAutoTimer();
  if (charTyping) {
    finishTypewriter();
    scheduleNarrativeAuto();
    return;
  }
  if (!narrative) return;
  if (narrative.index >= narrative.lines.length) {
    // 变量：done，文本播放完毕后的回调函数，取出后再清空 narrative 状态。
    const done = narrative.done;
    narrative = null;
    typing = false;
    done && done();
    render();
    return;
  }
  addLine(narrative.lines[narrative.index++], narrative.className || "", {
    typewriter: narrative.typewriter,
  });
  render();
  scheduleNarrativeAuto();
}

function skipNarrativeSegment() {
  clearNarrativeAutoTimer();
  if (charTyping) {
    finishTypewriter();
  }
  if (!narrative || narrative.index >= narrative.lines.length) {
    render();
    if (narrative) continueNarrative();
    return;
  }
  while (narrative.index < narrative.lines.length) {
    addLine(narrative.lines[narrative.index++], narrative.className || "");
  }
  render();
  continueNarrative();
}

function toggleNarrativeAuto() {
  state.settings = state.settings || {};
  state.settings.narrativeAuto = !state.settings.narrativeAuto;
  saveUserSettings();
  if (state.settings.narrativeAuto) {
    scheduleNarrativeAuto();
  } else {
    clearNarrativeAutoTimer();
  }
  render();
}

function clearNarrativeAutoTimer() {
  if (!narrativeAutoTimer) return;
  clearTimeout(narrativeAutoTimer);
  narrativeAutoTimer = null;
}

function scheduleNarrativeAuto() {
  clearNarrativeAutoTimer();
  if (!typing || !narrative || !state.settings?.narrativeAuto || charTyping) return;
  narrativeAutoTimer = setTimeout(() => {
    narrativeAutoTimer = null;
    continueNarrative();
  }, narrative.index >= narrative.lines.length ? 450 : 700);
}

function narrativeCharDelay() {
  const speedId = state.settings?.textSpeed || "normal";
  return NARRATIVE_SPEED_OPTIONS.find((option) => option.id === speedId)?.delay ?? 22;
}

function toLines(value) {
  return Array.isArray(value) ? value : [value];
}

function clearLog() {
  $("log").innerHTML = "";
}

function addLine(text, className = "", options = {}) {
  if (previewingOutcome) return;
  if (!text) return;
  // 变量：paragraph，日志或面板里的段落节点，用于承载一行文本说明。
  const paragraph = document.createElement("p");
  paragraph.className = `entry ${className}`.trim();
  $("log").appendChild(paragraph);
  if (options.typewriter) {
    typeIntoLine(paragraph, text);
  } else {
    paragraph.textContent = text;
  }
  scrollLogToBottom();
}

function addHtmlLine(html, className = "") {
  if (previewingOutcome) return;
  if (!html) return;
  // 变量：paragraph，日志或面板里的段落节点，用于承载一行文本说明。
  const paragraph = document.createElement("p");
  paragraph.className = `entry ${className}`.trim();
  paragraph.innerHTML = html;
  $("log").appendChild(paragraph);
  scrollLogToBottom();
}

function typeIntoLine(node, text) {
  finishTypewriter();
  currentTypewriterLine = { node, text };
  const delay = narrativeCharDelay();
  if (delay <= 0) {
    node.textContent = text;
    charTyping = false;
    currentTypewriter = null;
    currentTypewriterLine = null;
    scrollLogToBottom();
    return;
  }
  charTyping = true;
  node.textContent = "";
  // 变量：i，打字机已输出字符数，用于逐步截取文本内容。
  let i = 0;
  // 变量：timer，逐字输出的定时器句柄，用于完成或取消打字机效果。
  const timer = setInterval(() => {
    node.textContent = text.slice(0, ++i);
    scrollLogToBottom();
    if (i >= text.length) {
      clearInterval(timer);
      charTyping = false;
      currentTypewriter = null;
      currentTypewriterLine = null;
      render();
      scheduleNarrativeAuto();
    }
  }, delay);
  currentTypewriter = { node, text, timer };
}

function finishTypewriter() {
  if (!currentTypewriter) return;
  clearInterval(currentTypewriter.timer);
  currentTypewriter.node.textContent = currentTypewriter.text;
  currentTypewriter = null;
  currentTypewriterLine = null;
  charTyping = false;
  scrollLogToBottom();
}

function restartTypewriterWithCurrentSpeed() {
  if (!currentTypewriterLine) return;
  const { node, text } = currentTypewriterLine;
  if (currentTypewriter) {
    clearInterval(currentTypewriter.timer);
    currentTypewriter = null;
  }
  currentTypewriterLine = null;
  typeIntoLine(node, text);
}

function cancelNarrative() {
  clearNarrativeAutoTimer();
  if (currentTypewriter) {
    clearInterval(currentTypewriter.timer);
    currentTypewriter = null;
  }
  currentTypewriterLine = null;
  narrative = null;
  typing = false;
  charTyping = false;
}

function scrollLogToBottom() {
  requestAnimationFrame(() => {
    // 变量：log，日志容器，滚动时保持最新文本可见。
    const log = $("log");
    if (!log) return;
    log.scrollTop = log.scrollHeight;
    requestAnimationFrame(() => {
      log.scrollTop = log.scrollHeight;
    });
  });
}

function setActions(buttons) {
  // 变量：actionContainer，底部主操作按钮容器，渲染前进、攻击、菜单等动作。
  const actionContainer = $("actions");
  actionContainer.innerHTML = "";
  buttons.forEach((buttonConfig) => {
    if (buttonConfig.type === "resource") {
      actionContainer.appendChild(makeActionResource(buttonConfig));
      return;
    }
    if (buttonConfig.type === "quickSkill") {
      actionContainer.appendChild(makeQuickSkillButton(buttonConfig));
      return;
    }
    if (buttonConfig.type === "quickItem") {
      actionContainer.appendChild(makeQuickItemButton(buttonConfig));
      return;
    }
    actionContainer.appendChild(
      makeButton(
        buttonConfig.label,
        buttonConfig.onClick,
        buttonConfig.className,
        buttonConfig.disabled,
      ),
    );
  });
}

function setChoices(buttons) {
  // 变量：choiceContainer，底部事件选项容器，渲染文本或随机事件的可选分支。
  const choiceContainer = $("choices");
  choiceContainer.innerHTML = "";
  buttons.forEach((buttonConfig) => {
    if (buttonConfig.type === "quickSkill") {
      choiceContainer.appendChild(makeQuickSkillButton(buttonConfig));
      return;
    }
    if (buttonConfig.type === "quickItem") {
      choiceContainer.appendChild(makeQuickItemButton(buttonConfig));
      return;
    }
    if (buttonConfig.preview) {
      choiceContainer.appendChild(makeChoicePreviewButton(buttonConfig));
      return;
    }
    choiceContainer.appendChild(
      makeButton(
        buttonConfig.label,
        buttonConfig.onClick,
        buttonConfig.className,
        buttonConfig.disabled,
      ),
    );
  });
}

function makeButton(label, onClick, className = "", disabled = false) {
  // 变量：buttonElement，动态生成的按钮节点，绑定文案、样式、禁用态和点击回调。
  const buttonElement = document.createElement("button");
  buttonElement.textContent = label;
  buttonElement.className = className;
  buttonElement.disabled = !!disabled;
  buttonElement.addEventListener("click", onClick);
  return buttonElement;
}

function makeActionResource(config) {
  // 变量：box，底部操作栏中的战斗资源展示块。
  const box = document.createElement("div");
  box.className = `action-resource ${config.className || ""}`.trim();
  box.innerHTML = `<span class="action-resource-label">${escapeHtml(config.label)}</span><strong>${escapeHtml(config.value)}</strong>`;
  return box;
}

function makeQuickSkillButton(config) {
  // 变量：wrap，快捷战技控件，左右切换，中间释放。
  const wrap = document.createElement("div");
  wrap.className = `action-quick-wrap ${config.className || ""}`.trim();
  // 变量：skill，当前快捷释放的主动战斗技能。
  const skill = config.skill;
  // 变量：skills，玩家已学习技能映射，用于渲染、升级和施放判定。
  const skills = config.skills || [];
  const canSwitch = skills.length > 1;
  const prevButton = makeButton("‹", () => cycleQuickPlayerSkill(-1), "action-quick-arrow", !canSwitch);
  const nextButton = makeButton("›", () => cycleQuickPlayerSkill(1), "action-quick-arrow", !canSwitch);
  prevButton.title = "切换上一个快捷战技";
  nextButton.title = "切换下一个快捷战技";
  wrap.appendChild(prevButton);

  if (!skill) {
    const buttonElement = makeButton("", config.onClick, "action-quick-skill is-empty", true);
    buttonElement.innerHTML = `<span class="action-quick-top"><span>快捷</span><span class="action-quick-cost">未设</span></span><strong>战技</strong>`;
    buttonElement.title = "还没有设置快捷释放技能。";
    wrap.appendChild(buttonElement);
    wrap.appendChild(nextButton);
    return wrap;
  }

  const cost = skill.cost || 0;
  const cooldown = state.player.skillCooldowns?.[skill.id] || 0;
  const currentMp = state.player.mp ?? state.player.maxMp ?? 30;
  const mpText = cost > 0 ? `${Math.min(currentMp, cost)}/${cost}MP` : "0MP";
  const status = cooldown > 0
    ? { css: "is-cooling", text: `冷却 ${cooldown}` }
    : currentMp < cost
      ? { css: "is-short", text: mpText }
      : { css: "is-ready", text: mpText };
  const buttonElement = makeButton("", config.onClick, `action-quick-skill ${status.css}`.trim(), config.disabled);
  buttonElement.innerHTML = `<span class="action-quick-top"><span>快捷</span><span class="action-quick-cost">${status.text}</span></span><strong>${escapeHtml(skill.name)}</strong>`;
  buttonElement.title = `${skill.name}（消耗 ${cost} MP）`;
  wrap.appendChild(buttonElement);
  wrap.appendChild(nextButton);
  return wrap;
}

function makeQuickItemButton(config) {
  // 变量：wrap，快捷道具控件，左右切换，中间使用。
  const wrap = document.createElement("div");
  wrap.className = `action-quick-wrap ${config.className || ""}`.trim();
  // 变量：item，当前快捷使用的战斗消耗品。
  const item = config.item;
  // 变量：items，当前背包中可战斗快捷使用的消耗品。
  const items = config.items || [];
  const canSwitch = items.length > 1;
  const prevButton = makeButton("‹", () => cycleQuickBattleItem(-1), "action-quick-arrow", !canSwitch);
  const nextButton = makeButton("›", () => cycleQuickBattleItem(1), "action-quick-arrow", !canSwitch);
  prevButton.title = "切换上一个快捷道具";
  nextButton.title = "切换下一个快捷道具";
  wrap.appendChild(prevButton);

  if (!item) {
    const buttonElement = makeButton("", config.onClick, "action-quick-skill action-quick-item is-empty", true);
    buttonElement.innerHTML = `<span class="action-quick-top"><span>快捷</span><span class="action-quick-cost">未设</span></span><strong>道具</strong>`;
    buttonElement.title = "背包里没有可在战斗中快捷使用的道具。";
    wrap.appendChild(buttonElement);
    wrap.appendChild(nextButton);
    return wrap;
  }

  const count = state.inventory[item.id] || 0;
  const status = count > 0
    ? { css: "is-ready", text: `x${count}` }
    : { css: "is-short", text: "用尽" };
  const buttonElement = makeButton("", config.onClick, `action-quick-skill action-quick-item ${status.css}`.trim(), config.disabled);
  buttonElement.innerHTML = `<span class="action-quick-top"><span>快捷</span><span class="action-quick-cost">${status.text}</span></span><strong>${escapeHtml(item.name)}</strong>`;
  buttonElement.title = `${item.name}（${item.desc || "战斗中使用"}）`;
  wrap.appendChild(buttonElement);
  wrap.appendChild(nextButton);
  return wrap;
}

function makeChoicePreviewButton(buttonConfig) {
  // 变量：buttonElement，动态生成的按钮节点，绑定文案、样式、禁用态和点击回调。
  const buttonElement = makeButton(
    buttonConfig.label,
    buttonConfig.onClick,
    buttonConfig.className,
    buttonConfig.disabled,
  );
  buttonElement.classList.add("choice-preview-btn");
  buttonElement.innerHTML = `<span class="choice-label">${escapeHtml(buttonConfig.label)}</span><span class="choice-preview">${escapeHtml(buttonConfig.preview)}</span>`;
  return buttonElement;
}

function render() {
  if (!state || state._homeOnly) {
    if (typeof refreshHomeScreen === "function") refreshHomeScreen();
    return;
  }
  const inAlly = state.worldMode === "ally" && ["ally", "shop", "event"].includes(state.mode);
  document.body.classList.toggle("ally-mode", inAlly);
  document.querySelectorAll(".char-name").forEach((target) => {
    target.textContent = playerDisplayName();
  });
  // 变量：dungeon，当前副本配置，提供标题、时间限制、固定事件和敌人池。
  const dungeon = currentDungeon();
  $("dungeonTitle").textContent = inAlly
    ? (typeof currentTownTitle === "function" ? currentTownTitle() : "橡树小镇")
    : dungeon.title;
  const modePill = $("modePill");
  modePill.classList.add("time-pill");
  modePill.innerHTML = `<strong>${calendarDateText()}</strong>`;
  $("uiDungeon").textContent = inAlly ? "友邦" : dungeon.title.replace(/^.*?：/, "");
  $("uiRegion").textContent = inAlly ? "休整区" : regionName();
  $("uiTime").textContent = inAlly ? "安全" : `${state.timeLeft}/${dungeon.timeLimit}`;
  if ($("uiCalendar")) $("uiCalendar").textContent = calendarDateText();
  if ($("uiAge")) $("uiAge").textContent = `${playerAge()}岁`;
  renderExpeditionSupplies();
  renderJourneyLine();
  $("uiHpText").textContent = `${state.player.hp}/${state.player.maxHp}`;
  if ($("uiMpText")) $("uiMpText").textContent = `${state.player.mp ?? 30}/${state.player.maxMp ?? 30}`;
  if ($("uiMpBar")) $("uiMpBar").style.width = `${Math.max(0, ((state.player.mp ?? 30) / (state.player.maxMp ?? 30)) * 100)}%`;
  $("uiHpBar").style.width =
    `${Math.max(0, (state.player.hp / state.player.maxHp) * 100)}%`;
  $("uiLevelText").innerHTML =
    `<span class="char-lv">${state.player.level}</span><span class="char-dot">·</span><span class="char-realm-name">${realmName(state.player.level)}</span>`;
  if (state._levelUpFlash && !typing) {
    // 变量：el，需要触发动画的界面元素，重置 class 后重新播放效果。
    const el = $("uiLevelText");
    el.classList.remove("level-up", "realm-breakthrough");
    void el.offsetWidth;
    el.classList.add(state._levelUpFlash);
    state._levelUpFlash = null;
  }
  $("uiExpText").textContent = expText();
  $("uiExpBar").style.width = `${expProgressPct()}%`;
  $("uiAtk").textContent = totalAtk();
  $("uiDef").textContent = formatPct(totalDamageReduction());
  $("uiSpeed").textContent = totalSpeed();
  $("uiGold").textContent = state.gold;
  $("uiBuff").textContent = buffText();
  $("uiWeapon").textContent =
    getEquipment(state.equipments.weapon)?.name || "无";
  $("uiArmor").textContent = getEquipment(state.equipments.armor)?.name || "无";
  renderVisual();
  renderInventoryTags();
  renderBattlePanel();
  renderBattleHud();
  renderActionButtons();
  scrollLogToBottom();
  playQueuedVisualAnimations();
  if (typeof requestAutoSave === "function") requestAutoSave("render");
}

function renderExpeditionSupplies() {
  const rations = $("uiRations");
  const scroll = $("uiReturnScroll");
  const expedition = state.expedition ? normalizeExpedition(state.expedition) : null;
  if (rations) rations.textContent = expedition ? `${expedition.rationDays} 天` : "-";
  if (!scroll) return;
  scroll.innerHTML = "";
  if (!expedition?.scroll) {
    scroll.textContent = "-";
    return;
  }
  const button = makeButton(
    expeditionScrollName(expedition.scroll),
    useExpeditionReturnScroll,
    "journey-scroll-btn",
    state.worldMode !== "dungeon" || !["free", "shopChoice"].includes(state.mode) || typing,
  );
  scroll.appendChild(button);
}

function renderJourneyLine() {
  const line = $("journeyLine");
  const inAlly = state.worldMode === "ally" && state.mode !== "battle";
  if (line) line.classList.toggle("is-ally", inAlly);
  if (inAlly) {
    const stepText = $("journeyStepText");
    const fill = $("journeyFill");
    const current = $("journeyCurrent");
    if (stepText) stepText.textContent = "友邦待命";
    if (fill) fill.style.width = "0%";
    if (current) current.style.left = "0%";
    return;
  }
  const dungeon = currentDungeon();
  const bossStep = dungeon?.bossStep || 100;
  const step = clamp(state.step || 0, 0, bossStep);
  const percent = bossStep > 0 ? clamp((step / bossStep) * 100, 0, 100) : 0;
  const fill = $("journeyFill");
  const current = $("journeyCurrent");
  const stepText = $("journeyStepText");
  if (!fill || !current || !stepText || !line) return;
  fill.style.width = `${percent}%`;
  current.style.left = `${percent}%`;
  stepText.textContent = `${Math.round(step)}/${bossStep} 步`;
  const track = line.querySelector(".journey-track");
  if (track) {
    track.querySelectorAll(".journey-node").forEach((node) => node.remove());
    (dungeon?.routeNodes || []).forEach((routeNode) => {
      const node = document.createElement("div");
      const nodeStep = Number(routeNode.step || 0);
      node.className = `journey-node is-${routeNode.type || "point"}`;
      node.dataset.step = String(nodeStep);
      node.dataset.tip = routeNode.tip || "";
      node.style.setProperty("--pos", `${bossStep > 0 ? clamp((nodeStep / bossStep) * 100, 0, 100) : 0}%`);
      node.innerHTML = `<span class="journey-dot"></span><span class="journey-label">${escapeHtml(routeNode.label || String(nodeStep))}</span>`;
      track.appendChild(node);
    });
  }
  line.querySelectorAll(".journey-node").forEach((node) => {
    const nodeStep = Number(node.dataset.step || 0);
    node.classList.toggle("is-passed", step >= nodeStep);
    node.classList.toggle("is-next", step < nodeStep && step >= nodeStep - 5);
  });
}

function modeName() {
  if (typing) return "文本展开";
  if (state.mode === "battle") return state.battle?.isBoss ? "Boss 战" : "战斗";
  if (state.worldMode === "ally" || state.mode === "ally") return "友邦";
  if (state.mode === "free") return "自由操作";
  if (state.mode === "event") return "事件";
  if (state.mode === "bossChoice") return "战前抉择";
  if (state.mode === "clearArchive") return "归档";
  if (state.mode === "gameover") return "终局已定";
  if (state.mode === "clear") return "通关";
  return "行动";
}

function regionName() {
  // 变量：dungeon，当前副本配置，提供标题、时间限制、固定事件和敌人池。
  const dungeon = currentDungeon();
  if (Array.isArray(dungeon.regionStages) && dungeon.regionStages.length) {
    const step = state.step || 0;
    const stage = [...dungeon.regionStages]
      .reverse()
      .find((item) => step >= (item.step || 0));
    if (stage?.name) return stage.name;
  }
  // 变量：regionIndex，根据当前步数换算出的区域索引，用于显示副本内地域名。
  const regionIndex = Math.min(
    dungeon.regions.length - 1,
    Math.floor((state.step + 1) / 34),
  );
  return dungeon.regions[regionIndex];
}

function totalAtk() {
  // 变量：weaponAttackBonus，当前武器提供的攻击加成。
  const weaponAttackBonus = getEquipment(state.equipments.weapon)?.atk || 0;
  // 变量：armorAttackBonus，当前护具提供的攻击加成。
  const armorAttackBonus = getEquipment(state.equipments.armor)?.atk || 0;
  const flatAtk =
    state.player.baseAtk +
    state.player.tempAtk +
    weaponAttackBonus +
    armorAttackBonus;
  return Math.max(1, Math.floor(flatAtk * (1 + (state.player.tempAtkRate || 0))));
}

function totalDamageReduction() {
  const weaponBonus = getEquipment(state.equipments.weapon)?.damageReduction || 0;
  const armorBonus = getEquipment(state.equipments.armor)?.damageReduction || 0;
  return modifiedDamageReduction(
    (state.player.baseDamageReduction || 0) +
      (state.player.tempDamageReduction || 0) +
      (state.player.dungeonDamageReduction || 0) +
      weaponBonus +
      armorBonus,
    state.player,
  );
}


function totalSpeed() {
  // 变量：weaponSpeedBonus，当前武器提供的速度加成。
  const weaponSpeedBonus = getEquipment(state.equipments.weapon)?.speed || 0;
  // 变量：armorSpeedBonus，当前护具提供的速度加成。
  const armorSpeedBonus = getEquipment(state.equipments.armor)?.speed || 0;
  const rawSpeed = Math.round(
    (state.player.baseSpeed || 10) +
      (state.player.tempSpeed || 0) +
      weaponSpeedBonus +
      armorSpeedBonus,
  );
  const cap = typeof playerTotalSpeedCap === "function" ? playerTotalSpeedCap() : 30;
  return Math.min(cap, Math.max(1, rawSpeed));
}

function enemySpeed(enemy = state.battle?.enemy) {
  if (!enemy) return 10;
  return Math.max(1, Math.round((enemy.speed ?? 10) + (enemy.tempSpeed || 0)));
}

function buffText() {
  // 变量：buffLabels，侧栏状态标签列表，汇总临时增益、副本加成和异常状态。
  const buffLabels = [];
  if (state.player.tempAtk) buffLabels.push(`攻+${state.player.tempAtk}`);
  if (state.player.tempAtkRate) buffLabels.push(`攻+${formatPct(state.player.tempAtkRate)}`);
  if (state.player.tempDamageReduction) buffLabels.push(`免伤+${formatPct(state.player.tempDamageReduction)}`);
  if (state.player.tempSpeed) buffLabels.push(`速+${state.player.tempSpeed}`);
  if (state.player.dungeonDamageReduction)
    buffLabels.push(`副本免伤+${formatPct(state.player.dungeonDamageReduction)}`);
  if (state.avoidEncounters > 0)
    buffLabels.push(`避邪${state.avoidEncounters}步`);
  buffLabels.push(...statusText(state.player));
  return buffLabels.join("、") || "无";
}

function realmName(level) {
  if (level >= 41) return "传奇";
  if (level >= 31) return "冠卫";
  if (level >= 21) return "骑士";
  if (level >= 11) return "侍从";
  return "旅人";
}

function nextExp(level) {
  if (level >= ENEMY_LEVEL_CONFIG.maxLevel) return 0;
  return 40 + level * 18 + Math.floor(level * level * 1.6);
}

function expText() {
  if (state.player.level >= currentLevelCap())
    return `经验 已达本副本上限 ${currentLevelCap()}`;
  return `经验 ${state.player.exp}/${nextExp(state.player.level)}`;
}

function expProgressPct() {
  if (state.player.level >= currentLevelCap()) return 100;
  // 变量：need，当前等级升级所需经验，用于经验条百分比计算。
  const need = nextExp(state.player.level);
  return need
    ? Math.max(0, Math.min(100, (state.player.exp / need) * 100))
    : 100;
}

function renderInventoryTags() {
  // 变量：box，当前函数要写入内容的界面容器。
  const box = $("uiInventory");
  if (!box) return;
  box.innerHTML = "";
  // 变量：entries，背包中数量大于 0 的物品条目，用于生成物品标签。
  const entries = Object.entries(state.inventory).filter(([id, n]) => n > 0 && ITEM_DB[id]);
  if (!entries.length) {
    // 变量：span，标签类 DOM 节点，用于显示背包物品或空背包占位。
    const span = document.createElement("span");
    span.className = "tag";
    span.textContent = "空";
    box.appendChild(span);
    return;
  }
  entries.forEach(([id, n]) => {
    // 变量：span，标签类 DOM 节点，用于显示背包物品或空背包占位。
    const span = document.createElement("span");
    span.className = "tag";
    span.textContent = `${ITEM_DB[id].name} x${n}`;
    box.appendChild(span);
  });
}

function renderActionButtons() {
  if (typing) {
    const buttons = [
      {
        label: "继续",
        onClick: continueNarrative,
        className: state.mode === "battle" ? "primary battle-primary" : "primary",
      },
      { label: "菜单", onClick: () => openMenu("bag") },
    ];
    if (narrative?.allowSkip) {
      buttons.splice(
        1,
        0,
        { label: "跳过", onClick: skipNarrativeSegment },
        {
          label: state.settings?.narrativeAuto ? "自动：开" : "自动",
          onClick: toggleNarrativeAuto,
          className: state.settings?.narrativeAuto ? "primary" : "",
        },
      );
    }
    setActions(buttons);
    setChoices([]);
    return;
  }
  if (state.mode === "free") {
    // 变量：cannotBack，后退按钮禁用条件，避免剩余时间不足以走到 Boss。
    const returnLimit = (currentDungeon()?.bossStep || 100) + 1;
    const cannotBack = state.step <= 0 || state.timeLeft + state.step <= returnLimit;
    setChoices([]);
    setActions([
      { label: "前进", onClick: goForward, className: "primary" },
      { label: "后退", onClick: goBack, disabled: cannotBack },
      { label: "菜单", onClick: () => openMenu() },
    ]);
  } else if (state.mode === "ally") {
    renderAllyActions();
  } else if (state.mode === "battle") {
    if (state.battle?.qte) {
      setChoices([]);
      setActions([
        {
          label: "判定",
          onClick: confirmBattleQte,
          className: "primary battle-primary",
        },
        {
          type: "resource",
          label: "QTE",
          value: "出招",
          className: "action-resource--edge",
        },
      ]);
      return;
    }
    // 变量：playerReady，玩家行动槽是否已满。
    const playerReady = canPlayerAct();
    // 变量：quickSkill，玩家当前设置的快捷释放主动技能。
    const quickSkill = ensureQuickPlayerSkill();
    // 变量：quickItem，玩家当前设置的快捷战斗道具。
    const quickItem = ensureQuickBattleItem();
    setChoices([
      {
        type: "quickSkill",
        skill: quickSkill,
        skills: knownActivePlayerSkills(),
        onClick: useQuickPlayerSkill,
        disabled: !playerReady || !quickSkill || !canUsePlayerSkill(quickSkill),
      },
      {
        type: "quickItem",
        item: quickItem,
        items: knownBattleQuickItems(),
        onClick: useQuickBattleItem,
        disabled: !playerReady || !quickItem || !canUseBattleQuickItem(quickItem),
      },
    ]);
    setActions([
      {
        label: "攻击",
        onClick: playerAttack,
        className: "primary battle-primary",
        disabled: !playerReady,
      },
      {
        label: "技能",
        onClick: () => openMenu("skill"),
        disabled: !playerReady || !knownPlayerSkills().length,
      },
      {
        label: "使用道具",
        onClick: () => openMenu("bag"),
        disabled: !playerReady,
      },
      {
        label: "逃跑",
        onClick: tryRun,
        disabled: !playerReady || state.battle?.isBoss || state.battle?.noRun,
        className: "danger",
      },
      {
        type: "resource",
        label: battlePhaseText(),
        value: `${state.player.mp ?? 30}/${state.player.maxMp ?? 30} MP`,
        className: "action-resource--edge",
      },
    ]);
  } else if (state.mode === "event") {
    setActions([]);
    if (useEventModal()) setChoices([]);
  } else if (state.mode === "dungeonEnd") {
    setChoices([]);
    setActions([
      { label: "返回友邦", onClick: () => enterAlly({ fromDungeon: true }), className: "primary" },
      {
        label: "继续下个副本",
        onClick: () => openDungeonPrepModal(state.dungeonIndex + 1),
        disabled: state.dungeonIndex >= DUNGEONS.length - 1,
      },
    ]);
  } else if (state.mode === "clearArchive") {
    setChoices([]);
    setActions([]);
  } else if (state.mode === "clear") {
    setChoices([]);
    setActions([
      { label: "回到主菜单", onClick: showHomeScreen, className: "primary" },
      { label: "重新开始", onClick: confirmNewGame },
    ]);
  }
}

function renderAllyActions() {
  setChoices([]);
  setActions([]);
}

function allyTownNodes() {
  return typeof townFacilities === "function" ? townFacilities() : [];
}

function allyTownMenuPlaceholders(itemCount, totalSlots = 10) {
  const missing = Math.max(0, totalSlots - itemCount);
  return Array.from({ length: missing }, () =>
    '<span class="ally-town-menu-item ally-town-menu-item--placeholder" aria-hidden="true"></span>'
  ).join("");
}

function allyTrainingSkills() {
  return typeof townTrainingSkills === "function" ? townTrainingSkills() : [];
}

const TOWN_TIME_FLOW_THRESHOLD_DAYS = (typeof townTimeConfig === "function" ? townTimeConfig().flowThresholdDays : 5) || 5;

function townTimeActionDays(action, context = {}) {
  if (action === "rest-full") {
    return typeof allyFullRestDays === "function" ? allyFullRestDays() : 1;
  }
  const training = typeof townTrainingConfig === "function" ? townTrainingConfig() : {};
  if (action?.startsWith("learn-skill-")) {
    const skillId = action.replace("learn-skill-", "");
    return playerKnowsSkill(skillId) ? 0 : Math.max(0, Math.floor(Number(training.learnDays) || 0));
  }
  if (action?.startsWith("train-skill-")) {
    const skillId = action.replace("train-skill-", "");
    const level = context.level ?? playerSkillLevel(skillId);
    return level && level < 2 ? Math.max(0, Math.floor(Number(training.trainDays) || 0)) : 0;
  }
  const actionDays = typeof townTimeConfig === "function" ? townTimeConfig().actionDays || {} : {};
  return Math.max(0, Math.floor(Number(actionDays[action]) || 0));
}

function townTimeCostEntry(action, context = {}, label = "时间") {
  const days = townTimeActionDays(action, context);
  return days ? { label, value: `耗去 ${days} 天`, tone: "warn" } : null;
}

function shouldShowTownTimeFlow(days, options = {}) {
  const amount = Math.max(0, Math.floor(Number(days) || 0));
  return !!options.force || amount > TOWN_TIME_FLOW_THRESHOLD_DAYS;
}

function afterTownTimeFlow(timeResult, callback) {
  const delay = Math.max(0, Math.floor(Number(timeResult?.transitionDelay) || 0));
  if (delay > 0) {
    window.setTimeout(callback, delay);
    return;
  }
  callback();
}

function currentTownDungeonIds() {
  const townId = state?.allyTownId || "oak_town";
  return typeof townDungeonIds === "function"
    ? townDungeonIds(townId)
    : DUNGEON_META?.towns?.[townId]?.dungeonIds || [];
}

function currentTownDungeons() {
  return currentTownDungeonIds()
    .map((id) => DUNGEON_REGISTRY?.[id])
    .filter(Boolean);
}

function allyTownDetail(focus = state.allyFocus) {
  return typeof townDetail === "function" ? townDetail(focus) : {
    kicker: "橡树广场",
    title: "橡树小镇",
    desc: "这里是远征前的准备区。",
  };
}

function allyTownActionFromMeta(entry) {
  if (!entry || entry.type === "workBoard") return null;
  const action = {
    id: entry.id,
    label: entry.label,
    meta: entry.meta,
    help: entry.help,
    mark: entry.mark,
  };
  const timeCost = townTimeActionDays(entry.id);
  if (timeCost) action.timeCost = timeCost;
  if (entry.goldCost) {
    action.goldCost = entry.goldCost;
    action.disabled = state.gold < entry.goldCost;
  }
  if (entry.type === "repair") {
    action.meta = allyRepairMeta(entry.scope);
  }
  if (entry.type === "restFull") {
    action.help = `${entry.help} 当前 HP ${state.player.hp}/${state.player.maxHp}，MP ${state.player.mp ?? 30}/${state.player.maxMp ?? 30}。`;
  }
  return action;
}

function allyTownActionsFromMetadata(focus = state.allyFocus) {
  if (focus === "learn-skills") {
    return allyTrainingSkills().map((entry) => ({
      id: `learn-skill-${entry.id}`,
      label: allySkillLabel(entry.id),
      meta: allyLearnSkillMeta(entry),
      help: playerKnowsSkill(entry.id)
        ? "你已经学会这个技能，不能重复学习。"
        : `学习这个技能需要 ${entry.learnCost} 金，并耗去 ${townTimeActionDays(`learn-skill-${entry.id}`)} 天。教头会从基础动作开始训练你。`,
      timeCost: townTimeActionDays(`learn-skill-${entry.id}`),
      goldCost: playerKnowsSkill(entry.id) ? 0 : entry.learnCost,
      disabled: playerKnowsSkill(entry.id) || state.gold < entry.learnCost,
    }));
  }
  if (focus === "train-skills") {
    const trainCost = Math.max(0, Number((typeof townTrainingConfig === "function" ? townTrainingConfig() : {}).trainCost) || 0);
    return allyTrainingSkills().map((entry) => {
      const level = playerSkillLevel(entry.id);
      const timeCost = townTimeActionDays(`train-skill-${entry.id}`, { level });
      return {
        id: `train-skill-${entry.id}`,
        label: allySkillLabel(entry.id),
        meta: allyTrainSkillMeta(entry.id),
        help: !level
          ? "你还没有学会这个技能，需要先学习后才能训练。"
          : level >= 2
            ? "这个技能已经练到当前上限，暂时不能继续训练。"
            : `训练需要 ${trainCost} 金和 ${timeCost} 天。完成后，这个技能会提升到 Lv.2。`,
        disabled: !level || level >= 2 || state.gold < trainCost,
        timeCost,
        goldCost: level && level < 2 ? trainCost : 0,
      };
    });
  }
  if (focus === "work-contracts") {
    return [
      ...townWorkBoardActions(),
      ...townActionDefs(focus)
        .filter((entry) => entry.type !== "workBoard")
        .map(allyTownActionFromMeta)
        .filter(Boolean),
    ];
  }
  if (focus === "gate") {
    const dungeons = currentTownDungeons();
    const maxIndex = Math.min(state.unlockedDungeonIndex || 0, dungeons.length - 1);
    return dungeons.slice(0, maxIndex + 1).map((dungeon) => {
      const globalIndex = Math.max(0, DUNGEONS.findIndex((dungeon) => dungeon.id === dungeon.id));
      return {
        id: "enter-dungeon",
        label: dungeon.title,
        meta: dungeon.subtitle || `烛时 ${dungeon.timeLimit}`,
        help: dungeon.entryText || dungeon.desc || `进入「${dungeon.title}」。本副本有 ${dungeon.bossStep || 100} 步路程，烛时时限为 ${dungeon.timeLimit}。出发前建议先整理装备和补给。`,
        value: String(globalIndex),
        active: globalIndex === state.dungeonIndex,
      };
    });
  }
  return townActionDefs(focus).map(allyTownActionFromMeta).filter(Boolean);
}

function allyTownActions(focus = state.allyFocus) {
  if (typeof townActionDefs === "function") {
    return allyTownActionsFromMetadata(focus);
  }
  if (focus === "rest") {
    return [
      {
        id: "rest-full",
        label: "在篝火旁歇息",
        meta: "回满生命法力",
        help: `休息后恢复全部 HP 和 MP。当前 HP ${state.player.hp}/${state.player.maxHp}，MP ${state.player.mp ?? 30}/${state.player.maxMp ?? 30}。篝火旁有热汤和绷带，适合远征前整理状态。`,
        timeCost: townTimeActionDays("rest-full"),
      },
      {
        id: "stash",
        label: "翻检随身箱",
        meta: "查看背包",
        help: "查看行囊和备用物资。出镇前可以确认药剂、卷轴和其他道具是否足够。",
      },
    ];
  }
  if (focus === "item-shop") {
    return [
      {
        id: "item-shop-placeholder",
        label: "向店主采买",
        meta: "购买药剂符纸",
        help: "打开道具店。这里出售生命药剂、法力药剂、战斗补给和赶路道具，货物会按月更新。",
        timeCost: townTimeActionDays("item-shop-placeholder"),
      },
    ];
  }
  if (focus === "forge") {
    return [
      {
        id: "equipment-shop-placeholder",
        label: "挑选兵甲",
        meta: "购买武器护甲",
        help: "打开铁匠铺商店。这里出售本月新锻造的武器和护甲，部分装备带有附魔效果。",
        timeCost: townTimeActionDays("equipment-shop-placeholder"),
      },
      {
        id: "focus-repair",
        label: "交给铁匠修补",
        meta: "修理受损装备",
        help: "进入修理选项。铁匠可以修复武器和护甲的耐久，避免装备在远征途中损坏。",
      },
    ];
  }
  if (focus === "repair") {
    return [
      {
        id: "repair-equipped",
        label: "修身上披挂",
        meta: allyRepairMeta("equipped"),
        help: "只修理当前装备中的武器和护甲。适合金币不多、只想先保证战斗装备可用时选择。",
        timeCost: townTimeActionDays("repair-equipped"),
      },
      {
        id: "repair-all",
        label: "修整全部行装",
        meta: allyRepairMeta("all"),
        help: "修理背包里所有受损的武器和护甲。花费更高，但能一次处理全部装备耐久。",
        timeCost: townTimeActionDays("repair-all"),
      },
      {
        id: "focus-forge",
        label: "退回铁砧前",
        meta: "返回铁匠铺",
        help: "返回铁匠铺的主选项，可以继续购买装备或选择修理装备。",
      },
    ];
  }
  if (focus === "training") {
    return [
      {
        id: "focus-learn-skills",
        label: "向教头拜师",
        meta: "学习新技能",
        help: "向训练场教头付费学习新技能。可学技能偏向生存、增益和破甲，适合远征前补强战斗能力。",
      },
      {
        id: "focus-train-skills",
        label: "闭营苦练",
        meta: "升级已学技能",
        help: "花费时间和金币训练已学会的技能。训练完成后，技能等级会提升。",
      },
    ];
  }
  if (focus === "learn-skills") {
    return allyTrainingSkills().map((entry) => ({
      id: `learn-skill-${entry.id}`,
      label: allySkillLabel(entry.id),
      meta: allyLearnSkillMeta(entry),
      help: playerKnowsSkill(entry.id)
        ? "你已经学会这个技能，不能重复学习。"
        : `学习这个技能需要 ${entry.learnCost} 金，并耗去 ${townTimeActionDays(`learn-skill-${entry.id}`)} 天。教头会从基础动作开始训练你。`,
      timeCost: townTimeActionDays(`learn-skill-${entry.id}`),
      goldCost: playerKnowsSkill(entry.id) ? 0 : entry.learnCost,
      disabled: playerKnowsSkill(entry.id) || state.gold < entry.learnCost,
    }));
  }
  if (focus === "train-skills") {
    return allyTrainingSkills().map((entry) => {
      const level = playerSkillLevel(entry.id);
      return {
        id: `train-skill-${entry.id}`,
        label: allySkillLabel(entry.id),
        meta: allyTrainSkillMeta(entry.id),
        help: !level
          ? "你还没有学会这个技能，需要先学习后才能训练。"
          : level >= 2
            ? "这个技能已经练到当前上限，暂时不能继续训练。"
            : "训练需要 120 金和 30 天。完成后，这个技能会提升到 Lv.2。",
        disabled: !level || level >= 2 || state.gold < 120,
        timeCost: townTimeActionDays(`train-skill-${entry.id}`, { level }),
        goldCost: level && level < 2 ? 120 : 0,
      };
    });
  }
  if (focus === "work") {
    return [
      {
        id: "focus-work-contracts",
        label: "工作承接",
        meta: "查看短工",
        help: "查看本月可以承接的短工和护卫契约。接下工作后会推进日期，完工后获得金币。",
      },
      {
        id: "guild-commission-placeholder",
        label: "悬赏委托",
        meta: "暂未开放",
        help: "悬赏委托暂未开放。之后这里会提供更危险、奖励更高的任务。",
      },
      {
        id: "guild-rumor",
        label: "行会密报",
        meta: "查看情报",
        help: "查看本月更新的行会情报。内容可能涉及副本补给、铁匠铺更新或小镇工作的风险。",
      },
    ];
  }
  if (focus === "work-contracts") {
    return [
      ...townWorkBoardActions(),
      {
        id: "focus-work",
        label: "退回工会柜台",
        meta: "返回工会",
        help: "返回冒险家工会主选项，可以重新查看工作、悬赏和情报。",
      },
    ];
  }
  if (focus === "bar") {
    return [
      {
        id: "bar-ale",
        label: "要一杯淡麦酒",
        meta: "恢复少量 HP",
        help: "花费 5 金喝一杯淡麦酒，恢复 15% HP。适合轻伤时补一点状态。",
        goldCost: 5,
        disabled: state.gold < 5,
      },
      {
        id: "bar-oak-wine",
        label: "点一杯橡木烈酒",
        meta: "恢复 HP/MP",
        help: "花费 8 金喝一杯烈酒，恢复 10% HP 和 10% MP。适合出镇前补一点生命和法力。",
        goldCost: 8,
        disabled: state.gold < 8,
      },
      {
        id: "bar-gamble",
        label: "坐上骰子桌",
        meta: "押 10 金赌博",
        help: "花费 10 金进行一次骰子赌博。可能输钱，也可能赢回更多金币。",
        goldCost: 10,
        disabled: state.gold < 10,
      },
      {
        id: "bar-rumor",
        label: "听吧台消息",
        meta: "听小镇传闻",
        help: "听取本月固定的一条小镇消息。内容可能提示商店刷新、战斗准备或其他实用信息。",
      },
    ];
  }
  if (focus === "gate") {
    const dungeons = currentTownDungeons();
    const maxIndex = Math.min(state.unlockedDungeonIndex || 0, dungeons.length - 1);
    return dungeons.slice(0, maxIndex + 1).map((dungeon) => {
      const globalIndex = Math.max(0, DUNGEONS.findIndex((dungeon) => dungeon.id === dungeon.id));
      return {
        id: "enter-dungeon",
        label: dungeon.title,
        meta: dungeon.subtitle || `烛时 ${dungeon.timeLimit}`,
        help: dungeon.entryText || dungeon.desc || `进入「${dungeon.title}」。本副本有 ${dungeon.bossStep || 100} 步路程，烛时时限为 ${dungeon.timeLimit}。出发前建议先整理装备和补给。`,
        value: String(globalIndex),
        active: globalIndex === state.dungeonIndex,
      };
    });
  }
  return [];
}
function renderAllyTownOverlay(frame) {
  let overlay = frame.querySelector(".ally-town-overlay");
  const wrap = frame.parentElement;
  let menu = wrap ? Array.from(wrap.children).find((child) => child.classList?.contains("ally-town-menu")) : null;
  let hint = wrap ? Array.from(wrap.children).find((child) => child.classList?.contains("ally-town-hover-tip")) : null;
  const inAllyTown = state.worldMode === "ally" && (state.mode === "ally" || state.mode === "shop");
  frame.classList.toggle("has-ally-town", inAllyTown);
  if (!inAllyTown) {
    overlay?.remove();
    menu?.remove();
    hint?.remove();
    return;
  }
  overlay?.remove();
  if (wrap && !hint) {
    hint = document.createElement("aside");
    hint.className = "ally-town-hover-tip";
    hint.setAttribute("aria-live", "polite");
    hint.setAttribute("aria-label", "小镇操作说明");
    const log = wrap.querySelector?.("#log");
    (log || frame).insertAdjacentElement("afterend", hint);
  } else if (wrap && hint) {
    const log = wrap.querySelector?.("#log");
    if (log && log.nextElementSibling !== hint) {
      log.insertAdjacentElement("afterend", hint);
    }
  }
  if (wrap && !menu) {
    menu = document.createElement("nav");
    menu.className = "ally-town-menu";
    menu.setAttribute("aria-label", `${typeof currentTownTitle === "function" ? currentTownTitle() : "橡树小镇"}设施`);
    const log = wrap.querySelector?.("#log");
    (hint || log || frame).insertAdjacentElement("afterend", menu);
  } else if (wrap && menu) {
    if (hint && hint.nextElementSibling !== menu) {
      hint.insertAdjacentElement("afterend", menu);
    }
  }

  const focus = state.allyFocus || "";
  const detail = allyTownDetail(focus);
  const actions = allyTownActions(focus);
  updateAllyTownHoverTip(hint, {
    title: detail.title,
    text: "悬浮小镇操作查看说明。",
  });
  if (menu) {
    const townNodes = !focus ? allyTownNodes() : [];
    const nodeButtons = !focus ? townNodes.map((node) => {
      const nodeDetail = allyTownDetail(node.id);
      const helpText = [node.title, nodeDetail.desc || node.meta].filter(Boolean).join("。");
      return '<button type="button" class="ally-town-menu-item ally-town-menu-item--' + node.id + '" data-ally-node="' + node.id + '" data-ally-help-title="' + escapeHtml(node.label) + '" data-ally-help="' + escapeHtml(helpText) + '" aria-label="' + escapeHtml(node.title) + '" title="' + escapeHtml(node.label) + ' · ' + escapeHtml(node.meta) + '">' +
        '<span class="ally-town-menu-mark" aria-hidden="true">' + escapeHtml(node.mark) + '</span>' +
        '<span class="ally-town-menu-copy"><strong>' + escapeHtml(node.label) + '</strong><small>' + escapeHtml(node.meta) + '</small></span>' +
      '</button>';
    }).join("") + allyTownMenuPlaceholders(townNodes.length) : "";
    const actionButtons = focus
      ? actions.map(allyTownActionButton).join("") +
        '<button type="button" class="ally-town-menu-item ally-town-menu-item--square" data-ally-action="square" data-ally-help-title="退回广场" data-ally-help="回到古橡树下，重新选择小镇设施。"><span class="ally-town-menu-mark" aria-hidden="true">返</span><span class="ally-town-menu-copy"><strong>退回广场</strong><small>回到古橡树下</small></span></button>'
        + allyTownMenuPlaceholders(actions.length + 1)
      : "";
    const detailPanel = focus ?
      '<section class="ally-town-menu-detail" aria-label="' + escapeHtml(detail.title) + '">' +
        '<div class="ally-town-menu-detail-copy"><span>' + escapeHtml(detail.kicker) + '</span><strong>' + escapeHtml(detail.title) + '</strong><p>' + escapeHtml(detail.desc) + '</p></div>' +
        '<div class="ally-town-menu-actions">' + actionButtons + '</div>' +
      '</section>' : "";
    menu.innerHTML = !focus
      ? '<section class="ally-town-menu-detail ally-town-menu-detail--root" aria-label="' + escapeHtml(detail.title) + '">' +
          '<div class="ally-town-menu-detail-copy"><span>' + escapeHtml(detail.kicker) + '</span><strong>' + escapeHtml(detail.title) + '</strong><p>' + escapeHtml(detail.desc) + '</p></div>' +
          '<div class="ally-town-menu-list">' + nodeButtons + '</div>' +
        '</section>'
      : detailPanel;
  }

  menu?.querySelectorAll("[data-ally-node]").forEach((node) => {
    node.addEventListener("click", () => setAllyFocus(node.dataset.allyNode));
  });
  menu?.querySelectorAll("[data-ally-action]").forEach((button) => {
    button.addEventListener("click", () => handleAllyTownAction(button.dataset.allyAction, button.dataset.allyValue));
  });
  menu?.querySelectorAll("[data-ally-help]").forEach((button) => {
    const showHelp = () => updateAllyTownHoverTip(hint, {
      title: button.dataset.allyHelpTitle || button.textContent.trim(),
      text: button.dataset.allyHelp || "",
    });
    const resetHelp = () => updateAllyTownHoverTip(hint, {
      title: detail.title,
      text: "悬浮小镇操作查看说明。",
    });
    button.addEventListener("mouseenter", showHelp);
    button.addEventListener("focus", showHelp);
    button.addEventListener("mouseleave", resetHelp);
    button.addEventListener("blur", resetHelp);
  });
}

function updateAllyTownHoverTip(tip, info = {}) {
  if (!tip) return;
  const title = info.title || (typeof currentTownTitle === "function" ? currentTownTitle() : "橡树小镇");
  const text = info.text || "悬浮小镇操作查看说明。";
  tip.innerHTML = `<span>操作说明</span><strong>${escapeHtml(title)}</strong><p>${escapeHtml(text)}</p>`;
}

function allyTownActionHelpText(action) {
  const parts = [];
  if (action.help) parts.push(action.help);
  else if (action.title) parts.push(action.title);
  else if (action.meta) parts.push(action.meta);
  if (action.goldCost) {
    parts.push(state.gold < action.goldCost
      ? `钱袋不足：需 ${action.goldCost} 金，现有 ${state.gold} 金。`
      : `花费 ${action.goldCost} 金。`);
  }
  if (action.rewardGold) parts.push(`完工酬金 ${formatTownGold(action.rewardGold)} 金。`);
  if (action.timeCost) parts.push(`耗去 ${action.timeCost} 天。`);
  return parts.filter(Boolean).join(" ");
}

function allyTownActionButton(action) {
  const valueAttr = action.value !== undefined
    ? ` data-ally-value="${escapeHtml(action.value)}"`
    : "";
  const disabledAttr = action.disabled ? " disabled" : "";
  const helpText = allyTownActionHelpText(action);
  const titleAttr = ` title="${escapeHtml(helpText)}"`;
  const helpAttrs = ` data-ally-help-title="${escapeHtml(action.label || "")}" data-ally-help="${escapeHtml(helpText)}"`;
  const badgeHtml = [
    action.goldCost
      ? `<span class="ally-town-menu-badge ally-town-menu-gold${state.gold < action.goldCost ? " is-short" : ""}" aria-label="${state.gold < action.goldCost ? `钱袋不足：需 ${escapeHtml(action.goldCost)} 金，现有 ${escapeHtml(state.gold)} 金` : `付 ${escapeHtml(action.goldCost)} 金`}">${state.gold < action.goldCost ? `缺${escapeHtml(action.goldCost - state.gold)}金` : `${escapeHtml(action.goldCost)}金`}</span>`
      : "",
    action.rewardGold
      ? `<span class="ally-town-menu-badge ally-town-menu-gold" aria-label="酬金 ${escapeHtml(formatTownGold(action.rewardGold))} 金">+${escapeHtml(formatTownGold(action.rewardGold))}金</span>`
      : "",
    action.timeCost
      ? `<span class="ally-town-menu-badge ally-town-menu-time" aria-label="耽搁 ${escapeHtml(action.timeCost)} 天">${escapeHtml(action.timeCost)}天</span>`
      : "",
  ].join("");
  return `<button
      type="button"
      class="ally-town-menu-item ally-town-menu-item--action${action.active ? " is-active" : ""}${action.disabled ? " is-disabled" : ""}"
      data-ally-action="${escapeHtml(action.id)}"${valueAttr}${disabledAttr}${titleAttr}${helpAttrs}
    >
      ${badgeHtml ? `<span class="ally-town-menu-badges">${badgeHtml}</span>` : ""}
      <span class="ally-town-menu-mark" aria-hidden="true">${escapeHtml(action.mark || String(action.label || "").slice(0, 1))}</span>
      <span class="ally-town-menu-copy">
        <strong>${escapeHtml(action.label)}</strong>
        <small>${escapeHtml(action.meta)}</small>
      </span>
    </button>`;
}

function setAllyFocus(focus) {
  state.allyFocus = focus && state.allyFocus !== focus ? focus : null;
  setChoices([]);
  setActions([]);
  render();
}

function allyTownActionTimeCost(action) {
  return townTimeActionDays(action);
}

function openRestConfirmModal() {
  const maxMp = state.player.maxMp ?? 30;
  const currentMp = state.player.mp ?? maxMp;
  const timeCost = townTimeCostEntry("rest-full");
  openAdventureConfirmModal({
    kicker: "篝火营地",
    title: "在篝火旁歇息？",
    desc: "休息会恢复全部 HP 和 MP，同时推进小镇日期。",
    costs: [
      timeCost,
      { label: "行程", value: "当前日期推进" },
    ].filter(Boolean),
    rewards: [
      { label: "HP / MP", value: "完全恢复", tone: "reward" },
      { label: "异常状态", value: "全部清除", tone: "reward" },
      { label: "战斗临时效果", value: "重置归零", tone: "reward" },
    ],
    status: [
      { label: "生命", value: `${state.player.hp}/${state.player.maxHp}` },
      { label: "法力", value: `${currentMp}/${maxMp}` },
      {
        label: "当前日期",
        value: typeof calendarDateText === "function" ? calendarDateText() : "今日",
      },
    ],
    cancelLabel: "暂不歇息",
    confirmLabel: "确认歇息",
    onConfirm: allyFullRest,
  });
}

function townTimeCalendarSnapshot(calendar) {
  const parts = typeof calendarParts === "function"
    ? calendarParts(calendar)
    : { year: 0, month: 1, day: 1 };
  const text = typeof calendarDateText === "function"
    ? calendarDateText(calendar)
    : `${parts.year}-${parts.month}-${parts.day}`;
  return {
    text,
    year: parts.year,
    month: parts.month,
    day: parts.day,
  };
}

function townTimeFlipPages(fromCalendar, toCalendar, amount) {
  const start = townTimeCalendarSnapshot(fromCalendar);
  const end = townTimeCalendarSnapshot(toCalendar);
  const middleElapsed = Math.max(
    0,
    Math.floor(Number(fromCalendar?.elapsedDays) || 0) + Math.max(1, Math.floor(amount / 2))
  );
  const middle = townTimeCalendarSnapshot({ elapsedDays: middleElapsed });
  return [start, middle, end].map((date, index) => `
    <div class="town-time-calendar-page town-time-calendar-page--${index + 1}">
      <div class="town-time-calendar-rings"><span></span><span></span></div>
      <span class="town-time-calendar-year" data-time-year>${escapeHtml(String(date.year))}</span>
      <strong data-time-day>${escapeHtml(String(date.day).padStart(2, "0"))}</strong>
      <span class="town-time-calendar-month" data-time-month>${escapeHtml(String(date.month).padStart(2, "0"))} \u6708</span>
    </div>
  `).join("");
}

function setTownTimeLiveDate(overlay, calendar) {
  if (!overlay) return;
  const date = townTimeCalendarSnapshot(calendar);
  overlay.querySelectorAll("[data-time-year]").forEach((node) => {
    node.textContent = String(date.year);
  });
  overlay.querySelectorAll("[data-time-day]").forEach((node) => {
    node.textContent = String(date.day).padStart(2, "0");
  });
  overlay.querySelectorAll("[data-time-month]").forEach((node) => {
    node.textContent = `${String(date.month).padStart(2, "0")} \u6708`;
  });
  overlay.querySelector("[data-time-current-date]")?.replaceChildren(document.createTextNode(date.text));
}

function startTownTimeDateTicker(overlay, fromCalendar, amount, duration, options = {}) {
  const startElapsed = Math.max(0, Math.floor(Number(fromCalendar?.elapsedDays) || 0));
  const total = Math.max(1, Math.floor(Number(amount) || 1));
  const progressOffset = Math.max(0, Math.floor(Number(options.progressOffset) || 0));
  const progressTotal = Math.max(total + progressOffset, Math.floor(Number(options.progressTotal) || total));
  let lastDay = -1;
  const startedAt = performance.now();
  const tick = () => {
    const progress = Math.min(1, (performance.now() - startedAt) / duration);
    const day = Math.min(total, Math.floor(progress * total));
    if (day !== lastDay) {
      lastDay = day;
      setTownTimeLiveDate(overlay, { elapsedDays: startElapsed + day });
      const elapsedNode = overlay.querySelector("[data-time-elapsed]");
      if (elapsedNode) {
        const shownDay = progressOffset + day;
        elapsedNode.textContent = day >= total
          ? progressTotal > total
            ? `第 ${shownDay} 天`
            : `${total} 天过去了`
          : day > 0
            ? `第 ${shownDay} 天`
            : "时间正在推进";
      }
      const progressBar = overlay.querySelector("[data-time-progress]");
      if (progressBar) {
        const progressRatio = Math.min(1, (progressOffset + day) / progressTotal);
        progressBar.style.width = `${Math.max(4, progressRatio * 100)}%`;
      }
    }
    if (progress >= 1) {
      window.clearInterval(overlay._townTimeTicker);
      overlay._townTimeTicker = null;
      setTownTimeLiveDate(overlay, { elapsedDays: startElapsed + total });
    }
  };
  tick();
  overlay._townTimeTicker = window.setInterval(tick, 58);
}

function playTownTimeTransition(days, reason = "\u57ce\u9547\u884c\u52a8", fromCalendar = null, toCalendar = null, options = {}) {
  const amount = Math.max(0, Math.floor(Number(days) || 0));
  if (!shouldShowTownTimeFlow(amount, options) || typeof document === "undefined") return 0;
  const beforeCalendar = normalizeCalendar(fromCalendar || state?.calendar);
  const afterCalendar = normalizeCalendar(toCalendar || state?.calendar);
  const before = townTimeCalendarSnapshot(beforeCalendar);
  const after = townTimeCalendarSnapshot(afterCalendar);
  const old = document.querySelector(".town-time-transition");
  if (old?._townTimeTicker) window.clearInterval(old._townTimeTicker);
  old?.remove();
  const flowDuration = Math.min(6200, Math.max(3600, amount * 115));
  const leaveDelay = flowDuration + 650;
  const removeDelay = leaveDelay + 520;
  const overlay = document.createElement("div");
  overlay.className = "town-time-transition";
  overlay.setAttribute("role", "status");
  overlay.setAttribute("aria-live", "polite");
  overlay.innerHTML = `
    <div class="town-time-transition-card">
      <div class="town-time-calendar" aria-hidden="true">
        <div class="town-time-calendar-back"></div>
        ${townTimeFlipPages(beforeCalendar, afterCalendar, amount)}
      </div>
      <div class="town-time-transition-copy">
        <span class="town-time-transition-kicker">\u65f6\u95f4\u6d41\u8f6c</span>
        <strong data-time-elapsed>\u65f6\u95f4\u6b63\u5728\u63a8\u8fdb</strong>
        <div class="town-time-current">
          <span>\u6b63\u5728\u63a8\u8fdb</span>
          <b data-time-current-date>${escapeHtml(before.text)}</b>
          <i><em data-time-progress></em></i>
        </div>
        <div class="town-time-date-track">
          <span>${escapeHtml(before.text)}</span>
          <i></i>
          <span>${escapeHtml(after.text)}</span>
        </div>
        <p>${escapeHtml(reason)} \u00b7 \u65e5\u5386\u7ffb\u8fc7\uff0c\u65f6\u95f4\u5411\u524d\u63a8\u8fdb</p>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  startTownTimeDateTicker(overlay, beforeCalendar, amount, flowDuration, {
    progressOffset: options.progressOffset,
    progressTotal: options.progressTotal,
  });
  window.setTimeout(() => overlay.classList.add("is-leaving"), leaveDelay);
  window.setTimeout(() => {
    if (overlay._townTimeTicker) window.clearInterval(overlay._townTimeTicker);
    overlay.remove();
  }, removeDelay);
  return removeDelay;
}

function runTownDailyCheck(dayInfo) {
  if (typeof window !== "undefined" && typeof window.townDailyCheck === "function") {
    return window.townDailyCheck(state, dayInfo);
  }
  if (typeof townDailyCheck === "function") return townDailyCheck(state, dayInfo);
  return null;
}

function advanceTownDate(days, reason) {
  if (!state || previewingOutcome) return { elapsed: 0, transitionDelay: 0 };
  const amount = Math.max(0, Math.floor(Number(days) || 0));
  if (!amount) return { elapsed: 0, transitionDelay: 0 };
  state.calendar = normalizeCalendar(state.calendar);
  const beforeCalendar = normalizeCalendar(state.calendar);
  const triggered = [];
  for (let day = 1; day <= amount; day += 1) {
    state.calendar.elapsedDays += 1;
    const result = runTownDailyCheck({
      day,
      totalDays: amount,
      reason,
      calendar: normalizeCalendar(state.calendar),
    });
    if (Array.isArray(result)) triggered.push(...result.filter(Boolean));
    else if (result) triggered.push(result);
  }
  addLine(`\u3010\u65f6\u95f4\u3011${reason}\u8017\u53bb ${amount} \u5929\uff0c\u5f53\u524d\uff1a${calendarDateText()}\u3002`, "system");
  triggered.forEach((line) => {
    if (typeof line === "string") addLine(line, "system");
  });
  const transitionDelay = playTownTimeTransition(amount, reason, beforeCalendar, state.calendar);
  return { elapsed: amount, transitionDelay };
}

function canPayTownBarGold(cost, actionLabel) {
  const price = Math.max(0, Number(cost) || 0);
  if (state.gold < price) {
    addLine(`钱袋太轻，${actionLabel}需要 ${price} 金。`, "warn");
    render();
    return false;
  }
  return true;
}

function payTownBarGold(cost, actionLabel) {
  const price = Math.max(0, Number(cost) || 0);
  if (!canPayTownBarGold(price, actionLabel)) return false;
  state.gold -= price;
  return true;
}

function townBarGoldAfter(cost) {
  return Math.round((state.gold - Math.max(0, Number(cost) || 0)) * 10) / 10;
}

function townBarDrink(kind) {
  return {
    ale: {
      cost: 5,
      name: "麦酒",
      reward: "HP +15%",
      line: "酒保推来一杯泛着浅沫的麦酒，暖意从喉咙一路沉到胃里。",
      effect: () => healPlayerPercent(state, 0.15),
    },
    oakWine: {
      cost: 8,
      name: "橡木烈酒",
      reward: "HP/MP +10%",
      line: "橡木烈酒像一小团火滚过舌尖，疲惫被粗暴地往外推开。",
      effect: () => {
        const hpText = healPlayerPercent(state, 0.1);
        const mpText = restorePlayerMpPercent(state, 0.1);
        return `${hpText}${mpText}`;
      },
    },
  }[kind] || null;
}

function drinkTownBar(kind) {
  const drink = townBarDrink(kind);
  if (!drink) return;
  if (!canPayTownBarGold(drink.cost, `点一杯${drink.name}`)) return;
  const maxMp = state.player.maxMp ?? 30;
  const currentMp = state.player.mp ?? maxMp;
  openAdventureConfirmModal({
    kicker: "橡木酒馆",
    title: `点一杯${drink.name}？`,
    desc: "支付酒钱后立即恢复对应的 HP 或 MP。",
    costs: [
      { label: "酒钱", value: `${drink.cost} 金`, tone: "warn" },
    ],
    rewards: [
      { label: "恢复", value: drink.reward, tone: "reward" },
    ],
    status: [
      { label: "当前金币", value: `${state.gold} 金` },
      { label: "饮后金币", value: `${townBarGoldAfter(drink.cost)} 金` },
      { label: "当前 HP", value: `${state.player.hp}/${state.player.maxHp}` },
      { label: "当前 MP", value: `${currentMp}/${maxMp}` },
    ],
    cancelLabel: "先不喝",
    confirmLabel: "付钱喝下",
    onConfirm: () => performDrinkTownBar(kind),
  });
}

function performDrinkTownBar(kind) {
  const drink = townBarDrink(kind);
  if (!drink || !payTownBarGold(drink.cost, `点一杯${drink.name}`)) return;
  const effectText = drink.effect();
  const resultText = `${drink.line}${effectText ? ` ${effectText}` : ""} 酒钱 ${drink.cost} 金。`;
  if (typeof openResultEventModal !== "function") {
    addLine(resultText, "reward");
    render();
    return;
  }
  openResultEventModal({
    kicker: "橡木酒馆",
    title: drink.name,
    desc: "酒保把杯口推到烛光下。钱币在吧台上轻轻一响，杯中的暖意也跟着递到你手边。",
    illustration: "assets/event/town/drink.png",
    result: () => resultText,
    resultChoiceLabel: "饮酒结果",
    emptyResultText: "杯子已经空了。",
    closeMode: "ally",
    logTone: "reward",
  });
}

function gambleTownBar() {
  const wager = 10;
  if (!canPayTownBarGold(wager, "坐上骰子桌")) return;
  openAdventureConfirmModal({
    kicker: "橡木酒馆",
    title: "坐上骰子桌？",
    desc: "押 10 金进行一次骰子赌博。可能输钱，也可能赢得更多金币。",
    costs: [
      { label: "押注", value: `${wager} 金`, tone: "warn" },
      { label: "风险", value: "可能输掉本局押注", tone: "warn" },
    ],
    rewards: [
      { label: "小胜", value: "收回 20 金", tone: "reward" },
      { label: "平局", value: "退回 10 金", tone: "reward" },
      { label: "大胜", value: "收回 50 金", tone: "reward" },
    ],
    status: [
      { label: "当前金币", value: `${state.gold} 金` },
      { label: "最差结果", value: `${townBarGoldAfter(wager)} 金` },
      { label: "牌桌风声", value: "58% 输 / 42% 不亏或赢" },
    ],
    cancelLabel: "离开赌桌",
    confirmLabel: "掷下骰子",
    onConfirm: performGambleTownBar,
  });
}

function performGambleTownBar() {
  const wager = 10;
  if (!payTownBarGold(wager, "坐上骰子桌")) return;
  const roll = Math.random();
  let resultText = "";
  let logTone = "system";
  if (roll < 0.58) {
    resultText = "骰盅揭开，点数冷得像井水。你输掉了 10 金。";
    logTone = "warn";
  } else if (roll < 0.78) {
    state.gold += 20;
    resultText = "骰子撞出一串脆响，你赢下小局，连本带利收回 20 金。";
    logTone = "reward";
  } else if (roll < 0.96) {
    state.gold += 10;
    resultText = "这一把平局，庄家把 10 金推回你面前。";
  } else {
    state.gold += 50;
    resultText = "满桌人忽然安静。你掷出酒馆今晚最大的点数，收回 50 金。";
    logTone = "reward";
  }
  if (typeof openResultEventModal !== "function") {
    addLine(resultText, logTone);
    render();
    return;
  }
  openResultEventModal({
    kicker: "橡木酒馆",
    title: "骰局落定",
    desc: "本次骰子赌博已经结算。",
    illustration: "assets/event/town/dice.png",
    result: () => resultText,
    resultChoiceLabel: "骰局结果",
    emptyResultText: "骰子停下了，但没人看清点数。",
    closeMode: "ally",
    logTone,
  });
}

function openDungeonPrepModal(index = 0) {
  const nextIndex = clamp(Number(index || 0), 0, state.unlockedDungeonIndex || 0);
  const dungeon = DUNGEONS[nextIndex] || DUNGEONS[0];
  const days = estimateDungeonBossDays(dungeon);
  const maxAffordableRations = Math.max(0, state.gold * 10);
  const defaultRations = Math.min(days, maxAffordableRations);
  const modal = $("menuModal");
  const title = $("menuTitle");
  const tabs = $("menuTabs");
  const content = $("menuContent");
  const closeButton = $("closeMenu");
  modal.dataset.menuMode = "dungeon-prep";
  modal.classList.remove("modal--home-settings", "modal--home-about");
  modal.classList.add("active");
  if (title) title.textContent = "整备远征";
  if (closeButton) closeButton.textContent = "合上行囊";
  tabs.innerHTML = "";
  tabs.classList.add("tabs--hidden");
  if (typeof openMultiTabModal === "function") {
    openMultiTabModal({
      mode: "dungeon-prep",
      classes: [],
      title: "\u6574\u5907\u8fdc\u5f81",
      closeLabel: "\u5408\u4e0a\u884c\u56ca",
      tabs: [],
      hideTabs: true,
    });
  }
  content.innerHTML = `
    <div class="dungeon-prep">
      <div class="dungeon-prep-head">
        <span>远征去处</span>
        <strong>${escapeHtml(dungeon.title || "未知副本")}</strong>
      </div>
      <p class="dungeon-prep-note">${escapeHtml(dungeon.desc || dungeon.entryText || "古门外的路已经打开，出发前请确认补给。")}</p>
      <div class="dungeon-prep-grid">
        <div><span>抵达终点</span><strong>${days} 天</strong></div>
        <div><span>行军干粮</span><strong>十日 1 金</strong></div>
        <div><span>钱袋余银</span><strong>${state.gold} 金</strong></div>
        <div><span>启程日</span><strong>${calendarDateText()}</strong></div>
      </div>
      <label class="dungeon-prep-field">
        <span>装入几日干粮</span>
        <input type="text" inputmode="numeric" pattern="[0-9]*" value="${defaultRations}" data-ration-days>
      </label>
      <div class="dungeon-prep-scrolls" role="radiogroup" aria-label="回城卷轴">
        <label><input type="radio" name="returnScroll" value="" checked> 不带回城卷轴</label>
        <label><input type="radio" name="returnScroll" value="basic"> 紧急避险卷轴（20金，舍弃本次所得）</label>
        <label><input type="radio" name="returnScroll" value="advanced"> 高阶传送卷轴（50金，保留3件本次所得）</label>
      </div>
      <p class="dungeon-prep-note">${escapeHtml(dungeon.warning || "干粮不足也能硬闯古门，但在荒途里耗尽便是死路。回城卷轴只许带一种，别让两道咒文在行囊里互相咬住。")}</p>
      <div class="dungeon-prep-total" data-prep-total></div>
      <div class="dungeon-prep-actions"></div>
    </div>
  `;
  const actions = content.querySelector(".dungeon-prep-actions");
  const departButton = makeButton("推门出征", () => confirmDungeonDeparture(nextIndex), "primary");
  actions.appendChild(departButton);
  actions.appendChild(makeButton("暂留镇中", closeMenu));
  const updatePrep = () => updateDungeonPrepCost(content, departButton);
  content.querySelector("[data-ration-days]")?.addEventListener("input", updatePrep);
  content.querySelectorAll('input[name="returnScroll"]').forEach((input) => {
    input.addEventListener("change", updatePrep);
  });
  updatePrep();
}

function selectedDungeonPrep(content = $("menuContent")) {
  const rationInput = content.querySelector("[data-ration-days]");
  const rationDays = Math.max(0, Math.floor(Number(rationInput?.value) || 0));
  if (rationInput) rationInput.value = String(rationDays);
  const scroll = content.querySelector('input[name="returnScroll"]:checked')?.value || null;
  const rationCost = rationCostForDays(rationDays);
  const scrollCost = scroll === "basic" ? 20 : scroll === "advanced" ? 50 : 0;
  return { rationDays, scroll, rationCost, scrollCost, totalCost: rationCost + scrollCost };
}

function updateDungeonPrepCost(content, departButton) {
  const prep = selectedDungeonPrep(content);
  const total = content.querySelector("[data-prep-total]");
  const canAfford = state.gold >= prep.totalCost;
  if (total) {
    total.textContent = `行囊花费 ${prep.totalCost} 金：干粮 ${prep.rationCost} 金，${expeditionScrollName(prep.scroll)} ${prep.scrollCost} 金。`;
  }
  if (departButton) {
    departButton.textContent = canAfford ? `付清并出征（${prep.totalCost}金）` : `钱袋不足（需${prep.totalCost}金）`;
    departButton.disabled = !canAfford;
  }
}

function confirmDungeonDeparture(index) {
  const prep = selectedDungeonPrep();
  const cost = prep.totalCost;
  if (state.gold < cost) {
    addLine(`钱袋太轻，本次远征整备需要 ${cost} 金。`, "warn");
    render();
    return;
  }
  state.gold -= cost;
  state.expedition = createExpeditionState(prep.rationDays, prep.scroll);
  const scrollText = prep.scroll ? `，携带${expeditionScrollName(prep.scroll)}` : "";
  addLine(`远征行囊已束紧：装入 ${prep.rationDays} 天干粮${scrollText}，付出 ${cost} 金。`, "system");
  closeMenu();
  enterDungeon(index);
}

function openAllyRestPoint() {
  setAllyFocus("rest");
}

function closeAllyPoint() {
  state.allyFocus = null;
  setChoices([]);
  setActions([]);
  render();
}

function openAllyTradePoint() {
  setAllyFocus("item-shop");
}

function openAllyTeleportPoint() {
  setAllyFocus("gate");
}

function openDungeonGate() {
  setAllyFocus("gate");
}

function renderBattlePanel() {
  // 变量：panel，战斗面板容器，战斗时展示敌人与技能资源。
  const panel = $("battlePanel");
  panel.innerHTML = "";
  panel.classList.toggle("active", state.mode === "battle" && !!state.battle);
  panel.setAttribute("aria-hidden", state.mode === "battle" && !!state.battle ? "true" : "false");
  if (!state.battle) return;
}

function renderBattleHud() {
  // 变量：hud，底部技能栏上方的战斗节奏信息区。
  const hud = $("battleHud");
  if (!hud) return;
  hud.innerHTML = "";
  hud.classList.toggle("active", state.mode === "battle" && !!state.battle);
  if (!state.battle) return;
  hud.appendChild(actionGaugeCard());
}

function renderBattleQteProgress() {
  const qte = state.battle?.qte;
  if (!qte) return false;
  const cursor = $("battleHud")?.querySelector(".qte-cursor");
  if (!cursor) return false;
  cursor.style.left = `${clamp(qte.progress || 0, 0, 1) * 100}%`;
  return true;
}

function renderVisual() {
  // 变量：frame，视觉画面容器，用于渲染场景或敌人插画效果。
  const frame = $("visualFrame");
  if (!frame) return;
  // 变量：isBattle，当前画面是否处于战斗态，用于切换视觉渲染来源。
  const isBattle = state.mode === "battle" && state.battle;
  // 变量：visual，当前场景或敌人的视觉配置，包含标题、描述、背景和氛围参数。
  const visual = isBattle ? battleVisual() : sceneVisual();
  const staticImageUrl = staticVisualImageUrl(visual);
  const useStaticImage = !!staticImageUrl;

  // 首次初始化 canvas
  if (!useStaticImage && !frame._visualReady) {
    VisualRenderer.setup(frame);
    frame._visualReady = true;
  }

  // 内容没变化则跳过渲染
  // 变量：key，当前副本的敌人池标识或视觉缓存键，用于查找对应配置。
  const key =
    visual.kind === "battle"
      ? `battle:${visual.enemy}`
      : `scene:${visual.region}`;
  const visualKey = `${key}:${useStaticImage ? staticImageUrl : "canvas"}`;
  if (frame._visualKey !== visualKey) {
    frame._visualKey = visualKey;
    frame.className = `visual-frame ${isBattle ? "is-battle" : "is-scene"} ${useStaticImage ? "uses-static-image" : ""}`.trim();
    frame.style.setProperty("--visual-bg", visual.bg);
    frame.style.setProperty("--visual-accent", visual.accent);
    if (useStaticImage) {
      frame.style.removeProperty("--visual-image");
      setVisualBackgroundImage(frame, staticImageUrl);
      VisualRenderer.stopLoop();
    } else {
      frame.style.removeProperty("--visual-image");
      setVisualBackgroundImage(frame, "");
      VisualRenderer.render(visual);
    }
  }

  // 文字叠加层
  // 变量：copy，视觉画面上的文字叠加层，用来显示场景或敌人说明。
  let copy = frame.querySelector(".visual-copy");
  if (!copy) {
    copy = document.createElement("div");
    frame.appendChild(copy);
  }
  copy.className = `visual-copy ${isBattle ? "visual-copy--battle" : ""}`.trim();
  copy.innerHTML = isBattle
    ? `<div class="visual-enemy-identity">
          <div class="visual-enemy-header">
            <span class="visual-enemy-kicker">敌影现身</span>
            ${battleEnemyTitleLine(visual.title)}
          </div>
          <p>${visual.desc}</p>
        </div>
        ${battleEnemyVisualInfo()}`
    : `<span>当前场景</span>
        <strong>${visual.title}</strong>
        <p>${visual.desc}</p>`;
  renderAllyTownOverlay(frame);
  renderClearArchiveOverlay(frame);
}

function renderClearArchiveOverlay(frame) {
  let overlay = frame.querySelector(".clear-archive");
  if (state.mode !== "clearArchive") {
    overlay?.remove();
    frame.classList.remove("is-clear-archive");
    return;
  }
  frame.classList.add("is-clear-archive");
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.className = "clear-archive";
    frame.appendChild(overlay);
  }
  const stats = state.clearStats || {};
  overlay.innerHTML = `
    <div class="clear-archive-scroll clear-archive-scroll--back" aria-hidden="true"></div>
    <div class="clear-archive-scroll clear-archive-scroll--front" aria-hidden="true"></div>
    <section class="clear-archive-card" aria-label="通关记录">
      <div class="clear-archive-head">
        <div class="clear-archive-seal" aria-hidden="true">终</div>
        <div class="clear-archive-head-copy">
          <span>通关记录</span>
          <strong>${escapeHtml(stats.title || "流程完成")}</strong>
          <p>本次游戏流程已完成。</p>
        </div>
      </div>
      <div class="clear-archive-hero">
        ${clearArchiveMetric("通关等级", `Lv.${stats.level || 1}`, stats.realm || "")}
        ${clearArchiveMetric("最终生命", `${stats.hp || 0}/${stats.maxHp || 0}`, "HP")}
        ${clearArchiveMetric("伤害 / 免伤 / 速", `${stats.atk || 0} / ${formatPct(stats.damageReduction || 0)} / ${stats.speed || 0}`, "终局属性")}
        ${clearArchiveMetric("剩余金币", stats.gold || 0, "金")}
      </div>
      <div class="clear-archive-section-title"><span></span><strong>行卷统计</strong><span></span></div>
      <div class="clear-archive-grid">
        ${clearArchiveStat("完成副本", stats.dungeonsDone, stats.dungeonsTotal)}
        ${clearArchiveStat("Boss 击破", stats.bossDefeated, stats.bossTotal)}
        ${clearArchiveStat("装备收集", stats.equipmentCount, stats.equipmentTotal)}
        ${clearArchiveStat("背包遗珍", stats.itemKinds, "类")}
      </div>
      <div class="clear-archive-foot">
        <span>确认后回到主菜单，通关记录将写入实时存档。</span>
        <button class="clear-archive-submit" type="button">收卷归档</button>
      </div>
    </section>
  `;
  overlay.querySelector(".clear-archive-submit")?.addEventListener("click", archiveClearRun);
}

function staticVisualImageUrl(visual) {
  if (visual?.image) return visualAssetUrl(visual.image);
  if (!window.USE_STATIC_VISUAL_IMAGES || !visual) return "";
  const dir = window.STATIC_VISUAL_IMAGE_DIR || "assets/ui/visual-banners";
  const ext = window.STATIC_VISUAL_IMAGE_EXT || "jpg";
  const map = visual.kind === "battle"
    ? window.STATIC_ENEMY_VISUAL_IMAGES
    : window.STATIC_SCENE_VISUAL_IMAGES;
  const key = visual.kind === "battle" ? visual.enemy : visual.region;
  const file = map?.[key] || map?.default;
  return file ? visualAssetUrl(`${dir}/${file}.${ext}`) : "";
}

function visualAssetUrl(path) {
  if (!path) return "";
  if (/^(?:[a-z]+:|\/|#)/i.test(path)) return path;
  if (path.startsWith("../")) return path.replace(/^(\.\.\/)+/, "");
  if (path.startsWith("./")) return visualAssetUrl(path.slice(2));
  return path;
}

function setVisualBackgroundImage(frame, src) {
  let img = frame.querySelector(".visual-bg-image");
  if (!src) {
    img?.remove();
    return;
  }
  if (!img) {
    img = document.createElement("img");
    img.className = "visual-bg-image";
    img.alt = "";
    img.decoding = "async";
    frame.prepend(img);
  }
  if (img.getAttribute("src") !== src) img.src = src;
}

function clearArchiveMetric(label, value, sub) {
  return `<div class="clear-archive-metric">
    <span>${escapeHtml(label)}</span>
    <strong>${escapeHtml(value)}</strong>
    <small>${escapeHtml(sub)}</small>
  </div>`;
}

function clearArchiveStat(label, value, total) {
  const totalText = total === "类" ? `${value || 0} 类` : `${value || 0}/${total || 0}`;
  return `<div class="clear-archive-stat">
    <span>${escapeHtml(label)}</span>
    <strong>${escapeHtml(totalText)}</strong>
  </div>`;
}

function battleEnemyTitleLine(title) {
  const enemy = state.battle?.enemy;
  if (!enemy) return "";
  const maxHp = Math.max(1, enemy.maxHp || enemy.hp || 1);
  const hpPct = clamp((enemy.hp / maxHp) * 100, 0, 100);
  return `<div class="visual-enemy-titleline">
        <strong>${escapeHtml(title)}</strong>
        <span class="visual-enemy-lv">Lv.${enemy.level || 1}</span>
        <div class="visual-enemy-hp">
          <div class="visual-enemy-hp-head"><span>HP</span><strong>${enemy.hp}/${maxHp}</strong></div>
          <div class="bar visual-enemy-hpbar"><span style="width:${hpPct}%"></span></div>
        </div>
      </div>`;
}

function battleEnemyVisualInfo() {
  const enemy = state.battle?.enemy;
  if (!enemy) return "";
  const enemyStatuses = escapeHtml(statusText(enemy).join("、") || "无");
  const chance = typeof enemySkillChance === "function" ? enemySkillChance(enemy) : (enemy.skillChance ?? 0.2);
  return `<div class="visual-enemy-panel">
        <div class="visual-enemy-grid">
          <div class="visual-enemy-stat"><span>攻击</span><strong>${enemy.atk}</strong></div>
          <div class="visual-enemy-stat"><span>免伤</span><strong>${formatPct(enemyDamageReduction())}</strong></div>
          <div class="visual-enemy-stat"><span>速度</span><strong>${enemySpeed(enemy)}</strong></div>
          <div class="visual-enemy-stat"><span>技能率</span><strong>${formatPct(chance)}</strong></div>
          <div class="visual-enemy-intel"><span>状态</span><strong>${enemyStatuses}</strong></div>
        </div>
      </div>`;
}

function battleVisual() {
  // 变量：enemy，当前战斗或待生成的敌人对象。
  const enemy = state.battle.enemy;
  // 变量：visual，当前场景或敌人的视觉配置，包含标题、描述、背景和氛围参数。
  const visual = ENEMY_VISUALS[enemy.name] || ENEMY_VISUALS.default;
  return {
    kind: "battle",
    title: ENEMY_VISUALS[enemy.name] ? visual.title : enemy.name,
    desc: enemy.desc || visual.desc,
    bg:
      visual.bg ||
      "linear-gradient(135deg, #10090d 0%, #3b1018 48%, #815040 100%)",
    accent: visual.accent,
    enemy: enemy.name,
    mood: visual.mood,
    clouds: visual.clouds || "heavy",
  };
}

function actionGaugeCard() {
  // 变量：div，临时 DOM 容器节点，用于组装当前面板或卡片结构。
  const div = document.createElement("div");
  div.className = "entity action-gauge-card";
  const action = state.battle?.action || {};
  const playerPct = clamp(action.playerGauge || 0, 0, ACTION_GAUGE_MAX);
  const enemyPct = clamp(action.enemyGauge || 0, 0, ACTION_GAUGE_MAX);
  const qte = state.battle?.qte;
  const qteProgress = qte ? battleQteProgress() * 100 : 0;
  const qteHtml = qte
    ? `<div class="qte-box qte-box--${qte.kind}">
        <div class="qte-head">
          <span class="qte-kicker">${qte.kind === "defense" ? "守势" : "剑诀"}判定</span>
          <strong>${escapeHtml(qte.label)}</strong>
          <span class="qte-hint">${escapeHtml(qte.hint)}</span>
        </div>
        <div class="qte-track">
          <span class="qte-track-glow"></span>
          <span class="qte-zone qte-zone--success" style="left:${qte.successStart * 100}%;width:${(qte.successEnd - qte.successStart) * 100}%"></span>
          <span class="qte-zone qte-zone--perfect" style="left:${qte.perfectStart * 100}%;width:${(qte.perfectEnd - qte.perfectStart) * 100}%"></span>
          <span class="qte-cursor" style="left:${qteProgress}%"></span>
          <span class="qte-track-pin qte-track-pin--start"></span>
          <span class="qte-track-pin qte-track-pin--end"></span>
        </div>
      </div>`
    : "";
  div.innerHTML = `<h3>行动槽：${battlePhaseText()}</h3>
        <div class="action-gauge-grid">
          <div class="action-gauge-row">
            <div class="action-gauge-meta"><span>${escapeHtml(playerDisplayName())}</span><strong>速度 ${totalSpeed()}</strong></div>
            <div class="action-gauge-track action-gauge-track--player" style="--gauge-pos:${playerPct}%">
              <span class="action-gauge-fill" style="width:${playerPct}%"></span>
              <span class="action-runner action-runner--hero" aria-hidden="true">
                <img class="runner-hero-img" src="assets/ui/duqinghuan-runner.png" alt="">
              </span>
            </div>
          </div>
          <div class="action-gauge-row">
            <div class="action-gauge-meta"><span>${escapeHtml(state.battle.enemy.name)}</span><strong>速度 ${enemySpeed(state.battle.enemy)}</strong></div>
            <div class="action-gauge-track action-gauge-track--enemy" style="--gauge-pos:${enemyPct}%">
              <span class="action-gauge-fill" style="width:${enemyPct}%"></span>
              <span class="action-runner action-runner--ghost" aria-hidden="true">
                <img class="runner-enemy-img" src="assets/ui/enemy-runner.png" alt="">
              </span>
            </div>
          </div>
        </div>
        ${qteHtml}`;
  return div;
}

function entityCard(type, name, hp, maxHp, atk, damageReduction, speed) {
  // 变量：div，临时 DOM 容器节点，用于组装当前面板或卡片结构。
  const div = document.createElement("div");
  div.className = "entity";
  // 变量：pct，生命条宽度百分比，根据当前 HP 与最大 HP 计算。
  const pct = Math.max(0, (hp / maxHp) * 100);
  div.innerHTML = `<h3>${type}：${name}</h3>
        <div class="stat-line"><span>HP</span><span>${hp}/${maxHp}</span></div>
        <div class="bar"><span style="width:${pct}%"></span></div>
        <div class="grid2"><div>伤害</div><div>${atk}</div><div>免伤</div><div>${formatPct(damageReduction || 0)}</div><div>速度</div><div>${speed}</div></div>`;
  return div;
}

function skillResourceCard() {
  // 变量：div，临时 DOM 容器节点，用于组装当前面板或卡片结构。
  const div = document.createElement("div");
  div.className = "entity";
  // 变量：enemy，当前战斗或待生成的敌人对象。
  const enemy = state.battle.enemy;
  const chance = typeof enemySkillChance === "function" ? enemySkillChance(enemy) : (enemy.skillChance ?? 0.2);
  div.innerHTML = `<h3>技能</h3>
        <div class="grid2"><div>MP</div><div>${state.player.mp ?? 30}/${state.player.maxMp ?? 30}</div><div>敌方技能率</div><div>${formatPct(chance)}</div><div>你</div><div>${statusText(state.player).join("、") || "无"}</div><div>敌</div><div>${statusText(enemy).join("、") || "无"}</div></div>`;
  return div;
}
