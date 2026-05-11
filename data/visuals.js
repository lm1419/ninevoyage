// 画面数据。自由行动按当前地域显示 SCENE_VISUALS，战斗按敌名显示 ENEMY_VISUALS。
// 每个场景可指定 mood（天空氛围）、clouds（云密度）、rays（是否启用圣光）。

window.SKY_PRESETS = {
  dawn: [
    { pos: 0, rgb: [18, 22, 35] },
    { pos: 0.18, rgb: [45, 30, 60] },
    { pos: 0.42, rgb: [120, 70, 50] },
    { pos: 0.68, rgb: [200, 150, 70] },
    { pos: 0.88, rgb: [180, 200, 160] },
    { pos: 1, rgb: [140, 120, 80] }
  ],
  mystical: [
    { pos: 0, rgb: [8, 12, 28] },
    { pos: 0.18, rgb: [25, 18, 55] },
    { pos: 0.4, rgb: [60, 40, 100] },
    { pos: 0.62, rgb: [70, 120, 200] },
    { pos: 0.84, rgb: [180, 200, 215] },
    { pos: 1, rgb: [155, 145, 95] }
  ],
  crimson: [
    { pos: 0, rgb: [10, 4, 8] },
    { pos: 0.22, rgb: [35, 8, 14] },
    { pos: 0.48, rgb: [80, 18, 24] },
    { pos: 0.7, rgb: [160, 40, 35] },
    { pos: 0.88, rgb: [140, 80, 45] },
    { pos: 1, rgb: [100, 60, 35] }
  ],
  ocean: [
    { pos: 0, rgb: [5, 18, 30] },
    { pos: 0.28, rgb: [15, 40, 65] },
    { pos: 0.52, rgb: [30, 100, 140] },
    { pos: 0.78, rgb: [140, 200, 210] },
    { pos: 0.92, rgb: [200, 190, 140] },
    { pos: 1, rgb: [170, 160, 90] }
  ],
  snow: [
    { pos: 0, rgb: [20, 28, 38] },
    { pos: 0.22, rgb: [45, 60, 80] },
    { pos: 0.5, rgb: [140, 165, 190] },
    { pos: 0.74, rgb: [210, 220, 230] },
    { pos: 0.9, rgb: [230, 225, 215] },
    { pos: 1, rgb: [180, 175, 160] }
  ],
  night: [
    { pos: 0, rgb: [4, 6, 14] },
    { pos: 0.22, rgb: [12, 10, 30] },
    { pos: 0.48, rgb: [28, 22, 55] },
    { pos: 0.72, rgb: [40, 35, 75] },
    { pos: 0.9, rgb: [60, 55, 90] },
    { pos: 1, rgb: [80, 70, 85] }
  ],
  sacred: [
    { pos: 0, rgb: [20, 16, 30] },
    { pos: 0.2, rgb: [70, 30, 50] },
    { pos: 0.45, rgb: [160, 70, 55] },
    { pos: 0.7, rgb: [230, 160, 80] },
    { pos: 0.9, rgb: [220, 200, 150] },
    { pos: 1, rgb: [170, 140, 90] }
  ],
  mountain: [
    { pos: 0, rgb: [14, 20, 18] },
    { pos: 0.25, rgb: [30, 42, 35] },
    { pos: 0.5, rgb: [65, 80, 60] },
    { pos: 0.75, rgb: [140, 150, 110] },
    { pos: 0.9, rgb: [175, 160, 100] },
    { pos: 1, rgb: [150, 120, 60] }
  ]
};

window.SCENE_VISUALS = {
  "橡树小镇": {
    title: "橡树小镇",
    desc: "古橡树的枝影盖住小镇广场，远征者在这里修整、交易，并从传送阵踏入镇外原野。",
    bg: "linear-gradient(135deg, #101716 0%, #273b35 48%, #9d7b42 100%)",
    accent: "#e4b85f",
    mood: "mountain",
    clouds: "mist",
    rays: true,
    image: "assets/ui/visual-banners/header-scene-oak-town.jpg"
  },
  "镇外原野": {
    title: "镇外原野",
    desc: "旧商路把荒草坡切成几段，雾气从废弃界碑后漫上来，盗匪和野兽都在等旅人露出破绽。",
    bg: "linear-gradient(135deg, #101716 0%, #3c4a32 52%, #a57943 100%)",
    accent: "#d7a84c",
    mood: "mountain",
    clouds: "low",
    rays: false,
    image: "assets/ui/visual-banners/header-scene-oak-town.jpg"
  },
  default: {
    title: "无尽途中",
    desc: "风从远处来，前路仍有未写完的故事。",
    bg: "linear-gradient(135deg, #101716 0%, #394139 50%, #a2834d 100%)",
    accent: "#d7a84c",
    mood: "mountain",
    clouds: "mist",
    rays: false,
    image: "assets/ui/visual-banners/header-scene-oak-town.jpg"
  }
};

window.ENEMY_VISUALS = {
  "荒原劫掠者": { title: "荒原劫掠者", desc: "旧商路旁的劫掠者披着破斗篷，刀口上还沾着车辙里的泥。", accent: "#f0a45f", mood: "crimson", clouds: "low" },
  "瘦脊野狼": { title: "瘦脊野狼", desc: "饥饿的野狼贴着草坡游走，低伏时几乎和夜雾混成一片。", accent: "#b8c7ff", mood: "night", clouds: "low" },
  "雾碑守卫": { title: "雾碑守卫", desc: "废弃界碑后的铁甲守卫被雾气缠住，仍固执地拦在旧路尽头。", accent: "#d7a84c", mood: "mountain", clouds: "mist" },
  "滋事流氓": { title: "滋事流氓", desc: "酒香翻倒，橡木地板上滚着碎杯和脏话。", accent: "#d7a84c", mood: "crimson", clouds: "low" },
  "摸门盗匪": { title: "摸门盗匪", desc: "城门外的夜色压低，短刀在雾里亮了一下。", accent: "#b8c7ff", mood: "night", clouds: "low" },
  "商道劫匪": { title: "商道劫匪", desc: "旧商道旁响起尖哨，货车前的尘土被脚步踢开。", accent: "#f0a45f", mood: "crimson", clouds: "heavy" },
  default: { title: "敌影现身", desc: "阴影聚成人形，向你试探这一步的代价。", accent: "#ff9d9d", mood: "crimson" }
};
