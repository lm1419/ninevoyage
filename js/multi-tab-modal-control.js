const MULTI_TAB_MODAL_DEFAULT_ID = "menuModal";
const MULTI_TAB_MODAL_MODE_CLASSES = [
  "modal--home-settings",
  "modal--home-load",
  "modal--home-about",
  "modal--home-codex",
];

function multiTabModalElements(modalId = MULTI_TAB_MODAL_DEFAULT_ID) {
  const modal = document.getElementById(modalId);
  if (!modal) return {};
  return {
    modal,
    title: modal.querySelector("[data-multi-tab-title]") || document.getElementById("menuTitle"),
    closeButton: modal.querySelector("[data-multi-tab-close]") || document.getElementById("closeMenu"),
    tabs: modal.querySelector("[data-multi-tab-tabs]") || document.getElementById("menuTabs"),
    content: modal.querySelector("[data-multi-tab-content]") || document.getElementById("menuContent"),
  };
}

function normalizeMultiTabClassList(classes = []) {
  if (!Array.isArray(classes)) return [];
  return classes.filter(Boolean);
}

function setMultiTabModalMode(options = {}) {
  const { modal } = multiTabModalElements(options.modalId);
  if (!modal) return null;
  modal.dataset.multiTabModal = "true";
  if (options.mode !== undefined) modal.dataset.menuMode = options.mode || "";
  modal.classList.remove(...MULTI_TAB_MODAL_MODE_CLASSES);
  const classes = normalizeMultiTabClassList(options.classes);
  if (classes.length) modal.classList.add(...classes);
  if (options.icon) modal.dataset.menuIcon = options.icon;
  return modal;
}

function setMultiTabModalTitle(options = {}) {
  const { title, closeButton } = multiTabModalElements(options.modalId);
  if (title && options.titleHtml !== undefined) title.innerHTML = options.titleHtml;
  else if (title && options.title !== undefined) title.textContent = options.title;
  if (closeButton && options.closeLabel !== undefined) closeButton.textContent = options.closeLabel;
}

function setMultiTabModalTabs(options = {}) {
  const { modal, tabs: tabsElement } = multiTabModalElements(options.modalId);
  if (!tabsElement) return null;
  const tabs = Array.isArray(options.tabs) ? options.tabs : [];
  const hideTabs = options.hideTabs === true || tabs.length <= 1;
  tabsElement.innerHTML = "";
  tabsElement.classList.toggle("tabs--hidden", hideTabs);
  tabs.forEach((tab) => {
    const id = Array.isArray(tab) ? tab[0] : tab.id;
    const label = Array.isArray(tab) ? tab[1] : tab.label;
    const button = typeof makeButton === "function"
      ? makeButton(label, () => options.onSelectTab?.(id), id === options.activeTab ? "primary" : "")
      : document.createElement("button");
    if (typeof makeButton !== "function") {
      button.type = "button";
      button.textContent = label;
      if (id === options.activeTab) button.classList.add("primary");
      button.addEventListener("click", () => options.onSelectTab?.(id));
    }
    tabsElement.appendChild(button);
  });
  if (modal && options.activeTab !== undefined) modal.dataset.activeMenuTab = options.activeTab;
  return tabsElement;
}

function prepareMultiTabModalContent(options = {}) {
  const { content } = multiTabModalElements(options.modalId);
  if (!content) return null;
  if (options.clear !== false) content.innerHTML = "";
  return content;
}

function updateMultiTabModalShell(options = {}) {
  if (options.mode !== undefined || options.classes !== undefined || options.icon !== undefined) {
    setMultiTabModalMode(options);
  }
  setMultiTabModalTitle(options);
  if (options.tabs !== undefined) setMultiTabModalTabs(options);
  return multiTabModalElements(options.modalId);
}

function openMultiTabModal(options = {}) {
  const elements = updateMultiTabModalShell(options);
  if (!elements.modal) return elements;
  elements.modal.classList.add("active", "multi-tab-modal");
  elements.modal.setAttribute("aria-hidden", "false");
  return elements;
}

function closeMultiTabModal(options = {}) {
  const elements = multiTabModalElements(options.modalId);
  if (!elements.modal) return elements;
  elements.modal.classList.remove("active", ...MULTI_TAB_MODAL_MODE_CLASSES);
  elements.modal.dataset.menuMode = "";
  elements.modal.removeAttribute("data-active-menu-tab");
  elements.modal.setAttribute("aria-hidden", "true");
  elements.tabs?.classList.remove("tabs--hidden");
  setMultiTabModalTitle({
    modalId: options.modalId,
    title: options.resetTitle === undefined ? "\u83dc\u5355" : options.resetTitle,
    closeLabel: options.resetCloseLabel === undefined ? "\u5173\u95ed" : options.resetCloseLabel,
  });
  return elements;
}
