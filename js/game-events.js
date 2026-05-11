function goForward() {
  if (state.worldMode !== "dungeon" || state.mode !== "free") return;
  state.step += 1;
  state.timeLeft -= 1;
  advanceDate(1, "探索");
  if (!consumeExpeditionRations(1)) return;
  ensureStatuses(state.player);
  if (hasStatus(state.player, "poison")) applyDamage(state.player, 2, "中毒");
  addLine(`你向前行了一步。`, "system");
  afterMove(true, tickAvoidEncounterStep());
}

function goBack() {
  if (state.worldMode !== "dungeon" || state.mode !== "free") return;
  const returnLimit = (currentDungeon()?.bossStep || 100) + 1;
  if (state.step <= 0 || state.timeLeft + state.step <= returnLimit) return;
  state.step -= 1;
  state.timeLeft -= 1;
  advanceDate(1, "折返");
  if (!consumeExpeditionRations(1)) return;
  addLine("你折返一段旧路。退路同样藏着风险。", "warn");
  // 变量：avoidsEncounter，本次移动是否消耗避战效果，用于跳过随机战斗。
  const avoidsEncounter = tickAvoidEncounterStep();
  if (triggerShopAtStep()) {
    render();
    return;
  }
  randomAfterMove(avoidsEncounter);
}

function afterMove(isForward, avoidsEncounter = false) {
  if (state.player.hp <= 0) return gameOver(`毒伤入骨，${playerDisplayName()}倒在半途。`);
  if (isForward && state.step >= (currentDungeon()?.bossStep || 100)) {
    startDungeonBoss(currentDungeon());
    return;
  }
  if (isForward && triggerShopAtStep()) return;
  randomAfterMove(avoidsEncounter);
}

function startDungeonBoss(dungeon) {
  state.fixedSceneVisual = null;
  startBattle(getEnemy(dungeon.boss), true);
}

const MOVE_OUTCOME_DEFAULT_WEIGHTS = Object.freeze({
  none: 45,
  event: 25,
  battle: 30,
});
const MOVE_OUTCOME_KEYS = Object.keys(MOVE_OUTCOME_DEFAULT_WEIGHTS);

function normalizeMoveOutcomeWeights(weights = {}) {
  return MOVE_OUTCOME_KEYS.reduce((next, key) => {
    const value = Number(weights[key]);
    next[key] = Number.isFinite(value)
      ? clamp(Math.round(value), 0, 100)
      : MOVE_OUTCOME_DEFAULT_WEIGHTS[key];
    return next;
  }, {});
}

function moveOutcomeWeights() {
  const weights = normalizeMoveOutcomeWeights(window.DEBUG_MOVE_OUTCOME_WEIGHTS);
  const total = MOVE_OUTCOME_KEYS.reduce((sum, key) => sum + weights[key], 0);
  return total > 0 ? weights : { ...MOVE_OUTCOME_DEFAULT_WEIGHTS };
}

function setMoveOutcomeWeights(weights) {
  window.DEBUG_MOVE_OUTCOME_WEIGHTS = normalizeMoveOutcomeWeights(weights);
  return moveOutcomeWeights();
}

function resetMoveOutcomeWeights() {
  window.DEBUG_MOVE_OUTCOME_WEIGHTS = { ...MOVE_OUTCOME_DEFAULT_WEIGHTS };
  return moveOutcomeWeights();
}

function setNextMoveOutcome(outcome) {
  const key = String(outcome || "").trim();
  if (!MOVE_OUTCOME_KEYS.includes(key)) {
    window.DEBUG_NEXT_MOVE_OUTCOME = null;
    return null;
  }
  window.DEBUG_NEXT_MOVE_OUTCOME = key;
  return key;
}

function nextMoveOutcome() {
  return MOVE_OUTCOME_KEYS.includes(window.DEBUG_NEXT_MOVE_OUTCOME)
    ? window.DEBUG_NEXT_MOVE_OUTCOME
    : null;
}

function pickMoveOutcome() {
  const forced = nextMoveOutcome();
  if (forced) {
    window.DEBUG_NEXT_MOVE_OUTCOME = null;
    return forced;
  }
  const weights = moveOutcomeWeights();
  const total = MOVE_OUTCOME_KEYS.reduce((sum, key) => sum + weights[key], 0);
  let roll = Math.random() * total;
  for (const key of MOVE_OUTCOME_KEYS) {
    roll -= weights[key];
    if (roll <= 0) return key;
  }
  return "battle";
}

