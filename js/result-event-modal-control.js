function resultEventModalValue(value, fallback = "", context) {
  if (typeof value === "function") {
    const resolved = value(context);
    return resolved == null ? fallback : String(resolved);
  }
  return value == null ? fallback : String(value);
}

function resultEventModalCurrentState() {
  return typeof state !== "undefined" ? state : undefined;
}

function openResultEventModal(options = {}) {
  const title = options.title || options.name || "事件结果";
  const currentState = resultEventModalCurrentState();
  const eventData = {
    kind: "result",
    kicker: options.kicker || "结果型事件",
    presentation: "result-event",
    name: title,
    text: resultEventModalValue(options.desc ?? options.text, "事件已经记录下来。", currentState),
    illustration: options.illustration || window.EVENT_DEFAULT_ILLUST,
    effect: typeof options.effect === "function"
      ? options.effect
      : (currentState) => resultEventModalValue(options.result, options.emptyResultText || "事件已经结束。", currentState),
  };

  if (typeof openEventModal !== "function") {
    const resultText = resultEventModalValue(eventData.effect, options.emptyResultText || "事件已经结束。", currentState);
    if (typeof addLine === "function") addLine(`【${title}】${resultText}`, options.logTone || "system");
    if (typeof render === "function") render();
    return;
  }

  openEventModal(eventData, {
    confirmLabel: options.confirmLabel || "确认",
    confirm: () => revealResultEventModal(eventData, options),
  });
}

function revealResultEventModal(eventData, options = {}) {
  const resultText = resultEventModalValue(eventData.effect, options.emptyResultText || "事件已经结束。", resultEventModalCurrentState());
  const displayText = resultText || options.emptyResultText || "事件已经结束。";

  if (resultText && typeof addLine === "function") {
    addLine(resultText, options.logTone || "system");
  }
  const resultNode = $("eventResult");
  if (resultNode) {
    resultNode.textContent = displayText;
    resultNode.classList.add("active");
  }

  const confirmButton = $("eventConfirm");
  if (confirmButton) confirmButton.textContent = options.closeLabel || "确认";

  if (typeof activeEventModal !== "undefined" && activeEventModal) {
    activeEventModal.confirm = () => closeResultEventModal(options);
  }
  if (typeof options.onResolve === "function") options.onResolve(displayText, eventData);
  if (typeof render === "function") render();
}

function closeResultEventModal(options = {}) {
  if (options.skipDefaultClose) {
    if (typeof closeEventModal === "function") closeEventModal();
    if (typeof options.onClose === "function") options.onClose();
    return;
  }
  if (typeof state !== "undefined") state.mode = options.closeMode || "free";
  if (typeof closeEventModal === "function") closeEventModal();
  if (typeof checkPlayerAlive === "function") checkPlayerAlive();
  if (typeof options.onClose === "function") options.onClose();
  if (typeof render === "function") render();
}

window.ResultEventModalControl = {
  open: openResultEventModal,
  reveal: revealResultEventModal,
  close: closeResultEventModal,
};
