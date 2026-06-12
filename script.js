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
  favoritePhotos:       {},     // { photoId: true }
  notes:                [],     // [{ id, title, text, createdAt, modified? }]
  sips:                 0,
  tetprobas:            0,      // elérhető Tétpróbák száma (max 5)
  sejtesCount:          0,      // Sejtés segédeszköz darabszám
  tudasszomjCount:      0,      // Tudásszomj segédeszköz darabszám
  commissions:          [],     // 3 aktív megbízás [{type,variant,reward,difficulty,baseline,completed}]
  soldTreasuresTotal:   0,      // eladott kincsek számlálója (kumulatív)
  usedTreasuresTotal:   0,      // felhasznált kincsek számlálója (kumulatív)
  deactivatedCursesTotal: 0,    // deaktivált átkok számlálója (kumulatív)
  wonTetprobaTotal:     0,      // nyert tétpróbák számlálója (kumulatív)
};

let currentFilter  = "all";
let kedvencFilter  = false;   // kedvencek-először nézet

// ── BOLT TERMÉKEK ────────────────────────────────────────────

const shopItems = [
  { id: "extra_life",      name: "❤️ +1 Élet",                    desc: "Egy extra élettel rendelkezel a játékban.",                          price: 25000 },
  { id: "remove_curse",    name: "🔓 Átok levétele",               desc: "Egy aktív átkod azonnal deaktiválódik.",                             price: 18500 },
  { id: "extra_photo",     name: "📸 +1 Fotó húzása",              desc: "Egy extra képet húzhatsz a galériádba.",                             price: 320 },
  { id: "impostor_change", name: "🕵️ Imposztorjelölés módosítása", desc: "Egyszer megváltoztathatod a gyanúsítottadat.",                       price: 650 },
  { id: "sejtés",          name: "🔍 Sejtés",                      desc: "Tétpróba megkezdése előtt felfedi a kérdés témáját.",                price: 1800 },
  { id: "tudasszomj",      name: "🍺 Tudásszomj",                  desc: "Tétpróba közben kizár 1 rossz választ. Kérdésenként max. 1×.",       price: 4100 },
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
    state.favoritePhotos        = p.favoritePhotos        || {};
    state.notes                 = p.notes                 || [];
    state.sips                  = p.sips                  || 0;
    state.tetprobas               = p.tetprobas               || 0;
    state.sejtesCount             = p.sejtesCount             || 0;
    state.tudasszomjCount         = p.tudasszomjCount         || 0;
    state.commissions             = p.commissions             || [];
    state.soldTreasuresTotal      = p.soldTreasuresTotal      || 0;
    state.usedTreasuresTotal      = p.usedTreasuresTotal      || 0;
    state.deactivatedCursesTotal  = p.deactivatedCursesTotal  || 0;
    state.wonTetprobaTotal        = p.wonTetprobaTotal        || 0;
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
  if (tabName === "notes")     renderNotes();
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
  checkCommissions();
}

