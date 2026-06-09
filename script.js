// ============================================================
// script.js – Kincsvadászat App logika
// ============================================================

// ── ÁLLAPOT ─────────────────────────────────────────────────

let state = {
  missions:             [],
  curses:               [],
  photos:               {},
  collectedTreasures:   [],
  lastMissionId:        null,
  lastCurseId:          null,
  theme:                "night",
  tokens:               0,
  character:            null,   // { roleId, ability1Used, ability2Used }
  impostorName:         "",
  impostorChangePurchased: false,
  returnMode:           false,
  lives:                3,
};

let currentFilter = "all";

// ── BOLT TERMÉKEK ────────────────────────────────────────────

const shopItems = [
  { id: "extra_life",      name: "❤️ +1 Élet",                    desc: "Egy extra élettel rendelkezel a játékban.",         price: 3 },
  { id: "remove_curse",    name: "🔓 Átok levétele",               desc: "Egy aktív átkod azonnal deaktiválódik.",            price: 2 },
  { id: "extra_photo",     name: "📸 +1 Fotó húzása",              desc: "Egy extra képet húzhatsz a galériádba.",            price: 4 },
  { id: "impostor_change", name: "🕵️ Imposztorjelölés módosítása", desc: "Egyszer megváltoztathatod a gyanúsítottadat.",      price: 2 },
];

// ── INICIALIZÁLÁS ────────────────────────────────────────────

function init() {
  loadState();
  applyTheme(state.theme);
  renderAll();
}

// ── MENTÉS / BETÖLTÉS ────────────────────────────────────────

const SAVE_KEY = "kincsvadasz_state";

function saveState() {
  localStorage.setItem(SAVE_KEY, JSON.stringify(state));
}

function loadState() {
  const saved = localStorage.getItem(SAVE_KEY);
  if (!saved) return;
  try {
    const p = JSON.parse(saved);
    state.missions              = p.missions              || [];
    state.curses                = p.curses                || [];
    state.photos                = p.photos                || {};
    state.collectedTreasures    = p.collectedTreasures    || [];
    state.lastMissionId         = p.lastMissionId         || null;
    state.lastCurseId           = p.lastCurseId           || null;
    state.theme                 = p.theme                 || "night";
    state.tokens                = p.tokens                || 0;
    state.character             = p.character             || null;
    state.impostorName          = p.impostorName          || "";
    state.impostorChangePurchased = p.impostorChangePurchased || false;
    state.returnMode            = p.returnMode            || false;
    state.lives                 = (p.lives !== undefined) ? p.lives : 3;
  } catch (e) {
    console.warn("Betöltési hiba:", e);
  }
}

// ── FÜL VÁLTÁS ───────────────────────────────────────────────

function switchTab(tabName) {
  document.querySelectorAll(".tab-panel").forEach(p => p.classList.remove("active"));
  document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));
  document.getElementById("tab-" + tabName).classList.add("active");
  document.getElementById("nav" + capitalize(tabName)).classList.add("active");

  if (tabName === "settings")  renderSettings();
  if (tabName === "character") renderKarakter();
  if (tabName === "shop")      renderBolt();
  if (tabName === "camp")      renderHatizsak();
}

// ── HÚZÁS LOGIKA ─────────────────────────────────────────────

function drawRandom(list, lastId) {
  if (list.length === 0) return null;
  if (list.length === 1) return list[0];
  let item, attempts = 0;
  do {
    item = list[Math.floor(Math.random() * list.length)];
    attempts++;
  } while (item.id === lastId && attempts < 50);
  return item;
}

function drawMission() {
  const item = drawRandom(missions, state.lastMissionId);
  if (!item) return;
  state.missions.push({ id: item.id, instanceId: item.id + "_" + Date.now(), status: "active" });
  state.lastMissionId = item.id;
  saveState();
  showResult("mission", item.title, item.description, "🏆 Jutalom: " + item.reward);
  updateStats();
}

