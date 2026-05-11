// Event data helpers: data/events.js loads before the game engine.
function resultEvent(name, text, effect, illustration, weight = window.EVENT_DEFAULT_WEIGHT ?? 10) { return { kind: "result", name, text, effect, illustration: illustration || window.EVENT_DEFAULT_ILLUST, weight }; }
function choiceEvent(name, text, choices, illustration, weight = window.EVENT_DEFAULT_WEIGHT ?? 10) { return { kind: "choice", name, text, choices, illustration: illustration || window.EVENT_DEFAULT_ILLUST, weight }; }
