// Service Worker for caching critical resources
const CACHE_NAME = 'dive-cache-v1'
const CRITICAL_RESOURCES = [
  '/',
  '/index.html',
  '/assets/index-DMTyPHfp.css',
  '/assets/Pretendard-Regular-BhrLQoBv.woff2'
]

// Install event - cache critical resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching critical resources')
        return cache.addAll(CRITICAL_RESOURCES)
      })
      .catch((error) => {
        console.error('Service Worker: Failed to cache resources', error)
      })
  )
  self.skipWaiting()
})

// Fetch event - serve from cache when possible
self.addEventListener('fetch', (event) => {
  // Only cache GET requests
  if (event.request.method !== 'GET') return

  // For critical resources, try cache first
  if (CRITICAL_RESOURCES.some(resource => event.request.url.includes(resource))) {
    event.respondWith(
      caches.match(event.request)
        .then((response) => {
          if (response) {
            return response
          }
          return fetch(event.request)
        })
    )
  }
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Deleting old cache', cacheName)
            return caches.delete(cacheName)
          }
        })
      )
    })
  )
  self.clients.claim()
})
