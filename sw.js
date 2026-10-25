/* 八股闪背 Service Worker：缓存优先，支持完全离线使用。
   改版后想强制更新缓存，把 CACHE 常量的版本号 +1 即可。 */
const CACHE = 'shanbei-v21';
const ASSETS = ['./', './index.html', './manifest.webmanifest', './icon.svg'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.open(CACHE).then(c =>
      c.match(e.request).then(hit =>
        hit ||
        fetch(e.request).then(resp => {
          if (resp.ok) c.put(e.request, resp.clone());
          return resp;
        }).catch(() => c.match('./index.html'))
      )
    )
  );
});
