function ensureHomeState() {
  if (state?._homeOnly) return;
  if (!state) {
    state = createInitialState();
    state.mode = "home";
    state._homeOnly = true;
  }
}

const HOME_MUSIC_STORAGE_KEY = "endless-land.homeMusicEnabled";
const homeMusic = typeof Audio !== "undefined" ? new Audio("assets/audio/main.mp3") : null;
const gameMainMusic = typeof Audio !== "undefined" ? new Audio() : null;
const buttonClickSounds = typeof Audio !== "undefined"
  ? Array.from({ length: 4 }, () => new Audio("assets/audio/button-soft.wav"))
  : [];
const gameSfxSources = {
  attack: "assets/audio/sfx-attack-slash.wav",
  skillSlash: "assets/audio/sfx-skill-slash.wav",
  buff: "assets/audio/sfx-buff-cast.wav",
  item: "assets/audio/sfx-item-use.wav",
};
const gameSfxPools = typeof Audio !== "undefined"
  ? Object.fromEntries(
    Object.entries(gameSfxSources).map(([key, src]) => [
      key,
      Array.from({ length: 3 }, () => new Audio(src)),
    ]),
  )
  : {};
const gameSfxIndexes = {};
let buttonClickSoundIndex = 0;
let homeMusicEnabled = getHomeMusicPreference();
let homeMusicUnlocked = false;
let gameMainMusicUnlocked = false;
let activeGameMainMusicSrc = "";

if (homeMusic) {
  homeMusic.loop = true;
  homeMusic.volume = 0.42;
  homeMusic.preload = "auto";
}

if (gameMainMusic) {
  gameMainMusic.loop = true;
  gameMainMusic.volume = 0.36;
  gameMainMusic.preload = "auto";
}

buttonClickSounds.forEach((sound) => {
  sound.volume = 0.3;
  sound.preload = "auto";
});

Object.values(gameSfxPools).flat().forEach((sound) => {
  sound.volume = 0.58;
  sound.preload = "auto";
});

function getHomeMusicPreference() {
  try {
    return localStorage.getItem(HOME_MUSIC_STORAGE_KEY) !== "false";
  } catch (error) {
    return true;
  }
}

function saveHomeMusicPreference(enabled) {
  try {
    localStorage.setItem(HOME_MUSIC_STORAGE_KEY, String(enabled));
  } catch (error) {}
}

function updateHomeMusicButton() {
  const button = $("homeMusicBtn");
  const text = $("homeMusicText");
  if (!button || !text) return;
  button.classList.toggle("is-muted", !homeMusicEnabled);
  button.setAttribute("aria-pressed", String(homeMusicEnabled));
  button.setAttribute("aria-label", homeMusicEnabled ? "关闭主菜单乐曲" : "开启主菜单乐曲");
  text.textContent = homeMusicEnabled ? "主菜单音乐 · 开" : "主菜单音乐 · 关";
}

function pauseHomeMusic() {
  if (!homeMusic) return;
  homeMusic.pause();
}

function pauseGameMainMusic() {
  if (!gameMainMusic) return;
  gameMainMusic.pause();
}

function playHomeMusic() {
  if (!homeMusic || !homeMusicEnabled || !document.body.classList.contains("home-active")) return;
  homeMusic.play().catch(() => {});
}

function dungeonMusicSrc(dungeon = typeof currentDungeon === "function" ? currentDungeon() : null) {
  return dungeon?.music || "assets/audio/ch01.mp3";
}

function syncGameMainMusicTrack() {
  if (!gameMainMusic) return;
  const nextSrc = dungeonMusicSrc();
  if (activeGameMainMusicSrc === nextSrc) return;
  activeGameMainMusicSrc = nextSrc;
  gameMainMusic.pause();
  gameMainMusic.src = nextSrc;
  gameMainMusic.currentTime = 0;
  gameMainMusic.load();
}

function playGameMainMusic() {
  if (!gameMainMusic || !homeMusicEnabled || document.body.classList.contains("home-active")) return;
  syncGameMainMusicTrack();
  gameMainMusic.play().catch(() => {});
}

function setHomeMusicEnabled(enabled) {
  homeMusicEnabled = enabled;
  saveHomeMusicPreference(enabled);
  updateHomeMusicButton();
  if (enabled) {
    homeMusicUnlocked = true;
    if (document.body.classList.contains("home-active")) {
      playHomeMusic();
    } else {
      gameMainMusicUnlocked = true;
      playGameMainMusic();
    }
  } else {
    pauseHomeMusic();
    pauseGameMainMusic();
  }
}

