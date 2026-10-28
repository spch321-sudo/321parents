const VERSION='spf321-v1.1.2';
const CORE=['./','./index.html','./manifest.json','./icon-192.png','./icon-512.png','./apple-touch-icon.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(VERSION).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==VERSION).map(x=>caches.delete(x)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{const u=e.request.url;if(e.request.method!=='GET')return;
 if(/workers\.dev/.test(u))return;
 e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request).then(res=>{if(res.ok&&(u.startsWith(self.location.origin)||/fonts\.(googleapis|gstatic)/.test(u))){const c=res.clone();caches.open(VERSION).then(x=>x.put(e.request,c))}return res}).catch(()=>caches.match('./index.html'))))});
