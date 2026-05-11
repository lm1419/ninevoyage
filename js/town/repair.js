function allyRepairTargets(scope) {
  const ids = scope === "equipped"
    ? [state.equipments?.weapon, state.equipments?.armor].filter(Boolean)
    : [...new Set(state.ownedEquip || [])];
  return ids
    .map((id) => {
      const equipment = getEquipment(id);
      if (!equipment?.durability) return null;
      const current = equipmentDurabilityValue(id);
      const missing = Math.max(0, equipment.durability - current);
      return { id, equipment, current, missing };
    })
    .filter((entry) => entry && entry.missing > 0);
}

function allyRepairCost(scope) {
  const missing = allyRepairTargets(scope).reduce((sum, entry) => sum + entry.missing, 0);
  return missing * 0.5;
}

function formatRepairGold(cost) {
  return Number.isInteger(cost) ? String(cost) : cost.toFixed(1);
}

function allyRepairMeta(scope) {
  const targets = allyRepairTargets(scope);
  if (!targets.length) return "无需修补";
  const missing = targets.reduce((sum, entry) => sum + entry.missing, 0);
  return `裂痕 ${missing} · ${formatRepairGold(missing * 0.5)} 金`;
}

function repairAllyEquipment(scope) {
  const targets = allyRepairTargets(scope);
  if (!targets.length) {
    addLine(scope === "equipped" ? "铁匠扫了一眼你身上的披挂：尚且结实，不必动火。" : "行囊里没有需要上铆钉的兵甲。", "system");
    render();
    return;
  }
  const totalMissing = targets.reduce((sum, entry) => sum + entry.missing, 0);
  const cost = totalMissing * 0.5;
  if (state.gold < cost) {
    addLine(`钱袋太轻，铁匠要 ${formatRepairGold(cost)} 金才肯动锤。`, "warn");
    render();
    return;
  }
  openAdventureConfirmModal({
    kicker: "铁匠铺",
    title: scope === "equipped" ? "修补身上披挂？" : "修整全部行装？",
    desc: scope === "equipped"
      ? "只修理当前穿戴的武器和护甲。确认后会支付修理费并推进日期。"
      : "修理背包里所有受损装备。确认后会支付修理费并推进日期。",
    costs: [
      { label: "修理费", value: `${formatRepairGold(cost)} 金`, tone: "warn" },
      townTimeCostEntry(scope === "equipped" ? "repair-equipped" : "repair-all", {}, "耗时"),
    ].filter(Boolean),
    rewards: [
      { label: "修复装备", value: `${targets.length} 件`, tone: "reward" },
      { label: "补回裂痕", value: `${totalMissing}`, tone: "reward" },
    ],
    status: [
      { label: "当前金币", value: `${state.gold} 金` },
      { label: "修后金币", value: `${formatRepairGold(Math.round((state.gold - cost) * 10) / 10)} 金` },
      { label: "当前日期", value: typeof calendarDateText === "function" ? calendarDateText() : "今日" },
    ],
    cancelLabel: "先不修",
    confirmLabel: "交给铁匠",
    onConfirm: () => performRepairAllyEquipment(scope),
  });
}

function performRepairAllyEquipment(scope) {
  const targets = allyRepairTargets(scope);
  if (!targets.length) {
    addLine(scope === "equipped" ? "铁匠扫了一眼你身上的披挂：尚且结实，不必动火。" : "行囊里没有需要上铆钉的兵甲。", "system");
    render();
    return;
  }
  const totalMissing = targets.reduce((sum, entry) => sum + entry.missing, 0);
  const cost = totalMissing * 0.5;
  if (state.gold < cost) {
    addLine(`钱袋太轻，铁匠要 ${formatRepairGold(cost)} 金才肯动锤。`, "warn");
    render();
    return;
  }
  state.gold = Math.round((state.gold - cost) * 10) / 10;
  state.equipmentDurability = state.equipmentDurability || {};
  targets.forEach(({ id, equipment }) => {
    state.equipmentDurability[id] = equipment.durability;
  });
  const actionId = scope === "equipped" ? "repair-equipped" : "repair-all";
  const timeResult = advanceTownDate(townTimeActionDays(actionId), scope === "equipped" ? "修补身上披挂" : "修整整副行装");
  const resultText = `铁匠修好 ${targets.length} 件兵甲，补回裂痕 ${totalMissing}，收取 ${formatRepairGold(cost)} 金。`;
  afterTownTimeFlow(timeResult, () => {
    if (typeof openResultEventModal !== "function") {
      addLine(resultText, "reward");
      render();
      return;
    }
    openResultEventModal({
      kicker: "铁匠铺",
      title: scope === "equipped" ? "披挂修补完毕" : "行装修整完毕",
      desc: "装备耐久已经修复，可以继续用于远征。",
      illustration: "assets/event/town/fixed.png",
      result: () => resultText,
      resultChoiceLabel: "修理结果",
      emptyResultText: "铁匠已经收工。",
      closeMode: "ally",
      logTone: "reward",
    });
  });
}
