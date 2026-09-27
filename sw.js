// KidsOS service worker: offline support.
// This file is a template. build.mjs fills in the values marked __LIKE_THIS__.
//
// App files: downloaded at install, one cache per release, served from the cache.
// Large media: cached on first use, kept across releases until the file changes.
const APP_CACHE = 'kidsOS-app-__VERSION__-__HASH__';
const MEDIA_CACHE = 'kidsOS-media';
const PRECACHE = __PRECACHE__; // ['index.html', 'js/os.js', ...]
const MEDIA = __MEDIA__;       // { 'media/corgi.glb': '<content hash>' }

const SCOPE = self.registration.scope;
const abs = path => new URL(path, SCOPE).href;
const mediaKey = path => abs(path) + '?rev=' + MEDIA[path];

self.addEventListener('install', e => {
  // All or nothing: one failed download fails the install, and the old release stays active
  e.waitUntil(caches.open(APP_CACHE).then(cache => Promise.all(PRECACHE.map(async path => {
    const res = await fetch(abs(path), { cache: 'reload' });
    if (!res.ok) throw new Error(`precache ${path}: HTTP ${res.status}`);
    await cache.put(abs(path), res);
  }))));
});

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    // Other sites can share this origin: remove KidsOS caches only
    const stale = (await caches.keys()).filter(k => k.startsWith('kidsOS-') && k !== APP_CACHE && k !== MEDIA_CACHE);
    await Promise.all(stale.map(k => caches.delete(k)));

    const media = await caches.open(MEDIA_CACHE);
    const current = new Set(Object.keys(MEDIA).map(mediaKey));
    await Promise.all((await media.keys()).filter(req => !current.has(req.url)).map(req => media.delete(req)));

    await self.clients.claim();
  })());
});

// The app sends this when the user accepts an update
self.addEventListener('message', e => {
  if (e.data && e.data.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || !url.href.startsWith(SCOPE)) return;
  const path = url.pathname.slice(new URL(SCOPE).pathname.length) || 'index.html';
  if (path === 'version.json' && url.search) return; // update check: must reach the network
  e.respondWith(respond(e.request, path));
});

async function respond(request, path) {
  const range = request.headers.get('range');
  const cached = path in MEDIA
    ? await mediaResponse(path, range)
    : await (await caches.open(APP_CACHE)).match(abs(path));
  if (!cached) return fetch(request);
  return range ? slice(cached, range) : cached;
}

async function mediaResponse(path, range) {
  const cache = await caches.open(MEDIA_CACHE);
  const hit = await cache.match(mediaKey(path));
  if (hit || range) return hit; // a partial download cannot go into the cache: use the network
  const res = await fetch(abs(path));
  if (res.ok) cache.put(mediaKey(path), res.clone()).catch(() => {}); // storage full: still play from network
  return res;
}

// Audio and video elements ask for byte ranges. Safari plays only from a 206 answer.
async function slice(res, range) {
  const m = /^bytes=(\d*)-(\d*)$/.exec(range);
  if (!m || (m[1] === '' && m[2] === '')) return res;
  const data = await res.arrayBuffer();
  const size = data.byteLength;
  const start = m[1] === '' ? Math.max(0, size - Number(m[2])) : Number(m[1]);
  const end = m[1] === '' || m[2] === '' ? size - 1 : Math.min(Number(m[2]), size - 1);
  if (start > end) {
    return new Response(null, { status: 416, headers: { 'Content-Range': `bytes */${size}` } });
  }
  return new Response(data.slice(start, end + 1), {
    status: 206,
    statusText: 'Partial Content',
    headers: {
      'Content-Type': res.headers.get('Content-Type') || 'application/octet-stream',
      'Content-Range': `bytes ${start}-${end}/${size}`,
      'Content-Length': String(end - start + 1),
      'Accept-Ranges': 'bytes',
    },
  });
}
