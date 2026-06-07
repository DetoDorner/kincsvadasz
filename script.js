// ============================================================
// script.js – Kincsvadász App logika
// Vanilla JS, offline, localStorage mentéssel
// ============================================================

// ── ÁLLAPOT ─────────────────────────────────────────────────
// Az app teljes játékállapota ebben az objektumban él.

let state = {
  // Begyűjtött küldetések – tömb objektumokkal { id, instanceId, status }
  // instanceId: egyedi azonosító, ha ugyanazt húzzuk többször
  missions: [],

  // Begyűjtött átkok – tömb objektumokkal { id, instanceId, status }
  curses: [],

  // Megszerzett képek – objektum: { photoId: count, ... }
  photos: {},

  // Az utoljára kihúzott küldetés id-ja (ismétlésgátló)
  lastMissionId: null,

  // Az utoljára kihúzott átok id-ja (ismétlésgátló)
  lastCurseId: null,

  // Kihúzott kincsek – tömb objektumokkal { id, instanceId }
  collectedTreasures: [],

  // Aktuálisan kiválasztott téma: "night" | "day" | "punikornis"
  theme: "night"
};

// ── INICIALIZÁLÁS ────────────────────────────────────────────

// Az app indulásakor betöltjük a mentett állapotot, és felrajzoljuk a UI-t
function init() {
  loadState();
  applyTheme(state.theme);
  renderAll();
}

// ── LOCALSTORAGE MENTÉS / BETÖLTÉS ──────────────────────────

const SAVE_KEY = "kincsvadasz_state";

// Az aktuális state-et elmenti localStorage-ba JSON formátumban
function saveState() {
  localStorage.setItem(SAVE_KEY, JSON.stringify(state));
}

// Betölti a mentett state-et, ha van. Ha nincs, az alapértelmezett marad.
function loadState() {
  const saved = localStorage.getItem(SAVE_KEY);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      // Biztonságosan olvassuk vissza – csak ismert mezőket importálunk
      state.missions    = parsed.missions    || [];
      state.curses      = parsed.curses      || [];
      state.photos      = parsed.photos      || {};
      state.collectedTreasures = parsed.collectedTreasures || [];
      state.lastMissionId = parsed.lastMissionId || null;
      state.lastCurseId   = parsed.lastCurseId   || null;
      state.theme         = parsed.theme         || "night";
    } catch (e) {
      console.warn("Mentés betöltési hiba:", e);
    }
  }
}

// ── FÜLTABVÁLTÁS ─────────────────────────────────────────────

// A megadott tab-ot aktiválja, a többit elrejti
function switchTab(tabName) {
  // Összes panel + nav gomb deaktiválás
  document.querySelectorAll(".tab-panel").forEach(p => p.classList.remove("active"));
  document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));

  // Célpanel + nav gomb aktiválás
  document.getElementById("tab-" + tabName).classList.add("active");
  document.getElementById("nav" + capitalize(tabName)).classList.add("active");

  // Ha Beállítások fülre váltunk, frissítjük az összesítőt
  if (tabName === "settings") renderSettings();
}

// ── HÚZÁS LOGIKA ─────────────────────────────────────────────

// Véletlenszerűen kihúz egy elemet a tömbből,
// de nem engedi, hogy az előző (lastId) ismétlődjön közvetlenül
function drawRandom(list, lastId) {
  if (list.length === 0) return null;
  if (list.length === 1) return list[0]; // ha csak 1 elem van, muszáj azt húzni

  let item;
  let attempts = 0;
  do {
    item = list[Math.floor(Math.random() * list.length)];
    attempts++;
    // Max 50 próbálkozás végtelen ciklus ellen
  } while (item.id === lastId && attempts < 50);

  return item;
}

// ── KÜLDETÉS HÚZÁSA ──────────────────────────────────────────

function drawMission() {
  const item = drawRandom(missions, state.lastMissionId);
  if (!item) return;

  // Egyedi instance-azonosító: id + timestamp
  const instance = {
    id: item.id,
    instanceId: item.id + "_" + Date.now(),
    status: "active" // "active" | "completed"
  };

  state.missions.push(instance);
  state.lastMissionId = item.id;
  saveState();

  // Eredménykártya megjelenítése
  showResult("mission", item.title, item.description, "🏆 Jutalom: " + item.reward);

  // Statisztikák frissítése
  updateStats();
}

