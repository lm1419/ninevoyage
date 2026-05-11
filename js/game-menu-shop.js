function openMenu(tab = "bag", options = {}) {
  const modal = $("menuModal");
  const homeMode = options.homeAbout ? "home-about" :
      options.home ? "home-settings" : "";
  if (state?.mode === "shop") {
    state.mode = state.worldMode === "ally" ? "ally" : "free";
    state.currentShopId = null;
    state.currentShopFilter = "";
    state.currentShopTitle = "";
    state.currentShopDesc = "";
  }
  if (typeof openMultiTabModal === "function") {
    openMultiTabModal({
      mode: homeMode,
      classes: homeMode ? [`modal--${homeMode}`] : [],
      title: homeMode === "home-about" ? "\u5173\u4e8e" :
        homeMode === "home-settings" && tab === "system" ? "\u8bbe\u7f6e" : "\u83dc\u5355",
      closeLabel: "\u5173\u95ed",
    });
    renderMenu(tab);
    return;
  }
  modal.dataset.menuMode = homeMode;
  modal.classList.toggle("modal--home-settings", homeMode === "home-settings");
  modal.classList.toggle("modal--home-about", homeMode === "home-about");
  const title = $("menuTitle");
  if (title) {
    title.textContent =
      homeMode === "home-about" ? "关于" :
        homeMode === "home-settings" && tab === "system" ? "设置" : "菜单";
  }
  modal.classList.add("active");
  renderMenu(tab);
}

function openShop(shopId, options = {}) {
  state.mode = "shop";
  state.currentShopId = shopId;
  state.currentShopFilter = options.filter || "";
  state.currentShopTitle = options.title || "";
  state.currentShopDesc = options.desc || "";
  initShopStock(shopId);
  const modal = $("menuModal");
  if (typeof openMultiTabModal === "function") {
    openMultiTabModal({
      mode: "shop",
      classes: [],
      closeLabel: "\u79bb\u5f00",
      hideTabs: true,
    });
    renderMenu("shop");
    render();
    return;
  }
  modal.dataset.menuMode = "shop";
  modal.classList.remove("modal--home-settings", "modal--home-about");
  modal.classList.add("active");
  renderMenu("shop");
  render();
}

function calendarMonthKey(calendar = state?.calendar) {
  const parts = typeof calendarParts === "function" ? calendarParts(calendar) : null;
  if (parts) return `${parts.year}-${parts.month}`;
  const elapsedDays = Math.max(0, Math.floor(Number(calendar?.elapsedDays) || 0));
  return String(Math.floor(elapsedDays / 30));
}

function ensureMonthlySmithGoods(shopId = "oak_town") {
  if (!state) return;
  const townId = typeof currentTownId === "function" ? currentTownId() : "oak_town";
  const forgeShop = typeof townShopConfig === "function" ? townShopConfig("forge", townId) : null;
  if (forgeShop?.shopId && shopId !== forgeShop.shopId) return;
  state.monthlyShopGoods = state.monthlyShopGoods || {};
  const monthKey = calendarMonthKey();
  const stockKey = forgeShop?.monthlyStockKey || "forge";
  state.monthlyShopGoods[townId] = state.monthlyShopGoods[townId] || {};
  const current = state.monthlyShopGoods[townId][stockKey];
  if (current?.monthKey === monthKey && Array.isArray(current.goods)) return;
  const weaponId = createEquipmentInstance("travelerSword", state, { rarity: "magic" });
  const armorId = createEquipmentInstance("studdedJerkin", state, { rarity: "magic" });
  state.monthlyShopGoods[townId][stockKey] = {
    monthKey,
    goods: [
      { type: "equipment", id: weaponId, stock: 1 },
      { type: "equipment", id: armorId, stock: 1 },
    ].filter((good) => good.id),
  };
}

function renderMenu(tab) {
  // 变量：tabs，菜单页签配置，决定可切换的背包、技能、装备等页面。
  const allTabs = [
    ["bag", "背包"],
    ["detail", "状态"],
    ["skill", "技能"],
    ["equip", "装备"],
    ["shop", "商店"],
    ["help", "帮助"],
    ["about", "关于"],
    ["system", "设置"],
  ];
  const tabs = tab === "shop"
    ? allTabs.filter(([id]) => id === "shop")
    : allTabs.filter(([id]) => !["shop", "help"].includes(id));
  const tabsElement = $("menuTabs");
  const modal = $("menuModal");
  const menuIconMap = {
    bag: "bag",
    detail: "person",
    skill: "spark",
    equip: "sword",
    shop: "coin",
    help: "help",
    about: "info",
    system: "gear",
  };
  if (modal) {
    modal.dataset.activeMenuTab = tab;
    modal.dataset.menuIcon = menuIconMap[tab] || "menu";
  }
  if (typeof setMultiTabModalTabs === "function") {
    setMultiTabModalTabs({ tabs, activeTab: tab, onSelectTab: renderMenu });
  } else {
    tabsElement.innerHTML = "";
    tabsElement.classList.toggle("tabs--hidden", tabs.length <= 1);
    tabs.forEach(([id, label]) =>
      tabsElement.appendChild(
        makeButton(label, () => renderMenu(id), id === tab ? "primary" : ""),
      ),
    );
  }
  // 变量：content，当前菜单页的内容容器。
  const content = $("menuContent");
  hideAboutInfoModal(content);
  content.innerHTML = "";
  const title = $("menuTitle");
  const closeButton = $("closeMenu");
  const menuTitleMap = {
    bag: "\u80cc\u5305",
    detail: "\u72b6\u6001",
    skill: "\u6280\u80fd",
    equip: "\u88c5\u5907",
    shop: "\u5546\u5e97",
    help: "\u5e2e\u52a9",
    about: "\u5173\u4e8e",
    system: "\u8bbe\u7f6e",
  };
  if (tab === "shop") {
    const shop = SHOP_DB[state.currentShopId];
    if (title) title.textContent = state.currentShopTitle || shop?.name || "商店";
    if (closeButton) closeButton.textContent = "离开";
  } else {
    if (title) title.innerHTML = `<span class="menu-title-main">${menuTitleMap[tab] || "\u83dc\u5355"}</span>`;
    if (closeButton) closeButton.textContent = "关闭";
  }
  if (typeof updateMultiTabModalShell === "function") {
    if (tab === "shop") {
      const shop = SHOP_DB[state.currentShopId];
      updateMultiTabModalShell({
        title: state.currentShopTitle || shop?.name || "\u5546\u5e97",
        closeLabel: "\u79bb\u5f00",
      });
    } else {
      updateMultiTabModalShell({
        titleHtml: `<span class="menu-title-main">${menuTitleMap[tab] || "\u83dc\u5355"}</span>`,
        closeLabel: "\u5173\u95ed",
      });
    }
  }
  if (tab === "bag") renderBag(content);
  if (tab === "skill") renderSkills(content);
  if (tab === "equip") renderEquip(content);
  if (tab === "shop") renderShop(content);
  if (tab === "detail") renderDetails(content);
  if (tab === "help") renderHelp(content);
  if (tab === "about") renderAbout(content);
  if (tab === "system") renderSystem(content);
}

function renderBag(content) {
  // 变量：entries，背包中数量大于 0 的物品条目。
  const entries = Object.entries(state.inventory).filter(([, n]) => n > 0);

  if (!entries.length) {
    content.innerHTML = `<p class="footnote">背包空空，风吹得很有礼貌。</p>`;
    return;
  }

  // 变量：consumables，消耗品条目列表。
  const consumables = entries.filter(([id]) => ITEM_DB[id]?.type === "consumable");
  // 变量：passives，宝物条目列表。
  const passives = entries.filter(([id]) => ITEM_DB[id]?.type === "passive");
  if (consumables.length || passives.length) ensureItemCardStyle();

  // 变量：wrapper，背包主容器。
  const wrapper = document.createElement("div");
  wrapper.className = "bag-wrapper";

  // ── 消耗品 ──
  if (consumables.length) {
    // 变量：sec，消耗品分区。
    const sec = document.createElement("div");
    sec.className = "bag-section";
    sec.innerHTML = `<div class="bag-section-head"><span class="bag-section-mark"></span><span class="bag-section-label">消耗品</span></div>`;
    const grid = document.createElement("div");
    grid.className = "equip-grid equip-grid--unified bag-consumable-grid";
    consumables.forEach(([id, n]) => {
      grid.appendChild(consumableChoiceCard(id, n));
    });
    sec.appendChild(grid);
    wrapper.appendChild(sec);
  }

  // ── 宝物 ──
  if (passives.length) {
    // 变量：sec，宝物分区。
    const sec = document.createElement("div");
    sec.className = "bag-section";
    sec.innerHTML = `<div class="bag-section-head"><span class="bag-section-mark bag-section-mark--gold"></span><span class="bag-section-label bag-section-label--gold">宝物</span></div>`;
    const grid = document.createElement("div");
    grid.className = "equip-grid equip-grid--unified bag-consumable-grid";
    passives.forEach(([id, n]) => {
      grid.appendChild(passiveChoiceCard(id, n));
    });
    sec.appendChild(grid);
    wrapper.appendChild(sec);
  }

  content.appendChild(wrapper);
}

function consumableChoiceCard(id, count) {
  const item = ITEM_DB[id];
  const card = document.createElement("div");
  card.className = `equip-card item-card equip-rarity--common bag-consumable-card ${consumableThemeClass(item)}`;
  card.innerHTML = consumableCardHtml(item, count);

  const actionWrap = document.createElement("div");
  actionWrap.className = "equip-action-wrap";
  actionWrap.appendChild(
    makeButton("使用", () => useItem(id), "primary", state.mode === "battle" && item.scope === "battle" && false),
  );
  card.appendChild(actionWrap);
  return card;
}

