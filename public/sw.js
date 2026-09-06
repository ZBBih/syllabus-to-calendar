const CACHE = 'syllabify-v2'
const SHELL = ['/', '/icon.svg', '/manifest.webmanifest']

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()))
})

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (e) => {
  const req = e.request
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return
  // The recognition model is large and immutable, so it is worth keeping once a photo has been read.
  const isStatic = req.url.includes('/_next/static/') || req.url.includes('/tesseract/')
  e.respondWith(
    caches.match(req).then((hit) => {
      const network = fetch(req)
        .then((res) => {
          if (res.ok && (isStatic || req.mode === 'navigate' || SHELL.includes(new URL(req.url).pathname))) {
            const copy = res.clone()
            caches.open(CACHE).then((c) => c.put(req, copy))
          }
          return res
        })
        .catch(() => hit)
      return isStatic && hit ? hit : network.then((res) => res ?? hit)
    }),
  )
})