function drawCurse() {
  const item = drawRandom(curses, state.lastCurseId);
  if (!item) return;
  state.curses.push({ id: item.id, instanceId: item.id + "_" + Date.now(), status: "active" });
  state.lastCurseId = item.id;
  saveState();
  showResult("curse", item.title, item.description, "🔓 Feloldás: " + item.unlock);
  updateStats();
}

function drawTreasure() {
  if (treasures.length === 0) return;
  const item = treasures[Math.floor(Math.random() * treasures.length)];
  state.collectedTreasures.push({ id: item.id, instanceId: item.id + "_" + Date.now() });
  saveState();
  const extra = (item.effect ? "✨ Hatás: " + item.effect + "<br>" : "") + "💰 Érték: " + item.value;
  showResult("treasure", item.name, "Egy titokzatos kincs a mélyből.", extra);
  updateStats();
}

function drawPhoto() {
  if (photos.length === 0) return;
  const item = photos[Math.floor(Math.random() * photos.length)];
  state.photos[item.id] = (state.photos[item.id] || 0) + 1;
  saveState();
  showPhotoResult(item);
  updateStats();
}

// ── VISSZAÚT MÓD HÚZÁS ───────────────────────────────────────

function drawReturnMode() {
  const r = Math.random();
  if      (r < 0.60) drawMission();
  else if (r < 0.80) drawCurse();
  else if (r < 0.90) drawTreasure();
  else               drawPhoto();
}

// ── EREDMÉNYKÁRTYA ───────────────────────────────────────────

function showResult(type, title, description, extra) {
  const card      = document.getElementById("resultCard");
  const typeBadge = document.getElementById("resultType");
  const titleEl   = document.getElementById("resultTitle");
  const descEl    = document.getElementById("resultDescription");
  const extraEl   = document.getElementById("resultExtra");

  typeBadge.textContent = { mission: "🗺️ Küldetés", curse: "💀 Átok", treasure: "💎 Kincs", photo: "📸 Kép" }[type] || type;
  typeBadge.className = "result-type-badge badge-type-" + type;
  titleEl.textContent  = title;
  descEl.textContent   = description;
  extraEl.innerHTML    = extra || "";
  extraEl.style.display = extra ? "block" : "none";

  card.querySelector(".result-photo-img")?.remove();
  card.querySelector(".result-photo-rarity")?.remove();
  card.classList.remove("hidden");
  document.querySelector(".app-main").scrollTo({ top: 0, behavior: "smooth" });
}

function showPhotoResult(item) {
  const card  = document.getElementById("resultCard");
  const inner = card.querySelector(".result-card-inner");

  document.getElementById("resultType").textContent = "📸 Kép";
  document.getElementById("resultType").className   = "result-type-badge badge-type-photo";
  document.getElementById("resultTitle").textContent       = item.name;
  document.getElementById("resultDescription").textContent = item.description;
  document.getElementById("resultExtra").style.display     = "none";

  inner.querySelector(".result-photo-img")?.remove();
  inner.querySelector(".result-photo-rarity")?.remove();

  const rarityBadge = document.createElement("div");
  rarityBadge.className   = "result-photo-rarity rarity-" + item.rarity;
  rarityBadge.textContent = rarityLabel(item.rarity);
  inner.insertBefore(rarityBadge, inner.firstChild.nextSibling);

  const img = document.createElement("img");
  img.className = "result-photo-img";
  img.src = item.src;
  img.alt = item.name;
  img.onerror = function () { this.style.display = "none"; };
  rarityBadge.after(img);

  card.classList.remove("hidden");
  document.querySelector(".app-main").scrollTo({ top: 0, behavior: "smooth" });
}

function dismissResult() {
  document.getElementById("resultCard").classList.add("hidden");
  renderHatizsak();
}

// ── TELJES RENDER ────────────────────────────────────────────

function renderAll() {
  renderHatizsak();
  updateStats();
  updateTokenDisplay();
  updateReturnModeArea();
}

