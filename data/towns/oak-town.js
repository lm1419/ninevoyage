// 橡树小镇元数据。
// 约束：本文件只描述数据，不读取 state、不操作 DOM、不执行随机逻辑、不推进时间。
window.TOWN_DATA = window.TOWN_DATA || {};

window.TOWN_DATA.oak_town = {
  // 小镇唯一 id，用于存档、商店、副本归属和运行时查询。
  id: "oak_town",
  // 小镇显示名称，用于标题、存档摘要和默认视觉区域名。
  title: "橡树小镇",
  // 小镇默认场景视觉键，用于兼容 SCENE_VISUALS 中已有的同名配置。
  sceneKey: "橡树小镇",
  // 小镇默认广场焦点，为 null 表示停留在根节点广场。
  defaultFocus: null,
  // 小镇关联副本 id 顺序，用于镇外古门展示可进入副本。
  dungeonIds: ["oak01"],

  // 进入和返回小镇时使用的叙事文案。
  intro: {
    // 新游戏或首次进入小镇时写入日志的文本。
    enter: "你抵达橡树小镇。篝火、药铺、铁砧、校场、酒馆、行会与镇外古门在古橡枝影下一一亮起。",
    // 从副本返回小镇时写入日志的文本。
    returnFromDungeon: "副本气息从甲叶间散去，你回到了橡树小镇。",
    // 使用回城卷轴返回小镇时拼接的地点名称。
    returnName: "橡树小镇",
  },

  // 小镇地图上的可点击设施点。
  facilities: [
    {
      // 设施 id，用于 focus 状态和动作分组。
      id: "rest",
      // 设施无障碍标题，用于按钮 aria-label。
      title: "营火圣坛",
      // 设施短名称，用于菜单按钮主文本。
      label: "篝火营地",
      // 设施功能摘要，用于菜单按钮副文本。
      meta: "恢复生命",
      // 设施图标文字，用于镇内菜单标记。
      mark: "火",
      // 设施在小镇背景图上的横向百分比位置。
      x: 15,
      // 设施在小镇背景图上的纵向百分比位置。
      y: 70,
    },
    {
      // 设施 id，用于 focus 状态和动作分组。
      id: "item-shop",
      // 设施无障碍标题，用于按钮 aria-label。
      title: "药剂与符纸铺",
      // 设施短名称，用于菜单按钮主文本。
      label: "道具店",
      // 设施功能摘要，用于菜单按钮副文本。
      meta: "购买道具",
      // 设施图标文字，用于镇内菜单标记。
      mark: "药",
      // 设施在小镇背景图上的横向百分比位置。
      x: 31,
      // 设施在小镇背景图上的纵向百分比位置。
      y: 64,
    },
    {
      // 设施 id，用于 focus 状态和动作分组。
      id: "forge",
      // 设施无障碍标题，用于按钮 aria-label。
      title: "铁砧工坊",
      // 设施短名称，用于菜单按钮主文本。
      label: "铁匠铺",
      // 设施功能摘要，用于菜单按钮副文本。
      meta: "装备与修理",
      // 设施图标文字，用于镇内菜单标记。
      mark: "铁",
      // 设施在小镇背景图上的横向百分比位置。
      x: 48,
      // 设施在小镇背景图上的纵向百分比位置。
      y: 62,
    },
    {
      // 设施 id，用于 focus 状态和动作分组。
      id: "training",
      // 设施无障碍标题，用于按钮 aria-label。
      title: "民兵校场",
      // 设施短名称，用于菜单按钮主文本。
      label: "训练场",
      // 设施功能摘要，用于菜单按钮副文本。
      meta: "学习技能",
      // 设施图标文字，用于镇内菜单标记。
      mark: "训",
      // 设施在小镇背景图上的横向百分比位置。
      x: 64,
      // 设施在小镇背景图上的纵向百分比位置。
      y: 66,
    },
    {
      // 设施 id，用于 focus 状态和动作分组。
      id: "bar",
      // 设施无障碍标题，用于按钮 aria-label。
      title: "橡木酒馆",
      // 设施短名称，用于菜单按钮主文本。
      label: "橡木酒馆",
      // 设施功能摘要，用于菜单按钮副文本。
      meta: "喝酒与传闻",
      // 设施图标文字，用于镇内菜单标记。
      mark: "酒",
      // 设施在小镇背景图上的横向百分比位置。
      x: 70,
      // 设施在小镇背景图上的纵向百分比位置。
      y: 72,
    },
    {
      // 设施 id，用于 focus 状态和动作分组。
      id: "work",
      // 设施无障碍标题，用于按钮 aria-label。
      title: "冒险者行会",
      // 设施短名称，用于菜单按钮主文本。
      label: "冒险家工会",
      // 设施功能摘要，用于菜单按钮副文本。
      meta: "工作与情报",
      // 设施图标文字，用于镇内菜单标记。
      mark: "会",
      // 设施在小镇背景图上的横向百分比位置。
      x: 76,
      // 设施在小镇背景图上的纵向百分比位置。
      y: 60,
    },
    {
      // 设施 id，用于 focus 状态和动作分组。
      id: "gate",
      // 设施无障碍标题，用于按钮 aria-label。
      title: "镇外古门",
      // 设施短名称，用于菜单按钮主文本。
      label: "镇外古门",
      // 设施功能摘要，用于菜单按钮副文本。
      meta: "进入副本",
      // 设施图标文字，用于镇内菜单标记。
      mark: "门",
      // 设施在小镇背景图上的横向百分比位置。
      x: 84,
      // 设施在小镇背景图上的纵向百分比位置。
      y: 55,
    },
  ],

  // 各焦点页面的说明文本。
  // details.*.kicker：说明眉标，用于详情面板的小标题。
  // details.*.title：说明标题，用于详情面板主标题。
  // details.*.desc：说明正文，用于介绍当前焦点可做事项。
  details: {
    // 根节点说明，用于未选择设施时的广场详情。
    root: {
      // 说明眉标，用于详情面板的小标题。
      kicker: "橡树广场",
      // 说明标题，用于详情面板主标题。
      title: "橡树小镇",
      // 说明正文，用于介绍当前焦点可做事项。
      desc: "这里是远征前的准备区。你可以休息、购物、修装备、训练、接工作，或从镇外古门进入副本。",
    },
    // 篝火营地说明。
    rest: { kicker: "镇中地标", title: "篝火营地", desc: "这里可以休息、恢复 HP 和 MP。广场边有篝火、热汤和绷带，适合远征前整理状态。" },
    // 道具店说明。
    "item-shop": { kicker: "镇中地标", title: "道具店", desc: "这里出售药剂、符纸和补给道具。店主每月更新一次货物，出镇前可以来补充消耗品。" },
    // 铁匠铺说明。
    forge: { kicker: "镇中地标", title: "铁匠铺", desc: "这里可以买武器和护甲，也可以修理受损装备。铁匠铺的商品会按月更新。" },
    // 修理台说明。
    repair: { kicker: "铁匠铺", title: "铆钉修台", desc: "这里处理装备耐久。你可以只修当前装备，也可以修理背包里的全部受损装备。" },
    // 训练场说明。
    training: { kicker: "镇中地标", title: "训练场", desc: "这里可以学习和训练技能。教头会收取金币，训练也会消耗小镇时间。" },
    // 学习技能说明。
    "learn-skills": { kicker: "训练场", title: "拜师习艺", desc: "这里可以花金币学习新技能。每个技能都有学习费用，并会消耗一定天数。" },
    // 训练技能说明。
    "train-skills": { kicker: "训练场", title: "闭营苦练", desc: "这里可以升级已学会的技能。训练完成后，技能会提升到更高等级。" },
    // 冒险家工会说明。
    work: { kicker: "镇中地标", title: "冒险家工会", desc: "这里可以承接工作、查看悬赏和读取情报。多数工作会消耗天数，完成后获得金币。" },
    // 工作承接说明。
    "work-contracts": { kicker: "冒险家工会", title: "工作承接", desc: "这里列出本月可接的工作。每份工作都有耗时、酬金和可能的风险。" },
    // 酒馆说明。
    bar: { kicker: "镇中地标", title: "橡木酒馆", desc: "这里可以花金币恢复状态、进行骰子赌博，或听取本月的小镇消息。" },
    // 古门说明。
    gate: { kicker: "远征门扉", title: "镇外古门", desc: "这里可以选择并进入已解锁的副本。出发前建议先补给、修装备、确认技能。" },
  },

  // 各焦点页面的视觉配置。
  // visuals.*.title：视觉标题，用于主视觉标题。
  // visuals.*.desc：视觉描述，用于主视觉说明。
  // visuals.*.bg：背景渐变，用于无图片或图片加载前的色彩基底。
  // visuals.*.accent：强调色，用于视觉组件高亮。
  // visuals.*.mood：天空氛围预设名，用于 visual-renderer 的天空颜色。
  // visuals.*.clouds：云层密度预设名，用于 visual-renderer 的云层表现。
  // visuals.*.rays：是否启用光束效果。
  // visuals.*.image：视觉图片路径，用于主视觉背景图。
  visuals: {
    // 根节点视觉，用于未选择设施时的小镇总览。
    root: {
      // 视觉标题，用于主视觉标题。
      title: "橡树小镇",
      // 视觉描述，用于主视觉说明。
      desc: "古橡树的枝影盖住小镇广场，远征者在这里修整、交易，并从传送阵踏入副本。",
      // 背景渐变，用于无图片或图片加载前的色彩基底。
      bg: "linear-gradient(135deg, #101716 0%, #273b35 48%, #9d7b42 100%)",
      // 强调色，用于视觉组件高亮。
      accent: "#e4b85f",
      // 天空氛围预设名，用于 visual-renderer 的天空颜色。
      mood: "mountain",
      // 云层密度预设名，用于 visual-renderer 的云层表现。
      clouds: "mist",
      // 是否启用光束效果。
      rays: true,
      // 视觉图片路径，用于主视觉背景图。
      image: "assets/ui/visual-banners/header-scene-oak-town.jpg",
    },
    // 篝火营地视觉。
    rest: { title: "篝火营地", desc: "古橡的根须护住营火，旅人在此卸下铠尘，让温热和星光慢慢回到骨头里。", bg: "linear-gradient(135deg, #0d1215 0%, #312519 52%, #a05f2d 100%)", accent: "#f0a34b", mood: "night", clouds: "mist", rays: false, image: "assets/ui/settlements/oak-town-campfire.png" },
    // 道具店视觉。
    "item-shop": { title: "道具店", desc: "药架与干草香气挤在低矮木屋里，瓶罐间闪着温暖灯火，远征者在此补足治疗与护身的小物。", bg: "linear-gradient(135deg, #101715 0%, #334124 52%, #9a7336 100%)", accent: "#c9d981", mood: "mountain", clouds: "mist", rays: true, image: "assets/ui/settlements/oak-town-item-shop.png" },
    // 铁匠铺视觉。
    forge: { title: "铁匠铺", desc: "炉火把铁器烧得发红，铁匠铺里挂满了待售武具与护具，每一声锤响都像在给远征者壮胆。", bg: "linear-gradient(135deg, #111115 0%, #3b2519 52%, #a54925 100%)", accent: "#e48745", mood: "crimson", clouds: "low", rays: false, image: "assets/ui/settlements/oak-town-equipment-shop.png" },
    // 训练场视觉。
    training: { title: "训练场", desc: "木桩、沙袋与旧旗在场边排开，剑痕和脚印把泥地磨得发亮，适合把基础本领一遍遍砸进身体里。", bg: "linear-gradient(135deg, #101516 0%, #3f3523 52%, #b08a43 100%)", accent: "#d6b15c", mood: "mountain", clouds: "high", rays: true, image: "assets/ui/settlements/oak-town-skill-train.png" },
    // 冒险家工会视觉。
    work: { title: "冒险家工会", desc: "委托札、地图和旧徽章挤满木墙，冒险者在吧台与告示牌前寻找下一笔短工、悬赏或传闻。", bg: "linear-gradient(135deg, #111318 0%, #352b20 52%, #9b6e37 100%)", accent: "#d2a85c", mood: "mountain", clouds: "mist", rays: false, image: "assets/ui/settlements/oak-town-adv.png" },
    // 酒馆视觉。
    bar: { title: "橡木酒馆", desc: "灯火把橡木桌照得油亮，酒杯、骰子和低声传闻在吧台边来回交换，远征者在此把疲惫和金币都放上桌面。", bg: "linear-gradient(135deg, #14100e 0%, #3b241b 52%, #9a5a2d 100%)", accent: "#d9924f", mood: "crimson", clouds: "low", rays: false, image: "assets/ui/settlements/oak-town-bar.png" },
    // 镇外古门视觉。
    gate: { title: "镇外古门", desc: "古门立在镇外石坡上，门缝里吹出不属于此地的冷风。远征者在此束紧行囊，再把最后一点犹疑留在镇内。", bg: "linear-gradient(135deg, #0f1418 0%, #29313a 52%, #806842 100%)", accent: "#b9a36c", mood: "mountain", clouds: "mist", rays: true, image: "assets/ui/settlements/oak-town-door.png" },
  },

  // 子焦点映射到主视觉焦点，避免修理和训练子页重复配置视觉。
  // visualFocusMap 的键：子焦点 id，用于匹配当前 state.allyFocus。
  // visualFocusMap 的值：主视觉焦点 id，用于读取 visuals 中的视觉配置。
  visualFocusMap: {
    // 修理台沿用铁匠铺视觉。
    repair: "forge",
    // 学习技能沿用训练场视觉。
    "learn-skills": "training",
    // 训练技能沿用训练场视觉。
    "train-skills": "training",
    // 工作承接沿用冒险家工会视觉。
    "work-contracts": "work",
  },

  // 小镇动作元数据，运行时代码会根据 type 解释为实际行为。
  // actions.*[].id：动作唯一 id，用于按钮 dataset、耗时查询和分发处理。
  // actions.*[].type：动作类型，用于 JS 解释为聚焦、开商店、休息、修理、传闻等行为。
  // actions.*[].label：按钮主文本，用于小镇菜单显示。
  // actions.*[].meta：按钮副文本，用于说明动作概要。
  // actions.*[].help：悬浮提示正文，用于解释动作效果。
  // actions.*[].mark：按钮标记文字，未填写时运行时取 label 首字。
  // actions.*[].target：focus 动作的目标焦点 id。
  // actions.*[].shopRole：openShop 动作读取 shops 配置时使用的角色键。
  // actions.*[].scope：repair 动作的修理范围。
  // actions.*[].drink：barDrink 动作对应的酒水键。
  // actions.*[].goldCost：动作显示和禁用判断使用的金币费用。
  // actions.*[].message：message 动作写入日志的文本。
  actions: {
    // 篝火营地动作列表。
    rest: [
      { id: "rest-full", type: "restFull", label: "在篝火旁歇息", meta: "回满生命法力", help: "休息后恢复全部 HP 和 MP。篝火旁有热汤和绷带，适合远征前整理状态。" },
      { id: "stash", type: "message", label: "翻检随身箱", meta: "查看背包", help: "查看行囊和备用物资。出镇前可以确认药剂、卷轴和其他道具是否足够。", message: "营地边的旧木箱已经掀开，皮带、药瓶和备用火石被一件件摆到毯子上。" },
    ],
    // 道具店动作列表。
    "item-shop": [
      { id: "item-shop-placeholder", type: "openShop", shopRole: "item", label: "向店主采买", meta: "购买药剂符纸", help: "打开道具店。这里出售生命药剂、法力药剂、战斗补给和赶路道具，货物会按月更新。" },
    ],
    // 铁匠铺动作列表。
    forge: [
      { id: "equipment-shop-placeholder", type: "openShop", shopRole: "forge", label: "挑选兵甲", meta: "购买武器护甲", help: "打开铁匠铺商店。这里出售本月新锻造的武器和护甲，部分装备带有附魔效果。" },
      { id: "focus-repair", type: "focus", target: "repair", label: "交给铁匠修补", meta: "修理受损装备", help: "进入修理选项。铁匠可以修复武器和护甲的耐久，避免装备在远征途中损坏。" },
    ],
    // 修理台动作列表。
    repair: [
      { id: "repair-equipped", type: "repair", scope: "equipped", label: "修身上披挂", help: "只修理当前装备中的武器和护甲。适合金币不多、只想先保证战斗装备可用时选择。" },
      { id: "repair-all", type: "repair", scope: "all", label: "修整全部行装", help: "修理背包里所有受损的武器和护甲。花费更高，但能一次处理全部装备耐久。" },
      { id: "focus-forge", type: "focus", target: "forge", label: "退回铁砧前", meta: "返回铁匠铺", help: "返回铁匠铺的主选项，可以继续购买装备或选择修理装备。" },
    ],
    // 训练场动作列表。
    training: [
      { id: "focus-learn-skills", type: "focus", target: "learn-skills", label: "向教头拜师", meta: "学习新技能", help: "向训练场教头付费学习新技能。可学技能偏向生存、增益和破甲，适合远征前补强战斗能力。" },
      { id: "focus-train-skills", type: "focus", target: "train-skills", label: "闭营苦练", meta: "升级已学技能", help: "花费时间和金币训练已学会的技能。训练完成后，技能等级会提升。" },
    ],
    // 冒险家工会动作列表。
    work: [
      { id: "focus-work-contracts", type: "focus", target: "work-contracts", label: "工作承接", meta: "查看短工", help: "查看本月可以承接的短工和护卫契约。接下工作后会推进日期，完工后获得金币。" },
      { id: "guild-commission-placeholder", type: "message", label: "悬赏委托", meta: "暂未开放", help: "悬赏委托暂未开放。之后这里会提供更危险、奖励更高的任务。", message: "悬赏委托暂未开放。之后这里会出现更危险、奖励更高的任务。" },
      { id: "guild-rumor", type: "guildRumor", label: "行会密报", meta: "查看情报", help: "查看本月更新的行会情报。内容可能涉及副本补给、铁匠铺更新或小镇工作的风险。" },
    ],
    // 工作承接动作列表。
    "work-contracts": [
      { id: "town-work-board", type: "workBoard" },
      { id: "focus-work", type: "focus", target: "work", label: "退回工会柜台", meta: "返回工会", help: "返回冒险家工会主选项，可以重新查看工作、悬赏和情报。" },
    ],
    // 酒馆动作列表。
    bar: [
      { id: "bar-ale", type: "barDrink", drink: "ale", label: "要一杯淡麦酒", meta: "恢复少量 HP", help: "花费 5 金喝一杯淡麦酒，恢复 15% HP。适合轻伤时补一点状态。", goldCost: 5 },
      { id: "bar-oak-wine", type: "barDrink", drink: "oakWine", label: "点一杯橡木烈酒", meta: "恢复 HP/MP", help: "花费 8 金喝一杯烈酒，恢复 10% HP 和 10% MP。适合出镇前补一点生命和法力。", goldCost: 8 },
      { id: "bar-gamble", type: "barGamble", label: "坐上骰子桌", meta: "押 10 金赌博", help: "花费 10 金进行一次骰子赌博。可能输钱，也可能赢回更多金币。", goldCost: 10 },
      { id: "bar-rumor", type: "barRumor", label: "听吧台消息", meta: "听小镇传闻", help: "听取本月固定的一条小镇消息。内容可能提示商店刷新、战斗准备或其他实用信息。" },
    ],
  },

  // 小镇时间消耗配置。
  // time.flowThresholdDays：大于该天数的小镇操作会展示时间流逝动画。
  // time.actionDays：固定动作耗时表，键为动作 id，值为消耗天数。
  time: {
    // 大于该天数的小镇操作会展示时间流逝动画。
    flowThresholdDays: 5,
    // 固定动作耗时表，动态动作由运行时代码结合训练配置计算。
    actionDays: {
      // 道具店采买耗时。
      "item-shop-placeholder": 1,
      // 铁匠铺挑选装备耗时。
      "equipment-shop-placeholder": 1,
      // 修理当前装备耗时。
      "repair-equipped": 1,
      // 修理全部装备耗时。
      "repair-all": 1,
      // 旧占位工作耗时，保留给兼容动作。
      "work-placeholder": 1,
    },
  },

  // 小镇训练配置。
  // training.learnDays：学习新技能统一消耗天数。
  // training.trainDays：已学技能闭营训练消耗天数。
  // training.trainCost：已学技能闭营训练金币费用。
  // training.skills：可学习技能列表。
  // training.skills[].id：技能 id，对应 data/skills.js 中 PLAYER_SKILLS 的键。
  // training.skills[].learnCost：学习该技能的金币费用。
  training: {
    // 学习新技能统一消耗天数。
    learnDays: 10,
    // 已学技能闭营训练消耗天数。
    trainDays: 30,
    // 已学技能闭营训练金币费用。
    trainCost: 120,
    // 可学习技能列表。
    skills: [
      { id: "fleetEscape", learnCost: 50 },
      { id: "battleFocus", learnCost: 100 },
      { id: "sunderStrike", learnCost: 100 },
    ],
  },

  // 小镇商店关联配置。
  // shops.*.shopId：实际打开的 SHOP_DB 商店 id。
  // shops.*.filter：商店界面使用的商品过滤器。
  // shops.*.title：打开商店时显示的商店标题。
  // shops.*.desc：打开商店时显示的商店说明。
  // shops.*.monthlyStockKey：月度随机库存缓存键，用于铁匠铺等刷新库存。
  shops: {
    // 道具店关联配置。
    item: { shopId: "oak_town", filter: "consumables", title: "道具店", desc: "这里出售生命药剂、法力药剂、战斗补给和赶路道具。商品每月刷新一次。" },
    // 铁匠铺关联配置。
    forge: { shopId: "oak_town", filter: "magic-smith", title: "铁匠铺", desc: "这里出售本月新锻造的武器和护甲。商品每月刷新一次，买完后需要等下月更新。", monthlyStockKey: "forge" },
  },

  // 小镇工作配置。
  // work.requiredIds：每月必定出现的工作 id。
  // work.randomIds：每月随机抽取的工作 id 池。
  // work.randomCount：每月从 randomIds 中抽取的数量。
  // work.jobs：工作 id 到工作定义的映射。
  // work.jobs.*.name：工作显示名称，用于按钮、确认弹窗和结算。
  // work.jobs.*.duration：工作持续天数，用于推进小镇日期。
  // work.jobs.*.rewardGold：工作完成后获得的金币。
  // work.jobs.*.mark：工作按钮标记文字。
  // work.jobs.*.desc：工作说明文本。
  // work.jobs.*.role：工作刷出规则备注，仅用于维护说明。
  // work.jobs.*.minLevel：承接工作需要的最低角色等级。
  // work.jobs.*.minHp：承接工作需要的最低当前 HP。
  // work.jobs.*.risk：每日触发战斗风险配置。
  // work.jobs.*.risk.chance：每日触发战斗的概率。
  // work.jobs.*.risk.enemyId：触发战斗时使用的敌人 id。
  // work.jobs.*.risk.label：风险说明文本。
  // work.jobs.*.encounterLine：风险战斗触发时写入日志的文本。
  // work.jobs.*.everyDays：每隔多少工作日触发一次固定消耗。
  // work.jobs.*.hpCost：固定消耗触发时扣除的 HP。
  // work.jobs.*.dailyEffectLine：每日特殊效果写入日志的模板。
  // work.jobs.*.scratchChance：每日受伤概率。
  // work.jobs.*.scratchDamage：受伤时扣除的 HP。
  // work.jobs.*.bonusItemChance：完工时获得额外物品的概率。
  // work.jobs.*.bonusItem：额外物品 id。
  // work.jobs.*.bonusLine：获得额外物品时写入结果的文本。
  work: {
    // 每月必定出现的工作 id。
    requiredIds: ["cargo-haul", "tavern-patrol"],
    // 每月随机抽取的工作 id 池。
    randomIds: ["guild-copyist", "street-odd-jobs", "gate-watch", "caravan-escort", "forge-bellows", "herb-drying"],
    // 每月随机工作抽取数量。
    randomCount: 2,
    // 工作 id 到工作定义的映射。
    jobs: {
      "cargo-haul": { name: "搬运货箱", duration: 30, rewardGold: 1, mark: "搬", desc: "替行会和商队搬运木箱，完成后领取酬金。", role: "必定刷出" },
      "tavern-patrol": { name: "酒馆巡逻", duration: 30, rewardGold: 10, mark: "巡", desc: "在橡木酒馆夜里巡逻，完成后领取酬金。", role: "必定刷出", risk: { chance: 0.02, enemyId: "townThug", label: "每天 2% 流氓战斗" }, encounterLine: "酒馆角落里有人掀翻桌子，碎杯和咒骂一起炸开。你必须把滋事的流氓打倒。" },
      "guild-copyist": { name: "行会抄录账册", duration: 30, rewardGold: 3, mark: "账", desc: "把旧账、收据和委托名册誊清，完成后领取酬金。" },
      "street-odd-jobs": { name: "街边零工", duration: 7, rewardGold: 0.5, mark: "零", desc: "帮摊贩和旅人处理零工，完成后领取酬金。" },
      "gate-watch": { name: "城门守夜", duration: 30, rewardGold: 8, mark: "夜", desc: "在镇外古门旁守夜，完成后领取酬金。", minLevel: 2, risk: { chance: 0.015, enemyId: "townBandit", label: "每天 1.5% 战斗" }, encounterLine: "夜雾里传来铁器轻响，有人试图摸过城门。你必须拦住他。" },
      "caravan-escort": { name: "商队押运", duration: 20, rewardGold: 15, mark: "押", desc: "护送短程商队通过旧路，完成后领取酬金。", minLevel: 3, risk: { chance: 0.04, enemyId: "caravanRaider", label: "每天 4% 战斗" }, encounterLine: "商队前方响起尖哨，劫匪从路边冲出。你必须护住货车。" },
      "forge-bellows": { name: "铁匠铺拉风箱", duration: 30, rewardGold: 2, mark: "炉", desc: "在铁匠铺帮忙拉风箱，完成后领取酬金。", minHp: 7, everyDays: 10, hpCost: 2, dailyEffectLine: "炉火烤得人眼前发白，{jobName}第 {workDay} 天：HP -{amount}。" },
      "herb-drying": { name: "药铺晒草", duration: 15, rewardGold: 1, mark: "药", desc: "在药铺翻晒草药和磨药粉，完成后领取酬金。", scratchChance: 0.01, scratchDamage: 3, bonusItemChance: 0.2, bonusItem: "apprenticeHealthPotion", dailyEffectLine: "毒草刺破了手背，{jobName}第 {workDay} 天：HP -{amount}。", bonusLine: "药铺掌柜见你手脚还算稳，又塞来一瓶学徒生命药剂。" },
    },
  },

  // 行会密报池，和副本密报合并后按月抽取。
  // guildReports[].id：密报唯一 id，用于月度缓存。
  // guildReports[].name：密报标题，用于弹窗标题。
  // guildReports[].text：密报阅读前的描述文本。
  // guildReports[].result：密报结果文本，用于弹窗结果和日志。
  // guildReports[].illustration：可选插图路径，未填时使用默认密报图。
  guildReports: [
    { id: "hidden-dust", name: "行会密报：隐匿之尘", text: "书记员压低声音，递来一张没有署名的货单。货单角落画着一小撮灰白粉末。", result: "密报写着：隐匿之尘能避开一段路上的遭遇。它不改变路程，但能让你把有限的 HP 和 MP 留给 Boss 门前。" },
    { id: "armor-breaks", name: "行会密报：裂甲败因", text: "一份战败归档被推到桌上，纸页里夹着半枚断裂的皮甲铆钉。", result: "密报写着：许多远征者不是败给怪物，而是败给半路裂开的护甲。出镇前修满装备耐久，往往比多买一瓶药更稳。" },
    { id: "monthly-forge", name: "行会密报：炉火轮换", text: "铁匠铺送来的换货记录被钉在行会柜台内侧，只有正式登记的冒险者才能翻看。", result: "密报写着：橡树小镇铁匠铺按月轮换新锻武具。错过本月墙上的附魔兵甲，就只能等下个月炉火重新开封。" },
    { id: "town-work-risk", name: "行会密报：短工风险", text: "书记员点了点工作板边角的血痕，那不是装饰，是某个夜班巡逻人留下的警告。", result: "密报写着：酒馆巡逻和商队押运的酬金更高，是因为麻烦会自己找上门。接这类工作前，确认 HP 和装备都扛得住。" },
  ],

  // 酒馆传闻池，和副本传闻合并后按月抽取。
  // tavernRumors[].id：传闻唯一 id，用于月度缓存。
  // tavernRumors[].title：传闻标题，用于弹窗标题。
  // tavernRumors[].text：传闻听取前的描述文本。
  // tavernRumors[].result：传闻结果文本，用于弹窗结果和日志。
  tavernRumors: [
    { id: "hidden-dust-value", title: "耳语：灰尘小袋", text: "一个戴兜帽的人没有看你，只把半句提醒留在杯底的泡沫旁。", result: "一个戴兜帽的人提醒你：隐匿之尘能避开十步麻烦，真正缺时间时比多打一场小胜更值钱。" },
    { id: "armor-durability", title: "耳语：裂甲败仗", text: "老佣兵敲了敲杯沿，像是在替某场没人愿意提起的败仗敲钟。", result: "老佣兵敲了敲杯沿：出门前把装备耐久补满，很多败仗不是输给怪物，是输给半路裂开的护甲。" },
    { id: "monthly-forge-stock", title: "耳语：月初炉火", text: "酒保擦杯子的手没有停，只把铁匠铺那边的消息轻轻抛给你。", result: "酒保说，橡树小镇的月初铁匠铺会换新货；想碰运气，就别把所有金币都喝进肚子里。" },
  ],
};
