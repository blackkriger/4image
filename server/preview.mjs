import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';

const PORT = Number(process.env.PORT ?? 3104);
const HTML_PATH = process.env.HTML_PATH ?? '/var/www/4image/index.html';
const SITE = 'https://4image.org';
const API = 'https://a.4cdn.org';
const TIMEOUT_MS = 1500;
const API_GAP_MS = 1000;
const BOARDS_TTL_MS = 24 * 60 * 60 * 1000;
const THREAD_TTL_MS = 60 * 1000;
const CACHE_LIMIT = 500;
const FULL_IMAGE_MAX = 5 * 1024 * 1024;
const TITLE_MAX = 90;
const ROUTE = /^\/([a-z0-9]+)(\/archive)?(?:\/(\d+))?\/?$/;

let page = { mtime: 0, html: '' };

async function template() {
  const { mtimeMs } = await stat(HTML_PATH);
  if (mtimeMs !== page.mtime) page = { mtime: mtimeMs, html: await readFile(HTML_PATH, 'utf8') };
  return page.html;
}

const cache = new Map();
let nextSlot = 0;

async function slot() {
  const now = Date.now();
  const wait = Math.max(0, nextSlot - now);
  nextSlot = Math.max(nextSlot, now) + API_GAP_MS;
  if (wait) await new Promise((r) => setTimeout(r, wait));
}

function cached(path, ttl) {
  const hit = cache.get(path);
  if (hit && Date.now() - hit.at < ttl) return hit.data;
  const data = slot()
    .then(() => fetch(API + path, { signal: AbortSignal.timeout(TIMEOUT_MS * 4) }))
    .then((res) => (res.status === 404 ? null : res.ok ? res.json() : Promise.reject(new Error(`HTTP ${res.status}`))));
  data.catch(() => cache.delete(path));
  cache.set(path, { at: Date.now(), data });
  if (cache.size > CACHE_LIMIT) cache.delete(cache.keys().next().value);
  return data;
}

async function boardOf(b) {
  const json = await cached('/boards.json', BOARDS_TTL_MS);
  return json?.boards.find((x) => x.board === b) ?? null;
}

function plainText(html) {
  return html
    .replace(/<br\s*\/?>/g, ' ')
    .replace(/<[^>]*>/g, '')
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

function clip(text) {
  return text.length > TITLE_MAX ? `${text.slice(0, TITLE_MAX - 1).trimEnd()}…` : text;
}

function imageOf(b, op) {
  if (op.tim == null || !op.ext) return null;
  const full = (op.ext === '.jpg' || op.ext === '.png') && op.fsize <= FULL_IMAGE_MAX;
  return full
    ? { url: `${SITE}/img/${b}/${op.tim}${op.ext}`, w: op.w, h: op.h, large: true }
    : { url: `${SITE}/img/${b}/${op.tim}s.jpg`, w: op.tn_w, h: op.tn_h, large: false };
}

async function metaFor(path) {
  const m = ROUTE.exec(path);
  if (!m) return null;
  const [, b, archive, no] = m;
  const board = await boardOf(b);
  if (!board) return null;
  const boardMeta = { title: `/${b}/ ${board.title}`, description: `/${b}/ ${board.title} as an image gallery`, url: SITE + path };
  if (!no || archive) return boardMeta;
  const thread = await cached(`/${b}/thread/${no}.json`, THREAD_TTL_MS);
  const op = thread?.posts?.[0];
  if (!op) return boardMeta;
  const text = plainText(op.sub ?? '') || plainText(op.com ?? '') || `No.${op.no}`;
  const images = (op.images ?? 0) + (op.tim != null ? 1 : 0);
  return {
    title: clip(`/${b}/ ${text}`),
    description: `${images} images, ${op.replies ?? 0} replies`,
    url: SITE + path,
    image: board.ws_board ? imageOf(b, op) : null,
  };
}

function escape(value) {
  return String(value).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function setMeta(html, attr, key, value) {
  const tag = `<meta ${attr}="${key}" content="${escape(value)}" />`;
  const re = new RegExp(`<meta ${attr}="${key.replace(/[:.]/g, '\\$&')}" content="[^"]*"\\s*/?>`);
  return re.test(html) ? html.replace(re, tag) : html.replace('</head>', `  ${tag}\n  </head>`);
}

function render(html, meta) {
  let out = html.replace(/<title>[^<]*<\/title>/, `<title>${escape(meta.title)}</title>`);
  out = setMeta(out, 'name', 'description', meta.description);
  out = setMeta(out, 'property', 'og:title', meta.title);
  out = setMeta(out, 'property', 'og:description', meta.description);
  out = setMeta(out, 'property', 'og:url', meta.url);
  out = setMeta(out, 'name', 'twitter:card', meta.image?.large ? 'summary_large_image' : 'summary');
  if (meta.image) {
    out = setMeta(out, 'property', 'og:image', meta.image.url);
    if (meta.image.w && meta.image.h) {
      out = setMeta(out, 'property', 'og:image:width', meta.image.w);
      out = setMeta(out, 'property', 'og:image:height', meta.image.h);
    }
  }
  return out;
}

function timeout() {
  return new Promise((r) => setTimeout(() => r(null), TIMEOUT_MS));
}

createServer(async (req, res) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405).end();
    return;
  }
  try {
    const html = await template();
    const path = new URL(req.url ?? '/', SITE).pathname;
    const meta = await Promise.race([metaFor(path).catch(() => null), timeout()]);
    const body = meta ? render(html, meta) : html;
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-cache' });
    res.end(req.method === 'HEAD' ? undefined : body);
  } catch {
    res.writeHead(502).end();
  }
}).listen(PORT, '127.0.0.1');
