function handleAllyTownAction(action, value) {
  const actionMeta = typeof townActionDef === "function" ? townActionDef(action) : null;
  if (action?.startsWith("focus-")) {
    setAllyFocus(actionMeta?.target || action.replace("focus-", ""));
    return;
  }
  if (action === "square") {
    closeAllyPoint();
    return;
  }
  if (action === "rest-full") {
    openRestConfirmModal();
    return;
  }
  if (action === "stash") {
    addLine(actionMeta?.message || "营地边的旧木箱已经掀开，皮带、药瓶和备用火石被一件件摆到毯子上。", "system");
    render();
    return;
  }
  const timeCost = allyTownActionTimeCost(action);
  if (action === "item-shop-placeholder") {
    if (timeCost) advanceTownDate(timeCost, "在道具店挑拣货箱");
    const shop = typeof townShopConfig === "function" ? townShopConfig(actionMeta?.shopRole || "item") : null;
    openShop(shop?.shopId || "oak_town", {
      filter: shop?.filter || "consumables",
      title: shop?.title || "道具店",
      desc: shop?.desc || "这里出售生命药剂、法力药剂、战斗补给和赶路道具。商品每月刷新一次。",
    });
    return;
  }
  if (action === "equipment-shop-placeholder") {
    if (timeCost) advanceTownDate(timeCost, "在铁匠铺试刃披甲");
    const shop = typeof townShopConfig === "function" ? townShopConfig(actionMeta?.shopRole || "forge") : null;
    openShop(shop?.shopId || "oak_town", {
      filter: shop?.filter || "magic-smith",
      title: shop?.title || "铁匠铺",
      desc: shop?.desc || "这里出售本月新锻造的武器和护甲。商品每月刷新一次，买完后需要等下月更新。",
    });
    return;
  }
  if (action === "repair-equipped" || action === "repair-all") {
    repairAllyEquipment(action === "repair-equipped" ? "equipped" : "all");
    return;
  }
  if (action === "bar-ale") {
    drinkTownBar(actionMeta?.drink || "ale");
    return;
  }
  if (action === "bar-oak-wine") {
    drinkTownBar(actionMeta?.drink || "oakWine");
    return;
  }
  if (action === "bar-gamble") {
    gambleTownBar();
    return;
  }
  if (action === "bar-rumor") {
    hearTownBarRumor();
    return;
  }
  if (action === "guild-rumor") {
    openGuildRumorEvent();
    return;
  }
  if (action?.startsWith("learn-skill-")) {
    learnAllyTrainingSkill(action.replace("learn-skill-", ""));
    return;
  }
  if (action?.startsWith("train-skill-")) {
    trainAllyTrainingSkill(action.replace("train-skill-", ""));
    return;
  }
  if (action?.startsWith("work-job-")) {
    startTownWork(action.replace("work-job-", ""));
    return;
  }
  if (timeCost) advanceTownDate(timeCost, `在${typeof currentTownTitle === "function" ? currentTownTitle() : "小镇"}奔走`);
  const placeholderMessages = {
    "repair-placeholder": "铁匠把修台清了出来，只等你把裂甲和缺口的兵刃递上去。",
    "basic-skill-training-placeholder": "校场木桩已经排好，教头说等规矩定下，便能把粗浅招式练成真本事。",
    "work-placeholder": "行会书记员在羊皮册上记下你的名字，今日的跑腿差事算是接下了。",
    "guild-commission-placeholder": "悬赏委托暂未开放。之后这里会出现更危险、奖励更高的任务。",
    "guild-rumor-placeholder": "书记员合上密报簿，低声说各地传闻尚未誊清，晚些再来。",
  };
  if (placeholderMessages[action]) {
    addLine(actionMeta?.message || placeholderMessages[action], "system");
    render();
    return;
  }
  if (actionMeta?.type === "message" && actionMeta.message) {
    addLine(actionMeta.message, "system");
    render();
    return;
  }
  if (action === "shop-sell") {
    addLine("柜台后的秤盘已经擦亮，等收购章程写好，便可把战利品换成金子。", "system");
    render();
    return;
  }
  if (action === "shop-repair") {
    addLine("铁砧已被炉火烤热，等铁匠报出工钱，裂开的兵甲就能重新上阵。", "system");
    render();
    return;
  }
  if (action === "enter-dungeon") {
    openDungeonPrepModal(Number(value || 0));
    return;
  }
}

function allyTownVisualFocus(focus = state.allyFocus) {
  return typeof townVisualFocus === "function" ? townVisualFocus(focus) : ({
    repair: "forge",
    "learn-skills": "training",
    "train-skills": "training",
    "work-contracts": "work",
  }[focus] || focus);
}

function sceneVisual() {
  if (state.worldMode === "ally" || state.mode === "ally") {
    const focus = state.allyFocus || "root";
    const sceneKey = typeof currentTownSceneKey === "function" ? currentTownSceneKey() : "橡树小镇";
    const title = typeof currentTownTitle === "function" ? currentTownTitle() : "橡树小镇";
    const visual = (typeof townVisualConfig === "function" ? townVisualConfig(focus) : null)
      || SCENE_VISUALS[sceneKey]
      || SCENE_VISUALS.default;
    const regionTitle = focus && focus !== "root"
      ? `${title}:${visual.title}`
      : title;
    return {
      kind: "scene",
      title: visual.title,
      desc: visual.desc,
      bg: visual.bg,
      accent: visual.accent,
      region: regionTitle,
      mood: visual.mood,
      clouds: visual.clouds,
      rays: visual.rays,
      landscape: visual.landscape,
      image: visual.image,
    };
  }
  const region = regionName();
  const visualKey = state.fixedSceneVisual || region;
  const visual = SCENE_VISUALS[visualKey] || SCENE_VISUALS[region] || SCENE_VISUALS.default;
  return {
    kind: "scene",
    title: visual.title,
    desc: visual.desc,
    bg: visual.bg,
    accent: visual.accent,
    region: visualKey,
    mood: visual.mood,
    clouds: visual.clouds,
    rays: visual.rays,
    landscape: visual.landscape,
    image: visual.image,
  };
}