function unlockHomeMusic() {
  if (homeMusicUnlocked || !homeMusicEnabled) return;
  homeMusicUnlocked = true;
  playHomeMusic();
}

function unlockSceneMusic() {
  if (!homeMusicEnabled) return;
  if (document.body.classList.contains("home-active")) {
    unlockHomeMusic();
    return;
  }
  gameMainMusicUnlocked = true;
  playGameMainMusic();
}

function playButtonClickSound(target) {
  if (!buttonClickSounds.length) return;
  const button = target?.closest?.("button");
  if (!button || button.disabled || button.getAttribute("aria-disabled") === "true") return;
  const sound = buttonClickSounds[buttonClickSoundIndex];
  buttonClickSoundIndex = (buttonClickSoundIndex + 1) % buttonClickSounds.length;
  sound.currentTime = 0;
  sound.play().catch(() => {});
}

function playGameSfx(name) {
  const pool = gameSfxPools[name];
  if (!pool?.length) return;
  const index = gameSfxIndexes[name] || 0;
  const sound = pool[index];
  gameSfxIndexes[name] = (index + 1) % pool.length;
  sound.currentTime = 0;
  sound.play().catch(() => {});
}

function refreshHomeScreen() {
  const slot = typeof latestSaveSlot === "function" ? latestSaveSlot() : null;
  const hasSave = !!slot?.payload?.state;
  const continueButton = $("homeContinueBtn");
  const summary = $("homeContinueSummary");
  const saveTime = $("homeSaveTime");
  const versionText = $("homeVersionText");
  const meta = window.GAME_META || {};
  if (continueButton) continueButton.disabled = !hasSave;
  if (summary) {
    summary.textContent = hasSave
      ? saveSummary(slot.payload.state)
      : "暂无营火记录";
  }
  if (saveTime) {
    saveTime.textContent = hasSave
      ? formatSaveTime(slot.savedAt)
      : "尚未点燃";
  }
  if (versionText) {
    versionText.textContent = `v${meta.version || "0.1.0"} · ${meta.build || "本地构建"}`;
  }
  updateHomeMusicButton();
  if (typeof updateDebugNameShortcutTargets === "function") updateDebugNameShortcutTargets();
}

function showHomeScreen() {
  ensureHomeState();
  document.body.classList.add("home-active");
  document.body.classList.remove("ally-mode");
  $("homeScreen")?.classList.add("active");
  pauseGameMainMusic();
  refreshHomeScreen();
  if (homeMusicUnlocked) playHomeMusic();
}

function enterGameScreen() {
  document.body.classList.remove("home-active");
  $("homeScreen")?.classList.remove("active");
  pauseHomeMusic();
  gameMainMusicUnlocked = true;
  playGameMainMusic();
  if (state?._homeOnly) delete state._homeOnly;
}

function continueHomeGame() {
  const slot = latestSaveSlot();
  if (!slot?.payload?.state) {
    refreshHomeScreen();
    return;
  }
  loadGame();
}

let characterSetupPortrait = null;
let characterPortraitChoicesRequestId = 0;

function characterSetupGender() {
  const selectedGender = document.querySelector('input[name="characterGender"]:checked')?.value;
  return normalizePlayerGender(selectedGender);
}

function setCharacterPortraitPickerOpen(open) {
  const panel = document.querySelector(".character-portrait-panel");
  const toggle = $("characterPortraitPickerToggle");
  panel?.classList.toggle("is-selecting", !!open);
  toggle?.setAttribute("aria-expanded", open ? "true" : "false");
  if (open) renderCharacterPortraitChoices();
}

function chooseCharacterSetupPortrait(src) {
  characterSetupPortrait = normalizePlayerPortrait(src, characterSetupGender());
  updateCharacterSetupPreview();
  setCharacterPortraitPickerOpen(false);
}

function characterPortraitFileName(src) {
  const normalized = String(src || "").replace(/\\/g, "/");
  return decodeURIComponent(normalized.split("/").pop() || "");
}

