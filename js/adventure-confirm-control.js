function confirmControlEscapeHtml(value) {
  if (typeof escapeHtml === "function") return escapeHtml(value);
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function createAdventureConfirmControl(config = {}) {
  const id = config.id || "adventureConfirmModal";
  const titleId = config.titleId || "adventureConfirmTitle";
  let lastFocus = null;
  let activeOptions = null;

  function entriesHtml(entries, emptyText = "无", minRows = 0) {
    const list = (Array.isArray(entries) ? entries : []).filter(Boolean);
    const rows = list.length ? list : [{ value: emptyText, muted: true }];
    while (rows.length < minRows) rows.push({ spacer: true });
    return rows.map((entry) => {
      if (entry?.spacer) {
        return `<div class="adventure-confirm-line is-spacer" aria-hidden="true"><strong>&nbsp;</strong></div>`;
      }
      if (typeof entry === "string") {
        return `<div class="adventure-confirm-line"><strong>${confirmControlEscapeHtml(entry)}</strong></div>`;
      }
      const tone = entry.tone ? ` adventure-confirm-line--${confirmControlEscapeHtml(entry.tone)}` : entry.muted ? " is-muted" : "";
      const label = entry.label ? `<span>${confirmControlEscapeHtml(entry.label)}</span>` : "";
      const value = entry.value || entry.text || "";
      return `<div class="adventure-confirm-line${tone}">${label}<strong>${confirmControlEscapeHtml(value)}</strong></div>`;
    }).join("");
  }

  function cardsHtml(entries, emptyText = "暂无") {
    const list = (Array.isArray(entries) ? entries : []).filter(Boolean);
    if (!list.length) {
      return `<div class="adventure-confirm-stat is-muted"><strong>${confirmControlEscapeHtml(emptyText)}</strong></div>`;
    }
    return list.map((entry) => {
      if (typeof entry === "string") {
        return `<div class="adventure-confirm-stat"><strong>${confirmControlEscapeHtml(entry)}</strong></div>`;
      }
      const label = entry.label ? `<span>${confirmControlEscapeHtml(entry.label)}</span>` : "";
      const value = entry.value || entry.text || "";
      return `<div class="adventure-confirm-stat">${label}<strong>${confirmControlEscapeHtml(value)}</strong></div>`;
    }).join("");
  }

  function ensure() {
    let modal = document.getElementById(id);
    if (modal) return modal;
    modal = document.createElement("div");
    modal.id = id;
    modal.className = "modal adventure-confirm-modal";
    modal.setAttribute("aria-hidden", "true");
    modal.innerHTML = `
      <section class="modal-card adventure-confirm-card" role="dialog" aria-modal="true" aria-labelledby="${titleId}">
        <div class="adventure-confirm-aura" aria-hidden="true"></div>
        <button class="adventure-confirm-close" type="button" data-adventure-confirm-close aria-label="关闭">关闭</button>
        <div class="adventure-confirm-hero">
          <div class="adventure-confirm-emblem" aria-hidden="true">
            <span class="adventure-confirm-ring adventure-confirm-ring--outer"></span>
            <span class="adventure-confirm-ring adventure-confirm-ring--inner"></span>
            <span class="adventure-confirm-needle adventure-confirm-needle--north"></span>
            <span class="adventure-confirm-needle adventure-confirm-needle--south"></span>
            <span class="adventure-confirm-route adventure-confirm-route--one"></span>
            <span class="adventure-confirm-route adventure-confirm-route--two"></span>
          </div>
          <div class="adventure-confirm-head">
            <span data-adventure-confirm-kicker>行动确认</span>
            <strong id="${titleId}" data-adventure-confirm-title></strong>
            <p data-adventure-confirm-desc></p>
          </div>
        </div>
        <div class="adventure-confirm-ledger" aria-label="行动代价与回报">
          <section class="adventure-confirm-column adventure-confirm-column--cost">
            <span class="adventure-confirm-column-title">付出代价</span>
            <div data-adventure-confirm-costs></div>
          </section>
          <section class="adventure-confirm-column adventure-confirm-column--reward">
            <span class="adventure-confirm-column-title">得到回报</span>
            <div data-adventure-confirm-rewards></div>
          </section>
        </div>
        <div class="adventure-confirm-status" aria-label="当前状态" data-adventure-confirm-status></div>
        <div class="adventure-confirm-actions">
          <button class="primary" type="button" data-adventure-confirm-submit></button>
          <button type="button" data-adventure-confirm-cancel></button>
        </div>
      </section>
    `;
    modal.addEventListener("click", (event) => {
      if (
        event.target === modal ||
        event.target.closest("[data-adventure-confirm-cancel]") ||
        event.target.closest("[data-adventure-confirm-close]")
      ) {
        close();
        return;
      }
      if (event.target.closest("[data-adventure-confirm-submit]")) {
        confirm();
      }
    });
    document.body.appendChild(modal);
    return modal;
  }

  function open(options = {}) {
    const modal = ensure();
    activeOptions = options;
    modal.querySelector("[data-adventure-confirm-kicker]").textContent = options.kicker || "行动确认";
    modal.querySelector("[data-adventure-confirm-title]").textContent = options.title || "确认如此做？";
    modal.querySelector("[data-adventure-confirm-desc]").textContent = options.desc || "请确认这次行动的代价与回报。";
    const costCount = (Array.isArray(options.costs) ? options.costs : []).filter(Boolean).length;
    const rewardCount = (Array.isArray(options.rewards) ? options.rewards : []).filter(Boolean).length;
    const ledgerRows = Math.max(1, costCount, rewardCount);
    modal.querySelector("[data-adventure-confirm-costs]").innerHTML = entriesHtml(options.costs, "没有额外代价", ledgerRows);
    modal.querySelector("[data-adventure-confirm-rewards]").innerHTML = entriesHtml(options.rewards, "没有额外回报", ledgerRows);
    modal.querySelector("[data-adventure-confirm-status]").innerHTML = cardsHtml(options.status, "暂无状态");
    modal.querySelector("[data-adventure-confirm-cancel]").textContent = options.cancelLabel || "暂不执行";
    modal.querySelector("[data-adventure-confirm-submit]").textContent = options.confirmLabel || "确认执行";
    lastFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    modal.classList.add("active");
    modal.setAttribute("aria-hidden", "false");
    const focusSubmit = () => modal.querySelector("[data-adventure-confirm-submit]")?.focus({ preventScroll: true });
    requestAnimationFrame(() => requestAnimationFrame(focusSubmit));
    window.setTimeout(focusSubmit, 80);
  }

  function close(options = {}) {
    const modal = document.getElementById(id);
    if (!modal) return;
    modal.classList.remove("active");
    modal.setAttribute("aria-hidden", "true");
    if (options.restoreFocus !== false && lastFocus?.isConnected) {
      lastFocus.focus();
    }
    lastFocus = null;
    activeOptions = null;
  }

  function confirm() {
    const onConfirm = activeOptions?.onConfirm;
    close({ restoreFocus: false });
    if (typeof onConfirm === "function") onConfirm();
  }

  function isOpen() {
    return !!document.getElementById(id)?.classList.contains("active");
  }

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape" || !isOpen()) return;
    event.preventDefault();
    close();
  });

  return { open, close, confirm, isOpen, ensure };
}

const adventureConfirmControl = createAdventureConfirmControl();

window.AdventureConfirmControl = {
  create: createAdventureConfirmControl,
  default: adventureConfirmControl,
};

function openAdventureConfirmModal(options = {}) {
  adventureConfirmControl.open(options);
}

function closeAdventureConfirmModal(options = {}) {
  adventureConfirmControl.close(options);
}

function confirmAdventureAction() {
  adventureConfirmControl.confirm();
}
