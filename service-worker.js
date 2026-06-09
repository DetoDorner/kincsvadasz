// ============================================================
// service-worker.js – Kincsvadász PWA
// Ez a fájl gondoskodik arról, hogy az app offline is működjön.
// Az első megnyitáskor minden fájlt (HTML, CSS, JS, képek)
// elmenti a telefon tárhelyére. Utána internet nélkül is fut.
// ============================================================

// Cache neve – ha megváltoztatod, az összes régi cache törlődik
// és újra letöltődik minden. Akkor változtasd, ha frissíted az appot.
const CACHE_NAME = "kincsvadasz-v7";

// ── CACHE-ELENDŐ FÁJLOK LISTÁJA ─────────────────────────────
// Ide kerül MINDEN fájl amit az app használ.
// Ha új képet adsz hozzá, add hozzá ide is, majd növeld a
// CACHE_NAME verziószámát (pl. "kincsvadasz-v2").

const FILES_TO_CACHE = [
  "./index.html",
  "./style.css",
  "./script.js",
  "./data.js",
  "./manifest.json",

  // ── COMMON KÉPEK (25 db) ──
  "./images/photos/common/common_01.jpg",
  "./images/photos/common/common_02.jpg",
  "./images/photos/common/common_03.jpg",
  "./images/photos/common/common_04.jpg",
  "./images/photos/common/common_05.jpg",
  "./images/photos/common/common_06.jpg",
  "./images/photos/common/common_07.jpg",
  "./images/photos/common/common_08.jpg",
  "./images/photos/common/common_09.jpg",
  "./images/photos/common/common_10.jpg",
  "./images/photos/common/common_11.jpg",
  "./images/photos/common/common_12.jpg",
  "./images/photos/common/common_13.jpg",
  "./images/photos/common/common_14.jpg",
  "./images/photos/common/common_15.jpg",
  "./images/photos/common/common_16.jpg",
  "./images/photos/common/common_17.jpg",
  "./images/photos/common/common_18.jpg",
  "./images/photos/common/common_19.jpg",
  "./images/photos/common/common_20.jpg",
  "./images/photos/common/common_21.jpg",
  "./images/photos/common/common_22.jpg",
  "./images/photos/common/common_23.jpg",
  "./images/photos/common/common_24.jpg",
  "./images/photos/common/common_25.jpg",

  // ── RARE KÉPEK (10 db) ──
  "./images/photos/rare/rare_01.jpg",
  "./images/photos/rare/rare_02.jpg",
  "./images/photos/rare/rare_03.jpg",
  "./images/photos/rare/rare_04.jpg",
  "./images/photos/rare/rare_05.jpg",
  "./images/photos/rare/rare_06.jpg",
  "./images/photos/rare/rare_07.jpg",
  "./images/photos/rare/rare_08.jpg",
  "./images/photos/rare/rare_09.jpg",
  "./images/photos/rare/rare_10.jpg",

  // ── LEGENDARY KÉPEK (5 db) ──
  "./images/photos/legendary/legendary_01.jpg",
  "./images/photos/legendary/legendary_02.jpg",
  "./images/photos/legendary/legendary_03.jpg",
  "./images/photos/legendary/legendary_04.jpg",
  "./images/photos/legendary/legendary_05.jpg"
];

// ── INSTALL ESEMÉNY ──────────────────────────────────────────
// Az app első megnyitásakor fut le.
// Letölti és elmenti az összes fájlt a cache-be.

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("[SW] Fájlok cache-elése...");
      // A képeknél ha valamelyik nem létezik még, ne akadjon meg
      // Ezért képenként próbáljuk, a fő fájlok viszont kötelezőek
      const coreFiles = [
        "./index.html",
        "./style.css",
        "./script.js",
        "./data.js",
        "./manifest.json"
      ];
      const imageFiles = FILES_TO_CACHE.filter(f => f.includes("/images/"));

      // Kötelező fájlok cache-elése
      return cache.addAll(coreFiles).then(() => {
        // Képek cache-elése egyenként – ha egy nem létezik, nem akad el
        return Promise.allSettled(
          imageFiles.map(url =>
            cache.add(url).catch(() => {
              console.warn("[SW] Kép nem található, kihagyva:", url);
            })
          )
        );
      });
    }).then(() => {
      console.log("[SW] Cache kész!");
      // Azonnal aktiválódjon, ne várjon következő megnyitásra
      return self.skipWaiting();
    })
  );
});

// ── ACTIVATE ESEMÉNY ─────────────────────────────────────────
// Régi cache-ek törlése, ha a CACHE_NAME megváltozott.

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter(name => name !== CACHE_NAME)
          .map(name => {
            console.log("[SW] Régi cache törölve:", name);
            return caches.delete(name);
          })
      );
    }).then(() => {
      // Azonnal átveszi az irányítást az összes nyitott tab felett
      return self.clients.claim();
    })
  );
});

// ── FETCH ESEMÉNY ────────────────────────────────────────────
// Minden hálózati kérést elfog.
// Először a cache-ből próbál kiszolgálni (offline first),
// ha nincs cache-ben, akkor megy a hálózatra.

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Ha megvan a cache-ben, onnan szolgálja ki (offline is működik)
      if (cachedResponse) {
        return cachedResponse;
      }
      // Ha nincs cache-ben, megpróbál hálózatról letölteni
      return fetch(event.request).catch(() => {
        // Ha hálózat sincs, és nincs cache – nem tudunk mit csinálni
        console.warn("[SW] Nem elérhető:", event.request.url);
      });
    })
  );
});
