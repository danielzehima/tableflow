// ================================================================
// Service Worker TableFlow PWA — v3
// Stratégie : network-first pour la navigation + RSC,
//             cache-first pour les assets statiques.
// ================================================================

const CACHE = "tableflow-v4";
const OFFLINE_URL = "/offline";

// Ressources critiques pré-mises en cache à l'installation
const PRECACHE = [
  "/",
  "/offline",
  "/login",
  "/dashboard",        // start_url du manifest
  "/icon-192.png",
  "/icon-512.png",
  "/apple-touch-icon.png",
  "/logo.png",
];

// ── Installation : precache robuste (chaque URL indépendamment) ──────────────
// IMPORTANT : on n'utilise PAS cache.addAll() qui est atomique
// (une seule URL en échec ferait échouer tout le precache).
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) =>
      Promise.allSettled(
        PRECACHE.map((url) =>
          fetch(url, { cache: "no-cache" })
            .then((res) => {
              if (res && res.ok) return cache.put(url, res);
            })
            .catch(() => {
              /* URL individuelle en échec — on ignore, les autres continuent */
            })
        )
      )
    )
  );
  self.skipWaiting();
});

// ── Activation : purge des anciens caches ────────────────────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

// ── Utilitaire : une réponse est-elle cachable ? ─────────────────────────────
function isCacheable(res) {
  return (
    res &&
    res.status === 200 &&
    (res.type === "basic" || res.type === "default")
  );
}

// ── Stratégie network-first avec fallback cache (ignoreSearch) ───────────────
async function networkFirst(req, { fallbackOffline = false } = {}) {
  const cache = await caches.open(CACHE);
  try {
    const res = await fetch(req);
    if (isCacheable(res)) {
      // On clone AVANT de retourner la réponse
      cache.put(req, res.clone()).catch(() => {});
    }
    return res;
  } catch {
    // Hors-ligne : chercher en cache (en ignorant les query params type ?_rsc)
    const cached =
      (await cache.match(req)) ||
      (await cache.match(req, { ignoreSearch: true }));
    if (cached) return cached;

    if (fallbackOffline) {
      const offline = await cache.match(OFFLINE_URL);
      if (offline) return offline;
    }
    // Dernier recours : réponse vide propre (évite un crash)
    return new Response("", { status: 504, statusText: "Hors ligne" });
  }
}

// ── Stratégie cache-first pour les assets immuables ──────────────────────────
async function cacheFirst(req) {
  const cache = await caches.open(CACHE);
  const cached = await cache.match(req);
  if (cached) return cached;
  try {
    const res = await fetch(req);
    if (isCacheable(res)) cache.put(req, res.clone()).catch(() => {});
    return res;
  } catch {
    return new Response("", { status: 504, statusText: "Hors ligne" });
  }
}

// ── Interception des requêtes ────────────────────────────────────────────────
self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // Ne jamais intercepter les API, les flux temps réel ni l'auth — toujours réseau
  if (
    url.pathname.startsWith("/api/") ||
    url.pathname.includes("/stream") ||
    url.pathname.includes("/realtime")
  ) {
    return;
  }

  // 1. Navigation HTML (chargement complet de page) → network-first + offline
  if (req.mode === "navigate") {
    event.respondWith(networkFirst(req, { fallbackOffline: true }));
    return;
  }

  // 2. Requêtes RSC (navigation côté client Next.js : ?_rsc / header RSC)
  //    → network-first SANS page offline (c'est du JSON, pas du HTML)
  const isRSC =
    url.searchParams.has("_rsc") ||
    req.headers.get("RSC") === "1" ||
    req.headers.get("Next-Router-Prefetch") === "1";
  if (isRSC) {
    event.respondWith(networkFirst(req));
    return;
  }

  // 3. Assets statiques (build Next.js + médias) → cache-first
  if (
    url.pathname.startsWith("/_next/static/") ||
    /\.(png|jpg|jpeg|svg|webp|gif|ico|woff2?|ttf|css|js)$/i.test(url.pathname)
  ) {
    event.respondWith(cacheFirst(req));
    return;
  }

  // 4. Le reste (manifest, etc.) → network-first léger
  event.respondWith(networkFirst(req));
});

// ── Message : permet au client de forcer l'activation immédiate ──────────────
self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") self.skipWaiting();
});

// ── Notifications push ───────────────────────────────────────────────────────
self.addEventListener("push", (event) => {
  if (!event.data) return;
  let data = {};
  try {
    data = event.data.json();
  } catch {
    data = { title: "TableFlow", body: event.data.text() };
  }
  const options = {
    body: data.body || "",
    icon: data.icon || "/icon-192.png",
    badge: "/icon-192.png",
    vibrate: [120, 60, 120],
    data: { url: data.url || "/dashboard" },
  };
  event.waitUntil(
    self.registration.showNotification(data.title || "TableFlow", options)
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target =
    (event.notification.data && event.notification.data.url) || "/dashboard";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      // Réutiliser un onglet existant si possible
      for (const client of list) {
        if (client.url.includes(target) && "focus" in client) return client.focus();
      }
      return self.clients.openWindow(target);
    })
  );
});
