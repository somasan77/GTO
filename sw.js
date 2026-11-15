const CACHE_NAME = 'gto-trainer-v2';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon.png'
];

// 初回インストール時に基本ファイルを端末へキャッシュ
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

// 古いバージョンのキャッシュを削除して新しいService Workerを有効化
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// オンライン時は常に最新版を取得してキャッシュを上書き、オフライン時はキャッシュから表示
self.addEventListener('fetch', (event) => {
  // GETリクエスト以外はそのまま通信
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // 正常に取得できたら最新のレスポンスをキャッシュに保存（自動更新）
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        // オフライン（通信失敗）時は端末内のキャッシュから読み出す
        return caches.match(event.request);
      })
  );
});