function triggerShopAtStep() {
  // 变量：shop，当前步数匹配到的商店配置，存在时进入商店流程。
  const shopData = currentDungeonShops().find((data) => data.step === state.step);
  if (shopData) ensureDungeonShopRegistered(shopData);
  const shop = shopData ? [shopData.id, shopData] : null;
  if (!shop) return false;
  // 变量：[id, data]，商店条目的 id 与配置数据，用于打开对应商店。
  const [id, data] = shop;
  const openCurrentShop = () => openShop(id);
  const showShopChoices = () => {
    if (!Array.isArray(data.choices) || !data.choices.length) {
      openCurrentShop();
      return;
    }
    state.mode = "shopChoice";
    setActions([]);
    setTimeout(() => {
      setChoices(
        data.choices.map((choice) => {
          const choiceData = Array.isArray(choice)
            ? { label: choice[0], onChoose: choice[1], disabled: choice[2] }
            : choice;
          return {
            label: choiceData.label,
            disabled:
              typeof choiceData.disabled === "function"
                ? choiceData.disabled(state)
                : !!choiceData.disabled,
            onClick: () => {
              setChoices([]);
              const msg = choiceData.onChoose ? choiceData.onChoose(state) : null;
              const resultText = choiceData.text || msg;
              if (resultText) {
                beginNarrative(resultText, openCurrentShop, {
                  allowSkip: true,
                  typewriter: choiceData.typewriter !== false,
                });
              } else {
                openCurrentShop();
              }
            },
          };
        }),
      );
      render();
    }, 0);
  };
  beginNarrative(`【商店】${data.name}。${data.desc}`, showShopChoices, {
    className: "system",
  });
  return true;
}

function randomAfterMove(avoidsEncounter = false) {
  const outcome = pickMoveOutcome();
  if (outcome === "none") {
    addLine(pick(currentEnvLines()));
  } else if (outcome === "event") {
    triggerRandomEvent();
  } else if (avoidsEncounter) {
    addLine("隐匿之尘未散，暗处的邪影绕路而去。", "system");
  } else {
    // 变量：enemy，当前战斗或待生成的敌人对象。
    const enemy = selectRandomEnemy(currentDungeon().id, state.step);
    if (!enemy) {
      addLine(pick(currentEnvLines()));
      render();
      return;
    }
    startBattle(enemy, false);
  }
  render();
}

function currentEnvLines() {
  const step = state.step || 0;
  const stagedLines = (currentDungeon()?.envLines || [])
    .filter((line) => isStepAvailable(line, step))
    .map((line) => line.text)
    .filter(Boolean);
  if (stagedLines.length) return stagedLines;
  return ["前路仍在风里延伸。"];
}

function triggerRandomEvent() {
  // 变量：eventPool，当前副本可抽取的随机事件列表。
  const eventPool = [
    ...dungeonEventPool(),
    ...skillEventPool(),
  ].filter((eventData) => isStepAvailable(eventData, state.step || 0));
  // 变量：eventData，当前固定或随机事件配置，包含文本、选项、奖励和插图。
  const eventData = weightedPick(eventPool);
  if (!eventData) {
    addLine(pick(currentEnvLines()));
    render();
    return;
  }
  if (!useEventModal()) {
    triggerRandomEventInline(eventData);
    return;
  }
  if (eventData.kind === "result") {
    openEventModal(eventData, {
      confirm: () => {
        // 变量：msg，事件、道具或战斗流程返回的提示文本。
        const msg = eventData.effect(state);
        if (msg) addLine(msg, "reward");
        $("eventResult").textContent = msg || "事件已发生。";
        $("eventResult").classList.add("active");
        activeEventModal.confirm = () => {
          state.mode = "free";
          closeEventModal();
          checkPlayerAlive();
          render();
        };
        render();
      },
    });
  } else {
    openEventModal(eventData);
  }
}

function isStepAvailable(entry, step) {
  if (!entry) return false;
  if (Number.isFinite(entry.minStep) && step < entry.minStep) return false;
  if (Number.isFinite(entry.maxStep) && step > entry.maxStep) return false;
  return true;
}

function dungeonEventPool(dungeon = currentDungeon()) {
  return (dungeon?.eventTable || [])
    .map((entry) => {
      const eventData = EVENT_DB?.[entry.eventId];
      return eventData ? { ...eventData, ...entry } : null;
    })
    .filter(Boolean);
}

function useEventModal() {
  return state.settings?.eventModal !== false;
}

function triggerRandomEventInline(eventData) {
  if (eventData.kind === "result") {
    addLine(`【事件】${eventData.text}`, "warn");
    // 变量：msg，事件、道具或战斗流程返回的提示文本。
    const msg = eventData.effect(state);
    if (msg) addLine(msg, "reward");
    checkPlayerAlive();
    render();
    return;
  }
  state.mode = "event";
  addLine(`【事件】${eventData.text}`, "warn");
  setActions([]);
  setChoices(
    eventData.choices.map((c) => ({
      label: c[0],
      disabled: typeof c[2] === "function" ? c[2](state) : !!c[2],
      preview: eventChoicePreview(c),
      onClick: () => {
        // 变量：msg，事件、道具或战斗流程返回的提示文本。
        const msg = c[1](state);
        if (msg) addLine(msg, "reward");
        state.mode = "free";
        setChoices([]);
        checkPlayerAlive();
        render();
      },
    })),
  );
}