function drawPhoto() {
  if (photos.length === 0) return;
  const item = photos[Math.floor(Math.random() * photos.length)];
  state.photos[item.id] = (state.photos[item.id] || 0) + 1;
  saveState();
  showPhotoResult(item);
  updateStats();
  checkCommissions();
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
  updateSipDisplay();
  renderTetprobaSection();
  renderKarakter();
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

  state.missions.map((inst, idx) => ({ inst, idx })).reverse().forEach(({ inst, idx }) => {
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

  state.curses.map((inst, idx) => ({ inst, idx })).reverse().forEach(({ inst, idx }) => {
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

  state.collectedTreasures.map((inst, idx) => ({ inst, idx })).reverse().forEach(({ inst, idx }) => {
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
      <div class="card-extra-value">${data.value}</div>
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

  // Kedvencek szűrő gomb
  const filterRow = document.createElement("div");
  filterRow.className = "gallery-filter-row";
  filterRow.innerHTML = `
    <button class="gallery-fav-toggle ${kedvencFilter ? 'active' : ''}"
            onclick="toggleKedvencFilter()">❤️ Kedvencek</button>
  `;
  container.appendChild(filterRow);

  // Ritkaság szerinti rendezés: legendary → rare → common
  const rarityOrder = { legendary: 0, rare: 1, common: 2 };
  const sorted = Object.entries(state.photos).sort(([aId], [bId]) => {
    const ra = photos.find(p => p.id === aId)?.rarity;
    const rb = photos.find(p => p.id === bId)?.rarity;
    return (rarityOrder[ra] ?? 3) - (rarityOrder[rb] ?? 3);
  });

  function buildCard(photoId, count) {
    const data = photos.find(p => p.id === photoId);
    if (!data) return null;
    const isFav = !!state.favoritePhotos[photoId];
    const card = document.createElement("div");
    card.className = "photo-card rarity-" + data.rarity;
    card.innerHTML = `
      ${count > 1 ? `<div class="photo-count-badge">×${count}</div>` : ""}
      <button class="photo-fav-btn ${isFav ? 'active' : ''}" onclick="toggleFavorite(event,'${data.id}')" title="Kedvenc">❤️</button>
      <button class="photo-delete-btn" onclick="deletePhoto(event,'${data.id}')" title="Törlés">🗑️</button>
      <img class="photo-card-img" src="${data.src}" alt="${data.name}"
           onerror="this.style.display='none';this.nextElementSibling.style.display='flex';">
      <div class="photo-placeholder" style="display:none;">${rarityEmoji(data.rarity)}</div>
      <div class="photo-card-info">
        <div class="photo-card-name">${data.name}</div>
        <div class="photo-card-rarity rarity-label-${data.rarity}">${rarityLabel(data.rarity)}</div>
      </div>
    `;
    card.addEventListener("click", () => openLightbox(data.src, data.name));
    return card;
  }

  if (kedvencFilter) {
    const favs   = sorted.filter(([id]) => state.favoritePhotos[id]);
    const others = sorted.filter(([id]) => !state.favoritePhotos[id]);

    if (favs.length > 0) {
      const hdr = document.createElement("div");
      hdr.className = "gallery-subsection-title";
      hdr.textContent = "❤️ Kedvencek";
      container.appendChild(hdr);
      const grid = document.createElement("div");
      grid.className = "gallery-sub-grid";
      favs.forEach(([id, cnt]) => { const c = buildCard(id, cnt); if (c) grid.appendChild(c); });
      container.appendChild(grid);
    }

    if (others.length > 0) {
      const hdr2 = document.createElement("div");
      hdr2.className = "gallery-subsection-title";
      hdr2.textContent = favs.length > 0 ? "📷 Többi" : "📷 Képek";
      container.appendChild(hdr2);
      const grid2 = document.createElement("div");
      grid2.className = "gallery-sub-grid";
      others.forEach(([id, cnt]) => { const c = buildCard(id, cnt); if (c) grid2.appendChild(c); });
      container.appendChild(grid2);
    }

    if (favs.length === 0 && others.length === 0) {
      container.innerHTML = '<p class="empty-state">A galériád üres.</p>';
    }
  } else {
    const grid = document.createElement("div");
    grid.className = "gallery-sub-grid";
    sorted.forEach(([id, cnt]) => { const c = buildCard(id, cnt); if (c) grid.appendChild(c); });
    container.appendChild(grid);
  }
}

function toggleKedvencFilter() {
  kedvencFilter = !kedvencFilter;
  renderGallery();
}

function toggleFavorite(e, photoId) {
  e.stopPropagation();
  if (state.favoritePhotos[photoId]) {
    delete state.favoritePhotos[photoId];
  } else {
    state.favoritePhotos[photoId] = true;
  }
  saveState();
  renderGallery();
}

function openLightbox(src, name) {
  document.getElementById("lightboxImg").src = src;
  document.getElementById("lightboxCaption").textContent = name;
  document.getElementById("photoLightbox").classList.remove("hidden");
  document.body.classList.add("lightbox-open");
}

function closeLightbox() {
  document.getElementById("photoLightbox").classList.add("hidden");
  document.body.classList.remove("lightbox-open");
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
  checkCommissions();
}

function deactivateCurse(idx) {
  if (!state.curses[idx]) return;
  state.curses[idx].status = "deactivated";
  state.deactivatedCursesTotal = (state.deactivatedCursesTotal || 0) + 1;
  // Harcos bónusz: +1 zseton deaktiválásonként
  if (state.character?.roleId === "role_harcos") {
    state.tokens += 1;
    updateTokenDisplay();
  }
  saveState();
  renderCurses();
  checkCommissions();
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
  state.usedTreasuresTotal = (state.usedTreasuresTotal || 0) + 1;
  saveState();
  renderTreasures();
  checkCommissions();
}

function addLife() {
  if (!confirm("Biztosan hozzáadsz 1 életet?")) return;
  state.lives++;
  saveState();
  renderBolt();
}

function removeLife() {
  if (state.lives <= 0) { alert("Nincs több élet!"); return; }
  if (!confirm("Biztosan levonsz 1 életet?")) return;
  state.lives--;
  saveState();
  renderBolt();
}

function sellTreasure(idx) {
  const inst = state.collectedTreasures[idx];
  const data = treasures.find(t => t.id === inst?.id);
  if (!data) return;
  const val = parseTokenValue(data.value);
  if (!confirm("Biztosan eladod?\n\n" + data.name + "\n\n+ " + formatNum(val) + " 🪙 zsetont kapsz.")) return;
  state.tokens += val;
  state.collectedTreasures.splice(idx, 1);
  state.soldTreasuresTotal = (state.soldTreasuresTotal || 0) + 1;
  saveState();
  renderTreasures();
  updateTokenDisplay();
  updateStats();
  checkCommissions();
}

function sellAllTreasures() {
  const sellable = state.collectedTreasures
    .map((inst, idx) => ({ inst, idx, data: treasures.find(t => t.id === inst.id) }))
    .filter(({ inst, data }) => !inst.used && data);
  if (sellable.length === 0) return;
  const total = sellable.reduce((s, { data }) => s + parseTokenValue(data.value), 0);
  if (!confirm("Biztosan eladod az összes kincset?\n\n" + sellable.length + " db kincs\n\nÖsszesen: +" + formatNum(total) + " 🪙")) return;
  // Törlés legnagyobb indextől, hogy az indexek ne csússzanak el
  sellable.map(x => x.idx).sort((a, b) => b - a).forEach(i => {
    state.collectedTreasures.splice(i, 1);
  });
  state.tokens += total;
  state.soldTreasuresTotal = (state.soldTreasuresTotal || 0) + sellable.length;
  saveState();
  alert("✅ Összes kincs eladva!\n\n+" + formatNum(total) + " 🪙 zseton jóváírva.");
  renderTreasures();
  updateTokenDisplay();
  updateStats();
  renderBolt();
  checkCommissions();
}

function deletePhoto(e, photoId) {
  e.stopPropagation();
  const data = photos.find(p => p.id === photoId);
  if (!confirm("Biztosan törölni szeretnéd?\n\n" + (data?.name || "ezt a képet"))) return;
  delete state.photos[photoId];
  delete state.favoritePhotos[photoId];
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

function adjustSips(delta) {
  const oldSips = state.sips || 0;
  state.sips = Math.max(0, oldSips + delta);

  // 10 kortyonként 1 Tétpróba (csak növelésnél, max 5)
  if (delta > 0) {
    const oldTens = Math.floor(oldSips / 10);
    const newTens = Math.floor(state.sips / 10);
    const earned  = newTens - oldTens;
    if (earned > 0 && state.tetprobas < 5) {
      const prev = state.tetprobas;
      state.tetprobas = Math.min(5, state.tetprobas + earned);
      const gained = state.tetprobas - prev;
      showTpToast("🎲 +" + gained + " Tétpróba!");
    }
  }

  saveState();
  const el = document.getElementById("sipCount");
  if (el) el.textContent = state.sips;
  // Animáció
  const wrap = document.querySelector(".sip-value-wrap");
  if (wrap) {
    wrap.classList.remove("sip-pop");
    void wrap.offsetWidth; // reflow
    wrap.classList.add("sip-pop");
  }
  renderTetprobaSection();
  checkCommissions();
}

function updateSipDisplay() {
  const el = document.getElementById("sipCount");
  if (el) el.textContent = state.sips || 0;
}

// ── TÉTPRÓBA RENDSZER ────────────────────────────────────

let tpPhase          = null;   // null | "bet" | "question" | "result"
let tpBet            = 0;
let tpQuestion       = null;   // aktuális kérdés objektum
let tpHintShown      = false;
let tpEliminated     = [];     // kizárt opcióindexek
let tpEliminationsUsed = 0;
let tpWon            = null;   // true | false | null
let tpOpen           = false;  // lenyitható panel állapota

function showTpToast(msg) {
  const t = document.getElementById("tpToast");
  if (!t) return;
  t.textContent = msg;
  t.classList.remove("tp-toast-hidden");
  t.classList.add("tp-toast-show");
  clearTimeout(t._timer);
  t._timer = setTimeout(() => {
    t.classList.remove("tp-toast-show");
    t.classList.add("tp-toast-hidden");
  }, 2200);
}

function toggleTetprobaSec() {
  if (tpPhase !== null) return;
  tpOpen = !tpOpen;
  renderTetprobaSection();
}

function renderTetprobaSection() {
  const el = document.getElementById("tetprobaSection");
  if (!el) return;

  const tp     = state.tetprobas      || 0;
  const sej    = state.sejtesCount    || 0;
  const tud    = state.tudasszomjCount || 0;
  const sips   = state.sips           || 0;
  const nextIn = tp < 5 ? (10 - (sips % 10)) : 0;

  // 5 slot-indikátor pont
  const dots = Array.from({length: 5}, (_, i) =>
    `<span class="tp-slot ${i < tp ? "tp-slot-filled" : "tp-slot-empty"}"></span>`
  ).join("");

  const isActive  = tpPhase !== null;
  const showBody  = tpOpen || isActive;

  // ── Fejléc (mindig látható) ──
  const header = `
    <div class="tetproba-header-row ${isActive ? "" : "tp-header-clickable"}"
         ${isActive ? "" : 'onclick="toggleTetprobaSec()"'}>
      <div class="tp-title-wrap">
        <span class="tp-icon-big">🎲</span>
        <span class="tetproba-title">Tétpróba</span>
      </div>
      <div class="tp-header-right">
        <div class="tp-slots">${dots}</div>
        ${!isActive ? `<span class="tp-chevron">${showBody ? "▲" : "▼"}</span>` : ""}
      </div>
    </div>`;

  if (!showBody) {
    el.innerHTML = `<div class="tetproba-card">${header}</div>`;
    return;
  }

  // ── Alap nézet (nyitott, nincs aktív játék) ──
  if (tpPhase === null) {
    const canStart = tp > 0 && state.tokens > 0;
    el.innerHTML = `
      <div class="tetproba-card">
        ${header}
        <div class="tp-body">
          <div class="tetproba-helpers-row">
            <span class="tp-helper-chip">🔍 Sejtés: <b>${sej}</b></span>
            <span class="tp-helper-chip">🍺 Tudásszomj: <b>${tud}</b></span>
          </div>
          <div class="tp-info-row">
            <span class="tetproba-info">Minden 10. kortyért 1 Tétpróbát kapsz.</span>
            ${tp < 5
              ? `<span class="tetproba-next">Következő: <b>${nextIn}</b> korty múlva</span>`
              : `<span class="tetproba-next tp-full">✨ Tele!</span>`}
          </div>
          ${canStart
            ? `<button class="btn-start-tetproba" onclick="startTetproba()">🎲 Tétpróba indítása</button>`
            : tp === 0
              ? `<p class="tetproba-warn">Nincs Tétpróbád – igyál többet! 🍺</p>`
              : `<p class="tetproba-warn">Nincs zsetonod – nem tehetsz tétet.</p>`
          }
        </div>
      </div>`;

  // ── Tét-megadás fázis ──
  } else if (tpPhase === "bet") {
    el.innerHTML = `
      <div class="tetproba-card tetproba-active">
        ${header}
        <div class="tp-body">
          <div class="tetproba-phase-label">💰 Tét megadása</div>
          <p class="tp-token-info">Egyenleged: <b>${formatNum(state.tokens)} 🪙</b></p>
          <input type="number" id="tpBetInput" class="tetproba-input"
                 min="1" max="${state.tokens}" placeholder="Tét összege (max ${formatNum(state.tokens)})">
          ${sej > 0 && !tpHintShown
            ? `<button class="btn-tp-helper" onclick="useSejtesHint()">🔍 Sejtés használata (${sej} db maradt)</button>`
            : ""
          }
          ${tpHintShown
            ? `<div class="tp-hint-box">🔍 Téma: <strong>${tpQuestion ? tpQuestion.topic : ""}</strong></div>`
            : ""
          }
          <div class="tp-action-row">
            <button class="btn-tp-confirm" onclick="confirmBet()">Tovább →</button>
            <button class="btn-tp-cancel"  onclick="closeTetproba()">Mégsem</button>
          </div>
        </div>
      </div>`;

  // ── Kérdés fázis ──
  } else if (tpPhase === "question") {
    const opts = tpQuestion.options.map((opt, i) => {
      const elim = tpEliminated.includes(i);
      return `<button class="btn-tp-option ${elim ? "tp-option-elim" : ""}"
                onclick="${elim ? "" : "answerTetproba(" + i + ")"}"
                ${elim ? "disabled" : ""}>${opt}</button>`;
    }).join("");

    const canTudasszomj = tud > 0 && tpEliminationsUsed < 1 &&
      (tpQuestion.options.length - tpEliminated.length) > 2;

    el.innerHTML = `
      <div class="tetproba-card tetproba-active">
        ${header}
        <div class="tp-body">
          <div class="tetproba-phase-label">❓ Kérdés</div>
          <p class="tp-bet-info">Tét: <b>${formatNum(tpBet)} 🪙</b></p>
          <p class="tetproba-question">${tpQuestion.question}</p>
          <div class="tp-options-grid">${opts}</div>
          ${canTudasszomj
            ? `<button class="btn-tp-helper" onclick="useTudasszomj()">🍺 Tudásszomj – rossz válasz kizárása (${tud} db)</button>`
            : ""
          }
        </div>
      </div>`;

  // ── Eredmény fázis ──
  } else if (tpPhase === "result") {
    const bonus    = Math.floor(tpBet * 0.5);
    const winnings = tpBet + bonus;
    el.innerHTML = `
      <div class="tetproba-card tetproba-result ${tpWon ? "tp-result-win" : "tp-result-lose"}">
        ${header}
        <div class="tp-body">
          <div class="tp-result-icon">${tpWon ? "✅" : "❌"}</div>
          <p class="tp-result-title">${tpWon ? "Helyes válasz!" : "Helytelen válasz!"}</p>
          <p class="tp-result-detail">${tpWon
            ? `<b>+${formatNum(winnings)} 🪙</b> (tét vissza + 50% bónusz)`
            : `<b>−${formatNum(tpBet)} 🪙</b> és igyál egyet! 🍺`
          }</p>
          <p class="tp-result-correct">Helyes válasz: <b>${tpQuestion.options[tpQuestion.correct]}</b></p>
          <button class="btn-start-tetproba" onclick="closeTetproba()">Bezárás</button>
        </div>
      </div>`;
  }
}

function startTetproba() {
  if ((state.tetprobas || 0) < 1) { alert("Nincs Tétpróbád!"); return; }
  if (state.tokens < 1) { alert("Nincs zsetonod!"); return; }
  tpQuestion       = tetprobaKerdesek[Math.floor(Math.random() * tetprobaKerdesek.length)];
  tpPhase          = "bet";
  tpBet            = 0;
  tpHintShown      = false;
  tpEliminated     = [];
  tpEliminationsUsed = 0;
  tpWon            = null;
  tpOpen           = true;
  renderTetprobaSection();
  // Görgetés a kártyára
  setTimeout(() => {
    document.getElementById("tetprobaSection")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, 50);
}

function useSejtesHint() {
  if ((state.sejtesCount || 0) < 1) return;
  state.sejtesCount--;
  tpHintShown = true;
  saveState();
  renderTetprobaSection();
}

function confirmBet() {
  const input = document.getElementById("tpBetInput");
  if (!input) return;
  const val = parseInt(input.value);
  if (isNaN(val) || val < 1) { alert("Adj meg érvényes tétösszeget (legalább 1 zseton)!"); return; }
  if (val > state.tokens) { alert("A tét nem haladhatja meg a zseton-egyenlegedet!"); return; }
  tpBet   = val;
  tpPhase = "question";
  renderTetprobaSection();
}

function useTudasszomj() {
  if ((state.tudasszomjCount || 0) < 1) return;
  if (tpEliminationsUsed >= 1) return;
  // Egy véletlenszerű, ki nem zárott helytelen opcióindex törlése
  const wrongIndices = tpQuestion.options
    .map((_, i) => i)
    .filter(i => i !== tpQuestion.correct && !tpEliminated.includes(i));
  if (wrongIndices.length === 0) return;
  const pick = wrongIndices[Math.floor(Math.random() * wrongIndices.length)];
  tpEliminated.push(pick);
  tpEliminationsUsed++;
  state.tudasszomjCount--;
  saveState();
  renderTetprobaSection();
}

function answerTetproba(idx) {
  if (tpEliminated.includes(idx)) return;
  tpWon = (idx === tpQuestion.correct);
  // Tétpróba elfogyasztása
  state.tetprobas = Math.max(0, (state.tetprobas || 0) - 1);
  if (tpWon) {
    const bonus = Math.floor(tpBet * 0.5);
    state.tokens += tpBet + bonus;
    state.wonTetprobaTotal = (state.wonTetprobaTotal || 0) + 1;
  } else {
    state.tokens = Math.max(0, state.tokens - tpBet);
  }
  tpPhase = "result";
  saveState();
  updateTokenDisplay();
  renderTetprobaSection();
}

function closeTetproba() {
  tpPhase          = null;
  tpBet            = 0;
  tpQuestion       = null;
  tpHintShown      = false;
  tpEliminated     = [];
  tpEliminationsUsed = 0;
  tpWon            = null;
  tpOpen           = false;
  renderTetprobaSection();
}

function updateTokenDisplay() {
  const v = state.tokens;
  const h = document.getElementById("headerTokens");
  if (h) h.textContent = "🪙 " + formatNum(v);
  const s = document.getElementById("shopTokenCount");
  if (s) s.textContent = formatNum(v);
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

// ── MEGBÍZÁSOK RENDSZER ───────────────────────────────────────

const commissionDefs = {
  complete_missions: {
    difficulty: "easy", icon: "🗺️",
    title:      (n) => `Teljesíts további ${n} küldetést!`,
    variants:   [1, 2, 3],
    getCurrent: () => state.missions.filter(m => m.status === "completed").length,
  },
  collect_photos: {
    difficulty: "easy", icon: "📸",
    title:      (n) => `Gyűjts be további ${n} képet!`,
    variants:   [1, 2, 3, 4, 5],
    getCurrent: () => Object.keys(state.photos).length,
  },
  drink_sips: {
    difficulty: "easy", icon: "🍺",
    title:      (n) => `Igyál további ${n} kortyot!`,
    variants:   [5, 6, 7, 8, 9, 10, 11, 12],
    getCurrent: () => state.sips || 0,
  },
  acquire_treasures: {
    difficulty: "medium", icon: "💎",
    title:      (n) => `Szerezz további ${n} kincset!`,
    variants:   [1, 2, 3],
    getCurrent: () => state.collectedTreasures.length,
  },
  sell_treasures: {
    difficulty: "medium", icon: "💰",
    title:      (n) => `Adj el ${n} kincset!`,
    variants:   [3, 4, 5],
    getCurrent: () => state.soldTreasuresTotal || 0,
  },
  use_treasures: {
    difficulty: "medium", icon: "✨",
    title:      (n) => `Használj fel ${n} kincset!`,
    variants:   [1, 2, 3],
    getCurrent: () => state.usedTreasuresTotal || 0,
  },
  collect_rare_photos: {
    difficulty: "hard", icon: "🌟",
    title:      (n) => `Gyűjts be további ${n} ritka vagy legendás képet!`,
    variants:   [1, 2, 3, 4, 5],
    getCurrent: () => Object.keys(state.photos).filter(id => {
      const p = photos.find(x => x.id === id);
      return p && (p.rarity === "rare" || p.rarity === "legendary");
    }).length,
  },
  deactivate_curses: {
    difficulty: "hard", icon: "🔓",
    title:      (n) => `Deaktiválj ${n} átkot!`,
    variants:   [1, 2, 3],
    getCurrent: () => state.deactivatedCursesTotal || 0,
  },
  win_tetproba: {
    difficulty: "hard", icon: "🎲",
    title:      (n) => `Nyerj ${n} tétpróbát!`,
    variants:   [1, 2, 3],
    getCurrent: () => state.wonTetprobaTotal || 0,
  },
};

function randReward(difficulty) {
  if (difficulty === "easy")   return 50  + Math.floor(Math.random() * 15) * 25;
  if (difficulty === "medium") return 400 + Math.floor(Math.random() * 15) * 25;
  /* hard */                   return 750 + Math.floor(Math.random() * 19) * 25;
}

function generateCommission(slotIdx, prevType = null) {
  const activeTypes = (state.commissions || [])
    .filter((c, i) => i !== slotIdx && c)
    .map(c => c.type);

  const allTypes = Object.keys(commissionDefs);
  let available = allTypes.filter(t => !activeTypes.includes(t) && t !== prevType);
  if (available.length === 0) available = allTypes.filter(t => !activeTypes.includes(t));
  if (available.length === 0) available = allTypes;

  const type    = available[Math.floor(Math.random() * available.length)];
  const def     = commissionDefs[type];
  const variant = def.variants[Math.floor(Math.random() * def.variants.length)];

  return { type, variant, reward: randReward(def.difficulty), difficulty: def.difficulty, baseline: def.getCurrent(), completed: false };
}

function initCommissions() {
  state.commissions = [];
  for (let i = 0; i < 3; i++) state.commissions.push(generateCommission(i));
  saveState();
}

function checkCommissions() {
  if (!state.commissions || state.commissions.length < 3) {
    if (state.character) { initCommissions(); renderKarakter(); }
    return;
  }
  let changed = false;
  state.commissions.forEach((comm, i) => {
    if (!comm || comm.completed) return;
    const def = commissionDefs[comm.type];
    if (!def) return;
    const prog = def.getCurrent() - comm.baseline;
    if (prog >= comm.variant) {
      state.commissions[i] = { ...comm, completed: true };
      changed = true;
    }
  });
  if (changed) { saveState(); renderKarakter(); }
}

let pendingSlideIn = new Set();

function claimCommission(slotIdx) {
  const comm = state.commissions?.[slotIdx];
  if (!comm?.completed) return;
  state.tokens += comm.reward;
  updateTokenDisplay();
  const prevType = comm.type;
  state.commissions[slotIdx] = null;
  state.commissions[slotIdx] = generateCommission(slotIdx, prevType);
  pendingSlideIn.add(slotIdx);
  saveState();
  renderMegbizasok();
}

let charSubTab = "megbizasok";

function switchCharTab(tab) {
  charSubTab = tab;
  renderKarakter();
}

function renderMegbizasok() {
  checkCommissions();
  const el = document.getElementById("commissionsContent");
  if (!el) return;

  const diffLabels = { easy: "🟢 Könnyű", medium: "🟡 Közepes", hard: "🔴 Nehéz" };

  const cards = (state.commissions || []).map((comm, i) => {
    if (!comm) return `<div class="commission-card">⏳</div>`;
    const def  = commissionDefs[comm.type];
    if (!def)  return "";
    const raw  = def.getCurrent() - comm.baseline;
    const prog = Math.min(comm.variant, Math.max(0, raw));
    const pct  = Math.round(prog / comm.variant * 100);

    return `
      <div class="commission-card comm-diff-${comm.difficulty}${comm.completed ? " comm-completed" : ""}" data-slot="${i}">
        <div class="comm-card-top">
          <span class="comm-icon">${def.icon}</span>
          <span class="comm-diff-badge comm-badge-${comm.difficulty}">${diffLabels[comm.difficulty]}</span>
          ${comm.completed ? `<span class="comm-done-badge">✅ Kész!</span>` : ""}
        </div>
        <p class="comm-title">${def.title(comm.variant)}</p>
        <div class="comm-progress-wrap">
          <div class="comm-progress-track">
            <div class="comm-progress-fill comm-fill-${comm.difficulty}" style="width:${pct}%"></div>
          </div>
          <span class="comm-progress-label">${prog} / ${comm.variant}</span>
        </div>
        <div class="comm-reward">Jutalom: <strong>${formatNum(comm.reward)} 🪙</strong></div>
        ${comm.completed
          ? `<button class="btn-claim-commission" onclick="claimCommission(${i})">🎁 Jutalom begyűjtése</button>`
          : ""}
      </div>`;
  }).join("");

  el.innerHTML = `<div class="commissions-list">${cards}</div>`;

  // Slide-in animáció az új megbízásokhoz
  pendingSlideIn.forEach(i => {
    const card = el.querySelector(`[data-slot="${i}"]`);
    if (card) {
      card.classList.add("comm-slide-in");
      setTimeout(() => card.classList.remove("comm-slide-in"), 550);
    }
  });
  pendingSlideIn.clear();
}

// ── KARAKTER ─────────────────────────────────────────────────

function renderKarakter() {
  const container = document.getElementById("characterContent");
  if (!container) return;

  // ── Karakterválasztás képernyő ──
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

  // Megbízások inicializálása ha szükséges
  if (!state.commissions || state.commissions.length < 3) initCommissions();

  const role    = characters.find(r => r.id === state.character.roleId);
  if (!role) return;

  // ── Alfül-váltó ──
  const tabSwitcher = `
    <div class="char-subtab-switcher">
      <button class="char-subtab-btn ${charSubTab === "megbizasok" ? "active" : ""}"
              onclick="switchCharTab('megbizasok')">📋 Megbízások</button>
      <button class="char-subtab-btn ${charSubTab === "kepessegek" ? "active" : ""}"
              onclick="switchCharTab('kepessegek')">⚡ Képességek</button>
    </div>`;

  // ── Megbízások fül ──
  if (charSubTab === "megbizasok") {
    container.innerHTML = tabSwitcher + `<div id="commissionsContent"></div>`;
    renderMegbizasok();
    return;
  }

  // ── Képességek fül ──
  const used    = [state.character.ability1Used, state.character.ability2Used];
  const canEdit = !state.impostorName || state.impostorChangePurchased;
  const completedMissions = state.missions.filter(m => m.status === "completed").length;
  const totalPhotos        = Object.keys(state.photos).length;
  const abilityReqs = [
    { current: completedMissions, max: 5,  goal: "Teljesíts 5 küldetést!",  unit: "teljesített küldetés" },
    { current: totalPhotos,       max: 20, goal: "Gyűjts össze 20 képet!", unit: "összegyűjtött kép"     }
  ];
  const unlocked = [completedMissions >= 5, totalPhotos >= 20];

  container.innerHTML = tabSwitcher + `
    <div class="active-role-header">
      <div class="active-role-name">${role.name}</div>
      <div class="active-role-desc">${role.description}</div>
    </div>

    <div class="abilities-list">
      ${role.abilities.map((ab, i) => {
        const isUsed     = used[i];
        const isUnlocked = unlocked[i];
        const req        = abilityReqs[i];
        const pct        = Math.min(100, Math.round(req.current / req.max * 100));

        if (isUsed) return `
          <div class="ability-card ability-used">
            <div class="ability-card-top">
              <div class="ability-num-badge">${i + 1}. képesség</div>
              <div class="ability-used-badge">✅ Felhasználva</div>
            </div>
            <div class="ability-body">
              <div class="ability-icon-col">⚡</div>
              <div class="ability-text-col">
                <div class="ability-name">${ab.name}</div>
                <div class="ability-desc">${ab.description}</div>
              </div>
            </div>
          </div>`;

        if (!isUnlocked) return `
          <div class="ability-card ability-locked">
            <div class="ability-card-top">
              <div class="ability-num-badge">${i + 1}. képesség</div>
              <div class="ability-lock-badge">🔒 Zárolt</div>
            </div>
            <div class="ability-body">
              <div class="ability-icon-col ability-icon-locked">⚡</div>
              <div class="ability-text-col">
                <div class="ability-name ability-name-locked">${ab.name}</div>
                <div class="ability-desc">${ab.description}</div>
              </div>
            </div>
            <div class="ability-unlock-goal">🎯 ${req.goal}</div>
            <div class="ability-progress-wrap">
              <div class="ability-progress-bar-track">
                <div class="ability-progress-bar-fill" style="width:${pct}%"></div>
              </div>
              <div class="ability-progress-label">${req.current} / ${req.max} ${req.unit}</div>
            </div>
          </div>`;

        return `
          <div class="ability-card ability-ready">
            <div class="ability-card-top">
              <div class="ability-num-badge">${i + 1}. képesség</div>
              <div class="ability-ready-badge">✨ Feloldva!</div>
            </div>
            <div class="ability-body">
              <div class="ability-icon-col">⚡</div>
              <div class="ability-text-col">
                <div class="ability-name">${ab.name}</div>
                <div class="ability-desc">${ab.description}</div>
              </div>
            </div>
            <div class="ability-progress-wrap">
              <div class="ability-progress-bar-track">
                <div class="ability-progress-bar-fill ability-progress-full" style="width:100%"></div>
              </div>
              <div class="ability-progress-label ability-progress-done-label">✅ ${req.max} / ${req.max} ${req.unit}</div>
            </div>
            <button class="btn-use-ability" onclick="useAbility(${i})">⚡ Képesség aktiválása</button>
          </div>`;
      }).join("")}
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
        <p class="impostor-change-hint">⚠️ Módosítási jogot a Boltban vásárolhatsz!</p>
      `}
    </div>
  `;
}

function selectRole(roleId) {
  const role = characters.find(r => r.id === roleId);
  if (!confirm("Biztosan ezt a karaktert választod?\n\n" + (role?.name || "") + "\n\nA döntés beállításokban resetelhető.")) return;
  state.character = { roleId, ability1Used: false, ability2Used: false };
  state.commissions = [];
  charSubTab = "megbizasok";
  initCommissions();
  saveState();
  renderKarakter();
}

function useAbility(i) {
  if (!state.character) return;
  // Ellenőrzés: fel van-e oldva
  const completedMissions = state.missions.filter(m => m.status === "completed").length;
  const totalPhotos        = Object.keys(state.photos).length;
  const unlocked = [completedMissions >= 5, totalPhotos >= 20];
  if (!unlocked[i]) {
    alert("Ez a képesség még nincs feloldva!");
    return;
  }
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
  state.commissions            = [];
  charSubTab = "megbizasok";
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

  const sellableTreasures = state.collectedTreasures
    .map((inst, idx) => ({ inst, idx }))
    .filter(({ inst }) => !inst.used);
  const sellAllTotal = sellableTreasures.reduce((sum, { inst }) => {
    const d = treasures.find(t => t.id === inst.id);
    return sum + (d ? parseTokenValue(d.value) : 0);
  }, 0);

  const sellSection = state.collectedTreasures.length > 0 ? `
    <div class="shop-section">
      <div class="shop-section-header">
        <h2 class="shop-section-title">💰 Kincsek eladása</h2>
        <div class="shop-section-header-btns">
          ${sellableTreasures.length > 1
            ? `<button class="btn-sell-all" onclick="sellAllTreasures()" title="Mindet eladja">Mindet eladja</button>`
            : ""}
          <button class="shop-refresh-btn" onclick="renderBolt()" title="Frissítés">🔄</button>
        </div>
      </div>
      ${state.collectedTreasures.map((inst, idx) => {
        const data = treasures.find(t => t.id === inst.id);
        if (!data) return "";
        const isUsed = !!inst.used;
        return `
          <div class="shop-sell-row${isUsed ? " shop-sell-used" : ""}">
            <div class="shop-sell-info">
              <div class="shop-sell-name">${data.name}</div>
              <div class="shop-sell-val">${isUsed ? "✅ Felhasználva" : `+${formatNum(parseTokenValue(data.value))} 🪙`}</div>
            </div>
            ${isUsed ? "" : `<button class="btn-sell-sm" onclick="sellTreasure(${idx})">Eladás</button>`}
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
          <button class="btn-buy" onclick="buyItem('${item.id}')">${formatNum(item.price)} 🪙</button>
        </div>
      `).join("")}
    </div>
  `;

  container.innerHTML = `
    <div class="token-hero">
      <div class="token-hero-label">Zseton egyenleg</div>
      <div class="token-hero-row">
        <span class="token-hero-num" id="shopTokenCount">${formatNum(state.tokens)}</span>
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
    const activeCurses = state.curses.map((inst, idx) => ({ inst, idx })).filter(e => e.inst.status === "active");
    if (activeCurses.length === 0) {
      alert("Nincs aktív átkod jelenleg – zsetonod visszakerül.");
      state.tokens += item.price;
    } else if (activeCurses.length === 1) {
      const data = curses.find(c => c.id === activeCurses[0].inst.id);
      if (!confirm("Deaktiváld ezt az átkot?\n\n" + (data?.title || "Ismeretlen átok"))) {
        state.tokens += item.price;
      } else {
        state.curses[activeCurses[0].idx].status = "deactivated";
        state.deactivatedCursesTotal = (state.deactivatedCursesTotal || 0) + 1;
        renderCurses();
      }
    } else {
      const options = activeCurses.map((e, i) => {
        const data = curses.find(c => c.id === e.inst.id);
        return (i + 1) + ". " + (data?.title || e.inst.id);
      }).join("\n");
      const choice = prompt("Melyik átkot szeretnéd deaktiválni?\n\n" + options + "\n\nÍrd be a sorszámot (1-" + activeCurses.length + "):");
      const num = parseInt(choice);
      if (!num || num < 1 || num > activeCurses.length) {
        alert("Érvénytelen választás – zsetonod visszakerül.");
        state.tokens += item.price;
      } else {
        state.curses[activeCurses[num - 1].idx].status = "deactivated";
        state.deactivatedCursesTotal = (state.deactivatedCursesTotal || 0) + 1;
        renderCurses();
      }
    }
  } else if (itemId === "extra_photo") {
    drawPhoto();
  } else if (itemId === "impostor_change") {
    state.impostorChangePurchased = true;
  } else if (itemId === "sejtés") {
    state.sejtesCount = (state.sejtesCount || 0) + 1;
  } else if (itemId === "tudasszomj") {
    state.tudasszomjCount = (state.tudasszomjCount || 0) + 1;
  }

  saveState();
  updateTokenDisplay();
  renderBolt();
  renderTetprobaSection();
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

// ── JEGYZETEK ────────────────────────────────────────────────

function renderNotes() {
  const list = document.getElementById("notesList");
  if (!list) return;

  if (state.notes.length === 0) {
    list.innerHTML = '<p class="empty-state">Még nincs egyetlen jegyzet sem.</p>';
    return;
  }

  list.innerHTML = "";
  [...state.notes].reverse().forEach(note => buildNoteCard(note, list));
}

function buildNoteCard(note, container) {
  const preview = note.text.length > 90
    ? note.text.slice(0, 90).trimEnd() + "…"
    : note.text;
  const dateStr = new Date(note.createdAt).toLocaleDateString("hu-HU", {
    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
  });
  const modTag = note.modified
    ? ' <span class="note-modified-tag">(módosított)</span>' : "";

  const card = document.createElement("div");
  card.className = "note-card";
  card.dataset.noteId = note.id;
  card.innerHTML = `
    <div class="note-card-header">
      <span class="note-card-title">${escapeHtml(note.title)}${modTag}</span>
      <div class="note-card-actions">
        <button class="note-edit-btn" onclick="openNoteEdit('${note.id}')" title="Szerkesztés">✏️</button>
        <button class="note-delete-btn" onclick="deleteNote('${note.id}')" title="Törlés">🗑️</button>
      </div>
    </div>
    <p class="note-card-preview">${escapeHtml(preview)}</p>
    <span class="note-card-date">${dateStr}</span>
  `;
  // Teljes szöveg kattintásra
  card.addEventListener("click", (e) => {
    if (e.target.closest(".note-card-actions")) return;
    card.classList.toggle("note-expanded");
    card.querySelector(".note-card-preview").textContent =
      card.classList.contains("note-expanded") ? note.text : preview;
  });
  container.appendChild(card);
}

function openNoteEdit(id) {
  const note = state.notes.find(n => n.id === id);
  if (!note) return;
  const card = document.querySelector(`.note-card[data-note-id="${id}"]`);
  if (!card) return;

  card.classList.add("note-editing");
  card.innerHTML = `
    <div class="note-edit-form">
      <input type="text" class="notes-title-input note-edit-title"
             value="${escapeHtml(note.title)}" maxlength="100" placeholder="Cím"/>
      <div class="notes-textarea-wrap">
        <textarea class="notes-textarea note-edit-text"
                  maxlength="500" rows="4"
                  oninput="updateEditCounter(this)">${escapeHtml(note.text)}</textarea>
        <span class="notes-char-counter note-edit-counter">${note.text.length} / 500</span>
      </div>
      <div class="note-edit-btns">
        <button class="btn-note-save" onclick="saveNoteEdit('${id}')">💾 Mentés</button>
        <button class="btn-note-cancel" onclick="renderNotes()">✕ Mégse</button>
      </div>
    </div>
  `;
}

function saveNoteEdit(id) {
  const card     = document.querySelector(`.note-card[data-note-id="${id}"]`);
  const titleEl  = card?.querySelector(".note-edit-title");
  const textEl   = card?.querySelector(".note-edit-text");
  const title    = titleEl?.value.trim();
  if (!title) { titleEl?.classList.add("input-error"); return; }

  const note = state.notes.find(n => n.id === id);
  if (!note) return;
  note.title    = title;
  note.text     = textEl?.value.trim() || "";
  note.modified = true;
  saveState();
  renderNotes();
}

function updateEditCounter(textarea) {
  const counter = textarea.closest(".notes-textarea-wrap")
                          ?.querySelector(".note-edit-counter");
  if (counter) {
    counter.textContent = textarea.value.length + " / 500";
    counter.classList.toggle("notes-char-warn", textarea.value.length >= 450);
  }
}

function addNote() {
  const titleEl = document.getElementById("noteTitle");
  const textEl  = document.getElementById("noteText");
  const title   = titleEl.value.trim();
  const text    = textEl.value.trim();

  if (!title) { titleEl.focus(); titleEl.classList.add("input-error"); return; }
  titleEl.classList.remove("input-error");

  state.notes.push({
    id:        "note_" + Date.now(),
    title,
    text,
    createdAt: Date.now(),
  });
  saveState();

  titleEl.value = "";
  textEl.value  = "";
  document.getElementById("noteCounter").textContent = "0 / 500";
  renderNotes();
}

function deleteNote(id) {
  const note = state.notes.find(n => n.id === id);
  if (!confirm("Biztosan törölni szeretnéd?\n\n" + (note?.title || "ezt a jegyzetet"))) return;
  state.notes = state.notes.filter(n => n.id !== id);
  saveState();
  renderNotes();
}

function updateNoteCounter() {
  const len = document.getElementById("noteText").value.length;
  const el  = document.getElementById("noteCounter");
  if (el) {
    el.textContent = len + " / 500";
    el.classList.toggle("notes-char-warn", len >= 450);
  }
}

function escapeHtml(str) {
  return str.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}

// ── RESET ────────────────────────────────────────────────────

function resetGame() {
  if (!confirm("Biztosan törlöd az összes mentett adatot?\n\nEz visszavonhatatlan!")) return;
  Object.assign(state, {
    missions: [], curses: [], photos: {}, collectedTreasures: [],
    lastMissionId: null, lastCurseId: null,
    tokens: 0, character: null, impostorName: "", impostorChangePurchased: false,
    returnMode: false, lives: 3, favoritePhotos: {}, notes: [], sips: 0,
    tetprobas: 0, sejtesCount: 0, tudasszomjCount: 0,
    commissions: [], soldTreasuresTotal: 0, usedTreasuresTotal: 0,
    deactivatedCursesTotal: 0, wonTetprobaTotal: 0,
  });
  // Tétpróba UI visszaállítása
  tpPhase = null; tpBet = 0; tpQuestion = null;
  tpHintShown = false; tpEliminated = []; tpEliminationsUsed = 0; tpWon = null; tpOpen = false;
  localStorage.removeItem(SAVE_KEY);
  document.getElementById("resultCard").classList.add("hidden");
  const endSummary = document.getElementById("endSummary");
  if (endSummary) { endSummary.innerHTML = ""; endSummary.classList.add("hidden"); }
  const tri = document.getElementById("trueImpostorInput");
  if (tri) tri.value = "";
  kedvencFilter = false;
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

function formatNum(n) {
  return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
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
