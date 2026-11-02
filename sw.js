/* Service worker: اجازه‌ی نصب + باز شدن سایت بدون اینترنت.
   صفحه‌ی اصلی اول از اینترنت گرفته می‌شود (تا تغییرات جدید زود دیده شود) و اگر نبود از حافظه. */
const V = "arga-v11";
const SHELL = ["./", "index.html", "manifest.webmanifest", "images/logo-96.png", "images/logo-192.png", "images/favicon.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(V).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;           // فونت، عکس‌های بیرونی و شمارنده دست‌نخورده
  const isPage = req.mode === "navigate" || url.pathname.endsWith("/") || url.pathname.endsWith(".html");
  if (isPage) {
    e.respondWith(fetch(req).then(r => { const c = r.clone(); caches.open(V).then(x => x.put(req, c)); return r; })
      .catch(() => caches.match(req).then(r => r || caches.match("index.html"))));
  } else {
    e.respondWith(caches.match(req).then(hit => {
      const net = fetch(req).then(r => { if (r.ok) { const c = r.clone(); caches.open(V).then(x => x.put(req, c)); } return r; }).catch(() => hit);
      return hit || net;
    }));
  }
});