// ── SZŰRŐ ────────────────────────────────────────────────────

function setFilter(filter) {
  currentFilter = filter;
  document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
  document.getElementById("filter-" + filter)?.classList.add("active");
  renderHatizsak();
}

// ── HÁTIZSÁK ─────────────────────────────────────────────────

function renderHatizsak() {
  const show = (id, visible) => {
    const el = document.getElementById(id);
    if (el) el.style.display = visible ? "" : "none";
  };
  const all = currentFilter === "all";
  show("section-missions",  all || currentFilter === "missions");
  show("section-curses",    all || currentFilter === "curses");
  show("section-treasures", all || currentFilter === "treasures");
  show("section-photos",    all || currentFilter === "photos");

  if (all || currentFilter === "missions")  renderMissions();
  if (all || currentFilter === "curses")    renderCurses();
  if (all || currentFilter === "treasures") renderTreasures();
  if (all || currentFilter === "photos")    renderGallery();
}

// ── KÜLDETÉSEK ───────────────────────────────────────────────

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
    const data = missions.find(m => m.id === inst.id);
    if (!data) return;
    const done = inst.status === "completed";
    const card = document.createElement("div");
    card.className = "item-card" + (done ? " status-completed" : "");
    card.innerHTML = `
      <div class="card-header">
        <div class="card-title">${data.title}</div>
        <div class="card-actions-row">
          ${done
            ? '<span class="card-status-icon">✅</span>'
            : `<button class="card-action-btn btn-complete" onclick="completeMission(${idx})">✔ Teljesítve</button>`
          }
          <button class="icon-btn" onclick="confirmDelete('mission', ${idx})" title="Törlés">🗑️</button>
        </div>
      </div>
      <div class="status-label ${done ? "status-completed-label" : "status-active-label"}">${done ? "Teljesítve" : "Aktív"}</div>
      <div class="card-description">${data.description}</div>
      <div class="card-extra-label">Jutalom</div>
      <div class="card-extra-value">${data.reward}</div>
      ${inst.impostorAtTime ? `<div class="impostor-tag">🕵️ Jelölt imposztor: <strong>${inst.impostorAtTime}</strong></div>` : ""}
    `;
    container.appendChild(card);
  });
}

// ── ÁTKOK ────────────────────────────────────────────────────

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
    const off = inst.status === "deactivated";
    const card = document.createElement("div");
    card.className = "item-card" + (off ? " status-deactivated" : "");
    card.innerHTML = `
      <div class="card-header">
        <div class="card-title">${data.title}</div>
        <div class="card-actions-row">
          ${off
            ? '<span class="card-status-icon">🔓</span>'
            : `<button class="card-action-btn btn-deactivate" onclick="deactivateCurse(${idx})">🔓 Deaktiválás</button>`
          }
          <button class="icon-btn" onclick="confirmDelete('curse', ${idx})" title="Törlés">🗑️</button>
        </div>
      </div>
      <div class="status-label ${off ? "status-deactivated-label" : "status-curse-label"}">${off ? "Deaktiválva" : "Aktív"}</div>
      <div class="card-description">${data.description}</div>
      <div class="card-extra-label">Feloldás módja</div>
      <div class="card-extra-value">${data.unlock}</div>
    `;
    container.appendChild(card);
  });
}

// ── KINCSEK ──────────────────────────────────────────────────

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
    const sellVal = parseTokenValue(data.value);
    const isUsed = !!inst.used;
    const card = document.createElement("div");
    card.className = "item-card" + (isUsed ? " status-deactivated" : "");
    card.innerHTML = `
      <div class="card-header">
        <div class="card-title">${data.name}</div>
        <div class="card-actions-row">
          ${isUsed
            ? '<span class="card-status-icon">✅</span>'
            : `<button class="icon-btn btn-use-treasure-icon" onclick="useTreasure(${idx})" title="Felhasználás">✔️</button>
               <button class="icon-btn btn-sell-icon" onclick="sellTreasure(${idx})" title="Eladás">💰</button>`
          }
        </div>
      </div>
      ${isUsed ? '<div class="status-label status-deactivated-label">Felhasználva</div>' : ""}
      ${data.effect ? `<div class="card-extra-label">Hatás</div><div class="card-extra-value">${data.effect}</div>` : ""}
      <div class="card-extra-label">Érték</div>
      <div class="card-extra-value">${data.value}${!isUsed ? ` <span class="sell-hint">(eladva: +${sellVal} 🪙)</span>` : ""}</div>
    `;
    container.appendChild(card);
  });
}

