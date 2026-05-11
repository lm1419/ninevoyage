function ensureMonthlyTownJobs() {
  const townId = typeof currentTownId === "function" ? currentTownId() : "oak_town";
  const workConfig = typeof townWorkConfig === "function" ? townWorkConfig(townId) : {};
  const requiredIds = workConfig.requiredIds || [];
  const randomIds = workConfig.randomIds || [];
  const randomCount = Math.max(0, Math.floor(Number(workConfig.randomCount) || 0));
  state.monthlyTownJobs = state.monthlyTownJobs || {};
  const monthKey = townWorkMonthKey();
  const current = state.monthlyTownJobs[townId];
  const expectedCount = requiredIds.length + randomCount;
  if (current?.monthKey === monthKey && Array.isArray(current.jobIds) && current.jobIds.length === expectedCount) {
    return current.jobIds;
  }
  const pool = [...randomIds];
  for (let i = pool.length - 1; i > 0; i -= 1) {
    const j = Math.min(i, Math.floor(Math.random() * (i + 1)));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  const jobIds = [...requiredIds, ...pool.slice(0, randomCount)];
  state.monthlyTownJobs[townId] = { monthKey, jobIds };
  return jobIds;
}

function formatTownGold(value) {
  const amount = Number(value) || 0;
  return Number.isInteger(amount) ? String(amount) : amount.toFixed(1);
}

function townWorkRestriction(job) {
  if (job.minLevel && (state.player.level || 1) < job.minLevel) return `需要 Lv.${job.minLevel}`;
  if (job.minHp && (state.player.hp || 0) < job.minHp) return `HP 需至少 ${job.minHp}`;
  return "";
}

function townWorkSubtitle(job) {
  const notes = [`${job.duration} 天`, `${formatTownGold(job.rewardGold)} 金`];
  if (job.minLevel) notes.push(`Lv.${job.minLevel}+`);
  if (job.minHp) notes.push(`HP ${job.minHp}+`);
  return notes.join(" · ");
}

function townWorkHelpText(job) {
  const parts = [
    `耗时 ${job.duration} 天，完成后获得 ${formatTownGold(job.rewardGold)} 金。`,
  ];
  if (job.minLevel) parts.push(`需要角色等级达到 Lv.${job.minLevel}。`);
  if (job.minHp) parts.push(`需要当前 HP 至少 ${job.minHp}。`);
  if (job.bonusItem) {
    const itemName = ITEM_DB[job.bonusItem]?.name || "额外物品";
    parts.push(`完成时有机会获得 ${itemName}。`);
  }
  return parts.join(" ");
}

function townWorkBoardActions() {
  const jobIds = ensureMonthlyTownJobs();
  const jobs = typeof townWorkJobs === "function" ? townWorkJobs() : {};
  return jobIds.filter((id) => jobs[id]).map((id) => {
    const job = jobs[id];
    const disabledReason = townWorkRestriction(job);
    return {
      id: `work-job-${id}`,
      label: job.name,
      meta: disabledReason || townWorkSubtitle(job),
      timeCost: job.duration,
      rewardGold: job.rewardGold,
      disabled: !!disabledReason,
      mark: job.mark,
      help: townWorkHelpText(job),
    };
  });
}

function townWorkCostEntries(job) {
  const costs = [
    { label: "时间", value: `耗去 ${job.duration} 天`, tone: "warn" },
  ];
  return costs;
}

function townWorkRewardEntries(job) {
  const rewards = [
    { label: "完工酬金", value: `${formatTownGold(job.rewardGold)} 金`, tone: "reward" },
  ];
  if (job.bonusItem && job.bonusItemChance) {
    const itemName = ITEM_DB[job.bonusItem]?.name || "额外物品";
    rewards.push({ label: "可能奖励", value: itemName, tone: "reward" });
  }
  return rewards;
}

function townWorkEnemy(job) {
  const enemy = getEnemy(job.risk.enemyId);
  const level = clamp(Number(state.player.level) || 1, 1, ENEMY_LEVEL_CONFIG.maxLevel || 50);
  return {
    ...enemy,
    fixedLevel: level,
  };
}

function townWorkEncounterLine(job) {
  return job.encounterLine || "商队前方响起尖哨，劫匪从路边冲出。你必须护住货车。";
}

function applyTownWorkDailyEffect(job, workDay) {
  if (job.everyDays && job.hpCost && workDay % job.everyDays === 0) {
    const before = state.player.hp;
    state.player.hp = Math.max(1, before - job.hpCost);
    return (job.dailyEffectLine || "{jobName}第 {workDay} 天：HP -{amount}。")
      .replace("{jobName}", job.name)
      .replace("{workDay}", String(workDay))
      .replace("{amount}", String(before - state.player.hp));
  }
  if (job.scratchChance && Math.random() < job.scratchChance) {
    const before = state.player.hp;
    state.player.hp = Math.max(1, before - (job.scratchDamage || 1));
    return (job.dailyEffectLine || "{jobName}第 {workDay} 天：HP -{amount}。")
      .replace("{jobName}", job.name)
      .replace("{workDay}", String(workDay))
      .replace("{amount}", String(before - state.player.hp));
  }
  return "";
}

function advanceTownWorkDays(job, days, reason) {
  const amount = Math.max(0, Math.floor(Number(days) || 0));
  if (!amount) return { elapsed: 0, encounter: false };
  state.calendar = normalizeCalendar(state.calendar);
  const beforeCalendar = normalizeCalendar(state.calendar);
  const triggered = [];
  let elapsed = 0;
  let encounter = false;
  let transitionDelay = 0;
  const completed = Math.max(0, (job.duration || amount) - (state.activeTownWork?.remainingDays || amount));
  for (let day = 1; day <= amount; day += 1) {
    state.calendar.elapsedDays += 1;
    elapsed += 1;
    const workDay = completed + day;
    const dailyText = applyTownWorkDailyEffect(job, workDay);
    if (dailyText) triggered.push(dailyText);
    const result = runTownDailyCheck({
      day,
      totalDays: amount,
      reason,
      calendar: normalizeCalendar(state.calendar),
    });
    if (Array.isArray(result)) triggered.push(...result.filter(Boolean));
    else if (result) triggered.push(result);
    if (job.risk?.chance && Math.random() < job.risk.chance) {
      encounter = true;
      break;
    }
  }
  if (elapsed > 0) {
    addLine(`【时间】${reason}耗去 ${elapsed} 天，当前：${calendarDateText()}。`, "system");
  }
  triggered.forEach((line) => {
    if (typeof line === "string") addLine(line, "system");
  });
  if (elapsed > 0) {
    transitionDelay = playTownTimeTransition(elapsed, reason, beforeCalendar, state.calendar, {
      force: encounter,
      progressOffset: completed,
      progressTotal: job.duration || amount,
    });
  }
  return { elapsed, encounter, transitionDelay };
}

function startTownWork(jobId) {
  const job = (typeof townWorkJobs === "function" ? townWorkJobs() : {})[jobId];
  if (!job) return;
  const disabledReason = townWorkRestriction(job);
  if (disabledReason) {
    addLine(`暂时不能接「${job.name}」：${disabledReason}。`, "warn");
    render();
    return;
  }
  openAdventureConfirmModal({
    kicker: "工作承接",
    title: `承接「${job.name}」？`,
    desc: townWorkHelpText(job) || "确认后，这份工作会立刻开始推进，完成后领取酬金。",
    costs: townWorkCostEntries(job),
    rewards: townWorkRewardEntries(job),
    status: [
      { label: "当前日期", value: typeof calendarDateText === "function" ? calendarDateText() : "今日" },
      { label: "当前 HP", value: `${state.player.hp}/${state.player.maxHp}` },
      { label: "当前金币", value: `${formatTownGold(state.gold)} 金` },
      { label: "工作时长", value: `${job.duration} 天` },
    ],
    cancelLabel: "暂不承接",
    confirmLabel: "签下委托",
    onConfirm: () => performStartTownWork(jobId),
  });
}

function performStartTownWork(jobId) {
  const job = (typeof townWorkJobs === "function" ? townWorkJobs() : {})[jobId];
  if (!job) return;
  const disabledReason = townWorkRestriction(job);
  if (disabledReason) {
    addLine(`暂时不能接「${job.name}」：${disabledReason}。`, "warn");
    render();
    return;
  }
  state.activeTownWork = { jobId, remainingDays: job.duration };
  addLine(`你从委托板上揭下「${job.name}」，约定做满 ${job.duration} 天，完工酬金 ${formatTownGold(job.rewardGold)} 金。`, "system");
  continueTownWork(jobId);
}

function continueTownWork(jobId) {
  const job = (typeof townWorkJobs === "function" ? townWorkJobs() : {})[jobId];
  if (!job || !state.activeTownWork) return;
  state.mode = "ally";
  state.worldMode = "ally";
  state.fixedSceneVisual = typeof currentTownSceneKey === "function" ? currentTownSceneKey() : "橡树小镇";
  const remaining = Math.max(0, Math.floor(Number(state.activeTownWork.remainingDays) || 0));
  if (!remaining) {
    finishTownWork(job);
    return;
  }
  const result = advanceTownWorkDays(job, remaining, `执行「${job.name}」`);
  state.activeTownWork.remainingDays = Math.max(0, remaining - result.elapsed);
  if (result.encounter) {
    addLine(townWorkEncounterLine({ ...job, id: jobId }), "danger");
    setActions([]);
    setChoices([]);
    document.querySelector(".ally-town-menu")?.remove();
    const beginEncounterBattle = () => startBattle(townWorkEnemy(job), false, {
      special: "townWork",
      noRun: true,
      skipBattleRewards: true,
      settlementText: "【战斗结算】滋事者被压下，没有额外报酬。",
      introText: `【工作冲突】${job.name}遭遇麻烦。`,
      onWin: () => continueTownWork(jobId),
    });
    if (result.transitionDelay > 0) {
      window.setTimeout(beginEncounterBattle, result.transitionDelay);
    } else {
      beginEncounterBattle();
    }
    return;
  }
  if (result.transitionDelay > 0) {
    window.setTimeout(() => finishTownWork(job), result.transitionDelay);
    return;
  }
  finishTownWork(job);
}

function finishTownWork(job) {
  state.activeTownWork = null;
  state.mode = "ally";
  state.gold = Math.round((Number(state.gold || 0) + Number(job.rewardGold || 0)) * 10) / 10;
  const resultLines = [`「${job.name}」完工。行会付给你 ${formatTownGold(job.rewardGold)} 金。`];
  if (job.bonusItem && Math.random() < (job.bonusItemChance || 0)) {
    addItem(state, job.bonusItem, 1);
    resultLines.push(job.bonusLine || "额外奖励已经放入行囊。");
  }
  const resultText = resultLines.join(" ");
  if (typeof openResultEventModal !== "function") {
    addLine(resultText, "reward");
    render();
    return;
  }
  openResultEventModal({
    kicker: "工作结算",
    title: `${job.name}完工`,
    desc: "行会书记员把委托册翻到你的名字，核过天数和签记后，从抽屉里取出这份差事的酬金。",
    illustration: "assets/event/town/job-done.png",
    result: () => resultText,
    resultChoiceLabel: "工作结果",
    emptyResultText: "这份工作已经结清。",
    closeMode: "ally",
    logTone: "reward",
  });
}
