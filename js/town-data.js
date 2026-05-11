const DEFAULT_TOWN_ID = "oak_town";

function allTowns() {
  return window.TOWN_DATA || {};
}

function getTown(townId = DEFAULT_TOWN_ID) {
  const id = String(townId || DEFAULT_TOWN_ID);
  return allTowns()[id] || allTowns()[DEFAULT_TOWN_ID] || null;
}

function currentTownId() {
  return (typeof state !== "undefined" && state?.allyTownId) || DEFAULT_TOWN_ID;
}

function currentTown() {
  return getTown(currentTownId());
}

function currentTownTitle() {
  return currentTown()?.title || "橡树小镇";
}

function currentTownSceneKey() {
  const town = currentTown();
  return town?.sceneKey || town?.title || "橡树小镇";
}

function townIntroText(kind, townId = currentTownId()) {
  const intro = getTown(townId)?.intro || {};
  return intro[kind] || "";
}

function townFacilities(townId = currentTownId()) {
  return [...(getTown(townId)?.facilities || [])];
}

function townDetail(focus = state?.allyFocus, townId = currentTownId()) {
  const town = getTown(townId);
  const details = town?.details || {};
  return details[focus] || details.root || {
    kicker: "小镇",
    title: town?.title || "小镇",
    desc: "这里是远征前的准备区。",
  };
}

function townVisualFocus(focus = state?.allyFocus, townId = currentTownId()) {
  const town = getTown(townId);
  return town?.visualFocusMap?.[focus] || focus || "root";
}

function townVisualConfig(focus = state?.allyFocus, townId = currentTownId()) {
  const town = getTown(townId);
  const visualFocus = townVisualFocus(focus, townId);
  return town?.visuals?.[visualFocus] || town?.visuals?.root || null;
}

function townActionDefs(focus = state?.allyFocus, townId = currentTownId()) {
  const town = getTown(townId);
  return [...(town?.actions?.[focus] || [])];
}

function townActionDef(actionId, townId = currentTownId()) {
  const groups = getTown(townId)?.actions || {};
  return Object.values(groups)
    .flat()
    .find((entry) => entry?.id === actionId) || null;
}

function townTimeConfig(townId = currentTownId()) {
  return getTown(townId)?.time || {};
}

function townTrainingConfig(townId = currentTownId()) {
  return getTown(townId)?.training || {};
}

function townTrainingSkills(townId = currentTownId()) {
  return [...(townTrainingConfig(townId).skills || [])];
}

function townWorkConfig(townId = currentTownId()) {
  return getTown(townId)?.work || {};
}

function townWorkJobs(townId = currentTownId()) {
  return townWorkConfig(townId).jobs || {};
}

function townShopConfig(role, townId = currentTownId()) {
  return getTown(townId)?.shops?.[role] || null;
}

function townGuildReportData(townId = currentTownId()) {
  return [...(getTown(townId)?.guildReports || [])];
}

function townTavernRumorData(townId = currentTownId()) {
  return [...(getTown(townId)?.tavernRumors || [])];
}

function townDungeonIds(townId = currentTownId()) {
  const town = getTown(townId);
  return [...(town?.dungeonIds || DUNGEON_META?.towns?.[townId]?.dungeonIds || [])];
}

function townWorkMonthKey(calendar = (typeof state !== "undefined" ? state?.calendar : null)) {
  const parts = typeof calendarParts === "function" ? calendarParts(calendar) : null;
  if (parts) return `${parts.year}-${String(parts.month).padStart(2, "0")}`;
  const elapsed = Math.max(0, Math.floor(Number(calendar?.elapsedDays) || 0));
  return `m${Math.floor(elapsed / DAYS_PER_MONTH)}`;
}

function townMonthlyStateBucket(rootKey, townId = currentTownId()) {
  state[rootKey] = state[rootKey] || {};
  const id = townId || DEFAULT_TOWN_ID;
  state[rootKey][id] = state[rootKey][id] || {};
  return state[rootKey][id];
}
