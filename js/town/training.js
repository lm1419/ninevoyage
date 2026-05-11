function playerSkillLevel(id) {
  const skills = state.player.skills || {};
  if (Array.isArray(skills)) return skills.includes(id) ? 1 : 0;
  return Number(skills[id] || 0);
}

function playerKnowsSkill(id) {
  return playerSkillLevel(id) > 0;
}

function allySkillLabel(id) {
  return PLAYER_SKILLS[id]?.name || id;
}

function allyLearnSkillMeta(entry) {
  if (playerKnowsSkill(entry.id)) return "已经会了";
  return "纳费受训";
}

function allyTrainSkillMeta(id) {
  const level = playerSkillLevel(id);
  if (!level) return "尚未入门";
  if (level >= 2) return "已是熟手";
  return "闭营苦练";
}

function allySkillEffectText(id, level = 1) {
  const skill = PLAYER_SKILLS[id];
  if (!skill) return "";
  if (skill.passive) return skill.desc || "被动本领生效";
  const levelInfo = Array.isArray(skill.levels) ? skill.levels[Math.max(0, level - 1)] : null;
  return levelInfo?.desc || skill.desc || "战斗本领生效";
}

function openAllyTrainingSkillResultModal({
  title,
  desc,
  illustration,
  resultText,
  resultChoiceLabel,
  logTone = "reward",
}) {
  if (typeof openResultEventModal !== "function") {
    addLine(resultText, logTone);
    render();
    return;
  }
  openResultEventModal({
    kicker: "训练场",
    title,
    desc,
    illustration: illustration || "assets/event/town/skill-learned.png",
    result: () => resultText,
    resultChoiceLabel,
    emptyResultText: "教头收起木剑，今日训练已经结束。",
    closeMode: "ally",
    logTone,
  });
}

function learnAllyTrainingSkill(id) {
  const entry = allyTrainingSkills().find((item) => item.id === id);
  const skill = PLAYER_SKILLS[id];
  if (!entry || !skill) return;
  if (playerKnowsSkill(id)) {
    addLine(`「${skill.name}」早已刻进你的身手里，教头只挥挥手让你别挡住木桩。`, "system");
    render();
    return;
  }
  if (state.gold < entry.learnCost) {
    addLine(`钱袋太轻，想让教头传授「${skill.name}」需要 ${entry.learnCost} 金。`, "warn");
    render();
    return;
  }
  const timeCost = townTimeCostEntry(`learn-skill-${id}`);
  openAdventureConfirmModal({
    kicker: "训练场",
    title: `学习「${skill.name}」？`,
    desc: "支付学费并花费时间，学习一门新的战斗技能。",
    costs: [
      { label: "学费", value: `${entry.learnCost} 金`, tone: "warn" },
      timeCost,
    ].filter(Boolean),
    rewards: [
      { label: "习得技能", value: skill.name, tone: "reward" },
      { label: "初学效果", value: allySkillEffectText(id, 1), tone: "reward" },
    ],
    status: [
      { label: "当前金币", value: `${state.gold} 金` },
      { label: "学习后金币", value: `${Math.round((state.gold - entry.learnCost) * 10) / 10} 金` },
      { label: "当前掌握", value: "尚未入门" },
    ],
    cancelLabel: "再想想",
    confirmLabel: "支付学费",
    onConfirm: () => performLearnAllyTrainingSkill(id),
  });
}

function performLearnAllyTrainingSkill(id) {
  const entry = allyTrainingSkills().find((item) => item.id === id);
  const skill = PLAYER_SKILLS[id];
  if (!entry || !skill) return;
  if (playerKnowsSkill(id)) {
    addLine(`「${skill.name}」早已刻进你的身手里，教头只挥挥手让你别挡住木桩。`, "system");
    render();
    return;
  }
  if (state.gold < entry.learnCost) {
    addLine(`钱袋太轻，想让教头传授「${skill.name}」需要 ${entry.learnCost} 金。`, "warn");
    render();
    return;
  }
  const learningDays = townTimeActionDays(`learn-skill-${id}`);
  state.gold -= entry.learnCost;
  addSkill(state, id);
  const timeResult = advanceTownDate(learningDays, `在校场学习「${skill.name}」`);
  const resultText = `你向教头交出 ${entry.learnCost} 金学费，花了 ${learningDays} 天学会「${skill.name}」。${allySkillEffectText(id, 1)}`;
  afterTownTimeFlow(timeResult, () => {
    openAllyTrainingSkillResultModal({
      title: `学会「${skill.name}」`,
      desc: "训练结束后，你已经掌握这门技能的基础用法。",
      illustration: "assets/event/town/skill-learned.png",
      resultText,
      resultChoiceLabel: "学习结果",
      logTone: "reward",
    });
  });
}

