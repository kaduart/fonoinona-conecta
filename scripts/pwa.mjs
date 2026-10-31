// Pós-build da versão web: transforma o export do Expo (dist/) em PWA.
// Idempotente: pode rodar várias vezes sobre o mesmo dist/.
// 1) injeta manifest, ícones e registro do service worker no index.html
// 2) gera dist/sw.js com a lista de todos os arquivos (app abre sem internet)
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const DIST = process.argv[2] ?? 'dist';
const MARCA = '<!-- pwa -->';
const IGNORAR = new Set(['sw.js', '_headers', '_redirects']);

function listar(dir) {
  return readdirSync(dir).flatMap((nome) => {
    const p = join(dir, nome);
    return statSync(p).isDirectory() ? listar(p) : [p];
  });
}

const indexPath = join(DIST, 'index.html');
let html = readFileSync(indexPath, 'utf8');
if (!html.includes(MARCA)) {
  const head = `${MARCA}
<link rel="manifest" href="/manifest.webmanifest">
<meta name="theme-color" content="#1F7A6B">
<link rel="apple-touch-icon" href="/icons/apple-touch-icon.png">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="Conecta">
<meta name="apple-mobile-web-app-status-bar-style" content="default">`;
  const corpo = `<script>if('serviceWorker' in navigator){addEventListener('load',function(){navigator.serviceWorker.register('/sw.js').catch(function(e){console.warn('sw',e)})})}</script>`;
  html = html.replace('<html lang="en">', '<html lang="pt-BR">').replace('</head>', `${head}\n</head>`).replace('</body>', `${corpo}\n</body>`);
  writeFileSync(indexPath, html);
}

const arquivos = listar(DIST)
  .map((p) => relative(DIST, p).split(sep).join('/'))
  .filter((r) => !IGNORAR.has(r))
  .sort();
const hash = createHash('sha256');
for (const r of arquivos) hash.update(r).update(readFileSync(join(DIST, r)));
const versao = hash.digest('hex').slice(0, 12);
const urls = arquivos.map((r) => (r === 'index.html' ? '/' : `/${r}`));

const sw = `// Gerado por scripts/pwa.mjs, não editar.
const VERSAO = 'conecta-${versao}';
const ARQUIVOS = ${JSON.stringify(urls)};

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSAO).then((c) => c.addAll(ARQUIVOS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== VERSAO).map((k) => caches.delete(k)))).then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return; // API e WhatsApp passam direto
  if (req.headers.has('range')) return; // vídeo no Safari pede por partes: deixa com o navegador
  if (req.mode === 'navigate') {
    // rota do app: tenta a rede, sem internet usa o index salvo
    e.respondWith(fetch(req).catch(() => caches.match('/')));
    return;
  }
  e.respondWith(
    caches.match(req, { ignoreSearch: true }).then((hit) => {
      if (hit) return hit;
      return fetch(req).then((res) => {
        if (res.ok) {
          const copia = res.clone();
          caches.open(VERSAO).then((c) => c.put(req, copia));
        }
        return res;
      });
    }),
  );
});
`;
writeFileSync(join(DIST, 'sw.js'), sw);

const total = arquivos.reduce((s, r) => s + statSync(join(DIST, r)).size, 0);
console.log(`[pwa] ${arquivos.length} arquivos no cache (${(total / 1048576).toFixed(1)} MB), versão ${versao}`);