function consumableCardHtml(item, count) {
  const scopeLabel = itemScopeLabel(item);
  const typeLabel = item.consumableType || "\u6d88\u8017\u54c1";
  return `
    <div class="equip-v2-top">
      <span class="equip-v2-grade">${escapeHtml(typeLabel)}</span>
      <strong class="equip-card-name">${escapeHtml(item.name)}</strong>
    </div>
    <div class="equip-card-subtitle">
      <span>&#25345;&#26377; x${count}</span>
      <span>${scopeLabel}</span>
      ${Number.isFinite(Number(item.price)) ? `<span>&#21806;&#20215; ${item.price}</span>` : ""}
    </div>
    <div class="equip-v2-core">
      <span>&#20351;&#29992;&#21518;</span><strong>&#28040;&#32791; 1</strong>
    </div>
    <div class="equip-affix-block">
      <ul class="equip-affixes">
        <li class="equip-affix equip-affix--misc">
          <strong class="equip-affix-value">${escapeHtml(item.desc)}</strong>
        </li>
      </ul>
    </div>
    <p class="equip-card-desc">${escapeHtml(item.flavor || item.desc)}</p>
  `;
}


function passiveChoiceCard(id, count) {
  const item = ITEM_DB[id];
  const card = document.createElement("div");
  card.className = "equip-card item-card equip-rarity--rare bag-consumable-card bag-consumable-card--passive";
  card.innerHTML = passiveCardHtml(item, count);
  return card;
}

function passiveCardHtml(item, count) {
  const scopeLabel = itemScopeLabel(item);
  return `
    <div class="equip-v2-top">
      <span class="equip-v2-grade">&#23453;&#29289;</span>
      <strong class="equip-card-name">${escapeHtml(item.name)}</strong>
    </div>
    <div class="equip-card-subtitle">
      <span>&#25345;&#26377; x${count}</span>
      <span>${scopeLabel}</span>
    </div>
    <div class="equip-v2-core">
      <span>&#24102;&#26377;&#25928;&#26524;</span><strong>&#25345;&#32493;</strong>
    </div>
    <div class="equip-affix-block">
      <ul class="equip-affixes">
        <li class="equip-affix equip-affix--misc">
          <strong class="equip-affix-value">${escapeHtml(item.desc)}</strong>
        </li>
      </ul>
    </div>
    <p class="equip-card-desc">${escapeHtml(item.flavor || item.desc)}</p>
  `;
}

function consumableThemeClass(item) {
  return item?.theme ? `bag-consumable-card--${String(item.theme).replace(/[^a-z0-9_-]/gi, "")}` : "";
}

function itemScopeLabel(item) {
  return item.scope === "battle"
    ? "战斗"
    : item.scope === "any"
      ? "通用"
      : "常驻";
}

function renderSkills(content) {
  // 变量：panelState，技能页的临时 UI 状态，不写入存档。
  const panelState = skillPanelState();
  // 变量：items，技能展示模型，整合当前等级、分类、升级和快捷状态。
  const items = buildSkillViewModels();
  // 变量：visibleItems，经过筛选和搜索后的技能列表。
  const visibleItems = items.filter((item) => skillVisibleInPanel(item, panelState));
  if (!visibleItems.some((item) => item.id === panelState.selectedId)) {
    panelState.selectedId =
      visibleItems.find((item) => item.canUpgrade)?.id ||
      visibleItems.find((item) => item.selectedQuick)?.id ||
      visibleItems[0]?.id ||
      null;
  }
  // 变量：selectedItem，详情面板当前展示的技能。
  const selectedItem = items.find((item) => item.id === panelState.selectedId) || visibleItems[0] || null;

  const panel = document.createElement("section");
  panel.className = "skill-panel";
  panel.appendChild(renderSkillSummary(items));
  panel.appendChild(renderSkillToolbar(items, panelState));

  const layout = document.createElement("div");
  layout.className = "skill-layout";

  const list = document.createElement("div");
  list.className = "skill-card-list";
  if (!items.length) {
    list.innerHTML = `<p class="footnote skill-empty">还没有学会技能。可通过战斗、事件或调试功能获得新的战斗招式。</p>`;
  } else if (!visibleItems.length) {
    list.innerHTML = `<p class="footnote skill-empty">当前筛选下没有技能。换个分类或搜索词试试。</p>`;
  } else {
    visibleItems.forEach((item) => list.appendChild(renderSkillCard(item, panelState)));
  }

  layout.appendChild(list);
  layout.appendChild(renderSkillDetail(selectedItem));
  panel.appendChild(layout);

  const paragraph = document.createElement("p");
  paragraph.className = "footnote skill-panel-note";
  paragraph.textContent = `当前 MP ${state.player.mp ?? 30}/${state.player.maxMp ?? 30}。升级消耗金币；效果型技能达到对应等级后可在战斗外施展。`;

  content.appendChild(panel);
  content.appendChild(paragraph);

  if (panelState.refocusSearch) {
    const caret = panelState.query.length;
    requestAnimationFrame(() => {
      const input = content.querySelector(".skill-search-input");
      if (input) {
        input.focus();
        input.setSelectionRange(caret, caret);
      }
      panelState.refocusSearch = false;
    });
  }
}

function skillPanelState() {
  window.__skillPanelState = window.__skillPanelState || {
    filter: "all",
    query: "",
    selectedId: null,
    refocusSearch: false,
  };
  const panelState = window.__skillPanelState;
  if (!["all", "upgradable", "combat", "effect", "passive"].includes(panelState.filter)) {
    panelState.filter = "all";
  }
  panelState.query = String(panelState.query || "");
  return panelState;
}

function buildSkillViewModels() {
  const quickId = quickPlayerSkill()?.id || null;
  return knownPlayerSkills()
    .map((skill, index) => {
      const base = PLAYER_SKILLS[skill.id];
      if (!base) return null;
      const maxLevel = Math.max(base.maxLevel || 1, base.levels?.length || 0);
      const level = clamp(Number(skill.level) || 1, 1, maxLevel);
      const currentData = getSkillLevelData(base, level) || skill;
      const nextData = level < maxLevel ? getSkillLevelData(base, level + 1) : null;
      const cat = skillCategoryMeta(skill, base);
      const active = isActivePlayerSkill(currentData);
      const cooldown = state.player.skillCooldowns?.[skill.id] || 0;
      const canUpgrade = maxLevel > 1 && level < maxLevel;
      const upgradeCost = canUpgrade ? upgradeGoldCost(level) : 0;
      const selectedQuick = quickId === skill.id;
      const searchText = [
        skill.name,
        cat.label,
        currentData.desc,
        nextData?.desc,
        ...(base.levels || []).map((item) => item.desc),
      ].join(" ").toLowerCase();
      return {
        id: skill.id,
        index,
        base,
        skill: currentData,
        nextData,
        cat,
        level,
        maxLevel,
        active,
        cooldown,
        canUse: active && canUsePlayerSkill({ id: skill.id, ...currentData }),
        canUpgrade,
        upgradeCost,
        canAffordUpgrade: state.gold >= upgradeCost,
        selectedQuick,
        searchText,
      };
    })
    .filter(Boolean)
    .sort(compareSkillViewModels);
}

function compareSkillViewModels(a, b) {
  const categoryOrder = { combat: 0, buff: 1, status: 2, passive: 3 };
  return (
    Number(b.canUpgrade) - Number(a.canUpgrade) ||
    Number(b.selectedQuick) - Number(a.selectedQuick) ||
    categoryOrder[a.cat.css] - categoryOrder[b.cat.css] ||
    a.index - b.index
  );
}

function skillCategoryMeta(skill, base) {
  if (skill.passive || base?.passive) return { css: "passive", label: "被动型", filter: "passive" };
  if (base?.kind === "combat") return { css: "combat", label: "主动·战斗型", filter: "combat" };
  if (base?.kind === "status") return { css: "status", label: "主动·状态型", filter: "effect" };
  return { css: "buff", label: "主动·效果型", filter: "effect" };
}

function skillVisibleInPanel(item, panelState) {
  const query = panelState.query.trim().toLowerCase();
  const byFilter =
    panelState.filter === "all" ||
    (panelState.filter === "upgradable" && item.canUpgrade) ||
    panelState.filter === item.cat.filter;
  return byFilter && (!query || item.searchText.includes(query));
}

function renderSkillSummary(items) {
  const summary = document.createElement("div");
  summary.className = "skill-summary";
  const upgradable = items.filter((item) => item.canUpgrade).length;
  const active = items.filter((item) => item.active).length;
  const passive = items.length - active;
  const quick = items.find((item) => item.selectedQuick)?.skill.name || "未设置";
  summary.innerHTML = `
    ${skillSummaryCell("已学技能", `${items.length}`, `${active} 主动 / ${passive} 被动`)}
    ${skillSummaryCell("可升级", `${upgradable}`, `金币 ${state.gold}`)}
    ${skillSummaryCell("技能资源", `${state.player.mp ?? 30}/${state.player.maxMp ?? 30}`, "当前 MP")}
    ${skillSummaryCell("快捷技能", quick, "战斗栏优先释放")}
  `;
  return summary;
}

function skillSummaryCell(label, value, hint) {
  return `
    <div class="skill-summary-cell">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(value)}</strong>
      <small>${escapeHtml(hint)}</small>
    </div>
  `;
}

function renderSkillToolbar(items, panelState) {
  const toolbar = document.createElement("div");
  toolbar.className = "skill-toolbar";
  const filters = [
    ["all", "全部", items.length],
    ["upgradable", "可升级", items.filter((item) => item.canUpgrade).length],
    ["combat", "战斗", items.filter((item) => item.cat.filter === "combat").length],
    ["effect", "效果", items.filter((item) => item.cat.filter === "effect").length],
    ["passive", "被动", items.filter((item) => item.cat.filter === "passive").length],
  ];

  const filterWrap = document.createElement("div");
  filterWrap.className = "skill-filters";
  filters.forEach(([id, label, count]) => {
    const button = makeButton(
      `${label} ${count}`,
      () => {
        panelState.filter = id;
        renderMenu("skill");
      },
      `skill-filter-btn ${panelState.filter === id ? "primary" : ""}`.trim(),
    );
    filterWrap.appendChild(button);
  });

  const search = document.createElement("label");
  search.className = "skill-search";
  search.innerHTML = `<span>查找</span>`;
  const input = document.createElement("input");
  input.className = "skill-search-input";
  input.type = "search";
  input.placeholder = "名称 / 效果";
  input.value = panelState.query;
  input.addEventListener("input", () => {
    panelState.query = input.value;
    panelState.refocusSearch = true;
    renderMenu("skill");
  });
  search.appendChild(input);

  toolbar.appendChild(filterWrap);
  toolbar.appendChild(search);
  return toolbar;
}

function renderSkillCard(item, panelState) {
  const card = document.createElement("article");
  card.className = [
    "skill-card",
    `skill-card--${item.cat.css}`,
    item.canUpgrade ? "skill-card--upgradable" : "skill-card--maxed",
    item.selectedQuick ? "skill-card--quick" : "",
    panelState.selectedId === item.id ? "is-selected" : "",
  ].filter(Boolean).join(" ");

  const main = document.createElement("button");
  main.type = "button";
  main.className = "skill-card-main";
  main.innerHTML = skillCardMainHtml(item);
  main.addEventListener("click", () => {
    panelState.selectedId = item.id;
    renderMenu("skill");
  });
  card.appendChild(main);

  const actions = document.createElement("div");
  actions.className = "skill-card-actions";
  if (item.canUpgrade) {
    const upgradeButton = makeButton(
      `升级 ${item.upgradeCost}金`,
      () => upgradeSkill(item.id),
      "primary skill-action skill-action--upgrade",
      !item.canAffordUpgrade,
    );
    upgradeButton.title = item.canAffordUpgrade ? "提升到下一等级" : "金币不足";
    actions.appendChild(upgradeButton);
  }
  if (item.active) {
    const useButton = makeButton(
      "施展",
      () => usePlayerSkill(item.id),
      `${item.canUpgrade ? "" : "primary"} skill-action`.trim(),
      !item.canUse,
    );
    useButton.title = skillUseStateLabel(item);
    actions.appendChild(useButton);

    const quickButton = makeButton(
      item.selectedQuick ? "快捷中" : "设快捷",
      () => {
        setQuickPlayerSkill(item.id);
        panelState.selectedId = item.id;
        renderMenu("skill");
      },
      item.selectedQuick ? "primary skill-action" : "skill-action",
      item.selectedQuick,
    );
    actions.appendChild(quickButton);
  }
  card.appendChild(actions);
  return card;
}

function skillCardMainHtml(item) {
  const desc = item.skill.desc || item.base.desc || "暂无说明。";
  const status = item.active ? skillUseStateLabel(item) : "常驻生效";
  const nextPreview = item.canUpgrade && item.nextData?.desc
    ? `<div class="skill-card-next"><span>下一阶</span><strong>${escapeHtml(item.nextData.desc)}</strong></div>`
    : "";
  return `
    <div class="skill-card-head">
      <span class="skill-cat-badge skill-cat-badge--${item.cat.css}">${escapeHtml(item.cat.label)}</span>
      ${item.selectedQuick ? `<span class="skill-card-quick">快捷</span>` : ""}
      <span class="skill-card-state">${item.canUpgrade ? "可升级" : "已满级"}</span>
    </div>
    <div class="skill-card-title">
      <strong>${escapeHtml(item.skill.name)}</strong>
      <span>Lv.${item.level}/${item.maxLevel}</span>
    </div>
    <div class="skill-level-pips" aria-hidden="true">${skillLevelPips(item.level, item.maxLevel)}</div>
    <p class="skill-card-desc">${escapeHtml(desc)}</p>
    <div class="skill-card-meta">
      <span>${escapeHtml(skillCostLabel(item.skill))}</span>
      <span>${escapeHtml(status)}</span>
    </div>
    ${nextPreview}
  `;
}

function skillLevelPips(level, maxLevel) {
  return Array.from({ length: maxLevel }, (_, index) => {
    const active = index < level ? "is-filled" : "";
    return `<span class="${active}"></span>`;
  }).join("");
}

function renderSkillDetail(item) {
  const detail = document.createElement("aside");
  detail.className = "skill-detail";
  if (!item) {
    detail.innerHTML = `<p class="footnote">选择一项技能查看等级效果。</p>`;
    return detail;
  }
  const nextBlock = item.canUpgrade
    ? `
      <div class="skill-detail-next">
        <span>升级预览</span>
        <strong>Lv.${item.level + 1}</strong>
        <p>${escapeHtml(item.nextData?.desc || "下一等级暂无说明。")}</p>
        <small>${item.canAffordUpgrade ? "可升级" : "金币不足"} · 需要 ${item.upgradeCost} 金币</small>
      </div>
    `
    : `
      <div class="skill-detail-next skill-detail-next--max">
        <span>升级预览</span>
        <strong>已达上限</strong>
        <p>当前技能已发挥全部等级效果。</p>
      </div>
    `;
  detail.innerHTML = `
    <div class="skill-detail-head">
      <span class="skill-cat-badge skill-cat-badge--${item.cat.css}">${escapeHtml(item.cat.label)}</span>
      <h3>${escapeHtml(item.skill.name)}</h3>
      <p>${escapeHtml(item.active ? skillUseStateLabel(item) : "被动技能会持续生效。")}</p>
    </div>
    <div class="skill-detail-stats">
      <span><small>当前等级</small><strong>Lv.${item.level}</strong></span>
      <span><small>最高等级</small><strong>Lv.${item.maxLevel}</strong></span>
      <span><small>升级消耗</small><strong>${item.canUpgrade ? `${item.upgradeCost}金` : "无"}</strong></span>
    </div>
    ${nextBlock}
    <div class="skill-level-track">
      <div class="skill-level-track-title">等级效果</div>
      ${skillLevelTrackHtml(item)}
    </div>
  `;
  return detail;
}

function skillLevelTrackHtml(item) {
  const levelCount = Math.max(item.maxLevel, item.base.levels?.length || 0, 1);
  return Array.from({ length: levelCount }, (_, index) => {
    const level = index + 1;
    const data = getSkillLevelData(item.base, level) || item.base;
    const stateClass = level < item.level
      ? "is-mastered"
      : level === item.level
        ? "is-current"
        : level === item.level + 1
          ? "is-next"
          : "is-locked";
    const stateLabel = level < item.level
      ? "已掌握"
      : level === item.level
        ? "当前"
        : level === item.level + 1
          ? "下一阶"
          : "未解锁";
    const unlockCost = level === 1 ? "习得" : `升级 ${upgradeGoldCost(level - 1)} 金`;
    return `
      <div class="skill-level-row ${stateClass}">
        <div class="skill-level-mark">
          <strong>Lv.${level}</strong>
          <span>${stateLabel}</span>
        </div>
        <div class="skill-level-body">
          <p>${escapeHtml(data.desc || item.base.desc || "暂无说明。")}</p>
          <div class="skill-level-tags">
            <span>${escapeHtml(unlockCost)}</span>
            ${skillEffectTagsHtml(data, item.base)}
          </div>
        </div>
      </div>
    `;
  }).join("");
}

function skillEffectTagsHtml(data, base) {
  const tags = [];
  if (base.category === "active") tags.push(skillCostLabel(data));
  if (data.cooldown) tags.push(`冷却 ${data.cooldown} 回合`);
  if (data.usableOutsideBattle) tags.push("战斗外可用");
  if (data.multiplier) tags.push(`伤害 ${Math.round(data.multiplier * 100)}%`);
  if (data.applyStatus?.id) tags.push(`状态 ${skillStatusName(data.applyStatus.id)}`);
  if (data.buffs?.length) {
    data.buffs.forEach((buff) => {
      tags.push(`${skillStatName(buff.stat)} ${skillSignedValue(buff.amount)}${buff.duration ? ` · ${buff.duration}回合` : ""}`);
    });
  }
  return tags.map((tag) => `<span>${escapeHtml(tag)}</span>`).join("");
}

function skillCostLabel(skill) {
  if (!skill || skill.category !== "active") return "无消耗";
  return skill.cost ? `消耗 ${skill.cost} MP` : "不消耗 MP";
}

function skillUseStateLabel(item) {
  if (!item.active) return "被动生效";
  const mp = state.player.mp ?? state.player.maxMp ?? 30;
  if (item.cooldown > 0) return `冷却 ${item.cooldown} 回合`;
  if (mp < (item.skill.cost || 0)) return "MP 不足";
  if (state.mode !== "battle" && !item.skill.usableOutsideBattle) return "需战斗中";
  return "可施展";
}

function skillStatusName(id) {
  if (typeof STATUS_DB !== "undefined" && STATUS_DB[id]?.name) return STATUS_DB[id].name;
  return id;
}

function skillStatName(stat) {
  const labels = {
    tempAtk: "攻击",
    tempAtkRate: "攻击",
    tempDamageReduction: "免伤",
    tempSpeed: "速度",
  };
  return labels[stat] || stat || "效果";
}

function skillSignedValue(value) {
  const number = Number(value) || 0;
  if (Math.abs(number) < 1 && number !== 0) return `${number > 0 ? "+" : ""}${Math.round(number * 100)}%`;
  return `${number > 0 ? "+" : ""}${number}`;
}

function useItem(id) {
  // 变量：item，当前背包物品配置。
  const item = ITEM_DB[id];
  if (typing) return;
  if (!state.inventory[id]) return;
  // 变量：inBattle，当前是否处于战斗模式。
  const inBattle = state.mode === "battle";
  if (inBattle && !beginPlayerAction()) {
    closeMenu();
    render();
    return;
  }
  state.inventory[id] -= 1;
  // 变量：msg，事件、道具或战斗流程返回的提示文本。
  const msg = item.use(state);
  if (typeof playGameSfx === "function") playGameSfx("item");
  addLine(`使用 ${item.name}。${msg}`, "reward");
  if (inBattle) {
    finishPlayerAction();
    closeMenu();
    render();
    return;
  }
  checkPlayerAlive();
  render();
  renderMenu("bag");
}

function renderEquip(content) {
  ensureItemCardStyle();
  const items = state.ownedEquip
    .filter(id => getEquipment(id)?.slot === "weapon" || getEquipment(id)?.slot === "armor")
    .sort(compareEquipmentChoiceIds);

  // 变量：slots，当前穿戴的武器和护具槽位。
  const slots = document.createElement("div");
  slots.className = "equip-slots";
  slots.innerHTML = ["weapon", "armor"].map(equipmentSlotHtml).join("");
  content.appendChild(slots);
  slots.querySelectorAll("[data-unequip-slot]").forEach((button) => {
    button.addEventListener("click", () => unequipSlot(button.dataset.unequipSlot));
  });

  // 变量：grid，待选装备统一网格容器。
  const grid = document.createElement("div");
  grid.className = "equip-grid equip-grid--unified";

  if (!items.length) {
    const empty = document.createElement("p");
    empty.className = "equip-empty equip-empty--unified";
    empty.textContent = "暂无待选装备";
    grid.appendChild(empty);
  } else {
    items.forEach(id => grid.appendChild(equipmentChoiceCard(id)));
  }

  content.appendChild(grid);
  // 变量：paragraph，日志或面板里的段落节点，用于承载一行文本说明。
  const paragraph = document.createElement("p");
  paragraph.className = "footnote";
  paragraph.textContent = "战斗中不能更换装备。";
  content.appendChild(paragraph);
}

function equipmentChoiceCard(id) {
  const e = getEquipment(id);
  const slot = e.slot;
  const equipped = state.equipments[slot] === id;
  const broken = equipmentDurabilityValue(id) <= 0;
  const card = document.createElement("div");
  card.className = `equip-card item-card equip-rarity--${equipmentRarity(e)}` + (equipped ? " equip-card--active" : "");
  card.innerHTML = `${equipped ? '<span class="equip-card-equipped">已装备</span>' : ""}
    <div class="equip-v2-top">
      <span class="equip-v2-grade">${equipmentRarityLabel(e)}${equipmentWeightLabel(e)}</span>
      <strong class="equip-card-name">${escapeHtml(e.name)}</strong>
    </div>
    <div class="equip-card-subtitle">
      <span>耐久 ${equipmentDurabilityText(id)}</span>
      <span>售价 ${e.price || 0}</span>
    </div>
    <div class="equip-v2-core">
      <span>${e.slot === "armor" ? "最终免伤" : "最终伤害"}</span><strong>${e.slot === "armor" ? formatPct(e.damageReduction) : statNumber(e.atk)}</strong>
    </div>
    ${equipmentAffixHtml(e)}
    <p class="equip-card-desc">${escapeHtml(e.desc)}</p>`;

  const actionWrap = document.createElement("div");
  actionWrap.className = "equip-action-wrap";
  actionWrap.style.position = "relative";
  actionWrap.style.display = "inline-grid";
  actionWrap.style.justifyItems = "center";
  actionWrap.appendChild(
    makeButton(
      "装备",
      () => {
        if (equipmentDurabilityValue(id) <= 0) {
          addLine(`${e.name} 耐久耗尽，无法装备。`, "warn");
          return;
        }
        state.equipments[slot] = id;
        addLine(`装备 ${e.name}。`, "system");
        render();
        renderMenu("equip");
      },
      "primary",
      equipped || broken || state.mode === "battle",
    ),
  );

  const compare = document.createElement("div");
  compare.className = "equip-hover-compare";
  compare.setAttribute("aria-hidden", "true");
  compare.style.cssText = [
    "display:none",
    "position:absolute",
    "z-index:20",
    "left:50%",
    "bottom:calc(100% + 10px)",
    "width:260px",
    "max-width:min(320px, 76vw)",
    "transform:translateX(-50%)",
    "pointer-events:none",
  ].join(";");
  compare.innerHTML = equipmentCompareHtml(e, equipped);
  styleEquipmentHoverCompare(compare);
  const showCompare = () => {
    compare.style.display = "block";
  };
  const hideCompare = () => {
    compare.style.display = "none";
  };
  actionWrap.addEventListener("mouseenter", showCompare);
  actionWrap.addEventListener("mouseleave", hideCompare);
  actionWrap.addEventListener("focusin", showCompare);
  actionWrap.addEventListener("focusout", hideCompare);
  actionWrap.appendChild(compare);
  card.appendChild(actionWrap);
  return card;
}

function ensureItemCardStyle() {
  if (document.getElementById("item-card-polish-style")) return;
  const style = document.createElement("style");
  style.id = "item-card-polish-style";
  style.textContent = `
    #menuContent .equip-grid.equip-grid--unified {
      display: grid !important;
      grid-template-columns: repeat(4, minmax(0, 1fr)) !important;
      gap: 18px !important;
      align-items: stretch !important;
    }
    #menuContent .equip-grid.equip-grid--unified .equip-card {
      min-width: 0 !important;
    }
    #menuContent .equip-empty--unified {
      grid-column: 1 / -1 !important;
    }
    #menuContent .equip-card.item-card {
      position: relative !important;
      isolation: isolate !important;
      overflow: hidden !important;
      display: flex !important;
      flex-direction: column !important;
      gap: 13px !important;
      padding: 0 18px 16px !important;
      min-height: 400px !important;
      border: 1px solid rgba(132, 100, 43, 0.62) !important;
      border-radius: 8px !important;
      color: #f4ead1 !important;
      background:
        linear-gradient(180deg, rgba(255, 246, 210, 0.07), transparent 30%),
        radial-gradient(circle at 14% 0%, rgba(178, 133, 56, 0.14), transparent 38%),
        linear-gradient(145deg, rgba(18, 14, 10, 0.99), rgba(8, 7, 7, 0.99) 58%, rgba(18, 13, 8, 0.99)) !important;
      box-shadow:
        inset 0 1px 0 rgba(255, 244, 210, 0.08),
        inset 0 0 0 1px rgba(82, 55, 18, 0.4),
        0 16px 30px rgba(0, 0, 0, 0.34) !important;
    }
    #menuContent .equip-card.item-card::before {
      content: "" !important;
      position: absolute !important;
      inset: 0 0 auto !important;
      height: 3px !important;
      background: linear-gradient(90deg, transparent, rgba(151, 112, 45, 0.62), rgba(210, 170, 86, 0.7), rgba(151, 112, 45, 0.62), transparent) !important;
      box-shadow: 0 0 12px rgba(190, 144, 58, 0.18) !important;
    }
    #menuContent .equip-card.item-card::after {
      content: "" !important;
      position: absolute !important;
      inset: 0 !important;
      z-index: 0 !important;
      display: block !important;
      pointer-events: none !important;
      opacity: 0 !important;
      background: radial-gradient(circle at 50% 0%, currentColor, transparent 45%) !important;
    }
    #menuContent .equip-card.item-card > * {
      position: relative !important;
      z-index: 1 !important;
    }
    #menuContent .item-card .equip-v2-top {
      position: relative !important;
      display: flex !important;
      flex-direction: column !important;
      align-items: flex-start !important;
      gap: 8px !important;
      margin: 0 -18px !important;
      padding: 16px 18px 11px !important;
      border-bottom: 1px solid rgba(163, 123, 47, 0.28) !important;
      background:
        linear-gradient(180deg, rgba(255, 235, 176, 0.08), transparent),
        linear-gradient(90deg, rgba(141, 99, 34, 0.22), transparent 54%, rgba(141, 99, 34, 0.14)) !important;
    }
    #menuContent .item-card .equip-v2-grade {
      display: inline-flex !important;
      align-items: center !important;
      width: auto !important;
      min-height: 22px !important;
      padding: 3px 9px !important;
      border: 1px solid rgba(140, 106, 47, 0.48) !important;
      border-radius: 999px !important;
      color: rgba(218, 196, 150, 0.9) !important;
      background: rgba(48, 35, 17, 0.52) !important;
      box-shadow: inset 0 1px 0 rgba(255, 244, 214, 0.09) !important;
      font-size: 12px !important;
      font-weight: 700 !important;
      line-height: 1.2 !important;
    }
    #menuContent .item-card .equip-card-name {
      width: 100% !important;
      padding-right: 0 !important;
      white-space: nowrap !important;
      overflow: hidden !important;
      text-overflow: ellipsis !important;
      color: #ead9b9 !important;
      font-size: 21px !important;
      line-height: 1.25 !important;
      text-align: left !important;
      text-shadow: 0 1px 0 rgba(0, 0, 0, 0.65), 0 0 18px rgba(203, 159, 74, 0.14) !important;
    }
    #menuContent .item-card .equip-card-equipped {
      position: absolute !important;
      top: 0 !important;
      right: 0 !important;
      z-index: 3 !important;
      min-height: 26px !important;
      padding: 5px 12px 5px 14px !important;
      border: 0 !important;
      border-left: 1px solid rgba(255, 231, 171, 0.28) !important;
      border-bottom: 1px solid rgba(255, 231, 171, 0.24) !important;
      border-radius: 0 7px 0 8px !important;
      color: rgba(255, 235, 176, 0.94) !important;
      background:
        linear-gradient(135deg, rgba(144, 96, 30, 0.92), rgba(76, 50, 18, 0.94)) !important;
      box-shadow:
        inset 0 1px 0 rgba(255, 244, 213, 0.16),
        0 8px 18px rgba(0, 0, 0, 0.22) !important;
      font-size: 12px !important;
      font-weight: 700 !important;
      line-height: 1.2 !important;
      letter-spacing: 0.04em !important;
      pointer-events: none !important;
    }
    #menuContent .item-card .equip-card-desc {
      min-height: 42px !important;
    }
    #menuContent .item-card .equip-action-wrap {
      margin-top: auto !important;
      align-self: flex-start !important;
    }
    #menuContent .item-card .equip-card-subtitle {
      display: flex !important;
      justify-content: flex-start !important;
      flex-wrap: wrap !important;
      gap: 8px !important;
      color: rgba(231, 214, 176, 0.86) !important;
      font-size: 13px !important;
      text-align: left !important;
    }
    #menuContent .item-card .equip-card-subtitle > span:not(.equip-card-badge),
    #menuContent .item-card .equip-card-badge {
      padding: 3px 8px !important;
      border: 1px solid rgba(154, 116, 42, 0.34) !important;
      border-radius: 999px !important;
      color: rgba(245, 223, 170, 0.94) !important;
      background: rgba(35, 25, 12, 0.48) !important;
    }
    #menuContent .item-card .equip-v2-core {
      display: flex !important;
      justify-content: flex-start !important;
      align-items: baseline !important;
      gap: 8px !important;
      padding: 10px 12px !important;
      border: 1px solid rgba(159, 119, 42, 0.28) !important;
      border-radius: 6px !important;
      background: linear-gradient(90deg, rgba(91, 64, 22, 0.34), rgba(22, 16, 9, 0.14)) !important;
    }
    #menuContent .item-card .equip-v2-core span {
      color: rgba(237, 222, 186, 0.84) !important;
      font-size: 14px !important;
    }
    #menuContent .item-card .equip-v2-core strong {
      color: #ecd9a8 !important;
      font-size: 20px !important;
      text-shadow: 0 0 14px rgba(235, 186, 84, 0.18) !important;
    }
    #menuContent .item-card .equip-affix-block {
      justify-items: stretch !important;
      gap: 8px !important;
      text-align: left !important;
    }
    #menuContent .item-card .equip-affix-block > span {
      color: rgba(232, 211, 164, 0.78) !important;
      font-size: 13px !important;
      text-align: left !important;
    }
    #menuContent .item-card .equip-affixes {
      gap: 6px !important;
      margin: 0 !important;
      padding: 0 !important;
      color: #e9d49a !important;
      text-align: left !important;
      list-style: none !important;
    }
    #menuContent .item-card .equip-affixes li {
      position: relative !important;
      display: block !important;
      padding-left: 17px !important;
      color: #f2dfaa !important;
      font-size: 14px !important;
      line-height: 1.35 !important;
    }
    #menuContent .item-card .equip-affixes li::before {
      content: "" !important;
      position: absolute !important;
      left: 2px !important;
      top: 0.62em !important;
      width: 5px !important;
      height: 5px !important;
      border-radius: 50% !important;
      background: currentColor !important;
      box-shadow: 0 0 10px currentColor !important;
    }
    #menuContent .item-card .equip-card-desc {
      margin: 0 !important;
      color: rgba(187, 169, 132, 0.8) !important;
      text-align: left !important;
    }
    #menuContent .item-card.equip-rarity--common {
      border-color: rgba(139, 111, 56, 0.5) !important;
      color: rgba(204, 164, 72, 0.1) !important;
    }
    #menuContent .item-card.equip-rarity--common .equip-v2-grade {
      opacity: 0.72 !important;
    }
    #menuContent .item-card.equip-rarity--magic {
      border-color: rgba(76, 112, 174, 0.58) !important;
      color: rgba(83, 130, 210, 0.18) !important;
      background:
        linear-gradient(180deg, rgba(76, 120, 190, 0.08), transparent 31%),
        radial-gradient(circle at 14% 0%, rgba(55, 92, 170, 0.2), transparent 40%),
        linear-gradient(145deg, rgba(15, 17, 24, 0.99), rgba(7, 8, 12, 0.99) 58%, rgba(13, 11, 8, 0.99)) !important;
      box-shadow:
        inset 0 1px 0 rgba(190, 210, 245, 0.06),
        inset 0 0 0 1px rgba(55, 88, 160, 0.22),
        0 0 20px rgba(58, 105, 190, 0.1),
        0 16px 30px rgba(0, 0, 0, 0.34) !important;
    }
    #menuContent .item-card.equip-rarity--magic::before {
      background: linear-gradient(90deg, transparent, rgba(66, 108, 190, 0.56), rgba(132, 164, 220, 0.72), rgba(66, 108, 190, 0.56), transparent) !important;
      box-shadow: 0 0 14px rgba(76, 126, 210, 0.24) !important;
    }
    #menuContent .item-card.equip-rarity--magic::after {
      opacity: 0.12 !important;
    }
    #menuContent .item-card.equip-rarity--magic .equip-v2-grade {
      border-color: rgba(96, 135, 200, 0.48) !important;
      color: #adc7e8 !important;
      background: rgba(28, 56, 110, 0.42) !important;
    }
    #menuContent .item-card.equip-rarity--magic .equip-card-name,
    #menuContent .item-card.equip-rarity--magic .equip-affixes li {
      color: #8fb3df !important;
      text-shadow: 0 0 14px rgba(83, 143, 255, 0.16) !important;
    }
    #menuContent .item-card.equip-rarity--rare {
      border-color: rgba(214, 174, 62, 0.66) !important;
      color: rgba(215, 174, 62, 0.2) !important;
      background:
        linear-gradient(180deg, rgba(220, 178, 64, 0.09), transparent 29%),
        radial-gradient(circle at 14% 0%, rgba(218, 168, 54, 0.22), transparent 42%),
        linear-gradient(145deg, rgba(24, 20, 8, 0.99), rgba(8, 7, 5, 0.99) 58%, rgba(20, 14, 5, 0.99)) !important;
      box-shadow:
        inset 0 1px 0 rgba(235, 216, 164, 0.08),
        inset 0 0 0 1px rgba(198, 152, 48, 0.2),
        0 0 22px rgba(215, 168, 55, 0.11),
        0 16px 30px rgba(0, 0, 0, 0.34) !important;
    }
    #menuContent .item-card.equip-rarity--rare::before {
      background: linear-gradient(90deg, transparent, rgba(206, 159, 43, 0.62), rgba(235, 215, 124, 0.76), rgba(206, 159, 43, 0.62), transparent) !important;
      box-shadow: 0 0 16px rgba(220, 180, 66, 0.26) !important;
    }
    #menuContent .item-card.equip-rarity--rare::after {
      opacity: 0.13 !important;
    }
    #menuContent .item-card.equip-rarity--rare .equip-v2-grade {
      border-color: rgba(220, 183, 78, 0.54) !important;
      color: #ead489 !important;
      background: rgba(92, 70, 18, 0.48) !important;
    }
    #menuContent .item-card.equip-rarity--rare .equip-card-name,
    #menuContent .item-card.equip-rarity--rare .equip-affixes li {
      color: #d9ba55 !important;
      text-shadow: 0 0 14px rgba(230, 185, 60, 0.16) !important;
    }
    #menuContent .item-card.equip-rarity--legendary {
      border-color: rgba(198, 105, 42, 0.68) !important;
      color: rgba(218, 110, 42, 0.2) !important;
      background:
        linear-gradient(180deg, rgba(210, 108, 40, 0.1), transparent 31%),
        radial-gradient(circle at 14% 0%, rgba(205, 98, 32, 0.24), transparent 44%),
        linear-gradient(145deg, rgba(30, 16, 5, 0.99), rgba(8, 7, 5, 0.99) 58%, rgba(25, 12, 4, 0.99)) !important;
      box-shadow:
        inset 0 1px 0 rgba(230, 190, 150, 0.08),
        inset 0 0 0 1px rgba(180, 84, 28, 0.22),
        0 0 24px rgba(210, 98, 28, 0.13),
        0 16px 30px rgba(0, 0, 0, 0.34) !important;
    }
    #menuContent .item-card.equip-rarity--legendary::before {
      background: linear-gradient(90deg, transparent, rgba(206, 96, 30, 0.62), rgba(230, 150, 76, 0.78), rgba(206, 96, 30, 0.62), transparent) !important;
      box-shadow: 0 0 17px rgba(220, 112, 38, 0.28) !important;
    }
    #menuContent .item-card.equip-rarity--legendary::after {
      opacity: 0.14 !important;
    }
    #menuContent .item-card.equip-rarity--legendary .equip-v2-grade {
      border-color: rgba(218, 126, 62, 0.56) !important;
      color: #e3aa79 !important;
      background: rgba(105, 45, 14, 0.5) !important;
    }
    #menuContent .item-card.equip-rarity--legendary .equip-card-name,
    #menuContent .item-card.equip-rarity--legendary .equip-affixes li {
      color: #d98242 !important;
      text-shadow: 0 0 16px rgba(220, 103, 32, 0.18) !important;
    }

    /* Simple item-card finish: flat surfaces, rarity as a quiet accent. */
    #menuContent .equip-card.item-card {
      --item-accent: #b7a064;
      --item-accent-soft: rgba(183, 160, 100, 0.14);
      gap: 12px !important;
      padding: 0 16px 16px !important;
      min-height: 360px !important;
      border: 1px solid rgba(190, 164, 102, 0.24) !important;
      border-radius: 6px !important;
      color: #efe6d1 !important;
      background: #12100d !important;
      box-shadow: 0 1px 0 rgba(255, 255, 255, 0.04) inset, 0 10px 22px rgba(0, 0, 0, 0.22) !important;
      filter: none !important;
    }
    #menuContent .equip-card.item-card::before {
      height: 3px !important;
      background: var(--item-accent) !important;
      box-shadow: none !important;
    }
    #menuContent .equip-card.item-card::after {
      display: none !important;
      content: none !important;
    }
    #menuContent .item-card .equip-v2-top {
      gap: 7px !important;
      margin: 0 -16px !important;
      padding: 14px 16px 12px !important;
      border-bottom: 1px solid rgba(190, 164, 102, 0.16) !important;
      background: #17130f !important;
      box-shadow: none !important;
    }
    #menuContent .item-card .equip-v2-grade,
    #menuContent .item-card .equip-card-subtitle > span:not(.equip-card-badge),
    #menuContent .item-card .equip-card-badge {
      border: 1px solid rgba(205, 176, 112, 0.22) !important;
      border-radius: 999px !important;
      color: #d6c6a5 !important;
      background: rgba(226, 190, 116, 0.055) !important;
      box-shadow: none !important;
    }
    #menuContent .item-card .equip-card-name,
    #menuContent .item-card.equip-rarity--common .equip-card-name,
    #menuContent .item-card.equip-rarity--magic .equip-card-name,
    #menuContent .item-card.equip-rarity--rare .equip-card-name,
    #menuContent .item-card.equip-rarity--legendary .equip-card-name {
      color: #f3e5c4 !important;
      text-shadow: none !important;
    }
    #menuContent .item-card .equip-card-equipped {
      top: 10px !important;
      right: 10px !important;
      min-height: 24px !important;
      padding: 4px 9px !important;
      border: 1px solid var(--item-accent) !important;
      border-radius: 999px !important;
      color: #fff2cf !important;
      background: rgba(226, 190, 116, 0.08) !important;
      box-shadow: none !important;
      letter-spacing: 0 !important;
    }
    #menuContent .item-card .equip-card-subtitle {
      color: #a8997b !important;
    }
    #menuContent .item-card .equip-v2-core {
      display: grid !important;
      grid-template-columns: minmax(0, 1fr) auto !important;
      align-items: center !important;
      gap: 12px !important;
      padding: 10px 12px !important;
      border: 1px solid rgba(205, 176, 112, 0.16) !important;
      border-left: 3px solid var(--item-accent) !important;
      border-radius: 6px !important;
      background: #16120e !important;
      box-shadow: none !important;
    }
    #menuContent .item-card .equip-v2-core::before,
    #menuContent .item-card .equip-affix-block > span::before {
      display: none !important;
      content: none !important;
    }
    #menuContent .item-card .equip-v2-core span,
    #menuContent .item-card .equip-affix-block > span,
    #menuContent .item-card .equip-card-desc {
      color: #a79a7e !important;
      text-shadow: none !important;
    }
    #menuContent .item-card .equip-v2-core strong {
      color: #f6e7c8 !important;
      text-shadow: none !important;
    }
    #menuContent .item-card .equip-affixes {
      display: grid !important;
      grid-template-columns: repeat(auto-fit, minmax(118px, 1fr)) !important;
      gap: 6px !important;
    }
    #menuContent .item-card .equip-affixes li,
    #menuContent .item-card .equip-affixes li.equip-affix,
    #menuContent .item-card.equip-rarity--common .equip-affixes li,
    #menuContent .item-card.equip-rarity--magic .equip-affixes li,
    #menuContent .item-card.equip-rarity--rare .equip-affixes li,
    #menuContent .item-card.equip-rarity--legendary .equip-affixes li {
      min-height: 34px !important;
      padding: 7px 10px 7px 12px !important;
      border: 1px solid rgba(205, 176, 112, 0.13) !important;
      border-left: 2px solid var(--item-accent) !important;
      border-radius: 5px !important;
      color: #e6d5b0 !important;
      background: #15110e !important;
      box-shadow: none !important;
      text-shadow: none !important;
    }
    #menuContent .item-card .equip-affixes li::before,
    #menuContent .item-card .equip-affixes li.equip-affix::before {
      display: none !important;
      content: none !important;
    }
    #menuContent .item-card .equip-action-wrap {
      filter: none !important;
    }
    #menuContent .item-card button.primary {
      border: 1px solid var(--item-accent) !important;
      border-radius: 5px !important;
      color: #fff2cf !important;
      background: var(--item-accent-soft) !important;
      box-shadow: none !important;
    }
    #menuContent .item-card button.primary:hover:not(:disabled) {
      border-color: var(--item-accent) !important;
      color: #fff7df !important;
      background: rgba(226, 190, 116, 0.1) !important;
      box-shadow: none !important;
    }
    #menuContent .item-card.equip-rarity--common {
      --item-accent: #a99b7a;
      --item-accent-soft: rgba(169, 155, 122, 0.14);
      border-color: rgba(169, 155, 122, 0.28) !important;
      background: #12100d !important;
    }
    #menuContent .item-card.equip-rarity--magic {
      --item-accent: #7fa6c7;
      --item-accent-soft: rgba(127, 166, 199, 0.14);
      border-color: rgba(127, 166, 199, 0.3) !important;
      background: #12100d !important;
    }
    #menuContent .item-card.equip-rarity--rare {
      --item-accent: #d4ad55;
      --item-accent-soft: rgba(212, 173, 85, 0.15);
      border-color: rgba(212, 173, 85, 0.34) !important;
      background: #12100d !important;
    }
    #menuContent .item-card.equip-rarity--legendary {
      --item-accent: #d47a45;
      --item-accent-soft: rgba(212, 122, 69, 0.15);
      border-color: rgba(212, 122, 69, 0.34) !important;
      background: #12100d !important;
    }
    #menuContent .item-card.equip-rarity--magic .equip-v2-grade,
    #menuContent .item-card.equip-rarity--rare .equip-v2-grade,
    #menuContent .item-card.equip-rarity--legendary .equip-v2-grade {
      border-color: var(--item-accent) !important;
      color: var(--item-accent) !important;
      background: var(--item-accent-soft) !important;
    }

    /* Type-led card color: clear cards without the black-brick contrast. */
    #menuContent .equip-card.item-card {
      --item-accent: #b99f5f;
      --item-accent-soft: rgba(185, 159, 95, 0.16);
      --item-accent-wash: rgba(185, 159, 95, 0.08);
      --item-accent-border: rgba(185, 159, 95, 0.42);
      color: #eadfc8 !important;
      border-color: var(--item-accent-border) !important;
      background:
        linear-gradient(180deg, var(--item-accent-wash), rgba(29, 26, 21, 0.98) 34%, rgba(23, 21, 17, 0.99)) !important;
      box-shadow:
        inset 0 1px 0 rgba(255, 244, 213, 0.055),
        0 12px 24px rgba(0, 0, 0, 0.2) !important;
    }
    #menuContent .equip-card.item-card::before {
      height: 4px !important;
      background: var(--item-accent) !important;
      opacity: 0.9 !important;
    }
    #menuContent .item-card .equip-v2-top {
      border-bottom-color: rgba(255, 244, 213, 0.1) !important;
      background:
        linear-gradient(90deg, var(--item-accent-soft), rgba(26, 23, 18, 0.9) 72%) !important;
    }
    #menuContent .item-card .equip-v2-grade {
      border-color: var(--item-accent-border) !important;
      color: var(--item-accent) !important;
      background: var(--item-accent-soft) !important;
    }
    #menuContent .item-card .equip-card-subtitle > span:not(.equip-card-badge),
    #menuContent .item-card .equip-card-badge {
      border-color: rgba(255, 244, 213, 0.08) !important;
      color: rgba(202, 187, 155, 0.82) !important;
      background: rgba(10, 8, 6, 0.26) !important;
    }
    #menuContent .item-card .equip-card-name,
    #menuContent .item-card.equip-rarity--common .equip-card-name,
    #menuContent .item-card.equip-rarity--magic .equip-card-name,
    #menuContent .item-card.equip-rarity--rare .equip-card-name,
    #menuContent .item-card.equip-rarity--legendary .equip-card-name {
      color: #fff0cf !important;
    }
    #menuContent .item-card .equip-v2-core,
    #menuContent .item-card .equip-affixes li,
    #menuContent .item-card .equip-affixes li.equip-affix {
      border-color: rgba(255, 244, 213, 0.12) !important;
      border-left-color: var(--item-accent) !important;
      background: rgba(12, 10, 8, 0.2) !important;
    }
    #menuContent .item-card .equip-v2-core strong,
    #menuContent .item-card .equip-affixes li,
    #menuContent .item-card .equip-affixes li.equip-affix {
      color: #f1dfb9 !important;
    }
    #menuContent .item-card button.primary {
      border-color: var(--item-accent-border) !important;
      color: #fff0cf !important;
      background: var(--item-accent-soft) !important;
    }
    #menuContent .item-card button.primary:hover:not(:disabled) {
      border-color: var(--item-accent) !important;
      background: var(--item-accent-wash) !important;
    }
    #menuContent .item-card.equip-rarity--common {
      --item-accent: #9b895c;
      --item-accent-soft: rgba(155, 137, 92, 0.13);
      --item-accent-wash: rgba(155, 137, 92, 0.07);
      --item-accent-border: rgba(155, 137, 92, 0.36);
    }
    #menuContent .item-card.equip-rarity--magic {
      --item-accent: #5f87a0;
      --item-accent-soft: rgba(95, 135, 160, 0.14);
      --item-accent-wash: rgba(95, 135, 160, 0.08);
      --item-accent-border: rgba(95, 135, 160, 0.38);
    }
    #menuContent .item-card.equip-rarity--rare {
      --item-accent: #ae8d48;
      --item-accent-soft: rgba(174, 141, 72, 0.14);
      --item-accent-wash: rgba(174, 141, 72, 0.08);
      --item-accent-border: rgba(174, 141, 72, 0.38);
    }
    #menuContent .item-card.equip-rarity--legendary {
      --item-accent: #ad6640;
      --item-accent-soft: rgba(173, 102, 64, 0.14);
      --item-accent-wash: rgba(173, 102, 64, 0.08);
      --item-accent-border: rgba(173, 102, 64, 0.4);
    }
    #menuContent .item-card.bag-consumable-card--health {
      --item-accent: #9f4a42;
      --item-accent-soft: rgba(159, 74, 66, 0.16);
      --item-accent-wash: rgba(159, 74, 66, 0.09);
      --item-accent-border: rgba(159, 74, 66, 0.42);
    }
    #menuContent .item-card.bag-consumable-card--mana {
      --item-accent: #527f9d;
      --item-accent-soft: rgba(82, 127, 157, 0.16);
      --item-accent-wash: rgba(82, 127, 157, 0.09);
      --item-accent-border: rgba(82, 127, 157, 0.42);
    }
    #menuContent .item-card.bag-consumable-card--status {
      --item-accent: #4f865d;
      --item-accent-soft: rgba(79, 134, 93, 0.16);
      --item-accent-wash: rgba(79, 134, 93, 0.09);
      --item-accent-border: rgba(79, 134, 93, 0.42);
    }
    #menuContent .item-card.bag-consumable-card--passive {
      --item-accent: #9c7d45;
      --item-accent-soft: rgba(156, 125, 69, 0.15);
      --item-accent-wash: rgba(156, 125, 69, 0.08);
      --item-accent-border: rgba(156, 125, 69, 0.4);
    }

    /* Strong type identity: grade labels should read before card copy. */
    #menuContent .equip-card.item-card {
      --item-accent-deep: #4c3a18;
      --item-accent-bright: #f3d37b;
      --item-accent-mark: rgba(243, 211, 123, 0.34);
    }
    #menuContent .equip-card.item-card::before {
      height: 6px !important;
      opacity: 1 !important;
      background: linear-gradient(90deg, var(--item-accent-deep), var(--item-accent), var(--item-accent-bright)) !important;
    }
    #menuContent .item-card .equip-v2-top {
      background:
        linear-gradient(90deg, rgba(0, 0, 0, 0.26), transparent 58%),
        linear-gradient(180deg, var(--item-accent-wash), rgba(26, 23, 18, 0.9)) !important;
    }
    #menuContent .item-card .equip-v2-grade {
      min-height: 27px !important;
      padding: 5px 11px !important;
      border: 1px solid var(--item-accent) !important;
      border-radius: 5px !important;
      color: var(--item-accent-bright) !important;
      background:
        linear-gradient(180deg, var(--item-accent), var(--item-accent-deep)) !important;
      box-shadow:
        inset 0 1px 0 rgba(255, 244, 213, 0.12),
        0 0 0 1px rgba(0, 0, 0, 0.28) !important;
      font-size: 13px !important;
      font-weight: 850 !important;
    }
    #menuContent .item-card .equip-card-subtitle > span:not(.equip-card-badge),
    #menuContent .item-card .equip-card-badge {
      border-color: rgba(255, 244, 213, 0.1) !important;
      color: rgba(225, 211, 180, 0.9) !important;
      background: rgba(7, 6, 5, 0.36) !important;
    }
    #menuContent .item-card .equip-v2-core,
    #menuContent .item-card .equip-affixes li,
    #menuContent .item-card .equip-affixes li.equip-affix {
      border-left-color: var(--item-accent-bright) !important;
    }
    #menuContent .item-card button.primary {
      border-color: var(--item-accent) !important;
      color: var(--item-accent-bright) !important;
      background:
        linear-gradient(180deg, var(--item-accent-soft), rgba(10, 8, 6, 0.28)) !important;
    }
    #menuContent .item-card.equip-rarity--common {
      --item-accent-deep: #4b4025;
      --item-accent-bright: #dccb9b;
      --item-accent-mark: rgba(220, 203, 155, 0.28);
    }
    #menuContent .item-card.equip-rarity--magic,
    #menuContent .item-card.bag-consumable-card--mana {
      --item-accent: #4f91bd;
      --item-accent-deep: #17354a;
      --item-accent-bright: #b5e2ff;
      --item-accent-mark: rgba(118, 186, 230, 0.34);
    }
    #menuContent .item-card.equip-rarity--rare {
      --item-accent: #c6942e;
      --item-accent-deep: #50390e;
      --item-accent-bright: #ffd56f;
      --item-accent-mark: rgba(255, 213, 111, 0.34);
    }
    #menuContent .item-card.equip-rarity--legendary {
      --item-accent: #bd6b37;
      --item-accent-deep: #572712;
      --item-accent-bright: #ffb47a;
      --item-accent-mark: rgba(255, 180, 122, 0.34);
    }
    #menuContent .item-card.bag-consumable-card--health {
      --item-accent: #bd4a3f;
      --item-accent-deep: #4b1916;
      --item-accent-bright: #ff9386;
      --item-accent-mark: rgba(255, 147, 134, 0.34);
    }
    #menuContent .item-card.bag-consumable-card--status {
      --item-accent: #468e59;
      --item-accent-deep: #15381f;
      --item-accent-bright: #9ee2aa;
      --item-accent-mark: rgba(158, 226, 170, 0.34);
    }
    #menuContent .item-card.bag-consumable-card--passive {
      --item-accent: #9d7b3c;
      --item-accent-deep: #453014;
      --item-accent-bright: #e4c26f;
      --item-accent-mark: rgba(228, 194, 111, 0.32);
    }

    /* Loot-card finish: aligned descriptions and stronger treasure presence. */
    #menuContent .equip-grid.equip-grid--unified:not(.bag-consumable-grid) .equip-card.item-card {
      display: grid !important;
      grid-template-rows: auto auto auto 106px minmax(58px, auto) auto !important;
      align-content: stretch !important;
      min-height: 370px !important;
      border-width: 1px !important;
      box-shadow:
        inset 0 1px 0 rgba(255, 244, 213, 0.08),
        inset 0 0 0 1px rgba(255, 244, 213, 0.025),
        0 0 0 1px color-mix(in srgb, var(--item-accent) 22%, transparent),
        0 16px 30px rgba(0, 0, 0, 0.3),
        0 0 22px var(--item-accent-mark) !important;
    }
    #menuContent .equip-grid.equip-grid--unified:not(.bag-consumable-grid) .equip-card.item-card::after {
      content: "" !important;
      display: block !important;
      position: absolute !important;
      inset: 6px 1px 1px !important;
      z-index: 0 !important;
      pointer-events: none !important;
      opacity: 0.72 !important;
      background:
        linear-gradient(120deg, rgba(255, 244, 213, 0.08), transparent 18% 78%, rgba(255, 244, 213, 0.035)),
        radial-gradient(ellipse at 50% 0%, var(--item-accent-mark), transparent 54%) !important;
    }
    #menuContent .equip-grid.equip-grid--unified:not(.bag-consumable-grid) .equip-card.item-card > * {
      position: relative !important;
      z-index: 1 !important;
    }
    #menuContent .equip-grid.equip-grid--unified:not(.bag-consumable-grid) .item-card .equip-v2-top {
      border-bottom-color: color-mix(in srgb, var(--item-accent) 36%, rgba(255, 244, 213, 0.08)) !important;
    }
    #menuContent .equip-grid.equip-grid--unified:not(.bag-consumable-grid) .item-card .equip-card-name {
      color: var(--item-accent-bright) !important;
      text-shadow: 0 0 14px color-mix(in srgb, var(--item-accent) 28%, transparent) !important;
    }
    #menuContent .equip-grid.equip-grid--unified:not(.bag-consumable-grid) .item-card .equip-affix-block {
      min-height: 106px !important;
      align-content: start !important;
    }
    #menuContent .equip-grid.equip-grid--unified:not(.bag-consumable-grid) .item-card .equip-card-desc {
      align-self: start !important;
      min-height: 58px !important;
      margin: 0 !important;
      padding-top: 2px !important;
    }
    #menuContent .equip-grid.equip-grid--unified:not(.bag-consumable-grid) .item-card .equip-action-wrap {
      align-self: end !important;
    }
    #menuContent .equip-grid.equip-grid--unified:not(.bag-consumable-grid) .item-card.equip-rarity--rare,
    #menuContent .equip-grid.equip-grid--unified:not(.bag-consumable-grid) .item-card.equip-rarity--legendary {
      border-color: var(--item-accent) !important;
      box-shadow:
        inset 0 1px 0 rgba(255, 244, 213, 0.11),
        inset 0 0 0 1px rgba(255, 244, 213, 0.035),
        0 0 0 1px color-mix(in srgb, var(--item-accent) 36%, transparent),
        0 18px 34px rgba(0, 0, 0, 0.34),
        0 0 30px var(--item-accent-mark) !important;
    }

    /* Equipment glow ladder: common none, magic low, rare medium, legendary full. */
    #menuContent .equip-grid.equip-grid--unified:not(.bag-consumable-grid) .item-card.equip-rarity--common {
      --item-accent-mark: transparent;
      box-shadow:
        inset 0 1px 0 rgba(255, 244, 213, 0.08),
        inset 0 0 0 1px rgba(255, 244, 213, 0.025),
        0 0 0 1px color-mix(in srgb, var(--item-accent) 16%, transparent),
        0 16px 30px rgba(0, 0, 0, 0.3) !important;
    }
    #menuContent .equip-grid.equip-grid--unified:not(.bag-consumable-grid) .item-card.equip-rarity--magic {
      --item-accent-mark: rgba(118, 186, 230, 0.12);
      box-shadow:
        inset 0 1px 0 rgba(255, 244, 213, 0.08),
        inset 0 0 0 1px rgba(255, 244, 213, 0.025),
        0 0 0 1px color-mix(in srgb, var(--item-accent) 22%, transparent),
        0 16px 30px rgba(0, 0, 0, 0.3),
        0 0 14px var(--item-accent-mark) !important;
    }
    #menuContent .equip-grid.equip-grid--unified:not(.bag-consumable-grid) .item-card.equip-rarity--rare {
      --item-accent-mark: rgba(255, 213, 111, 0.2);
      box-shadow:
        inset 0 1px 0 rgba(255, 244, 213, 0.1),
        inset 0 0 0 1px rgba(255, 244, 213, 0.03),
        0 0 0 1px color-mix(in srgb, var(--item-accent) 32%, transparent),
        0 18px 34px rgba(0, 0, 0, 0.34),
        0 0 22px var(--item-accent-mark) !important;
    }
    #menuContent .equip-grid.equip-grid--unified:not(.bag-consumable-grid) .item-card.equip-rarity--legendary {
      --item-accent-mark: rgba(255, 180, 122, 0.34);
    }
    #menuContent .equip-grid.equip-grid--unified:not(.bag-consumable-grid) .item-card.equip-rarity--common .equip-card-name {
      text-shadow: none !important;
    }
    #menuContent .equip-grid.equip-grid--unified:not(.bag-consumable-grid) .item-card.equip-rarity--magic .equip-card-name {
      text-shadow: 0 0 8px color-mix(in srgb, var(--item-accent) 14%, transparent) !important;
    }
    #menuContent .equip-grid.equip-grid--unified:not(.bag-consumable-grid) .item-card.equip-rarity--rare .equip-card-name {
      text-shadow: 0 0 12px color-mix(in srgb, var(--item-accent) 20%, transparent) !important;
    }
  `;
  document.head.appendChild(style);
}

function styleEquipmentHoverCompare(compare) {
  const panel = compare.querySelector(".equip-compare");
  if (panel) {
    panel.style.cssText += [
      "padding:11px 12px",
      "border:1px solid rgb(112, 112, 255)",
      "border-radius:4px",
      "background:#050506",
      "box-shadow:inset 0 0 0 1px rgba(255,255,255,.04), 0 12px 28px rgba(0,0,0,.55)",
    ].join(";");
  }
  const deltas = compare.querySelector(".equip-deltas");
  if (deltas) {
    deltas.style.cssText += [
      "display:grid",
      "grid-template-columns:1fr",
      "gap:7px",
    ].join(";");
  }
  compare.querySelectorAll(".equip-delta").forEach((delta) => {
    delta.style.cssText += [
      "display:grid",
      "grid-template-columns:minmax(42px, auto) minmax(0, 1fr)",
      "align-items:start",
      "gap:10px",
      "width:100%",
      "min-height:30px",
      "padding:7px 9px",
      "border-radius:4px",
      "background:#10101e",
      "color:#aaaaff",
      "white-space:normal",
      "overflow-wrap:anywhere",
    ].join(";");
    const value = delta.querySelector("strong");
    if (value) {
      value.style.cssText += [
        "justify-self:end",
        "max-width:100%",
        "text-align:right",
        "white-space:normal",
        "overflow-wrap:anywhere",
      ].join(";");
    }
  });
}

function equipmentSlotHtml(slot) {
  const e = getEquipment(state.equipments[slot]);
  const slotLabel = slot === "weapon" ? "武器槽" : "护具槽";
  const emptyLabel = slot === "weapon" ? "未装备武器" : "未装备护具";
  if (!e) {
    return `
      <div class="equip-slot equip-slot--${slot}">
        <div class="equip-slot-head">
          <span class="equip-slot-icon">${slot === "weapon" ? "剑" : "甲"}</span>
          <span class="equip-slot-label">${slotLabel}</span>
        </div>
        <div class="equip-slot-empty">${emptyLabel}</div>
      </div>
    `;
  }

  const kind = equipmentWeightClass(e);
  return `
    <div class="equip-slot equip-slot--${slot} equip-slot--filled">
      <div class="equip-slot-head">
        <span class="equip-slot-icon">${slot === "weapon" ? "剑" : "甲"}</span>
        <span class="equip-slot-label">${slotLabel}</span>
      </div>
      <strong class="equip-slot-name">${escapeHtml(e.name)}</strong>
      <div class="equip-slot-badges">
        <span class="equip-card-badge">${equipmentLevelLabel(e)}</span>
        <span class="equip-card-badge equip-card-kind equip-card-kind--${kind}">${equipmentWeightLabel(e)}</span>
      </div>
      <div class="equip-slot-core" aria-label="${slotLabel}属性">
        <span class="equip-slot-stat equip-slot-stat--atk"><span>攻击</span><strong>${signedStat(e.atk)}</strong></span>
        <span class="equip-slot-stat equip-slot-stat--guard"><span>免伤</span><strong>${signedPct(e.damageReduction)}</strong></span>
        <span class="equip-slot-stat equip-slot-stat--speed"><span>速度</span><strong>${signedStat(e.speed)}</strong></span>
        <span class="equip-slot-stat equip-slot-stat--durability"><span>耐久</span><strong>${equipmentDurabilityText(state.equipments[slot])}</strong></span>
      </div>
      ${equipmentSlotAffixHtml(e)}
      <button class="equip-slot-unequip" type="button" data-unequip-slot="${slot}" ${state.mode === "battle" ? "disabled" : ""}>卸下</button>
    </div>
  `;
}

function unequipSlot(slot) {
  if (state.mode === "battle") return;
  if (!["weapon", "armor"].includes(slot)) return;
  const e = getEquipment(state.equipments[slot]);
  if (!e) return;
  state.equipments[slot] = null;
  addLine(`卸下 ${e.name}。`, "system");
  render();
  renderMenu("equip");
}

function renderDetails(content) {
  // 变量：weapon，当前装备的武器配置。
  const weapon = getEquipment(state.equipments.weapon) || {};
  // 变量：armor，当前装备的护具配置。
  const armor = getEquipment(state.equipments.armor) || {};
  // 变量：hpPct，当前生命值百分比。
  const hpPct = Math.max(0, state.player.hp / state.player.maxHp * 100);
  // 变量：atk，最终伤害。
  const atk = totalAtk();
  // 变量：damageReduction，最终免伤。
  const damageReduction = totalDamageReduction();
  // 变量：speed，最终速度。
  const speed = totalSpeed();

  // 变量：sheet，角色面板主容器。
  const sheet = document.createElement("div");
  sheet.className = "char-sheet";

  // ── 左：人物肖像 ──
  // 变量：portrait，左侧肖像区域。
  const portrait = document.createElement("div");
  portrait.className = "char-sheet-portrait";
  portrait.innerHTML = `
    <div class="char-sheet-frame">
      <img src="${escapeAttr(playerPortraitSrc())}" alt="${escapeAttr(playerDisplayName())}" />
      <div class="char-sheet-frame-border"></div>
    </div>
    <div class="char-sheet-identity">
      <div class="char-sheet-seal"></div>
      <div class="char-sheet-name-block">
        <h3 class="char-sheet-name">${escapeHtml(playerDisplayName())}</h3>
        <span class="char-sheet-realm">${state.player.level} · ${realmName(state.player.level)} · ${playerGenderLabel()}</span>
      </div>
    </div>
    <div class="char-sheet-hp">
      <div class="char-sheet-hp-label">生命</div>
      <div class="char-sheet-hp-bar">
        <span style="width:${hpPct}%"></span>
      </div>
      <div class="char-sheet-hp-num">${state.player.hp} / ${state.player.maxHp}</div>
    </div>
  `;
  sheet.appendChild(portrait);

  // ── 右：属性详情 ──
  // 变量：stats，右侧属性面板。
  const stats = document.createElement("div");
  stats.className = "char-sheet-stats";

  // 变量：statGroups，属性分组定义。
  const statGroups = [
    {
      label: "历练",
      items: [
        { name: "等级", value: `${state.player.level} · ${realmName(state.player.level)}`, tip: "当前阶位。升级会永久增加最大 HP、攻击和免伤。" },
        { name: "经验", value: state.player.level >= currentLevelCap() ? "本副本已满" : `${state.player.exp}/${nextExp(state.player.level)}`, tip: "战斗胜利获得经验；达到本副本等级上限后不再获得。" },
        { name: "最大 HP", value: state.player.maxHp, tip: "生命上限。当前 HP 降至 0 时游戏结束。" },
        { name: "MP", value: `${state.player.mp ?? 30}/${state.player.maxMp ?? 30}`, tip: "技能资源。" },
      ]
    },
    {
      label: "战斗",
      items: [
        { name: "伤害", value: atk, tip: `基础 ${state.player.baseAtk} + 武器 ${weapon.atk || 0} + 护具 ${armor.atk || 0} + 临时 ${state.player.tempAtk || 0}，再受攻击百分比加成 ${formatPct(state.player.tempAtkRate || 0)}。伤害公式：伤害值 + 随机浮动，目标免伤会在最终扣血前按百分比减免。` },
        { name: "免伤", value: formatPct(damageReduction), tip: `基础 ${formatPct(state.player.baseDamageReduction || 0)} + 装备 ${formatPct((weapon.damageReduction || 0) + (armor.damageReduction || 0))} + 临时 ${formatPct(state.player.tempDamageReduction || 0)} + 副本 ${formatPct(state.player.dungeonDamageReduction || 0)}。` },
        { name: "速度", value: speed, tip: `基础 ${state.player.baseSpeed || 10}/${playerBaseSpeedCap()} + 装备 ${(weapon.speed || 0) + (armor.speed || 0)} + 临时 ${state.player.tempSpeed || 0}；最终速度上限 ${playerTotalSpeedCap()}。影响半即时战斗中行动槽积攒速度。` },
      ]
    },
    {
      label: "装备",
      items: [
        { name: "武器", value: weapon.name ? `${weapon.name}（${equipmentLevelLabel(weapon)} · ${equipmentWeightLabel(weapon)}）` : "无", tip: weapon.name ? `${equipmentLevelLabel(weapon)} ${equipmentWeightLabel(weapon)}武器。攻击 ${signedStat(weapon.atk)} 免伤 ${signedPct(weapon.damageReduction)} 速度 ${signedStat(weapon.speed)}。${weapon.desc || ""}` : "可在装备页选择和更换武器。" },
        { name: "护具", value: armor.name ? `${armor.name}（${equipmentLevelLabel(armor)} · ${equipmentWeightLabel(armor)}）` : "无", tip: armor.name ? `${equipmentLevelLabel(armor)} ${equipmentWeightLabel(armor)}护具。攻击 ${signedStat(armor.atk)} 免伤 ${signedPct(armor.damageReduction)} 速度 ${signedStat(armor.speed)}。${armor.desc || ""}` : "可在装备页选择和更换护具。" },
      ]
    },
  ];

  statGroups.forEach(group => {
    // 变量：sec，属性分组区块。
    const sec = document.createElement("div");
    sec.className = "char-sheet-stat-group";
    // 变量：head，分组标题。
    const head = document.createElement("div");
    head.className = "char-sheet-stat-head";
    head.innerHTML = `<span class="char-sheet-stat-mark"></span><span class="char-sheet-stat-label">${group.label}</span>`;
    sec.appendChild(head);

    group.items.forEach(item => {
      // 变量：line，单条属性行。
      const line = document.createElement("div");
      line.className = "char-sheet-stat-line";
      line.innerHTML = `
        <span class="char-sheet-stat-name">
          <span class="stat-tip" data-tip="${escapeAttr(item.tip)}">${item.name}</span>
        </span>
        <span class="char-sheet-stat-value">${item.value}</span>
      `;
      sec.appendChild(line);
    });
    stats.appendChild(sec);
  });

  sheet.appendChild(stats);
  content.appendChild(sheet);
}

function renderAbout(content) {
  const meta = aboutGameMeta();
  const updates = aboutUpdates();
  const updateGroups = aboutUpdateGroups(updates);
  const hiddenUpdateGroups = updateGroups.slice(1);
  const updateList = updateGroups.length
    ? `${aboutUpdateCard(updateGroups[0])}${aboutUpdateArchive(hiddenUpdateGroups)}`
    : `<div class="about-empty">暂无更新纪要。</div>`;

  content.innerHTML = `
    <div class="about-page">
      <section class="about-hero" aria-label="游戏信息">
        <div class="about-hero-seal" aria-hidden="true"></div>
        <div class="about-hero-copy">
          <div class="about-kicker">游戏标题</div>
          <div class="about-title">${escapeHtml(meta.name)}</div>
        </div>
      </section>

      <div class="sys-page about-update-page">
        <div class="sys-section sys-section--stack about-update-section">
          <div class="sys-icon sys-icon--gold">记</div>
          <div class="sys-body">
            <div class="sys-title">更新纪要</div>
            <div class="sys-desc">默认显示最新版本；另有 <span class="sys-mode-tag">${hiddenUpdateGroups.length}</span> 个历史版本可展开。</div>
          </div>
          <div class="about-update-list">
            ${updateList}
          </div>
        </div>
      </div>
    </div>
  `;
}

function aboutGameMeta() {
  const meta = typeof GAME_META !== "undefined" ? GAME_META : {};
  return {
    name: meta.name || "无尽之地",
    version: meta.version || "本地版本",
    build: meta.build || "本地构建",
  };
}

function aboutUpdates() {
  const updates = typeof GAME_UPDATES !== "undefined" && Array.isArray(GAME_UPDATES)
    ? GAME_UPDATES
    : [];
  return updates.filter((entry) => entry && (entry.title || entry.version || entry.date));
}

function aboutUpdateGroups(updates) {
  return updates.reduce((groups, entry) => {
    const version = entry.version || "本地版本";
    let group = groups.find((item) => item.version === version);
    if (!group) {
      group = { version, date: entry.date || "", entries: [] };
      groups.push(group);
    }
    if (entry.date && (!group.date || entry.date > group.date)) {
      group.date = entry.date;
    }
    group.entries.push(entry);
    return groups;
  }, []).sort((a, b) => (
    Date.parse(b.date || 0) - Date.parse(a.date || 0) ||
    String(b.version).localeCompare(String(a.version), "zh-CN", { numeric: true })
  ));
}

function hideAboutInfoModal(content) {
  content?.querySelector(".about-info-modal")?.remove();
}

function aboutUpdateCard(group) {
  const itemHtml = group.entries.map((entry) => {
    const items = Array.isArray(entry.items) ? entry.items : [];
    const details = items.length
      ? items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")
      : `<li>${escapeHtml(entry.desc || "本次更新没有详细说明。")}</li>`;
    return `
      <section class="about-update-entry">
        <div class="about-update-entry-title">${escapeHtml(entry.title || "未命名更新")}</div>
        <ul class="about-update-items">
          ${details}
        </ul>
      </section>
    `;
  }).join("");
  return `
    <article class="about-update-card">
      <div class="about-update-head">
        <div>
          <strong class="about-update-version-main">${escapeHtml(group.version)}</strong>
          <span>${escapeHtml(group.date || "日期未标")}</span>
        </div>
      </div>
      <div class="about-update-entries">
        ${itemHtml}
      </div>
    </article>
  `;
}

function aboutUpdateArchive(groups) {
  if (!groups.length) return "";
  return `
    <details class="about-update-more">
      <summary>展开历史纪要（${groups.length}）</summary>
      <div class="about-update-more-list">
        ${groups.map(aboutUpdateCard).join("")}
      </div>
    </details>
  `;
}

function aboutDlcCard(pack) {
  const version = pack.version ? `v${pack.version}` : "未标版本";
  const source = pack.source || "外部";
  return `
    <article class="about-dlc-card">
      <div class="about-dlc-head">
        <div>
          <strong>${escapeHtml(pack.name || pack.id || "未命名内容包")}</strong>
          <span>${escapeHtml(pack.id || "unknown")}</span>
        </div>
        <span class="about-dlc-state">已装载</span>
      </div>
      <p>${escapeHtml(pack.desc || "该内容包没有说明文本。")}</p>
      <div class="about-dlc-meta">
        <span>${escapeHtml(version)}</span>
        <span>${escapeHtml(source)}</span>
      </div>
    </article>
  `;
}

function renderSystem(content) {
  const isHomeOnly = !!state?._homeOnly;
  const menuMode = $("menuModal")?.dataset.menuMode || "";
  const isHomeSettings = menuMode === "home-settings";
  const eventMode = useEventModal() ? "弹窗" : "日志";
  const battleMode = state.settings?.battleMode || "qte";
  const battleModeLabel = battleMode === "auto" ? "实时演算" : "QTE 判定";
  const textSpeed = state.settings?.textSpeed || "normal";
  const textSpeedLabel =
    NARRATIVE_SPEED_OPTIONS.find((option) => option.id === textSpeed)?.label || "标准";
  const eventModeOptions = [
    ["modal", "弹窗"],
    ["log", "日志"],
  ];
  const battleModeOptions = [
    ["qte", "QTE 判定"],
    ["auto", "实时演算"],
  ];
  const textSpeedOptions = NARRATIVE_SPEED_OPTIONS.map((option) => [option.id, option.label]);
  const autoSave = typeof readAutoSave === "function" ? readAutoSave() : null;
  const hasAutoSave = !!autoSave?.state;
  const autoSaveStatus = hasAutoSave ? "已启用" : "等待首次记录";
  const autoSaveSummary = hasAutoSave ? escapeHtml(saveSummary(autoSave.state)) : "暂无实时存档";
  const autoSaveTime = hasAutoSave ? escapeHtml(formatSaveTime(autoSave.savedAt)) : "尚未写入";

  const saveSection = isHomeSettings ? "" : `
      <div class="sys-section sys-section--stack">
        <div class="sys-icon sys-icon--steel">自</div>
        <div class="sys-body">
          <div class="sys-title">实时存档</div>
          <div class="sys-desc">${isHomeOnly ? "从主菜单继续旅途时，会读取最近的实时存档。" : "旅程进度会在行动、战斗结算和界面刷新后的稳定状态自动写入。"}</div>
        </div>
        <div class="autosave-card ${hasAutoSave ? "autosave-card--filled" : "autosave-card--empty"}">
          <div class="autosave-card-head">
            <div>
              <div class="autosave-card-kicker">自动记录</div>
              <div class="autosave-card-title">实时存档</div>
            </div>
            <span class="autosave-card-state">${autoSaveStatus}</span>
          </div>
          <div class="autosave-card-summary">${autoSaveSummary}</div>
          <div class="autosave-card-time">${autoSaveTime}</div>
        </div>
      </div>

      <div class="sys-sep"></div>
  `;
  const newGameSection = isHomeSettings ? "" : `
      <div class="sys-sep"></div>

      <div class="sys-section">
        <div class="sys-icon sys-icon--danger">新</div>
        <div class="sys-body">
          <div class="sys-title">新游戏</div>
          <div class="sys-desc">${isHomeOnly ? "从序章重新启程，进入无尽行卷。" : "重新开始会覆盖当前实时存档。点击后需要二次确认。"}</div>
        </div>
        <div class="sys-acts">
          <button class="sys-btn sys-btn--danger" id="sysReset">${isHomeOnly ? "开始" : "重新开始"}</button>
        </div>
      </div>
  `;

  content.innerHTML = `
    <div class="sys-page">

      ${saveSection}

      <div class="sys-section">
        <div class="sys-icon sys-icon--gold">事</div>
        <div class="sys-body">
          <div class="sys-title">随机事件</div>
          <div class="sys-desc">当前呈现方式：<span class="sys-mode-tag">${eventMode}</span>。弹窗模式在独立窗口内操作；日志模式在底部选项栏操作。</div>
        </div>
        <div class="sys-acts">
          ${systemDropdown("eventMode", useEventModal() ? "modal" : "log", eventModeOptions)}
        </div>
      </div>

      <div class="sys-sep"></div>

      <div class="sys-section">
        <div class="sys-icon sys-icon--steel">战</div>
        <div class="sys-body">
          <div class="sys-title">战斗模式</div>
          <div class="sys-desc">当前模式：<span class="sys-mode-tag">${battleModeLabel}</span>。QTE 判定需要手动按键；实时演算会自动结算攻防。</div>
        </div>
        <div class="sys-acts">
          ${systemDropdown("battleMode", battleMode, battleModeOptions)}
        </div>
      </div>

      <div class="sys-sep"></div>

      <div class="sys-section">
        <div class="sys-icon sys-icon--steel">文</div>
        <div class="sys-body">
          <div class="sys-title">文字速度</div>
          <div class="sys-desc">当前速度：<span class="sys-mode-tag">${textSpeedLabel}</span>。影响文本逐字展开速度。</div>
        </div>
        <div class="sys-acts">
          ${systemDropdown("textSpeed", textSpeed, textSpeedOptions)}
        </div>
      </div>

      ${newGameSection}

    </div>
  `;
  $("sysReset")?.addEventListener("click", () => {
    if (!state?._homeOnly) {
      confirmNewGame();
      return;
    }
    closeMenu();
    newGame();
  });
  bindSystemDropdowns(content);
}

function systemDropdown(name, value, options, extraClass = "") {
  const selected = options.find(([id]) => id === value) || options[0];
  const items = options.map(([id, label]) =>
    `<button class="sys-select-option ${id === value ? "is-selected" : ""}" type="button" data-select-name="${name}" data-select-value="${id}">${label}</button>`,
  ).join("");
  return `
    <div class="sys-select-wrap ${extraClass}" data-sys-select="${name}">
      <button class="sys-select" type="button" aria-haspopup="listbox" aria-expanded="false">
        <span>${selected[1]}</span>
      </button>
      <div class="sys-select-menu" role="listbox">
        ${items}
      </div>
    </div>
  `;
}

function bindSystemDropdowns(content) {
  content.addEventListener("click", (event) => {
    if (event.target.closest("[data-sys-select]")) return;
    closeSystemDropdowns(content);
  });
  content.querySelectorAll("[data-sys-select] .sys-select").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      const wrap = event.currentTarget.closest("[data-sys-select]");
      const open = wrap.classList.contains("is-open");
      closeSystemDropdowns(content);
      wrap.classList.toggle("is-open", !open);
      event.currentTarget.setAttribute("aria-expanded", String(!open));
    });
  });
  content.querySelectorAll("[data-select-name]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      updateSystemDropdown(button.dataset.selectName, button.dataset.selectValue);
    });
  });
}

function closeSystemDropdowns(content) {
  content.querySelectorAll("[data-sys-select].is-open").forEach((wrap) => {
    wrap.classList.remove("is-open");
    wrap.querySelector(".sys-select")?.setAttribute("aria-expanded", "false");
  });
}

function updateSystemDropdown(name, value) {
  state.settings = state.settings || {};
  if (name === "eventMode") {
    state.settings.eventModal = value === "modal";
    saveUserSettings();
    closeEventModal();
    if (!state._homeOnly) {
      if (state.mode === "event") state.mode = "free";
      setChoices([]);
      addLine(`随机事件呈现已切换为${useEventModal() ? "弹窗" : "日志"}。`, "system");
      render();
    }
  }
  if (name === "battleMode") {
    state.settings.battleMode = value === "auto" ? "auto" : "qte";
    saveUserSettings();
    if (!state._homeOnly) {
      addLine(`战斗模式已切换为${state.settings.battleMode === "auto" ? "实时演算" : "QTE 判定"}。`, "system");
      render();
    }
  }
  if (name === "textSpeed") {
    state.settings.textSpeed = value;
    saveUserSettings();
    restartTypewriterWithCurrentSpeed();
  }
  renderMenu("system");
}
function renderShop(content = $("menuContent")) {
  // 变量：content，当前菜单页的内容容器。
  // 变量：shop，当前步数匹配到的商店配置，存在时进入商店流程。
  const shop = SHOP_DB[state.currentShopId];
  if (!shop) {
    content.innerHTML = `<p class="footnote">当前没有可用商店。</p>`;
    return;
  }
  ensureItemCardStyle();
  $("menuTitle").textContent = state.currentShopTitle || shop.name;
  $("closeMenu").textContent = "离开";
  content.innerHTML = "";
  initShopStock(state.currentShopId);

  const shopWrap = document.createElement("div");
  shopWrap.className = "shop-shelf shop-shelf--menu";
  const summary = document.createElement("div");
  summary.className = "shop-menu-summary";
  summary.innerHTML = `
    <p>${escapeHtml(state.currentShopDesc || shop.desc || "")}</p>
    <span>所持金：<strong>${state.gold}</strong></span>
  `;
  shopWrap.appendChild(summary);

  const grid = document.createElement("div");
  grid.className = "shop-grid shop-goods-grid equip-grid equip-grid--unified";
  const goods = shopGoodsForCurrentFilter(shop);
  if (!goods.length) {
    const empty = document.createElement("p");
    empty.className = "equip-empty equip-empty--unified";
    empty.textContent = "本店暂时没有可售商品。";
    grid.appendChild(empty);
  } else {
    goods.forEach(({ good, index }) => grid.appendChild(shopGoodCard(good, index)));
  }

  shopWrap.appendChild(grid);
  content.appendChild(shopWrap);
}

function shopGoodCard(good, index) {
  // 变量：stockKey，商店商品库存键，区分同 id 不同位置的商品。
  const stockKey = shopGoodKey(good, index);
  // 变量：stock，当前商品剩余库存。
  const stock = state.shopStocks[state.currentShopId][stockKey] ?? good.stock ?? 1;
  // 变量：price，当前商品购买价格。
  const price = shopGoodPrice(good);
  const priceView = shopGoodPriceView(good, price);
  // 变量：owned，非底材装备不可重复拥有。
  const owned = shopGoodOwned(good);
  // 变量：canBuy，当前商品是否满足库存、金币和拥有状态条件。
  const canBuy = stock > 0 && state.gold >= price && !owned && price >= 0;
  const statusText = owned ? "已拥有" : stock <= 0 ? "售罄" : state.gold < price ? "金币不足" : "可购";
  const context = { good, index, stock, priceView, owned, canBuy, statusText };
  const card = good.type === "equipment"
    ? shopEquipmentCard(context)
    : shopItemCard(context);
  card.classList.add(
    "shop-good-card",
    `shop-good-card--${good.type === "equipment" ? "equipment" : "item"}`,
    canBuy ? "is-buyable" : "is-locked",
  );
  if (owned) card.classList.add("is-owned");
  card.dataset.shopGoodIndex = String(index);
  return card;
}

function shopGoodsForCurrentFilter(shop) {
  const goods = (shop.goods || []).map((good, index) => ({ good, index }));
  if (state.currentShopFilter === "consumables") {
    const monthKey = calendarMonthKey();
    return goods
      .filter(({ good }) => good.type === "item" && ITEM_DB[good.id]?.type === "consumable")
      .map(({ good, index }) => ({ good, index: `item-${monthKey}-${index}` }));
  }
  if (state.currentShopFilter === "magic-smith") {
    const townId = typeof currentTownId === "function" ? currentTownId() : "oak_town";
    const stockKey = (typeof townShopConfig === "function" ? townShopConfig("forge", townId)?.monthlyStockKey : "") || "forge";
    const monthlyStock = state.monthlyShopGoods?.[townId]?.[stockKey] || state.monthlyShopGoods?.oakTownForge || {};
    const monthlyGoods = monthlyStock.goods || [];
    const monthKey = monthlyStock.monthKey || calendarMonthKey();
    return monthlyGoods.map((good, index) => ({ good, index: `forge-${monthKey}-${index}` }));
  }
  return goods;
}

function shopGoodOwned(good) {
  return good.type === "equipment" && !isEquipmentBase(good.id) && state.ownedEquip.includes(good.id);
}

function shopEquipmentCard({ good, index, stock, priceView, owned, canBuy, statusText }) {
  const e = getEquipment(good.id);
  if (!e) return shopMissingGoodCard(good, index, "装备资料缺失");
  const card = document.createElement("div");
  card.className = `equip-card item-card equip-rarity--${equipmentRarity(e)}`;
  card.innerHTML = `
    ${shopGoodRibbon(owned, stock)}
    <div class="equip-v2-top">
      <span class="equip-v2-grade">${equipmentRarityLabel(e)}${equipmentWeightLabel(e)}</span>
      <strong class="equip-card-name">${escapeHtml(e.name)}</strong>
    </div>
    <div class="equip-card-subtitle">
      <span>${shopGoodTypeLabel(good)}</span>
      <span>${shopGoodStockLabel(stock)}</span>
      ${shopPriceBadgeHtml(priceView)}
    </div>
    <div class="equip-v2-core">
      <span>${e.slot === "armor" ? "最终免伤" : "最终伤害"}</span><strong>${e.slot === "armor" ? formatPct(e.damageReduction) : statNumber(e.atk)}</strong>
    </div>
    ${equipmentAffixHtml(e) || shopEmptyAffixHtml("基础装备")}
    <p class="equip-card-desc">${escapeHtml(e.desc)}</p>
    ${shopGoodStateHtml(statusText)}
  `;
  const actionWrap = document.createElement("div");
  actionWrap.className = "equip-action-wrap shop-card-actions";
  actionWrap.appendChild(
    makeButton(
      owned ? "已拥有" : "购买",
      () => buyShopGood(good, index),
      "primary",
      !canBuy,
    ),
  );
  actionWrap.appendChild(
    makeButton(
      owned ? "已拥有" : "购买并装备",
      () => buyShopGood(good, index, { equipAfterBuy: true }),
      "primary shop-equip-buy",
      !canBuy,
    ),
  );
  attachShopEquipmentCompare(actionWrap, e, false);
  card.appendChild(actionWrap);
  return card;
}

function shopItemCard({ good, index, stock, priceView, canBuy, statusText }) {
  const item = ITEM_DB[good.id];
  if (!item) return shopMissingGoodCard(good, index, "道具资料缺失");
  const card = document.createElement("div");
  card.className = `equip-card item-card ${item.type === "passive" ? "equip-rarity--rare bag-consumable-card--passive" : "equip-rarity--common"} bag-consumable-card ${consumableThemeClass(item)}`;
  const resultText = item.type === "passive" ? "宝物入袋" : "收入背包";
  const typeLabel = item.consumableType || shopGoodTypeLabel(good);
  card.innerHTML = `
    ${shopGoodRibbon(false, stock)}
    <div class="equip-v2-top">
      <span class="equip-v2-grade">${escapeHtml(typeLabel)}</span>
      <strong class="equip-card-name">${escapeHtml(item.name)}</strong>
    </div>
    <div class="equip-card-subtitle">
      <span>${shopGoodStockLabel(stock)}</span>
      <span>${itemScopeLabel(item)}</span>
      ${shopPriceBadgeHtml(priceView)}
    </div>
    <div class="equip-v2-core">
      <span>购买后</span><strong>${resultText}</strong>
    </div>
    <div class="equip-affix-block">
      <ul class="equip-affixes">
        <li class="equip-affix equip-affix--misc">
          <strong class="equip-affix-value">${escapeHtml(item.desc)}</strong>
        </li>
      </ul>
    </div>
    <p class="equip-card-desc">${escapeHtml(item.flavor || item.desc)}</p>
    ${shopGoodStateHtml(statusText)}
  `;
  const actionWrap = document.createElement("div");
  actionWrap.className = "equip-action-wrap shop-card-actions";
  actionWrap.appendChild(
    makeButton(
      "购买",
      () => buyShopGood(good, index),
      "primary",
      !canBuy,
    ),
  );
  card.appendChild(actionWrap);
  return card;
}

function shopMissingGoodCard(good, index, text) {
  const card = document.createElement("div");
  card.className = "equip-card item-card equip-rarity--common shop-good-card is-locked";
  card.innerHTML = `
    <div class="equip-v2-top">
      <span class="equip-v2-grade">异常商品</span>
      <strong class="equip-card-name">${escapeHtml(good?.id || `goods-${index}`)}</strong>
    </div>
    <p class="equip-card-desc">${escapeHtml(text)}</p>
  `;
  return card;
}

function shopGoodRibbon(owned, stock) {
  if (owned) return `<span class="equip-card-equipped">已拥有</span>`;
  if (stock <= 0) return `<span class="equip-card-equipped shop-card-ribbon--sold">售罄</span>`;
  return "";
}

function shopGoodStockLabel(stock) {
  return stock > 0 ? `库存 ${stock}` : "售罄";
}

function shopPriceBadgeHtml(priceView) {
  const label = priceView.discounted ? `<del>${priceView.base}</del><em>${escapeHtml(priceView.label)}</em>` : "";
  return `<span class="shop-card-price ${priceView.discounted ? "is-discounted" : ""}">价格 <strong>${priceView.current}</strong>${label}</span>`;
}

function shopEmptyAffixHtml(label) {
  return `<div class="equip-affix-block"><ul class="equip-affixes equip-affixes--empty"><li class="equip-affix equip-affix--misc"><strong class="equip-affix-value">${escapeHtml(label)}</strong></li></ul></div>`;
}

function shopGoodStateHtml(statusText) {
  const kind = statusText === "可购" ? "ready" : statusText === "金币不足" ? "short" : statusText === "售罄" ? "sold" : "owned";
  return `<div class="shop-card-state shop-card-state--${kind}"><span>${statusText}</span></div>`;
}

function attachShopEquipmentCompare(actionWrap, equipment, equipped) {
  const compare = document.createElement("div");
  compare.className = "equip-hover-compare";
  compare.setAttribute("aria-hidden", "true");
  compare.style.cssText = [
    "display:none",
    "position:absolute",
    "z-index:20",
    "left:50%",
    "bottom:calc(100% + 10px)",
    "width:260px",
    "max-width:min(320px, 76vw)",
    "transform:translateX(-50%)",
    "pointer-events:none",
  ].join(";");
  compare.innerHTML = equipmentCompareHtml(equipment, equipped);
  styleEquipmentHoverCompare(compare);
  const showCompare = () => {
    compare.style.display = "block";
  };
  const hideCompare = () => {
    compare.style.display = "none";
  };
  actionWrap.addEventListener("mouseenter", showCompare);
  actionWrap.addEventListener("mouseleave", hideCompare);
  actionWrap.addEventListener("focusin", showCompare);
  actionWrap.addEventListener("focusout", hideCompare);
  actionWrap.appendChild(compare);
}

function simulateShopEquipmentDrop() {
  return null;
}

function rollShopEquipmentDrop(baseId = null) {
  const fallbackBases = Object.entries(EQUIPMENT_DB || {})
    .filter(([, equipment]) => equipment?.isBase)
    .map(([id]) => id);
  const selectedBaseId = baseId || pick(fallbackBases);
  if (selectedBaseId && !isEquipmentBase(selectedBaseId)) {
    addLine(`${selectedBaseId} 不是装备底材。`, "warn");
    return null;
  }
  baseId = selectedBaseId;
  if (!baseId) {
    addLine("没有可用于模拟掉落的装备底材。", "warn");
    return null;
  }
  const finalId = addEquipment(state, baseId);
  const equipment = getEquipment(finalId);
  if (equipment) {
    addLine(`怪物掉落了 ${equipment.name}。`, "system");
  }
  render();
  if (state.currentShopId) renderShop();
  return finalId;
}

function shopGoodTypeLabel(good) {
  if (good.type === "equipment") {
    const equipment = getEquipment(good.id);
    if (equipment?.slot === "weapon") return "武器";
    if (equipment?.slot === "armor") return "护具";
    return "兵甲";
  }
  return ITEM_DB[good.id]?.type === "consumable" ? "符药" : "宝物";
}

function shopGoodBasePrice(good) {
  return good.type === "equipment"
    ? getEquipment(good.id)?.price || 0
    : ITEM_DB[good.id].price || 0;
}

function shopGoodPriceView(good, currentPrice) {
  if (window.DEBUG_SHOP_FREE) {
    const base = shopGoodBasePrice(good);
    return { current: currentPrice, base, discounted: base > currentPrice, label: "调试免费" };
  }
  const base = shopGoodBasePrice(good);
  const discountRate = 1 - (currentPrice / Math.max(1, base));
  return {
    current: currentPrice,
    base,
    discounted: base > 0 && currentPrice < base,
    label: discountRate > 0 ? `省 ${Math.round(discountRate * 100)}%` : "",
  };
}

function initShopStock(shopId) {
  if (state.currentShopFilter === "magic-smith") ensureMonthlySmithGoods(shopId);
  state.shopStocks[shopId] = state.shopStocks[shopId] || {};
    // 变量：shop，当前步数匹配到的商店配置，存在时进入商店流程。
  const shop = SHOP_DB[shopId];
  if (!shop) return;
  shopGoodsForCurrentFilter(shop).forEach(({ good, index }) => {
    // 变量：key，当前副本的敌人池标识或视觉缓存键，用于查找对应配置。
    const key = shopGoodKey(good, index);
    if (state.shopStocks[shopId][key] == null)
      state.shopStocks[shopId][key] = good.stock ?? 1;
  });
}

function shopGoodKey(good, index) {
  return `${good.type}:${good.id}:${index}`;
}

function shopGoodName(good) {
  return good.type === "equipment"
    ? getEquipment(good.id).name
    : ITEM_DB[good.id].name;
}

function shopGoodDesc(good) {
  if (good.type === "equipment") {
    // 变量：e，e 的局部缓存值，用于让后续表达式更清晰。
    const e = getEquipment(good.id);
    const slotLabel = e.slot === "weapon" ? "武器" : "护具";
    return `${equipmentLevelLabel(e)}${slotLabel}。${e.desc} 攻击 ${signedStat(e.atk)}，免伤 ${signedPct(e.damageReduction)}，速度 ${signedStat(e.speed)}，耐久 ${equipmentDurabilityText(good.id)}。词条：${equipmentAffixText(e)}。`;
  }
  return ITEM_DB[good.id].desc;
}

function shopGoodCompareHtml(good) {
  if (good.type !== "equipment") return "";
  return equipmentCompareHtml(getEquipment(good.id));
}

function equipmentCompareHtml(e, equipped = false) {
  if (!e) return "";
  const current = getEquipment(state.equipments[e.slot]) || {};
  const stats = [
    ["攻", statNumber(e.atk) - statNumber(current.atk), false],
    ["免伤", statNumber(e.damageReduction) - statNumber(current.damageReduction), true],
    ["速", statNumber(e.speed) - statNumber(current.speed), false],
  ];
  const chips = stats.map(([label, delta, pct]) => {
    const kind = delta > 0 ? "up" : delta < 0 ? "down" : "same";
    const value = pct ? signedPct(delta) : signedStat(delta);
    return `<span class="equip-delta equip-delta--${kind}"><span>${label}</span><strong>${value}</strong></span>`;
  }).join("");
  const currentName = current.name || "无";
  const label = equipped ? "当前穿戴" : `对比 ${escapeHtml(currentName)}`;
  return `<div class="equip-compare"><span class="equip-compare-label">${label}</span><div class="equip-deltas">${chips}</div></div>`;
}

function equipmentWeightClass(e) {
  return equipmentRarity(e);
}

function equipmentWeightLabel(e) {
  return e?.slot === "armor" ? "防具" : "武器";
}

function equipmentLevel(e) {
  return EQUIPMENT_RARITY?.[equipmentRarity(e)]?.affixCount ?? 0;
}

function equipmentLevelLabel(e) {
  return equipmentRarityLabel(e);
}

function compareEquipmentIds(a, b) {
  const first = getEquipment(a) || {};
  const second = getEquipment(b) || {};
  return (
    equipmentRarityRank(first) - equipmentRarityRank(second) ||
    String(first.name || a).localeCompare(String(second.name || b), "zh-Hans-CN")
  );
}

function compareEquipmentChoiceIds(a, b) {
  const first = getEquipment(a) || {};
  const second = getEquipment(b) || {};
  const firstEquipped = state.equipments?.[first.slot] === a ? 1 : 0;
  const secondEquipped = state.equipments?.[second.slot] === b ? 1 : 0;
  return secondEquipped - firstEquipped || compareEquipmentIds(a, b);
}

function equipmentRarity(e) {
  return ["common", "magic", "rare", "legendary"].includes(e?.rarity)
    ? e.rarity
    : "common";
}

function equipmentRarityRank(e) {
  return { common: 1, magic: 2, rare: 3, legendary: 4 }[equipmentRarity(e)] || 1;
}

function equipmentRarityLabel(e) {
  return EQUIPMENT_RARITY?.[equipmentRarity(e)]?.name || "普通";
}

function equipmentAffixes(e) {
  return e?.rarity === "legendary"
    ? (e.fixedAffixes || e.affixes || [])
    : (e?.affixes || []);
}

function equipmentAffixStatClass(affix) {
  if (affix?.stat === "atk") return "atk";
  if (affix?.stat === "damageReduction") return "guard";
  if (affix?.stat === "speed") return "speed";
  return "misc";
}

function equipmentAffixValueText(affix) {
  if (affix?.text) return affix.text;
  const value = Number(affix?.value);
  if (!Number.isFinite(value)) return "";
  const label = { atk: "攻击", damageReduction: "免伤", speed: "速度" }[affix?.stat] || "属性";
  return `${label} ${affix?.stat === "damageReduction" || affix?.unit === "percent" ? signedPct(value) : signedStat(value)}`;
}

function equipmentAffixText(e) {
  const affixes = equipmentAffixes(e);
  if (!affixes.length) return "无";
  return affixes.map((affix) => affix.text || affix.name).join(" / ");
}

function equipmentAffixHtml(e) {
  const affixes = equipmentAffixes(e);
  if (!affixes.length) return "";
  const chips = affixes.map((affix) => {
    const value = equipmentAffixValueText(affix);
    return `<li class="equip-affix equip-affix--${equipmentAffixStatClass(affix)}">
      <strong class="equip-affix-value">${escapeHtml(value || affix.text || affix.name || "属性")}</strong>
    </li>`;
  }).join("");
  return `<div class="equip-affix-block"><ul class="equip-affixes">${chips}</ul></div>`;
}

function equipmentSlotAffixHtml(e) {
  const affixes = equipmentAffixes(e);
  if (!affixes.length) return "";
  const chips = affixes.map((affix) => {
    const value = equipmentAffixValueText(affix);
    return `<span class="equip-slot-affix equip-slot-affix--${equipmentAffixStatClass(affix)}">
      <strong>${escapeHtml(value || affix.text || affix.name || "属性")}</strong>
    </span>`;
  }).join("");
  return `<div class="equip-slot-affix-panel">
    <div class="equip-slot-affix-list">${chips}</div>
  </div>`;
}

function equipmentDurabilityText(id) {
  const equipment = getEquipment(id);
  if (!equipment?.durability) return "-";
  const current = equipmentDurabilityValue(id);
  return `${current}/${equipment.durability}`;
}

function equipmentDurabilityValue(id) {
  const equipment = getEquipment(id);
  if (!equipment?.durability) return Infinity;
  return Number.isFinite(Number(state.equipmentDurability?.[id]))
    ? Number(state.equipmentDurability[id])
    : equipment.durability;
}

function statNumber(value) {
  return Number(value || 0);
}

function signedStat(value) {
  const num = statNumber(value);
  return `${num >= 0 ? "+" : ""}${num}`;
}

function signedPct(value) {
  const num = statNumber(value);
  return `${num >= 0 ? "+" : ""}${Math.round(num * 100)}%`;
}

function shopGoodPrice(good) {
  if (window.DEBUG_SHOP_FREE) return 0;
  // 变量：basePrice，商品原价。
  const basePrice = shopGoodBasePrice(good);
  // 变量：shopDeal，进店前选择带来的本店临时议价效果。
  const shopDeal = state.shopDeals?.[state.currentShopId] || {};
  let price = basePrice;
  if (shopDeal.discountRate && price > 0) {
    price = Math.max(1, Math.floor(price * (1 - shopDeal.discountRate)));
  }
  return price;
}

function buyShopGood(good, index, options = {}) {
  // 变量：shopId，shopId 的局部缓存值，用于让后续表达式更清晰。
  const shopId = state.currentShopId;
  // 变量：price，当前商品购买价格。
  const price = shopGoodPrice(good);
  // 变量：stockKey，商店商品库存键，区分同 id 不同位置的商品。
  const stockKey = shopGoodKey(good, index);
  if (
    !shopId ||
    !state.shopStocks[shopId] ||
    state.shopStocks[shopId][stockKey] <= 0
  )
    return;
  if (price < 0) return;
  if (state.gold < price) {
    addLine("金币不足，掌柜把货又往回收了半寸。", "warn");
    return;
  }
  if (good.type === "equipment" && !isEquipmentBase(good.id) && state.ownedEquip.includes(good.id)) return;
  state.gold -= price;
  state.shopStocks[shopId][stockKey] -= 1;
  if (good.type === "equipment") {
    const finalId = addEquipment(state, good.id);
    if (options.equipAfterBuy) {
      const equipment = getEquipment(finalId);
      state.equipments[equipment.slot] = finalId;
      addLine(`已装备 ${equipment.name}。`, "system");
    }
  } else {
    addItem(state, good.id, 1);
  }
  addLine(`花费 ${price} 金购买 ${shopGoodName(good)}。`, "reward");
  applyShopDealBonus(good);
  render();
  renderShop();
}

function applyShopDealBonus(good) {
  // 变量：shopDeal，本店趣味玩法可能附带的额外赠品或提示。
  const shopDeal = state.shopDeals?.[state.currentShopId];
  if (!shopDeal || good.type === "equipment") return;
  if (shopDeal.extraItemChance && Math.random() < shopDeal.extraItemChance) {
    addItem(state, good.id, 1);
    addLine(shopDeal.extraItemText || `摊主又塞给你 1 个${shopGoodName(good)}。`, "system");
  }
}
