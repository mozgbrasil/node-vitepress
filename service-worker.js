// Este é o service-worker.js que inclui os recursos, como cache de dados dinâmicos, notificações push com multimídia, sincronização em segundo plano e funcionalidade offline.

const CACHE_NAME = 'pwa-cache-v2';
const urlsToCache = [
  '/',
  '/index.html',
  '/icon.png',
  '/vp-icons.css', // Se você tiver um arquivo de estilo
];

// Instalando o Service Worker e armazenando arquivos no cache
self.addEventListener('install', (event) => {
  console.log('Service Worker instalado');

  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        // console.log('Arquivos em cache')
        return cache.addAll(urlsToCache);
      })
      .catch((error) => {
        console.error('Erro ao adicionar itens ao cache:', error);
      })
  );
});

// Ativando o Service Worker e limpando caches antigos
self.addEventListener('activate', (event) => {
  console.log('Service Worker ativado');

  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (!cacheWhitelist.includes(cacheName)) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Fetch: Tentativa de resposta do cache, senão busca na rede
self.addEventListener('fetch', (event) => {
  return;
  // eslint-disable-next-line no-unreachable
  console.log('Interceptando requisições', event);

  const requestUrl = new URL(event.request.url);

  // Ignorar solicitações com esquemas não suportados
  if (requestUrl.protocol !== 'http:' && requestUrl.protocol !== 'https:') {
    console.warn(`Esquema não suportado ignorado: ${requestUrl.protocol}`);
    return; // Sai da execução se o esquema for inválido
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request)
        .then((response) => {
          // Verificar se a resposta é válida antes de armazená-la no cache
          if (!response || response.status !== 200 || response.type !== 'basic') {
            console.warn(
              `Resposta inválida ignorada: ${event.request.url} (status: ${response.status}, type: ${response.type})`
            );
            return response;
          }

          // Armazenar a resposta válida no cache
          return caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, response.clone());
            return response;
          });
        })
        .catch((error) => {
          console.error(`Erro ao buscar recurso na rede: ${event.request.url}`, error);
          throw error;
        });
    })
  );
});

// Escutar as notificações push
self.addEventListener('push', (event) => {
  if (Notification.permission === 'granted') {
    const options = event.data ? JSON.parse(event.data.text()) : {};
    const notificationTitle = options.title || 'Você tem uma nova mensagem!';
    const notificationOptions = {
      body: options.body || 'Mensagem recebida.',
      icon: options.icon || '/icon.png',
      image: options.image || '/image.jpg',
      badge: options.badge || '/og.jpg',
      actions: [
        {
          action: 'open',
          title: 'Abrir',
          icon: '/icon.png',
        },
      ],
    };

    event.waitUntil(self.registration.showNotification(notificationTitle, notificationOptions));
  } else {
    console.warn('Permissão para notificações não concedida.');
  }
});

// Sincronização em segundo plano (background sync)
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(
      // Substitua pelo código de sincronização de dados em segundo plano
      fetch('/api/sync').then((response) => {
        if (response.ok) {
          // console.log('Sincronizado com sucesso em segundo plano')
        }
      })
    );
  }
});

// Mensagens do cliente (Web Component)
self.addEventListener('message', (event) => {
  if (event.data === 'simulateOffline') {
    // console.log('Modo offline ativado via Service Worker')
    // Simulação de comportamento offline, cache as respostas
    event.waitUntil(
      caches.open(CACHE_NAME).then((cache) => {
        cache.match(event.request).then((response) => {
          // console.log('Respondendo com dados em cache:', response)
          return response || fetch(event.request);
        });
      })
    );
  }

  if (event.data.type === 'pushNotification') {
    const { title, data } = event.data;
    self.registration.showNotification(title, data);
  }

  if (event.data.type === 'connectivityNotification') {
    const { title, data } = event.data;
    self.registration.showNotification(title, data);
  }

  if (event.data === 'simulateOffline') {
    self.addEventListener('fetch', (event) => {
      event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
          return cachedResponse || new Response('Modo offline ativado.');
        })
      );
    });
  }
});

// Lidar com cliques em notificações
self.addEventListener('notificationclick', (event) => {
  const action = event.action; // Ação realizada pelo usuário (se houver)
  event.notification.close(); // Fecha a notificação

  // Realizar ações baseadas no botão clicado
  if (action === 'accept') {
    clients.openWindow('/accept'); // Abrir página para "Aceitar"
  } else if (action === 'decline') {
    clients.openWindow('/decline'); // Abrir página para "Recusar"
  } else {
    // Ação padrão ou clique na própria notificação
    clients.openWindow('/');
  }
});