// ── KÉPGALÉRIA ───────────────────────────────────────────────

function renderGallery() {
  const container = document.getElementById("photoGallery");
  const badge     = document.getElementById("badgePhotos");
  const uniqueCount = Object.keys(state.photos).length;
  badge.textContent = uniqueCount;

  if (uniqueCount === 0) {
    container.innerHTML = '<p class="empty-state">A galériád üres.</p>';
    return;
  }
  container.innerHTML = "";

  // Ritkaság szerinti rendezés: legendary → rare → common
  const rarityOrder = { legendary: 0, rare: 1, common: 2 };
  const sorted = Object.entries(state.photos).sort(([aId], [bId]) => {
    const ra = photos.find(p => p.id === aId)?.rarity;
    const rb = photos.find(p => p.id === bId)?.rarity;
    return (rarityOrder[ra] ?? 3) - (rarityOrder[rb] ?? 3);
  });

  sorted.forEach(([photoId, count]) => {
    const data = photos.find(p => p.id === photoId);
    if (!data) return;
    const card = document.createElement("div");
    card.className = "photo-card rarity-" + data.rarity;
    card.innerHTML = `
      ${count > 1 ? `<div class="photo-count-badge">×${count}</div>` : ""}
      <button class="photo-delete-btn" onclick="deletePhoto('${data.id}')" title="Törlés">🗑️</button>
      <img class="photo-card-img" src="${data.src}" alt="${data.name}"
           onerror="this.style.display='none';this.nextElementSibling.style.display='flex';">
      <div class="photo-placeholder" style="display:none;">${rarityEmoji(data.rarity)}</div>
      <div class="photo-card-info">
        <div class="photo-card-name">${data.name}</div>
        <div class="photo-card-rarity rarity-label-${data.rarity}">${rarityLabel(data.rarity)}</div>
      </div>
    `;
    container.appendChild(card);
  });
}

// ── AKCIÓK ───────────────────────────────────────────────────

function completeMission(idx) {
  if (!state.missions[idx]) return;
  state.missions[idx].status        = "completed";
  state.missions[idx].impostorAtTime = state.impostorName;
  const data = missions.find(m => m.id === state.missions[idx].id);
  if (data) {
    state.tokens += parseTokenValue(data.reward);
    updateTokenDisplay();
  }
  saveState();
  renderMissions();
  updateStats();
  renderSettings();
}

function deactivateCurse(idx) {
  if (!state.curses[idx]) return;
  state.curses[idx].status = "deactivated";
  // Harcos bónusz: +1 zseton deaktiválásonként
  if (state.character?.roleId === "role_harcos") {
    state.tokens += 1;
    updateTokenDisplay();
  }
  saveState();
  renderCurses();
}

function confirmDelete(type, idx) {
  const labels = { mission: "küldetést", curse: "átkot", treasure: "kincset" };
  if (!confirm("Biztosan törölni szeretnéd ezt a " + (labels[type] || "elemet") + "?")) return;
  if (type === "mission") {
    state.missions.splice(idx, 1);
    saveState(); renderMissions(); updateStats(); renderSettings();
  } else if (type === "curse") {
    state.curses.splice(idx, 1);
    saveState(); renderCurses(); updateStats();
  }
}

