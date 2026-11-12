/* Service worker: اجازه‌ی نصب + باز شدن سایت بدون اینترنت.
   صفحه‌ی اصلی اول از اینترنت گرفته می‌شود (تا تغییرات جدید زود دیده شود) و اگر نبود از حافظه. */
const V = "arga-v102";
const SHELL = ["./", "manifest.webmanifest", "images/logo-96.png", "images/lock.jpg", "images/logo-192.png", "images/favicon.png", "fonts/Vazirmatn-VF.woff2", "fonts/MetalMania-digits.ttf"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(V).then(c => Promise.all(SHELL.map(u => c.add(u).catch(() => {})))).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;
  const isPage = req.mode === "navigate" || url.pathname.endsWith("/") || url.pathname.endsWith(".html");
  if (isPage) {
    // اول از اینترنت، ولی اگر بیش از ۲ ثانیه طول کشید همان نسخه‌ی ذخیره‌شده نشان داده می‌شود (اینترنت ضعیف سایت را معطل نکند).
    const net = fetch(req).then(r => { const c = r.clone(); caches.open(V).then(x => x.put(req, c)); return r; });
    const cached = () => caches.match(req).then(r => r || caches.match("./"));
    e.respondWith(new Promise(res => {
      let done = false;
      const t = setTimeout(() => cached().then(r => { if (r && !done) { done = true; res(r) } }), 2000);
      net.then(r => { if (!done) { done = true; clearTimeout(t); res(r) } })
         .catch(() => { clearTimeout(t); if (!done) { done = true; cached().then(res) } });
    }));
  } else {
    e.respondWith(caches.match(req).then(hit => {
      const net = fetch(req).then(r => { if (r.ok) { const c = r.clone(); caches.open(V).then(x => x.put(req, c)); } return r; }).catch(() => hit);
      return hit || net;
    }));
  }
});