function openEventModal(eventData, options = {}) {
  state.mode = "event";
  addLine(`【事件】${eventData.name}：${eventData.text}`, "warn");
  setActions([]);
  setChoices([]);
  activeEventModal = { event: eventData, confirm: options.confirm || null };
  const eventModal = $("eventModal");
  const isResultEventModal = eventData.presentation === "result-event" || eventData.presentation === "guild-rumor";
  eventModal?.classList.toggle("event-modal--result-event", isResultEventModal);
  eventModal?.classList.remove("event-modal--guild-rumor");
  if ($("eventKickerText")) $("eventKickerText").textContent = eventData.kicker || "随机事件";
  $("eventTitle").textContent = eventData.name || "事件";
  $("eventText").textContent = eventData.text;
  setEventIllustration(eventData.illustration, eventData.name || "事件插画");
  $("eventResult").textContent = "";
  $("eventResult").classList.remove("active");
  $("eventChoices").innerHTML = "";
  $("eventConfirm").textContent = options.confirmLabel || eventData.confirmLabel || "确认";
  $("eventConfirm").style.display = eventData.kind === "result" ? "" : "none";
  if (eventData.kind === "choice") {
    eventData.choices.forEach((choice) => {
      // 变量：disabled，当前选项或按钮是否禁用的判定结果。
      const disabled =
        typeof choice[2] === "function" ? choice[2](state) : !!choice[2];
      const buttonConfig = {
        label: choice[0],
        preview: eventChoicePreview(choice),
        onClick: () => resolveEventChoice(choice),
        className: "primary",
        disabled,
      };
      $("eventChoices").appendChild(
        buttonConfig.preview
          ? makeChoicePreviewButton(buttonConfig)
          : makeButton(
              choice[0],
              () => resolveEventChoice(choice),
              "primary",
              disabled,
            ),
      );
    });
  }
  $("eventModal").classList.add("active");
  render();
}

function resolveEventChoice(choice) {
  if (!activeEventModal) return;
  addLine(`【选择】${choice[0]}`, "system");
  // 变量：msg，事件、道具或战斗流程返回的提示文本。
  const msg = choice[1](state);
  if (msg) {
    addLine(msg, "reward");
    $("eventResult").textContent = msg;
    $("eventResult").classList.add("active");
  } else {
    $("eventResult").textContent = "事件已发生。";
    $("eventResult").classList.add("active");
  }
  $("eventChoices").innerHTML = "";
  $("eventConfirm").style.display = "";
  activeEventModal.confirm = () => {
    state.mode = "free";
    closeEventModal();
    checkPlayerAlive();
    render();
  };
  render();
}

function confirmEventModal() {
  if (!activeEventModal?.confirm) return;
  activeEventModal.confirm();
}

function closeEventModal() {
  $("eventModal")?.classList.remove("active", "event-modal--result-event", "event-modal--guild-rumor");
  activeEventModal = null;
}

function resultEvent(name, text, effect, illustration) {
  return {
    kind: "result",
    name,
    text,
    effect,
    illustration: illustration || window.EVENT_DEFAULT_ILLUST,
  };
}
function choiceEvent(name, text, choices, illustration) {
  return {
    kind: "choice",
    name,
    text,
    choices,
    illustration: illustration || window.EVENT_DEFAULT_ILLUST,
  };
}

function trainingCheck(s, chance, success, fail) {
  if (Math.random() < chance) return success(s);
  return fail(s);
}

function skillEventPool() {
  return RANDOM_EVENTS.commonSkills || [];
}

function eventChoicePreview(choice) {
  return "";
  if (typeof choice?.[1] !== "function") return "";
  // 变量：snapshot，当前状态快照，用于比较试算前后的变化。
  const snapshot = cloneForPreview(state);
  // 变量：previewState，试算用状态，绝不写回真实存档。
  const previewState = cloneForPreview(state);
  // 变量：originalRandom，预览时临时保存真实随机函数。
  const originalRandom = Math.random;
  previewingOutcome = true;
  Math.random = () => 0.42;
  try {
    // 变量：message，试算执行选项后返回的结果文本。
    const message = choice[1](previewState);
    // 变量：summary，预兆之眼展示给玩家的自然预见文案。
    const summary = summarizePreviewOutcome(snapshot, previewState, message);
    return summary ? `预兆之眼：${summary}` : "预兆之眼：四周暂时平静，没有明显变化。";
  } catch (error) {
    return "预兆之眼：雾气遮住了前路，只能看见风险未定。";
  } finally {
    Math.random = originalRandom;
    previewingOutcome = false;
  }
}


