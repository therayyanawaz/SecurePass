const CACHE_VERSION = "securepass-v1"
const PRECACHE_NAME = `${CACHE_VERSION}-precache`
const RUNTIME_CACHE_NAME = `${CACHE_VERSION}-runtime`
const PRECACHE_URLS = [
  "/",
  "/offline.html",
  "/manifest.webmanifest",
  "/icon-192.png",
  "/icon-512.png",
  "/icon-512-maskable.png",
  "/apple-touch-icon.png",
]

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(PRECACHE_NAME)
      await cache.addAll(PRECACHE_URLS)
      await self.skipWaiting()
    })(),
  )
})

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const cacheNames = await caches.keys()
      await Promise.all(
        cacheNames
          .filter((cacheName) => cacheName.startsWith("securepass-") && ![PRECACHE_NAME, RUNTIME_CACHE_NAME].includes(cacheName))
          .map((cacheName) => caches.delete(cacheName)),
      )

      await self.clients.claim()
    })(),
  )
})

self.addEventListener("fetch", (event) => {
  const { request } = event

  if (request.method !== "GET") {
    return
  }

  const url = new URL(request.url)
  if (url.origin !== self.location.origin) {
    return
  }

  if (request.mode === "navigate") {
    event.respondWith(handleNavigationRequest(request))
    return
  }

  if (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/_next/image") ||
    /\.(?:css|js|png|svg|ico|jpg|jpeg|webp|gif|woff2?)$/i.test(url.pathname)
  ) {
    event.respondWith(handleStaticAssetRequest(request))
  }
})

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting()
  }
})

async function handleNavigationRequest(request) {
  const runtimeCache = await caches.open(RUNTIME_CACHE_NAME)

  try {
    const response = await fetch(request)

    if (response.ok) {
      await runtimeCache.put(request, response.clone())
    }

    return response
  } catch (error) {
    return (await runtimeCache.match(request)) || (await caches.match(request)) || (await caches.match("/offline.html"))
  }
}

async function handleStaticAssetRequest(request) {
  const runtimeCache = await caches.open(RUNTIME_CACHE_NAME)
  const cachedResponse = await runtimeCache.match(request)

  const networkResponsePromise = fetch(request)
    .then(async (response) => {
      if (response.ok) {
        await runtimeCache.put(request, response.clone())
      }

      return response
    })
    .catch(() => undefined)

  if (cachedResponse) {
    return cachedResponse
  }

  const networkResponse = await networkResponsePromise
  if (networkResponse) {
    return networkResponse
  }

  return (await caches.match(request)) || Response.error()
}
