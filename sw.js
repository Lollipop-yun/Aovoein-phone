// PWA 所需的空白 Service Worker
self.addEventListener('install', (event) => {
    // 强制立即接管控制权
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
    // 对所有请求直接放行网络请求，不做复杂的离线缓存以免影响你的更新
    event.respondWith(fetch(event.request));
});
