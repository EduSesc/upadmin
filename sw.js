const CACHE_NAME = 'up7-pwa-v1';
const urlsToCache = [
  '/',
  /*'/index.html',
  '/antigos.html',
  '/detalhes.html',
  '/eventos.html',
  '/seminovos.html',
  '/vendidos.html',
  '/videos.html',*/
  '/admin.html',
  '/crud.html',
  '/crudbanner.html',
  '/crudeventos.html',
  '/crudvideos.html',
  '/dashboard.html',
  '/assets/css/style.css',
  /*
  '/assets/css/antigos.css',
  '/assets/css/detalhes.css',
  '/assets/css/eventos.css',
  '/assets/css/seminovos.css',
  '/assets/css/vendidos.css',
  '/assets/css/videos.css',*/
  '/assets/css/admin.css',
  '/assets/css/banner.css',
  '/assets/css/crud.css',
  '/assets/css/crudeventos.css',
  '/assets/css/crudvideos.css',
  '/assets/css/dashboard.css',
  '/assets/css/pwa.css',
  '/assets/js/app.js',
  '/assets/js/admin.js',
  '/assets/js/crud.js',
  '/assets/js/crudeventos.js',
  '/assets/js/daschboard.js',
  /*
  '/assets/js/antigos.js',
  '/assets/js/detalhes.js',
  '/assets/js/eventos.js',
  '/assets/js/index.js',*/
  '/assets/js/script.js',/*
  '/assets/js/seminovo.js',
  '/assets/js/vendidos.js',
  '/assets/js/videos.js',
  '/assets/img/antigo.webp',
  '/assets/img/antigo2.jpg',
  '/assets/img/carsemi.webp',
  '/assets/img/classico.jpg',*/
  '/assets/img/logo3.svg',
  '/assets/img/favicon.ico/manifest.json',

];

// Instalação do Service Worker
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        console.log('Cache aberto');
        return cache.addAll(urlsToCache);
      })
  );
});

// Interceptar requisições
self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        // Retorna o cache se encontrado, senão faz a requisição
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});

// Receber push
self.addEventListener('push', function(event) {
  const data = event.data ? event.data.json() : {};
  
  const title = data.title || "Nova notificação";
  const options = {
    body: data.body || "Você tem uma nova mensagem.",
    icon: "/assets/img/logo3.svg",
    badge: "/assets/img/logo3.svg",
    data: data.url || "/"
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Clique na notificação
self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data)
  );
});