function trainAllyTrainingSkill(id) {
  const skill = PLAYER_SKILLS[id];
  if (!skill) return;
  const trainCost = Math.max(0, Number((typeof townTrainingConfig === "function" ? townTrainingConfig() : {}).trainCost) || 120);
  const level = playerSkillLevel(id);
  if (!level) {
    addLine(`你尚未入门「${skill.name}」，教头不肯让你白白挨打。`, "warn");
    render();
    return;
  }
  if (level >= 2) {
    addLine(`「${skill.name}」已经练到熟手，继续在校场磨下去只会磨坏木剑。`, "system");
    render();
    return;
  }
  if (state.gold < trainCost) {
    addLine(`钱袋太轻，闭营苦练「${skill.name}」需要 ${trainCost} 金学费。`, "warn");
    render();
    return;
  }
  const timeCost = townTimeCostEntry(`train-skill-${id}`, { level });
  openAdventureConfirmModal({
    kicker: "训练场",
    title: `苦练「${skill.name}」？`,
    desc: `支付学费并花费 ${townTimeActionDays(`train-skill-${id}`, { level })} 天训练，将这个技能提升到 Lv.2。`,
    costs: [
      { label: "学费", value: `${trainCost} 金`, tone: "warn" },
      timeCost,
    ].filter(Boolean),
    rewards: [
      { label: "技能等级", value: `Lv.${level} → Lv.2`, tone: "reward" },
      { label: "熟练效果", value: allySkillEffectText(id, 2), tone: "reward" },
    ],
    status: [
      { label: "当前金币", value: `${state.gold} 金` },
      { label: "训练后金币", value: `${Math.round((state.gold - trainCost) * 10) / 10} 金` },
      {
        label: "当前日期",
        value: typeof calendarDateText === "function" ? calendarDateText() : "今日",
      },
    ],
    cancelLabel: "暂不苦练",
    confirmLabel: "开始训练",
    onConfirm: () => performTrainAllyTrainingSkill(id),
  });
}

function performTrainAllyTrainingSkill(id) {
  const skill = PLAYER_SKILLS[id];
  if (!skill) return;
  const trainCost = Math.max(0, Number((typeof townTrainingConfig === "function" ? townTrainingConfig() : {}).trainCost) || 120);
  const level = playerSkillLevel(id);
  if (!level) {
    addLine(`你尚未入门「${skill.name}」，教头不肯让你白白挨打。`, "warn");
    render();
    return;
  }
  if (level >= 2) {
    addLine(`「${skill.name}」已经练到熟手，继续在校场磨下去只会磨坏木剑。`, "system");
    render();
    return;
  }
  if (state.gold < trainCost) {
    addLine(`钱袋太轻，闭营苦练「${skill.name}」需要 ${trainCost} 金学费。`, "warn");
    render();
    return;
  }
  state.gold -= trainCost;
  state.player.skills = state.player.skills || {};
  if (Array.isArray(state.player.skills)) {
    const next = {};
    state.player.skills.forEach((sid) => {
      next[sid] = sid === id ? 2 : 1;
    });
    state.player.skills = next;
  } else {
    state.player.skills[id] = 2;
  }
  const timeResult = advanceTownDate(townTimeActionDays(`train-skill-${id}`, { level }), `在校场苦练「${skill.name}」`);
  const trainDays = townTimeActionDays(`train-skill-${id}`, { level });
  const resultText = `${trainDays} 日尘土与木剑之后，「${skill.name}」终于练到熟手。学费支出 ${trainCost} 金。${allySkillEffectText(id, 2)}`;
  afterTownTimeFlow(timeResult, () => {
    openAllyTrainingSkillResultModal({
      title: `「${skill.name}」升至 Lv.2`,
      desc: "训练完成后，这门技能已经提升到更熟练的等级。",
      illustration: "assets/event/town/skill-learned-up.png",
      resultText,
      resultChoiceLabel: "训练结果",
      logTone: "reward",
    });
  });
}