// ── ÁTOK HÚZÁSA ──────────────────────────────────────────────

function drawCurse() {
  const item = drawRandom(curses, state.lastCurseId);
  if (!item) return;

  const instance = {
    id: item.id,
    instanceId: item.id + "_" + Date.now(),
    status: "active" // "active" | "deactivated"
  };

  state.curses.push(instance);
  state.lastCurseId = item.id;
  saveState();

  showResult("curse", item.title, item.description, "🔓 Feloldás: " + item.unlock);
  updateStats();
}

// ── KINCS HÚZÁSA ─────────────────────────────────────────────

function drawTreasure() {
  if (treasures.length === 0) return;
  const item = treasures[Math.floor(Math.random() * treasures.length)];

  state.collectedTreasures.push({
    id: item.id,
    instanceId: item.id + "_" + Date.now()
  });
  saveState();

  const extraHtml = (item.effect ? `<div style="margin-bottom:6px">✨ <b>Hatás:</b> ${item.effect}</div>` : "") +
                    `💰 <b>Érték:</b> ${item.value}`;
  showResult("treasure", item.name, "Egy titokzatos kincs a mélyből.", extraHtml);
}

// ── KÉP HÚZÁSA ───────────────────────────────────────────────

function drawPhoto() {
  if (photos.length === 0) return;
  // Nincs ismétlésgátló – ugyanaz is jöhet egymás után
  const item = photos[Math.floor(Math.random() * photos.length)];

  // Ha már van a galériában, növeljük a számlálót, különben 1-gyel kezdjük
  if (state.photos[item.id]) {
    state.photos[item.id]++;
  } else {
    state.photos[item.id] = 1;
  }

  saveState();

  // Eredménykártya megjelenítése képpel
  showPhotoResult(item);
  updateStats();
}

// ── EREDMÉNYKÁRTYA MEGJELENÍTÉS ───────────────────────────────

// Általános eredménykártya (küldetés, átok, kincs)
function showResult(type, title, description, extra) {
  const card        = document.getElementById("resultCard");
  const typeBadge   = document.getElementById("resultType");
  const titleEl     = document.getElementById("resultTitle");
  const descEl      = document.getElementById("resultDescription");
  const extraEl     = document.getElementById("resultExtra");

  // Típus badge szöveg és stílus
  const typeLabels = {
    mission:  "🗺️ Küldetés",
    curse:    "💀 Átok",
    treasure: "💎 Kincs",
    photo:    "📸 Kép"
  };

  typeBadge.textContent = typeLabels[type] || type;
  // Előző stílusosztályok törlése, majd új hozzáadása
  typeBadge.className = "result-type-badge badge-type-" + type;

  titleEl.textContent       = title;
  descEl.textContent        = description;
  extraEl.innerHTML         = extra;
  extraEl.style.display     = extra ? "block" : "none";

  // Képkártya-specifikus elemek eltávolítása, ha vannak
  const existingImg    = card.querySelector(".result-photo-img");
  const existingRarity = card.querySelector(".result-photo-rarity");
  if (existingImg)    existingImg.remove();
  if (existingRarity) existingRarity.remove();

  card.classList.remove("hidden");

  // Görgetés a lap tetejére, hogy az eredménykártya látszódjon
  document.querySelector(".app-main").scrollTo({ top: 0, behavior: "smooth" });
}