const EVENT_EXISTING_ILLUST = new Set([
  "assets/event/default.png",
  "assets/event/town/secret.png",
  "assets/event/town/barwhisper.png",
  "assets/event/town/dead.png",
  "assets/event/town/dice.png",
  "assets/event/town/drink.png",
  "assets/event/town/fire-healthy.png",
  "assets/event/town/fixed.png",
  "assets/event/town/job-done.png",
  "assets/event/town/skill-learned.png",
  "assets/event/town/skill-learned-up.png",
  "assets/ui/settlements/oak-town-equipment-shop.png",
  "assets/ui/settlements/oak-town-skill-train.png",
  "assets/ui/settlements/oak-town-job.png",
]);

function normalizeEventIllustPath(src) {
  return String(src || "")
    .replace(/\\/g, "/")
    .replace(/^\.\//, "");
}

function setEventIllustration(src, alt) {
  // 变量：img，事件弹窗中的插画节点；若指定图片不存在，会自动回退到默认图。
  const img = $("eventIllust");
  const fallback = window.EVENT_DEFAULT_ILLUST || "assets/event/default.png";
  const normalizedSrc = normalizeEventIllustPath(src);
  const safeSrc = EVENT_EXISTING_ILLUST.has(normalizedSrc) ? normalizedSrc : fallback;
  img.onerror = () => {
    if (img.src.endsWith(fallback)) return;
    img.onerror = null;
    img.src = fallback;
  };
  img.src = safeSrc;
  img.alt = alt || "事件插画";
}

function cloneForPreview(value) {
  return JSON.parse(JSON.stringify(value));
}

function summarizePreviewOutcome(before, after, message) {
  // 变量：parts，技能提示文本片段列表。
  const parts = [];
  if (message) parts.push(String(message));
  addDeltaPreview(parts, "HP", after.player.hp - before.player.hp);
  addDeltaPreview(parts, "最大HP", after.player.maxHp - before.player.maxHp);
  addDeltaPreview(parts, "攻击", after.player.baseAtk - before.player.baseAtk);
  addDeltaPreview(parts, "免伤", after.player.baseDamageReduction - before.player.baseDamageReduction);
  addDeltaPreview(parts, "速度", (after.player.baseSpeed || 12) - (before.player.baseSpeed || 12));
  addDeltaPreview(parts, "金币", after.gold - before.gold);
  addDeltaPreview(parts, "时间", after.timeLeft - before.timeLeft);
  addDeltaPreview(parts, "避战步数", (after.avoidEncounters || 0) - (before.avoidEncounters || 0));
  previewInventoryChanges(parts, before.inventory || {}, after.inventory || {});
  previewStatusChanges(parts, before.player.statuses || {}, after.player.statuses || {});
  previewSkillChanges(parts, before.player.skills || {}, after.player.skills || {});
  return [...new Set(parts.filter(Boolean))].slice(0, 3).join("|");
}

function addDeltaPreview(parts, label, delta) {
  if (!delta) return;
  parts.push(`${label} ${delta > 0 ? "+" : ""}${delta}`);
}

function previewInventoryChanges(parts, before, after) {
  Object.keys({ ...before, ...after }).forEach((id) => {
    // 变量：delta，变化前后数值差，用于生成预兆之眼预览。
    const delta = (after[id] || 0) - (before[id] || 0);
    if (!delta) return;
    parts.push(`${ITEM_DB[id]?.name || id} ${delta > 0 ? "+" : ""}${delta}`);
  });
}

function previewStatusChanges(parts, before, after) {
  Object.keys(after).forEach((id) => {
    if (before[id]) return;
    parts.push(`获得${STATUS_DB[id]?.name || id}`);
  });
  Object.keys(before).forEach((id) => {
    if (after[id]) return;
    parts.push(`解除${STATUS_DB[id]?.name || id}`);
  });
}

function previewSkillChanges(parts, before, after) {
  Object.keys(after).forEach((id) => {
    if (before[id] === after[id]) return;
    // 变量：skill，当前施放的技能配置。
    const skill = PLAYER_SKILLS[id];
    if (!skill) return;
    parts.push(before[id] ? `${skill.name} Lv.${after[id]}` : `学会${skill.name}`);
  });
}

function learnSkillByChance(s, id, chance, successText, fail) {
  s.player.skills = s.player.skills || {};
  if (
    Array.isArray(s.player.skills)
      ? s.player.skills.includes(id)
      : id in s.player.skills
  )
    return fail(s, true);
  if (Math.random() < chance) {
    addSkill(s, id);
    return successText;
  }
  return fail(s, false);
}

function tickAvoidEncounterStep() {
  if ((state.avoidEncounters || 0) <= 0) return false;
  state.avoidEncounters = Math.max(0, state.avoidEncounters - 1);
  return true;
}
