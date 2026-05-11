function pickMonthlyGuildRumorId(monthKey) {
  const available = guildReports().filter(Boolean);
  if (!available.length) return "";
  let seed = 0;
  String(monthKey || "").split("").forEach((char) => {
    seed = (seed * 31 + char.charCodeAt(0)) >>> 0;
  });
  seed = (seed + Math.floor(Math.random() * available.length)) % available.length;
  return available[seed]?.id || available[0].id;
}

function ensureMonthlyGuildRumor() {
  const townId = typeof currentTownId === "function" ? currentTownId() : "oak_town";
  const monthKey = townWorkMonthKey();
  const reports = guildReports();
  state.monthlyGuildRumor = state.monthlyGuildRumor || {};
  if (state.monthlyGuildRumor.reportId) {
    state.monthlyGuildRumor = { [townId]: state.monthlyGuildRumor };
  }
  const current = state.monthlyGuildRumor[townId];
  if (current?.monthKey === monthKey && current.reportId) {
    return reports.find((report) => report.id === current.reportId) || reports[0];
  }
  const reportId = pickMonthlyGuildRumorId(monthKey);
  state.monthlyGuildRumor[townId] = { monthKey, reportId };
  return reports.find((report) => report.id === reportId) || reports[0];
}

function pickMonthlyTownBarRumorId(monthKey) {
  const available = townBarRumors().filter(Boolean);
  if (!available.length) return "";
  let seed = 0;
  String(monthKey || "").split("").forEach((char) => {
    seed = (seed * 31 + char.charCodeAt(0)) >>> 0;
  });
  seed = (seed + Math.floor(Math.random() * available.length)) % available.length;
  return available[seed]?.id || available[0].id;
}

function ensureMonthlyTownBarRumor() {
  const townId = typeof currentTownId === "function" ? currentTownId() : "oak_town";
  const monthKey = townWorkMonthKey();
  const rumors = townBarRumors();
  state.monthlyTownBarRumor = state.monthlyTownBarRumor || {};
  if (state.monthlyTownBarRumor.rumorId) {
    state.monthlyTownBarRumor = { [townId]: state.monthlyTownBarRumor };
  }
  const current = state.monthlyTownBarRumor[townId];
  if (current?.monthKey === monthKey && current.rumorId) {
    const known = rumors.find((rumor) => rumor.id === current.rumorId) || rumors[0];
    return current.result
      ? { ...known, result: current.result }
      : known;
  }
  const rumorId = pickMonthlyTownBarRumorId(monthKey);
  const rumor = rumors.find((entry) => entry.id === rumorId) || rumors[0];
  state.monthlyTownBarRumor[townId] = { monthKey, rumorId: rumor?.id || "", result: rumor?.result || "" };
  return rumor;
}

function townBarRumors() {
  return [
    ...(currentDungeon()?.tavernRumors || []),
    ...(typeof townTavernRumorData === "function" ? townTavernRumorData() : []),
  ];
}

function guildReports() {
  return [
    ...(currentDungeon()?.guildReports || []),
    ...(typeof townGuildReportData === "function" ? townGuildReportData() : []),
  ];
}

function hearTownBarRumor() {
  const rumor = ensureMonthlyTownBarRumor();
  if (!rumor) return;
  if (typeof openResultEventModal !== "function") {
    addLine(`【${rumor.title || "吧台耳语"}】${rumor.result}`, "system");
    render();
    return;
  }
  openResultEventModal({
    kicker: "橡木酒馆",
    title: rumor.title || "吧台耳语",
    desc: `${rumor.text || "你靠在吧台边听了一会儿。"} 这条耳语每个月刷新一次，本月内容会保持不变。`,
    illustration: "assets/event/town/barwhisper.png",
    result: () => rumor.result,
    resultChoiceLabel: "吧台耳语",
    emptyResultText: "吧台今晚没有新的耳语。",
    closeMode: "ally",
    logTone: "system",
  });
}

function openGuildRumorEvent() {
  const report = ensureMonthlyGuildRumor();
  if (!report) return;
  if (typeof openResultEventModal !== "function") {
    addLine(`【${report.name}】${report.result}`, "system");
    render();
    return;
  }
  openResultEventModal({
    kicker: "行会密报",
    title: report.name,
    desc: `${report.text} 这份密报每个月刷新一次，本月内容会保持不变。`,
    illustration: report.illustration || "assets/event/town/secret.png",
    result: () => report.result,
    resultChoiceLabel: "密报内容",
    emptyResultText: "密报已经读完。",
    closeMode: "ally",
    logTone: "system",
  });
}
