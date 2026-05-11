window.EQUIPMENT_DB = window.EQUIPMENT_BASE_DB || {};

function getEquipment(id, sourceState) {
  const currentState = sourceState || (typeof state !== "undefined" ? state : null);
  return currentState?.generatedEquipment?.[id] || window.EQUIPMENT_DB?.[id] || null;
}

function isEquipmentBase(id) {
  return !!window.EQUIPMENT_DB?.[id]?.isBase;
}

function rollEquipmentRarity() {
  const entries = Object.entries(window.EQUIPMENT_RARITY || {});
  const total = entries.reduce((sum, [, rarity]) => sum + (rarity.weight || 0), 0);
  let roll = Math.random() * total;
  for (const [key, rarity] of entries) {
    roll -= rarity.weight || 0;
    if (roll <= 0) return key;
  }
  return "common";
}

function pickEquipmentAffixes(slot, count) {
  const pool = (window.EQUIPMENT_MAGIC_AFFIX_POOL || [])
    .filter((affix) => (affix.slots || []).includes(slot))
    .map(rollEquipmentAffix);
  const affixes = [];
  while (pool.length && affixes.length < count) {
    const index = Math.floor(Math.random() * pool.length);
    affixes.push(pool.splice(index, 1)[0]);
  }
  return affixes;
}

function rollEquipmentAffix(affix) {
  const [min, max] = affix.range || [0, 0];
  const value = affix.unit === "percent"
    ? Math.round((min + Math.random() * (max - min)) * 100) / 100
    : Math.floor(min + Math.random() * (max - min + 1));
  return {
    id: affix.id,
    name: affix.name,
    stat: affix.stat,
    value,
    range: affix.range,
    unit: affix.unit || "flat",
    text: equipmentAffixBonusText(affix.stat, value, affix.unit),
  };
}

function equipmentAffixBonusText(stat, value, unit) {
  const labels = {
    atk: "攻击",
    damageReduction: "免伤",
    speed: "速度",
  };
  const label = labels[stat] || stat;
  if (unit === "percent" || stat === "damageReduction") {
    return `${label} +${Math.round(value * 100)}%`;
  }
  return `${label} +${value}`;
}

function sumEquipmentAffixes(affixes) {
  return affixes.reduce(
    (stats, affix) => {
      if (affix.stat === "atk") stats.atk += affix.value || 0;
      if (affix.stat === "damageReduction") stats.damageReduction += affix.value || 0;
      if (affix.stat === "speed") stats.speed += affix.value || 0;
      return stats;
    },
    { atk: 0, damageReduction: 0, speed: 0 },
  );
}

function pickRareEquipmentAdjective() {
  const adjectives = window.EQUIPMENT_RARE_ADJECTIVES || ["稀有"];
  return adjectives[Math.floor(Math.random() * adjectives.length)] || "稀有";
}

function generatedEquipmentName(base, rarity, affixes) {
  const baseName = base.baseName || base.name;
  if (rarity === "common") return baseName;
  if (rarity === "magic") return `${affixes[0]?.name || "魔法"}的${baseName}`;
  if (rarity === "rare") return `${pickRareEquipmentAdjective()}${baseName}`;
  return `${(window.EQUIPMENT_RARITY?.[rarity]?.name || "")}${baseName}`;
}

function pickLegendaryEquipment(baseId) {
  const pool = window.EQUIPMENT_LEGENDARY_DB?.[baseId] || [];
  if (!pool.length) return null;
  const legendary = pool[Math.floor(Math.random() * pool.length)];
  return {
    ...legendary,
    affixes: (legendary.affixes || []).map((affix) => ({ ...affix })),
    fixedAffixes: (legendary.affixes || []).map((affix) => ({ ...affix })),
  };
}

function createEquipmentInstance(baseId, targetState, options = {}) {
  const equipmentState = targetState || (typeof state !== "undefined" ? state : null);
  const base = window.EQUIPMENT_DB?.[baseId];
  if (!base || !equipmentState) return null;
  if (!base.isBase) return baseId;
  const rarity = window.EQUIPMENT_RARITY?.[options.rarity] ? options.rarity : rollEquipmentRarity();
  const rarityConfig = window.EQUIPMENT_RARITY[rarity] || window.EQUIPMENT_RARITY.common;
  const legendary = rarity === "legendary" ? pickLegendaryEquipment(baseId) : null;
  const affixes = legendary
    ? [...(legendary.affixes || [])]
    : pickEquipmentAffixes(base.slot, rarityConfig.affixCount || 0);
  const stats = sumEquipmentAffixes(affixes);
  const id = `gen_${baseId}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  equipmentState.generatedEquipment = equipmentState.generatedEquipment || {};
  equipmentState.generatedEquipment[id] = {
    id,
    baseId,
    name: legendary?.name || generatedEquipmentName(base, rarity, affixes),
    slot: legendary?.slot || base.slot,
    rarity,
    durability: legendary?.durability || base.durability,
    price: legendary?.price || Math.max(1, Math.round((base.price || 0) * ({ common: 0.7, magic: 1, rare: 1.6, legendary: 3 }[rarity] || 1))),
    affixes,
    fixedAffixes: rarity === "legendary" ? affixes : undefined,
    atk: legendary?.atk ?? stats.atk,
    damageReduction: legendary?.damageReduction ?? stats.damageReduction,
    speed: legendary?.speed ?? stats.speed,
    desc: legendary?.desc || `${base.baseName || base.name}生成装备。`,
  };
  return id;
}
