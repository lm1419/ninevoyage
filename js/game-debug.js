// Debug helpers. Expose console-only inventory and reward helpers.

window.DEBUG_CHEAT_GUIDE = [
  {
    order: 30,
    name: "debugGetAll",
    usage: "debugGetAll()",
    summary: "获得满级技能、各品级装备与全部道具，并把金币补到至少 999。",
    detail: "适合快速验收背包、技能、装备与商店购买链路。",
    examples: ["debugGetAll()"],
    tags: ["奖励", "背包"],
  },
  {
    order: 31,
    name: "debugGetAllItemsAndEquipment",
    usage: "debugGetAllItemsAndEquipment()",
    summary: "Grant every item and one generated equipment for each rarity.",
    detail: "Use this when testing inventory and equipment rarity display without filling the bag with duplicate gear.",
    examples: ["debugGetAllItemsAndEquipment()"],
    tags: ["items", "equipment"],
  },
];

function grantDebugItemMinimum(id, amount) {
  const previous = state.inventory[id] || 0;
  const next = Math.max(previous, amount);
  state.inventory[id] = next;
  if (previous <= 0 && next > 0) ITEM_DB[id]?.onAcquire?.(state);
}

function grantAllDebugItemsMinimum(amount = 1) {
  state.inventory = state.inventory || {};
  Object.keys(ITEM_DB || {}).forEach((id) => {
    grantDebugItemMinimum(id, amount);
  });
}

function debugEquipmentBaseIds() {
  const baseIds = Object.keys(window.EQUIPMENT_DB || {}).filter((id) => {
    if (typeof isEquipmentBase === "function") return isEquipmentBase(id);
    return !!window.EQUIPMENT_DB?.[id]?.isBase;
  });
  return baseIds.length ? baseIds : ["travelerSword", "studdedJerkin"];
}

function debugEquipmentRarities() {
  const rarities = Object.keys(window.EQUIPMENT_RARITY || {});
  return rarities.length ? rarities : ["common", "magic", "rare", "legendary"];
}

function grantDebugOneEquipmentPerRarity(targetState = state) {
  if (!targetState) return [];
  targetState.ownedEquip = targetState.ownedEquip || [];
  targetState.generatedEquipment = targetState.generatedEquipment || {};
  targetState.equipmentDurability = targetState.equipmentDurability || {};
  const granted = [];
  const baseIds = debugEquipmentBaseIds();
  debugEquipmentRarities().forEach((rarity, index) => {
    const baseId = baseIds[index % baseIds.length];
    const id = typeof createEquipmentInstance === "function"
      ? createEquipmentInstance(baseId, targetState, { rarity })
      : baseId;
    const equipment = typeof getEquipment === "function"
      ? getEquipment(id, targetState)
      : EQUIPMENT_DB?.[id];
    if (!id || !equipment) return;
    if (!targetState.ownedEquip.includes(id)) targetState.ownedEquip.push(id);
    if (equipment.durability) targetState.equipmentDurability[id] = equipment.durability;
    granted.push(id);
  });
  return granted;
}

function damageDebugEquipmentForRepair(equipmentIds, count = 3) {
  if (!state || !Array.isArray(equipmentIds) || !equipmentIds.length) return [];
  state.equipmentDurability = state.equipmentDurability || {};
  const damaged = [];
  const missingValues = [4, 7, 10];
  equipmentIds.forEach((id) => {
    if (damaged.length >= count) return;
    const equipment = typeof getEquipment === "function" ? getEquipment(id, state) : EQUIPMENT_DB?.[id];
    if (!equipment?.durability || equipment.durability <= 1) return;
    const missing = missingValues[damaged.length] || 4;
    state.equipmentDurability[id] = Math.max(1, equipment.durability - missing);
    damaged.push(id);
  });
  return damaged;
}

window.debugGetAllItemsAndEquipment = function debugGetAllItemsAndEquipment() {
  if (!state) return { items: 0, equipment: 0, equipmentIds: [] };
  state.inventory = state.inventory || {};
  grantAllDebugItemsMinimum(1);
  const grantedEquipment = grantDebugOneEquipmentPerRarity(state);
  const itemCount = Object.keys(ITEM_DB || {}).length;
  addLine(
    `Debug: granted ${itemCount} item types and ${grantedEquipment.length} equipment pieces.`,
    "system",
  );
  render();
  renderMenu("inventory");
  return { items: itemCount, equipment: grantedEquipment.length, equipmentIds: grantedEquipment };
};

window.debugGetAll = function debugGetAll() {
  if (!state) return;
  state.player.skills = state.player.skills || {};
  Object.keys(PLAYER_SKILLS).forEach((id) => {
    const max = PLAYER_SKILLS[id].maxLevel || 1;
    state.player.skills[id] = max;
  });
  const grantedEquipment = grantDebugOneEquipmentPerRarity(state);
  damageDebugEquipmentForRepair(grantedEquipment, 3);
  state.inventory = state.inventory || {};
  grantAllDebugItemsMinimum(1);
  state.gold = Math.max(state.gold, 999);
  state.player.hp = state.player.maxHp;
  state.player.mp = state.player.maxMp || 30;
  addLine(
    "调试：已获得满级技能、装备、道具，金币 999，并准备 3 件损坏装备。",
    "system",
  );
  render();
  renderMenu("skill");
};
