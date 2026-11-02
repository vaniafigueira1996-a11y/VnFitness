/**
 * VnFitness — Service Worker PWA
 * Suporte completo para instalação em Celular, Tablet e Computador
 */

const CACHE_NAME = 'vnfitness-pwa-v1.0.1';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/app',
  '/app.html',
  '/admin',
  '/admin.html',
  '/css/base.css',
  '/css/auth.css',
  '/css/app.css',
  '/css/admin.css',
  '/js/api.js',
  '/js/auth.js',
  '/js/app.js',
  '/js/admin.js',
  '/js/pwa-install.js',
  '/manifest.json',
  '/favicon.svg',
  '/img/favicon.svg',
  '/img/icon-192.png',
  '/img/icon-512.png',
  '/img/icon-maskable-512.png',
  '/img/apple-touch-icon.png'
];

// 1. Instalação do Service Worker e pré-carregamento do cache
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('⚡ [PWA] Pré-carregando assets estáticos para funcionamento offline...');
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('⚠️ [PWA] Alguns arquivos falharam no pré-cache (continuando):', err);
      });
    })
  );
  self.skipWaiting();
});

// 2. Ativação e limpeza de caches antigos
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('🧹 [PWA] Removendo cache obsoleto:', key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// 3. Interceptação de requisições:
// - /api/* -> Network-First (sempre dados mais recentes do Supabase)
// - Estáticos -> Stale-While-Revalidate (carregamento instantâneo)
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignora chamadas com métodos não-GET (POST, PUT, DELETE, PATCH)
  if (request.method !== 'GET') {
    return;
  }

  // Rotas da API: Network First com fallback de erro suave
  if (url.pathname.startsWith('/api')) {
    event.respondWith(
      fetch(request).catch(() => {
        return new Response(
          JSON.stringify({
            offline: true,
            message: 'Você está navegando sem conexão com a internet. Os dados serão sincronizados ao reconectar.'
          }),
          {
            status: 503,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      })
    );
    return;
  }

  // Assets estáticos e páginas: Stale-While-Revalidate
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const fetchPromise = fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => cachedResponse);

      return cachedResponse || fetchPromise;
    })
  );
});