function useTreasure(idx) {
  const inst = state.collectedTreasures[idx];
  const data = treasures.find(t => t.id === inst?.id);
  if (!data) return;
  if (!confirm("Felhasználtad ezt a kincset?\n\n" + data.name + "\n\nNem kapsz érte zsetont – a kincs deaktiválódik.")) return;
  state.collectedTreasures[idx].used = true;
  saveState();
  renderTreasures();
}

function addLife() {
  if (!confirm("Biztosan hozzáadsz 1 életet?")) return;
  state.lives++;
  saveState();
  renderBolt();
}

function removeLife() {
  if (state.lives <= 0) { alert("Nincs több élet!"); return; }
  if (!confirm("Biztosan levonasz 1 életet?")) return;
  state.lives--;
  saveState();
  renderBolt();
}

function sellTreasure(idx) {
  const inst = state.collectedTreasures[idx];
  const data = treasures.find(t => t.id === inst?.id);
  if (!data) return;
  const val = parseTokenValue(data.value);
  if (!confirm("Biztosan eladod?\n\n" + data.name + "\n\n+  " + val + " 🪙 zsetont kapsz.")) return;
  state.tokens += val;
  state.collectedTreasures.splice(idx, 1);
  saveState();
  renderTreasures();
  updateTokenDisplay();
  updateStats();
}

function deletePhoto(photoId) {
  const data = photos.find(p => p.id === photoId);
  if (!confirm("Biztosan törölni szeretnéd?\n\n" + (data?.name || "ezt a képet"))) return;
  delete state.photos[photoId];
  saveState();
  renderGallery();
  updateStats();
}

// ── STATISZTIKÁK ─────────────────────────────────────────────

function updateStats() {
  document.getElementById("statMissions").textContent = state.missions.length;
  document.getElementById("statCurses").textContent   = state.curses.length;
  document.getElementById("statPhotos").textContent   = Object.keys(state.photos).length;
}

function updateTokenDisplay() {
  const v = state.tokens;
  const h = document.getElementById("headerTokens");
  if (h) h.textContent = "🪙 " + v;
  const s = document.getElementById("shopTokenCount");
  if (s) s.textContent = v;
}

function renderSettings() {
  const completed = state.missions.filter(m => m.status === "completed").length;
  document.getElementById("sumMissions").textContent  = state.missions.length;
  document.getElementById("sumCurses").textContent    = state.curses.length;
  document.getElementById("sumPhotos").textContent    = Object.keys(state.photos).length;
  document.getElementById("sumCompleted").textContent = completed;
  const statusEl = document.getElementById("returnModeStatus");
  if (statusEl) statusEl.textContent = state.returnMode ? "BE" : "KI";
  const btn = document.getElementById("btnReturnMode");
  if (btn) btn.classList.toggle("active", state.returnMode);
}

// ── KARAKTER ─────────────────────────────────────────────────

