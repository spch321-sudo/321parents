/* 屬靈父母手冊 Service Worker —— 自動更新版（照 321app 技能第 14 節；只清自己前綴的快取） */
var PFX = 'spf321-';
var V = PFX + 'v2.4.2611022325-xz1103-au1103-xzm1103-rf1105-cs1109-lg1111';
var VER = 'v2.4.2611022325-xz1103-au1103-xzm1103-rf1105-cs1109-lg1111';
var SHELL = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png', './apple-touch-icon.png', './content.zh.json', './content.zs.json', './content.en.json', './lang-zs.json', './lang-en.json', './media.js', './cpar.js', './play.js', './card.js', './course.js', './icon-96.png', "./xz2.js", './xzm.js'];
self.addEventListener('install', function (e) {
  self.skipWaiting();
  e.waitUntil(caches.open(V).then(function (c) {
    return Promise.all(SHELL.map(function (u) { return fetch(new Request(u, { cache: 'reload' })).then(function (r) { if (r && r.ok) return c.put(u, r); })['catch'](function () { }); }));
  }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (ks) {
    return Promise.all(ks.filter(function (k) { return k.indexOf(PFX) === 0 && k !== V; }).map(function (k) { return caches['delete'](k); }));
  }).then(function () { return self.clients.claim(); }).then(function () {
    return self.clients.matchAll({ type: 'window', includeUncontrolled: true });
  }).then(function (cs) {
    cs.forEach(function (c) {
      try { if (c.url.indexOf(self.registration.scope) === 0) c.postMessage({ t: 'sw-updated', v: VER }); } catch (x) { }
      if (c.visibilityState === 'hidden' && c.navigate) { try { c.navigate(c.url); } catch (x) { } }
    });
  }));
});
self.addEventListener('message', function (e) { if (e.data === 'skip') self.skipWaiting(); });
/* 網路優先，但慢網路不讓人乾等：網路請求與 SHELL_WAIT 毫秒計時賽跑，超過就先用快取開（網路那份繼續下載並更新快取）。
   只有導覽請求才可以退回 index.html（程式檔退回 HTML 會變成 SyntaxError） */
var SHELL_WAIT = 1000;
function shellFetch(e, r, u, p, key, nav) {
  var netP = fetch(nav ? u.origin + p + u.search : r.url, { cache: 'no-cache', credentials: 'same-origin' }).then(function (resp) {
    if (resp && resp.ok) { var cp = resp.clone(); caches.open(V).then(function (c) { c.put(key, cp); }); }
    return resp;
  });
  e.waitUntil(netP['catch'](function () { }));
  var fromCache = function () {
    return caches.match(key, { ignoreSearch: true }).then(function (h) {
      return h || (nav ? caches.match('./index.html') : caches.match(r, { ignoreSearch: true }));
    });
  };
  return new Promise(function (resolve) {
    var settled = false;
    var timer = setTimeout(function () { fromCache().then(function (h) { if (h && !settled) { settled = true; resolve(h); } }); }, SHELL_WAIT);
    netP.then(function (resp) { clearTimeout(timer); if (!settled) { settled = true; resolve(resp); } }, function () {
      clearTimeout(timer); if (!settled) fromCache().then(function (h) { settled = true; resolve(h || Response.error()); });
    });
  });
}
self.addEventListener('fetch', function (e) {
  var r = e.request; if (r.method !== 'GET') return;
  var u = new URL(r.url); if (u.origin !== self.location.origin) return;
  var p = u.pathname;
  if (/\.(mp3|m4a|aac|wav|ogg|opus|mp4|mov|webm)$/i.test(p) || r.headers.get('range')) return;
  if (/version\.json$/.test(p)) { e.respondWith(fetch(p + '?t=' + Date.now(), { cache: 'no-store' })['catch'](function () { return new Response('{}', { headers: { 'Content-Type': 'application/json' } }); })); return; }
  var nav = r.mode === 'navigate' || /\.html$/.test(p) || /\/$/.test(p);
  var key = nav ? './index.html' : (/\.(json|js)$/.test(p) ? u.origin + p : r);
  if (nav || /\.(json|js|css)$/.test(p)) { e.respondWith(shellFetch(e, r, u, p, key, nav)); return; }
  e.respondWith(caches.match(r, { ignoreSearch: true }).then(function (h) {
    return h || fetch(r).then(function (resp) { if (resp && resp.ok) { var cp = resp.clone(); caches.open(V).then(function (c) { c.put(r, cp); }); } return resp; });
  }));
});