// Kép-specifikus eredménykártya
function showPhotoResult(item) {
  const card  = document.getElementById("resultCard");
  const inner = card.querySelector(".result-card-inner");

  // Általános mezők kitöltése
  document.getElementById("resultType").textContent = "📸 Kép";
  document.getElementById("resultType").className   = "result-type-badge badge-type-photo";
  document.getElementById("resultTitle").textContent       = item.name;
  document.getElementById("resultDescription").textContent = item.description;
  document.getElementById("resultExtra").style.display     = "none";

  // Régi kép + ritkaság elem törlése
  const existingImg    = inner.querySelector(".result-photo-img");
  const existingRarity = inner.querySelector(".result-photo-rarity");
  if (existingImg)    existingImg.remove();
  if (existingRarity) existingRarity.remove();

  // Ritkaság badge
  const rarityBadge = document.createElement("div");
  rarityBadge.className = "result-photo-rarity rarity-" + item.rarity;
  rarityBadge.textContent = rarityLabel(item.rarity);
  inner.insertBefore(rarityBadge, inner.firstChild.nextSibling);

  // Képelem
  const img = document.createElement("img");
  img.className = "result-photo-img";
  img.src = item.src;
  img.alt = item.name;
  img.onerror = function() {
    // Ha nem található a kép, placeholder szöveget mutatunk
    this.style.display = "none";
  };
  // A ritkaság badge után szúrjuk be
  rarityBadge.after(img);

  card.classList.remove("hidden");
  document.querySelector(".app-main").scrollTo({ top: 0, behavior: "smooth" });
}

// Eredménykártya bezárása
function dismissResult() {
  document.getElementById("resultCard").classList.add("hidden");
  // Tábor szekció frissítése, ha épp ott vagyunk
  renderCamp();
}

// ── TELJES RENDERELÉS ─────────────────────────────────────────

function renderAll() {
  renderCamp();
  updateStats();
}

// ── TÁBOR FÜLTARTALOM RENDERELÉSE ────────────────────────────

function renderCamp() {
  renderMissions();
  renderCurses();
  renderTreasures();
  renderGallery();
}

function renderTreasures() {
  const container = document.getElementById("treasureList");
  const badge     = document.getElementById("badgeTreasures");

  badge.textContent = state.collectedTreasures.length;

  if (state.collectedTreasures.length === 0) {
    container.innerHTML = '<p class="empty-state">Még nem húztál kincset.</p>';
    return;
  }

  container.innerHTML = "";

  state.collectedTreasures.forEach((inst, idx) => {
    const data = treasures.find(t => t.id === inst.id);
    if (!data) return;

    const card = document.createElement("div");
    card.className = "item-card";

    card.innerHTML = `
      <div class="card-header">
        <div class="card-title">${data.name}</div>
        <div class="card-status-icon">💎</div>
      </div>
      ${data.effect ? `<div class="card-extra-label">Hatás</div><div class="card-extra-value">${data.effect}</div>` : ""}
      <div class="card-extra-label">Érték</div>
      <div class="card-extra-value">${data.value}</div>
      <button class="card-action-btn btn-delete" onclick="deleteTreasure(${idx})">🗑️ Törlés</button>
    `;

    container.appendChild(card);
  });
}

// Begyűjtött küldetések listájának felrajzolása
function renderMissions() {
  const container = document.getElementById("missionList");
  const badge     = document.getElementById("badgeMissions");

  badge.textContent = state.missions.length;

  if (state.missions.length === 0) {
    container.innerHTML = '<p class="empty-state">Még nem húztál küldetést.</p>';
    return;
  }

  container.innerHTML = "";

  state.missions.forEach((inst, idx) => {
    // Az adatból megkeressük a küldetés objektumot
    const data = missions.find(m => m.id === inst.id);
    if (!data) return;

    const isCompleted = inst.status === "completed";

    const card = document.createElement("div");
    card.className = "item-card" + (isCompleted ? " status-completed" : "");

    card.innerHTML = `
      <div class="card-header">
        <div class="card-title">${data.title}</div>
        <div class="card-status-icon">${isCompleted ? "✅" : "⏳"}</div>
      </div>
      <div class="status-label ${isCompleted ? "status-completed-label" : "status-active-label"}">
        ${isCompleted ? "Teljesítve" : "Aktív"}
      </div>
      <div class="card-description">${data.description}</div>
      <div class="card-extra-label">Jutalom</div>
      <div class="card-extra-value">${data.reward}</div>
      ${isCompleted
        ? '<button class="card-action-btn btn-done" disabled>✅ Teljesítve</button>'
        : `<button class="card-action-btn btn-complete" onclick="completeMission(${idx})">✔ Teljesítve</button>`
      }
      <button class="card-action-btn btn-delete" onclick="deleteMission(${idx})">🗑️ Törlés</button>
    `;

    container.appendChild(card);
  });
}