function renderKarakter() {
  const container = document.getElementById("characterContent");
  if (!container) return;

  if (!state.character) {
    container.innerHTML = `
      <div class="char-intro">
        <h2 class="char-intro-title">🎭 Válassz karaktert!</h2>
        <p class="char-intro-sub">Minden karakter 2 különleges képességet ad. A választás beállításokban resetelhető.</p>
      </div>
      <div class="role-grid">
        ${characters.map(role => `
          <div class="role-card" onclick="selectRole('${role.id}')">
            <div class="role-name">${role.name}</div>
            <div class="role-desc">${role.description}</div>
            <div class="role-abilities">
              <div class="ability-preview">⚡ ${role.abilities[0].name}</div>
              <div class="ability-preview">⚡ ${role.abilities[1].name}</div>
            </div>
          </div>
        `).join("")}
      </div>
    `;
    return;
  }

  const role = characters.find(r => r.id === state.character.roleId);
  if (!role) return;
  const used = [state.character.ability1Used, state.character.ability2Used];
  const canEdit = !state.impostorName || state.impostorChangePurchased;

  container.innerHTML = `
    <div class="active-role-header">
      <div class="active-role-name">${role.name}</div>
      <div class="active-role-desc">${role.description}</div>
    </div>

    <div class="abilities-list">
      ${role.abilities.map((ab, i) => `
        <div class="ability-card${used[i] ? " ability-used" : ""}">
          <div class="ability-name">⚡ ${ab.name}</div>
          <div class="ability-desc">${ab.description}</div>
          ${used[i]
            ? '<div class="ability-status-tag">✅ Felhasználva</div>'
            : `<button class="btn-use-ability" onclick="useAbility(${i})">Jelölés felhasználtként</button>`
          }
        </div>
      `).join("")}
    </div>

    <div class="impostor-section">
      <h3 class="impostor-title">🕵️ Imposztorjelölés</h3>
      ${canEdit ? `
        <p class="impostor-hint">Kit gyanúsítasz imposztornak?</p>
        <div class="impostor-input-row">
          <input type="text" id="impostorInput" value="${state.impostorName}" placeholder="Írd be a nevet..." class="impostor-input">
          <button class="btn-set-impostor" onclick="setImpostor()">Mentés</button>
        </div>
      ` : `
        <div class="impostor-current-box">
          <span class="impostor-label">Gyanúsítottad:</span>
          <strong class="impostor-name-display">${state.impostorName}</strong>
        </div>
        <p class="impostor-change-hint">⚠️ Módosításhoz vásárold meg a Boltban (2 🪙)</p>
      `}
    </div>
  `;
}

function selectRole(roleId) {
  const role = characters.find(r => r.id === roleId);
  if (!confirm("Biztosan ezt a karaktert választod?\n\n" + (role?.name || "") + "\n\nA döntés beállításokban resetelhető.")) return;
  state.character = { roleId, ability1Used: false, ability2Used: false };
  saveState();
  renderKarakter();
}

function useAbility(i) {
  if (!state.character) return;
  const role = characters.find(r => r.id === state.character.roleId);
  const name = role?.abilities[i]?.name || "képesség";
  if (!confirm("Biztosan felhasználod?\n\n⚡ " + name + "\n\nEz visszavonhatatlan!")) return;
  if (i === 0) state.character.ability1Used = true;
  if (i === 1) state.character.ability2Used = true;
  saveState();
  renderKarakter();
}

function resetCharacter() {
  if (!confirm("Biztosan törlöd a karakterválasztást?\n\nAz imposztorjelölés is törlődik.")) return;
  state.character              = null;
  state.impostorName           = "";
  state.impostorChangePurchased = false;
  saveState();
  renderKarakter();
}

function setImpostor() {
  const input = document.getElementById("impostorInput");
  if (!input) return;
  const name = input.value.trim();
  if (!name) { alert("Írj be egy nevet!"); return; }
  state.impostorName            = name;
  state.impostorChangePurchased = false;
  saveState();
  renderKarakter();
}

// ── BOLT ─────────────────────────────────────────────────────

