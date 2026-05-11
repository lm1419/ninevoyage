// 状态数据。状态逻辑由 js/game.js 统一处理，技能和道具只负责施加或净化状态。
window.STATUS_DB = {
  poison: { name: "中毒", type: "negative", timing: "turnStart", value: 3, defaultDuration: 3, maxStacks: 3, desc: "每回合开始受到伤害。" },
  bleed: { name: "流血", type: "negative", timing: "afterAction", value: 4, defaultDuration: 3, maxStacks: 3, desc: "行动后受到伤害。" },
  stun: { name: "眩晕", type: "negative", defaultDuration: 1, maxStacks: 1, desc: "跳过一回合。" },
  breakDamageReduction: { name: "防御降低", type: "negative", value: -0.1, defaultDuration: 3, maxStacks: 1, modifyDamageReduction: "add", desc: "防御力降低。" },
  shield: { name: "护盾", type: "positive", value: 18, defaultDuration: 3, maxStacks: 5, stackValue: "add", absorbDamage: true, desc: "抵消伤害。" },
  vulnerable: { name: "易伤", type: "negative", value: 4, defaultDuration: 2, maxStacks: 1, modifyIncomingDamage: "add", desc: "受到的伤害固定增加。" },
  finalDamageUp: { name: "伤害提升", type: "positive", value: 0.1, defaultDuration: 3, maxStacks: 1, modifyOutgoingDamage: "multiplyUp", desc: "造成的最终伤害提高。" }
};
