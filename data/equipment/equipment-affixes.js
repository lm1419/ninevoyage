// Magic affix pool for generated equipment.
// Each affix defines:
// - name: display name
// - stat: bonus stat key, currently atk / damageReduction / speed
// - range: inclusive random roll range
// - unit: flat or percent display
// - slots: equipment slots that can roll this affix
window.EQUIPMENT_MAGIC_AFFIX_POOL = [
  {
    id: "sharp",
    name: "锋锐",
    stat: "atk",
    range: [3, 6],
    unit: "flat",
    slots: ["weapon"],
  },
  {
    id: "brutal",
    name: "残暴",
    stat: "atk",
    range: [7, 10],
    unit: "flat",
    slots: ["weapon"],
  },
  {
    id: "swift",
    name: "迅捷",
    stat: "speed",
    range: [1, 2],
    unit: "flat",
    slots: ["weapon", "armor"],
  },
  {
    id: "nimble",
    name: "轻灵",
    stat: "speed",
    range: [1, 3],
    unit: "flat",
    slots: ["weapon", "armor"],
  },
  {
    id: "guarded",
    name: "坚韧",
    stat: "damageReduction",
    range: [0.03, 0.06],
    unit: "percent",
    slots: ["armor"],
  },
  {
    id: "heavy",
    name: "厚重",
    stat: "damageReduction",
    range: [0.06, 0.1],
    unit: "percent",
    slots: ["armor"],
  },
  {
    id: "hiddenEdge",
    name: "藏锋",
    stat: "atk",
    range: [1, 3],
    unit: "flat",
    slots: ["armor"],
  },
  {
    id: "warding",
    name: "破势",
    stat: "damageReduction",
    range: [0.01, 0.03],
    unit: "percent",
    slots: ["weapon"],
  },
];
