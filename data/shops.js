// Town shop data. Dungeon shops are defined by each dungeon file under data/dungeons/.
// 维护规则：
// - equipment 商品不写价格，底材价格维护在 data/equipment/equipment-bases.js。
// - item 商品不写价格，价格统一维护在 data/items.js 的 price。
window.SHOP_DB = {
  oak_town: {
    name: "橡树小镇行商",
    desc: "行商把当前可用的基础补给单独摆在镇内货架上，不再混用远征途中的随机补给。",
    goods: [
      { type: "equipment", id: "travelerSword", stock: 1 },
      { type: "equipment", id: "studdedJerkin", stock: 1 },
      { type: "item", id: "apprenticeHealthPotion", stock: 2 },
      { type: "item", id: "apprenticeManaPotion", stock: 2 },
      { type: "item", id: "apprenticePowerPotion", stock: 1 },
    ]
  }
};
