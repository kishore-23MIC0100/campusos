const offlinePage = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="#0d1421">
  <title>You're offline | Scholaxys</title>
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; min-height: 100vh; display: grid; place-items: center;
      padding: 24px; background: #0d1421; color: #edf3fb;
      font: 1rem/1.6 system-ui, sans-serif; }
    main { max-width: 28rem; padding: 28px; background: #151f2e;
      border: 1px solid #2a374a; border-radius: 14px; }
    h1 { margin: 8px 0; line-height: 1.2; }
    p { color: #a6b5c9; }
    strong { color: #c2f970; }
    a { display: inline-block; padding: 8px 16px; border-radius: 8px;
      background: #c2f970; color: #15220c; font-weight: 600; }
    a:focus-visible { outline: 2px solid #edf3fb; outline-offset: 4px; }
  </style>
</head>
<body>
  <main>
    <strong>Scholaxys</strong>
    <h1>You're offline</h1>
    <p>Reconnect to the internet to open your school workspace.</p>
    <a href="">Try again</a>
  </main>
</body>
</html>`

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET' || request.mode !== 'navigate') return

  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return
  if (url.pathname === '/api' || url.pathname.startsWith('/api/')) return

  // Keep all requests on the network. Only a failed page navigation gets a fallback.
  event.respondWith(fetch(request).catch(() => new Response(offlinePage, {
    status: 503,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  })))
})