function renderBolt() {
  const container = document.getElementById("shopContent");
  if (!container) return;

  const gameEmpty = state.missions.length === 0 && state.curses.length === 0 &&
                    Object.keys(state.photos).length === 0 && state.collectedTreasures.length === 0;

  const startSection = gameEmpty ? `
    <div class="shop-section starting-section">
      <h2 class="shop-section-title">🎯 Kezdőzseton beállítása</h2>
      <p class="shop-desc">A játék még nem kezdődött el – add meg a kezdőzsetonokat!</p>
      <div class="starting-row">
        <input type="number" id="startTokenInput" value="${state.tokens}" min="0" class="token-number-input" placeholder="0">
        <button class="btn-set-tokens" onclick="setStartingTokens()">Beállítás</button>
      </div>
    </div>
  ` : "";

  const sellSection = state.collectedTreasures.length > 0 ? `
    <div class="shop-section">
      <h2 class="shop-section-title">💰 Kincsek eladása</h2>
      ${state.collectedTreasures.map((inst, idx) => {
        const data = treasures.find(t => t.id === inst.id);
        if (!data) return "";
        return `
          <div class="shop-sell-row">
            <div class="shop-sell-info">
              <div class="shop-sell-name">${data.name}</div>
              <div class="shop-sell-val">+${parseTokenValue(data.value)} 🪙</div>
            </div>
            <button class="btn-sell-sm" onclick="sellTreasure(${idx})">Eladás</button>
          </div>
        `;
      }).join("")}
    </div>
  ` : "";

  const buySection = `
    <div class="shop-section">
      <h2 class="shop-section-title">🛒 Vásárlás</h2>
      ${shopItems.map(item => `
        <div class="shop-buy-row">
          <div class="shop-buy-info">
            <div class="shop-buy-name">${item.name}</div>
            <div class="shop-buy-desc">${item.desc}</div>
          </div>
          <button class="btn-buy" onclick="buyItem('${item.id}')">${item.price} 🪙</button>
        </div>
      `).join("")}
    </div>
  `;

  container.innerHTML = `
    <div class="token-hero">
      <div class="token-hero-label">Zseton egyenleg</div>
      <div class="token-hero-row">
        <span class="token-hero-num" id="shopTokenCount">${state.tokens}</span>
        <span class="token-hero-icon">🪙</span>
      </div>
    </div>
    <div class="lives-bar">
      <button class="life-adj-btn" onclick="removeLife()">➖</button>
      <span>❤️ Életek: <strong id="livesCount">${state.lives}</strong></span>
      <button class="life-adj-btn" onclick="addLife()">➕</button>
    </div>
    ${startSection}
    ${sellSection}
    ${buySection}
  `;
}

function setStartingTokens() {
  const input = document.getElementById("startTokenInput");
  if (!input) return;
  const val = parseInt(input.value);
  if (isNaN(val) || val < 0) { alert("Érvényes számot adj meg!"); return; }
  state.tokens = val;
  saveState();
  updateTokenDisplay();
  renderBolt();
}

function buyItem(itemId) {
  const item = shopItems.find(i => i.id === itemId);
  if (!item) return;
  if (state.tokens < item.price) {
    alert("Nincs elég zsetonod!\n\nSzükséges: " + item.price + " 🪙\nJelenlegi: " + state.tokens + " 🪙");
    return;
  }
  if (!confirm("Biztosan megveszed?\n\n" + item.name + "\nÁr: " + item.price + " 🪙")) return;

  state.tokens -= item.price;

  if (itemId === "extra_life") {
    state.lives++;
  } else if (itemId === "remove_curse") {
    const active = state.curses.find(c => c.status === "active");
    if (active) {
      active.status = "deactivated";
      renderCurses();
    } else {
      alert("Nincs aktív átkod jelenleg – zsetonod visszakerül.");
      state.tokens += item.price;
    }
  } else if (itemId === "extra_photo") {
    drawPhoto();
  } else if (itemId === "impostor_change") {
    state.impostorChangePurchased = true;
  }

  saveState();
  updateTokenDisplay();
  renderBolt();
}

// ── IMPOSZTOR KIÉRTÉKELÉS ────────────────────────────────────

function evaluateImpostor() {
  const input = document.getElementById("trueImpostorInput");
  if (!input) return;
  const trueImp = input.value.trim();
  if (!trueImp) { alert("Írd be a valódi imposztor nevét!"); return; }

  const relevant = state.missions.filter(m => m.status === "completed" && m.impostorAtTime);
  if (relevant.length === 0) {
    alert("Nincs teljesített küldetés imposztorjelöléssel.");
    return;
  }

  let total = 0;
  const rows = relevant.map(inst => {
    const data    = missions.find(m => m.id === inst.id);
    const correct = inst.impostorAtTime.toLowerCase().trim() === trueImp.toLowerCase().trim();
    const change  = correct ? 2 : -1;
    total += change;
    return { title: data?.title || inst.id, marked: inst.impostorAtTime, correct, change };
  });

  // Kém karakter bónusz
  if (state.character?.roleId === "role_kém" && !state.character.ability2Used) {
    const correctCount = rows.filter(r => r.correct).length;
    if (correctCount / rows.length >= 0.5) {
      total += 3;
      state.character.ability2Used = true;
      alert("🕵️ Kém bónusz! 50%+ helyes tipp → +3 bónusz zseton!");
    }
  }

  state.tokens += total;
  saveState();
  updateTokenDisplay();
  renderEndSummary(rows, total, trueImp);
}