function uniquePortraitSources(sources) {
  const seen = new Set();
  return sources
    .map((src) => String(src || "").replace(/\\/g, "/"))
    .filter((src) => {
      const key = src.toLowerCase();
      if (!src || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

function sortPortraitSources(sources) {
  return [...sources].sort((a, b) => characterPortraitFileName(a).localeCompare(characterPortraitFileName(b), undefined, { numeric: true, sensitivity: "base" }));
}

function discoverCharacterPortraitOptions(gender) {
  return sortPortraitSources(uniquePortraitSources(playerPortraitOptions(normalizePlayerGender(gender))));
}

function renderCharacterPortraitChoices() {
  const choices = $("characterPortraitChoices");
  if (!choices) return;
  const gender = characterSetupGender();
  const requestId = ++characterPortraitChoicesRequestId;
  const options = discoverCharacterPortraitOptions(gender);
  if (requestId !== characterPortraitChoicesRequestId || gender !== characterSetupGender()) return;
  choices.replaceChildren();
  if (!options.length) {
    const empty = document.createElement("p");
    empty.className = "character-portrait-empty";
    empty.textContent = "暂无可选立绘";
    choices.appendChild(empty);
    return;
  }
  options.forEach((src, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `character-portrait-option${src === characterSetupPortrait ? " is-selected" : ""}`;
    button.setAttribute("aria-label", `选择${playerGenderLabel(gender)}立绘 ${index + 1}`);
    button.addEventListener("click", () => chooseCharacterSetupPortrait(src));

    const img = document.createElement("img");
    img.src = src;
    img.alt = `${playerGenderLabel(gender)}立绘 ${index + 1}`;
    img.loading = "lazy";
    img.decoding = "async";
    img.addEventListener("error", () => {
      button.disabled = true;
      button.classList.add("is-unavailable");
    });
    button.appendChild(img);
    choices.appendChild(button);
  });
}

function openCharacterSetupModal() {
  const modal = $("characterSetupModal");
  if (!modal) {
    newGame();
    return;
  }
  const nameInput = $("characterNameInput");
  const genderMale = $("characterGenderMale");
  if (nameInput) {
    nameInput.value = DEFAULT_PLAYER_NAME;
    requestAnimationFrame(() => {
      nameInput.focus();
      nameInput.select();
    });
  }
  if (genderMale) genderMale.checked = true;
  characterSetupPortrait = normalizePlayerPortrait(null, "male");
  setCharacterPortraitPickerOpen(false);
  updateCharacterSetupPreview();
  modal.classList.add("active");
  modal.setAttribute("aria-hidden", "false");
}

function closeCharacterSetupModal() {
  const modal = $("characterSetupModal");
  if (!modal) return;
  setCharacterPortraitPickerOpen(false);
  modal.classList.remove("active");
  modal.setAttribute("aria-hidden", "true");
}

function submitCharacterSetup(event) {
  event.preventDefault();
  const selectedGender = characterSetupGender();
  const profile = normalizePlayerProfile({
    name: $("characterNameInput")?.value,
    gender: selectedGender,
    portrait: characterSetupPortrait,
  });
  closeCharacterSetupModal();
  newGame(profile);
}

function updateCharacterSetupPreview() {
  const gender = characterSetupGender();
  const name = normalizePlayerName($("characterNameInput")?.value);
  const portrait = $("characterPortraitPreview");
  const previewName = $("characterPreviewName");
  characterSetupPortrait = normalizePlayerPortrait(characterSetupPortrait, gender);
  if (portrait) {
    portrait.src = playerPortraitSrc(gender, characterSetupPortrait);
    portrait.alt = `${name}立绘`;
  }
  if (previewName) previewName.textContent = name;
  if (document.querySelector(".character-portrait-panel")?.classList.contains("is-selecting")) {
    renderCharacterPortraitChoices();
  }
}

function resetCharacterSetup() {
  const nameInput = $("characterNameInput");
  const genderMale = $("characterGenderMale");
  if (nameInput) {
    nameInput.value = DEFAULT_PLAYER_NAME;
    nameInput.focus();
    nameInput.select();
  }
  if (genderMale) genderMale.checked = true;
  characterSetupPortrait = normalizePlayerPortrait(null, "male");
  setCharacterPortraitPickerOpen(false);
  updateCharacterSetupPreview();
}

function openHomeSettings() {
  ensureHomeState();
  openMenu("system", { home: true });
}

function openHomeAbout() {
  ensureHomeState();
  openMenu("about", { homeAbout: true });
}

const DEBUG_DIRECT_TOWN_BOOT = false;

$("homeNewBtn")?.addEventListener("click", openCharacterSetupModal);
$("homeContinueBtn")?.addEventListener("click", continueHomeGame);
$("homeSettingsBtn")?.addEventListener("click", openHomeSettings);
$("homeVersionBtn")?.addEventListener("click", openHomeAbout);
$("homeMusicBtn")?.addEventListener("click", () => setHomeMusicEnabled(!homeMusicEnabled));
$("characterSetupForm")?.addEventListener("submit", submitCharacterSetup);
$("characterSetupCancel")?.addEventListener("click", closeCharacterSetupModal);
$("characterSetupReset")?.addEventListener("click", resetCharacterSetup);
$("characterNameInput")?.addEventListener("input", updateCharacterSetupPreview);
$("characterPortraitPickerToggle")?.addEventListener("click", () => {
  const panel = document.querySelector(".character-portrait-panel");
  setCharacterPortraitPickerOpen(!panel?.classList.contains("is-selecting"));
});
document.querySelectorAll('input[name="characterGender"]').forEach((input) => {
  input.addEventListener("change", updateCharacterSetupPreview);
});
$("characterSetupModal")?.addEventListener("click", (event) => {
  if (event.target.id === "characterSetupModal") closeCharacterSetupModal();
});
document.addEventListener("pointerdown", unlockSceneMusic, { once: true });
document.addEventListener("keydown", unlockSceneMusic, { once: true });
document.addEventListener("click", (e) => playButtonClickSound(e.target), true);
$("closeMenu").addEventListener("click", () => {
  if ($("menuModal")?.dataset.menuMode === "shop") closeShop();
  else closeMenu();
});
$("eventConfirm").addEventListener("click", confirmEventModal);
$("detailBtn").addEventListener("click", () => openMenu("detail"));
$("equipTitle").addEventListener("click", () => openMenu("equip"));
$("bagTitle")?.addEventListener("click", () => openMenu("bag"));
$("menuModal").addEventListener("click", (e) => {
  if (e.target.id !== "menuModal") return;
  if ($("menuModal")?.dataset.menuMode === "shop") closeShop();
  else closeMenu();
});
document.addEventListener("mouseover", (e) => {
  // 变量：target，状态或技能效果的作用目标。
  const target = e.target.closest(".skill-tip, .stat-tip");
  if (target) showSkillHoverCard(target);
});
document.addEventListener("mousemove", (e) => {
  // 变量：target，状态或技能效果的作用目标。
  const target = e.target.closest(".skill-tip, .stat-tip");
  if (target) showSkillHoverCard(target);
});
document.addEventListener("mouseout", (e) => {
  if (e.target.closest(".skill-tip, .stat-tip")) hideSkillHoverCard();
});
document.addEventListener("scroll", hideSkillHoverCard, true);
document.addEventListener("keydown", (e) => {
  if (e.code !== "Space" && e.key !== "Enter") return;
  if (state?.mode !== "battle" || !state.battle?.qte) return;
  e.preventDefault();
  confirmBattleQte();
});

window.addEventListener("resize", () => {
  // 变量：frame，视觉画面容器，用于渲染场景或敌人插画效果。
  const frame = $("visualFrame");
  if (frame?._visualReady) VisualRenderer.resize(frame);
  hideSkillHoverCard();
});

function seedDebugTownInventory(targetState) {
  targetState.inventory = targetState.inventory || {};
  Object.entries(ITEM_DB || {}).forEach(([id, item]) => {
    if (item?.type !== "consumable" && item?.type !== "passive") return;
    const hadItem = (targetState.inventory[id] || 0) > 0;
    targetState.inventory[id] = Math.max(targetState.inventory[id] || 0, 1);
    if (item.type === "passive" && !hadItem) item.onAcquire?.(targetState);
  });

  targetState.ownedEquip = [];
  targetState.generatedEquipment = {};
  targetState.equipmentDurability = {};
  targetState.equipments = { weapon: null, armor: null };
  const baseIds = Object.keys(EQUIPMENT_DB || {}).filter((id) => isEquipmentBase(id));
  const debugBaseIds = baseIds.length ? baseIds : ["travelerSword", "studdedJerkin"];
  ["common", "magic", "rare", "legendary"].forEach((rarity, index) => {
    const baseId = debugBaseIds[index % debugBaseIds.length];
    const id = createEquipmentInstance(baseId, targetState, { rarity });
    const equipment = getEquipment(id, targetState);
    if (!id || !equipment) return;
    targetState.ownedEquip.push(id);
    if (equipment.durability) targetState.equipmentDurability[id] = equipment.durability;
  });
}

function bootDebugTown() {
  state = createInitialState();
  clearLog();
  seedDebugTownInventory(state);
  if (typeof enterGameScreen === "function") enterGameScreen();
  enterAlly({ intro: true });
  addLine("【测试模式】已跳过主菜单，生成短剑、皮甲各品级装备各 1 件，并获得全部消耗品、宝物各 1 个。", "reward");
  render();
}

if (DEBUG_DIRECT_TOWN_BOOT) {
  bootDebugTown();
} else {
  showHomeScreen();
}
