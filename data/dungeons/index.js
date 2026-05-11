// Dungeon metadata. A dungeon belongs to exactly one town; a town can expose many dungeons.
window.DUNGEON_META = {
  towns: Object.fromEntries(Object.entries(window.TOWN_DATA || {}).map(([id, town]) => [
    id,
    { id, title: town.title, dungeonIds: town.dungeonIds || [] },
  ])),
  dungeons: {
    oak01: {
      id: "oak01",
      townId: "oak_town",
      title: "镇外原野",
      summary: "橡树小镇外最早开放的低危远征区域。",
    },
  },
};

window.DUNGEON_REGISTRY = window.DUNGEON_REGISTRY || {};
window.DUNGEONS = window.DUNGEONS || [];

window.registerDungeon = function registerDungeon(dungeon) {
  if (!dungeon?.id) return null;
  const meta = window.DUNGEON_META?.dungeons?.[dungeon.id] || {};
  const normalized = {
    ...meta,
    ...dungeon,
    dungeonId: dungeon.dungeonId || dungeon.id,
    townId: dungeon.townId || meta.townId,
  };
  window.DUNGEON_REGISTRY[normalized.id] = normalized;
  window.DUNGEONS = Object.values(window.DUNGEON_REGISTRY).sort((a, b) => {
    const townA = window.DUNGEON_META?.towns?.[a.townId]?.dungeonIds || [];
    const townB = window.DUNGEON_META?.towns?.[b.townId]?.dungeonIds || [];
    const orderA = townA.includes(a.id) ? townA.indexOf(a.id) : Number.MAX_SAFE_INTEGER;
    const orderB = townB.includes(b.id) ? townB.indexOf(b.id) : Number.MAX_SAFE_INTEGER;
    return a.townId === b.townId
      ? orderA - orderB || a.id.localeCompare(b.id)
      : String(a.townId || "").localeCompare(String(b.townId || ""));
  }).map((entry, index) => ({
    ...entry,
    dungeonIndex: index,
  }));
  return normalized;
};

window.getDungeonInfo = function getDungeonInfo(idOrIndex = 0) {
  if (typeof idOrIndex === "number") return window.DUNGEONS?.[idOrIndex] || null;
  const id = String(idOrIndex || "").trim();
  if (!id) return null;
  return window.DUNGEON_REGISTRY?.[id] || null;
};
