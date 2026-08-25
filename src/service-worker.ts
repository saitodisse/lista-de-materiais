/// <reference lib="webworker" />

import { addRoute, cleanupOutdatedCaches, createHandlerBoundToURL, precache } from 'workbox-precaching'
import { NavigationRoute, registerRoute } from 'workbox-routing'

declare let self: ServiceWorkerGlobalScope

self.skipWaiting()
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})
cleanupOutdatedCaches()
precache(self.__WB_MANIFEST)

const offlineShell = createHandlerBoundToURL('/index.html')

// Com rede disponível, o servidor é a fonte do shell. Isso evita que um
// service worker já instalado entregue um index.html antigo ao Vite em modo
// de desenvolvimento. Sem rede, preservamos o F5 offline com o shell
// precacheado.
registerRoute(
  new NavigationRoute(async (options) => {
    try {
      const response = await fetch(options.request, { cache: 'no-store' })

      if (response.ok) {
        return response
      }
    } catch {
      // A ausência de rede usa o shell local logo abaixo.
    }

    return offlineShell(options)
  }),
)

// Os assets ainda são resolvidos pelo precache, depois da rota de navegação.
addRoute()