// Begyűjtött átkok listájának felrajzolása
function renderCurses() {
  const container = document.getElementById("curseList");
  const badge     = document.getElementById("badgeCurses");

  badge.textContent = state.curses.length;

  if (state.curses.length === 0) {
    container.innerHTML = '<p class="empty-state">Még nem húztál átkot.</p>';
    return;
  }

  container.innerHTML = "";

  state.curses.forEach((inst, idx) => {
    const data = curses.find(c => c.id === inst.id);
    if (!data) return;

    const isDeactivated = inst.status === "deactivated";

    const card = document.createElement("div");
    card.className = "item-card" + (isDeactivated ? " status-deactivated" : "");

    card.innerHTML = `
      <div class="card-header">
        <div class="card-title">${data.title}</div>
        <div class="card-status-icon">${isDeactivated ? "🔓" : "🔒"}</div>
      </div>
      <div class="status-label ${isDeactivated ? "status-deactivated-label" : "status-curse-label"}">
        ${isDeactivated ? "Deaktiválva" : "Aktív"}
      </div>
      <div class="card-description">${data.description}</div>
      <div class="card-extra-label">Feloldás módja</div>
      <div class="card-extra-value">${data.unlock}</div>
      ${isDeactivated
        ? '<button class="card-action-btn btn-done" disabled>🔓 Deaktiválva</button>'
        : `<button class="card-action-btn btn-deactivate" onclick="deactivateCurse(${idx})">🔓 Deaktiválás</button>`
      }
      <button class="card-action-btn btn-delete" onclick="deleteCurse(${idx})">🗑️ Törlés</button>
    `;

    container.appendChild(card);
  });
}

// Képgaléria felrajzolása
function renderGallery() {
  const container = document.getElementById("photoGallery");
  const badge     = document.getElementById("badgePhotos");

  // Hány egyedi kép van a galériában
  const uniqueCount = Object.keys(state.photos).length;
  badge.textContent = uniqueCount;

  if (uniqueCount === 0) {
    container.innerHTML = '<p class="empty-state">A galériád üres.</p>';
    return;
  }

  container.innerHTML = "";

  // Végigmegyünk a megszerzett képeken
  for (const [photoId, count] of Object.entries(state.photos)) {
    const data = photos.find(p => p.id === photoId);
    if (!data) continue;

    const card = document.createElement("div");
    card.className = "photo-card rarity-" + data.rarity;

    // Darabszám badge – csak ha több mint 1
    const countBadge = count > 1
      ? `<div class="photo-count-badge">×${count}</div>`
      : "";

    card.innerHTML = `
      ${countBadge}
      <img class="photo-card-img"
           src="${data.src}"
           alt="${data.name}"
           onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
      <div class="photo-placeholder" style="display:none;">${rarityEmoji(data.rarity)}</div>
      <div class="photo-card-info">
        <div class="photo-card-name">${data.name}</div>
        <div class="photo-card-rarity rarity-label-${data.rarity}">${rarityLabel(data.rarity)}</div>
      </div>
    `;

    container.appendChild(card);
  }
}

// ── AKCIÓK ───────────────────────────────────────────────────

// Küldetés teljesítése: az idx-edik instance státuszát "completed"-re állítja
function completeMission(idx) {
  if (state.missions[idx]) {
    state.missions[idx].status = "completed";
    saveState();
    renderMissions();
    updateStats();
    renderSettings(); // összesítő frissítése
  }
}

// Átok deaktiválása
function deactivateCurse(idx) {
  if (state.curses[idx]) {
    state.curses[idx].status = "deactivated";
    saveState();
    renderCurses();
  }
}