function renderEndSummary(rows, total, trueImp) {
  const container = document.getElementById("endSummary");
  if (!container) return;

  const rowsHtml = rows.map(r => `
    <div class="eval-row ${r.correct ? "eval-correct" : "eval-wrong"}">
      <div class="eval-mission">${r.title}</div>
      <div class="eval-detail">
        Jelölt: <strong>${r.marked}</strong> →
        ${r.correct ? "✅ Helyes" : "❌ Hibás"}
        <span class="eval-change">${r.change > 0 ? "+" : ""}${r.change} 🪙</span>
      </div>
    </div>
  `).join("");

  container.innerHTML = `
    <div class="end-summary-box">
      <div class="eval-header">Valódi imposztor: <strong>${trueImp}</strong></div>
      ${rowsHtml}
      <div class="eval-total ${total >= 0 ? "eval-pos" : "eval-neg"}">
        Végeredmény: <strong>${total > 0 ? "+" : ""}${total} 🪙</strong>
      </div>
    </div>
  `;
  container.classList.remove("hidden");
}

// ── VISSZAÚT MÓD ─────────────────────────────────────────────

function toggleReturnMode() {
  state.returnMode = !state.returnMode;
  saveState();
  updateReturnModeArea();
  renderSettings();
}

function updateReturnModeArea() {
  const area = document.getElementById("returnModeArea");
  if (area) area.classList.toggle("hidden", !state.returnMode);
}

// ── TÉMA ─────────────────────────────────────────────────────

function applyTheme(theme) {
  document.body.className = "theme-" + theme;
  ["themeNight","themePunikornis","themeKrokodildo","themeFelsoszank"].forEach(id => {
    document.getElementById(id)?.classList.remove("active");
  });
  const map = { night:"themeNight", punikornis:"themePunikornis", krokodildo:"themeKrokodildo", felsoszank:"themeFelsoszank" };
  document.getElementById(map[theme])?.classList.add("active");
}

function setTheme(theme) {
  state.theme = theme;
  applyTheme(theme);
  saveState();
}

// ── RESET ────────────────────────────────────────────────────

function resetGame() {
  if (!confirm("Biztosan törlöd az összes mentett adatot?\n\nEz visszavonhatatlan!")) return;
  Object.assign(state, {
    missions: [], curses: [], photos: {}, collectedTreasures: [],
    lastMissionId: null, lastCurseId: null,
    tokens: 0, character: null, impostorName: "", impostorChangePurchased: false,
    returnMode: false, lives: 1,
  });
  localStorage.removeItem(SAVE_KEY);
  document.getElementById("resultCard").classList.add("hidden");
  currentFilter = "all";
  document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
  document.getElementById("filter-all")?.classList.add("active");
  renderAll();
  switchTab("collect");
}

// ── SEGÉDFÜGGVÉNYEK ──────────────────────────────────────────

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function rarityLabel(rarity) {
  return { common: "⬜ Közönséges", rare: "🔵 Ritka", legendary: "🟣 Legendás" }[rarity] || rarity;
}

function rarityEmoji(rarity) {
  return { common: "🌿", rare: "💫", legendary: "✨" }[rarity] || "🖼️";
}

function parseTokenValue(str) {
  const m = String(str || "").match(/\d+/);
  return m ? parseInt(m[0]) : 1;
}

// ── INDÍTÁS ──────────────────────────────────────────────────

document.addEventListener("DOMContentLoaded", init);