// Küldetés törlése
function deleteMission(idx) {
  const data = missions.find(m => m.id === state.missions[idx]?.id);
  const nev = data ? data.title : "ezt a küldetést";
  if (!confirm("Biztosan törölni szeretnéd?\n\n" + nev)) return;
  state.missions.splice(idx, 1);
  saveState();
  renderMissions();
  updateStats();
  renderSettings();
}

// Átok törlése
function deleteCurse(idx) {
  const data = curses.find(c => c.id === state.curses[idx]?.id);
  const nev = data ? data.title : "ezt az átkot";
  if (!confirm("Biztosan törölni szeretnéd?\n\n" + nev)) return;
  state.curses.splice(idx, 1);
  saveState();
  renderCurses();
  updateStats();
}

// Kincs törlése
function deleteTreasure(idx) {
  const data = treasures.find(t => t.id === state.collectedTreasures[idx]?.id);
  const nev = data ? data.name : "ezt a kincset";
  if (!confirm("Biztosan törölni szeretnéd?\n\n" + nev)) return;
  state.collectedTreasures.splice(idx, 1);
  saveState();
  renderTreasures();
}

// ── STATISZTIKÁK FRISSÍTÉSE ───────────────────────────────────

function updateStats() {
  // Begyűjtés fül statisztika sáv
  document.getElementById("statMissions").textContent = state.missions.length;
  document.getElementById("statCurses").textContent   = state.curses.length;
  document.getElementById("statPhotos").textContent   = Object.keys(state.photos).length;
}

// Beállítások fül összesítő
function renderSettings() {
  const completedCount = state.missions.filter(m => m.status === "completed").length;

  document.getElementById("sumMissions").textContent = state.missions.length;
  document.getElementById("sumCurses").textContent   = state.curses.length;
  document.getElementById("sumPhotos").textContent   = Object.keys(state.photos).length;
  document.getElementById("sumCompleted").textContent = completedCount;
}

// ── TÉMA ─────────────────────────────────────────────────────

// Alkalmazza a megadott témát a body-ra, és frissíti a gombokat
function applyTheme(theme) {
  document.body.className = "theme-" + theme;

  const nightBtn      = document.getElementById("themeNight");
  const punikornisBtn = document.getElementById("themePunikornis");

  if (nightBtn)      nightBtn.classList.toggle("active",      theme === "night");
  if (punikornisBtn) punikornisBtn.classList.toggle("active", theme === "punikornis");
}

// Témaváltás (gombokból hívva)
function setTheme(theme) {
  state.theme = theme;
  applyTheme(theme);
  saveState();
}

// ── RESET ─────────────────────────────────────────────────────

// Teljes játékállapot törlése megerősítés után
function resetGame() {
  const confirmed = confirm("Biztosan törlöd az összes mentett adatot?\n\nEz visszavonhatatlan!");
  if (!confirmed) return;

  // Állapot visszaállítása alapértékre
  state.missions           = [];
  state.curses             = [];
  state.photos             = {};
  state.collectedTreasures = [];
  state.lastMissionId      = null;
  state.lastCurseId        = null;
  // Témát megtartjuk reset után

  // LocalStorage törlése
  localStorage.removeItem(SAVE_KEY);

  // Eredménykártya elrejtése
  document.getElementById("resultCard").classList.add("hidden");

  // UI újrarajzolása
  renderAll();

  // Vissza a Begyűjtés fülre
  switchTab("collect");
}

// ── SEGÉDFÜGGVÉNYEK ───────────────────────────────────────────

// String első karakterét nagybetűsíti (pl. "collect" → "Collect")
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// Ritkaság szöveg magyarul
function rarityLabel(rarity) {
  const labels = {
    common:    "⬜ Közönséges",
    rare:      "🔵 Ritka",
    legendary: "🟣 Legendás"
  };
  return labels[rarity] || rarity;
}

// Ritkaság emoji (placeholder képekhez)
function rarityEmoji(rarity) {
  const emojis = { common: "🌿", rare: "💫", legendary: "✨" };
  return emojis[rarity] || "🖼️";
}

// ── APP INDÍTÁSA ──────────────────────────────────────────────

// Amikor az oldal teljesen betöltött, inicializáljuk az appot
document.addEventListener("DOMContentLoaded", init);
