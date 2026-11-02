import { HttpError, type Post } from './api';

const ARCHIVES: Record<string, string[]> = {
  'arch.b4k.dev': ['v', 'vg', 'vm', 'vmg', 'vp', 'vrpg', 'vst', 'qb'],
  'archive.palanq.win': ['bant', 'c', 'e', 'i', 'n', 'news', 'out', 'p', 'pw', 'qst', 'toy', 'vip', 'vt', 'w', 'wg', 'wsr'],
};

const BY_BOARD = new Map(Object.entries(ARCHIVES).flatMap(([host, boards]) => boards.map((b) => [b, host] as const)));

const THUMBS_ONLY = new Set(['arch.b4k.dev']);

export function archiveOf(board: string): string | undefined {
  return BY_BOARD.get(board);
}

function thumbsOnly(board: string): boolean {
  return THUMBS_ONLY.has(archiveOf(board) ?? '');
}

export function boardPath(board: string, archive: boolean): string {
  return archive ? `/${board}/archive` : `/${board}`;
}

interface ArcMedia {
  media_link: string | null;
  thumb_link: string | null;
  media_orig: string | null;
  media_filename: string | null;
  media_w: string;
  media_h: string;
  media_size: string;
  banned: string;
  exif?: string | null;
}

interface ArcPost {
  num: string;
  subnum: string;
  thread_num: string;
  timestamp: number;
  fourchan_date?: string;
  title: string | null;
  comment: string | null;
  media: ArcMedia | null;
}

interface ArcThread {
  op: ArcPost;
  posts?: Record<string, ArcPost> | ArcPost[];
  omitted?: number;
  images_omitted?: number;
}

function escapeHtml(s: string): string {
  return s.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
}

function commentHtml(raw: string): string {
  return escapeHtml(raw)
    .replace(/\[spoiler\]([\s\S]*?)\[\/spoiler\]/g, '<s>$1</s>')
    .split('\n')
    .map((line) => {
      const linked = line.replace(/&gt;&gt;(\d+)/g, '<a href="#p$1" class="quotelink">&gt;&gt;$1</a>');
      return /^&gt;(?!&gt;\d|&gt;&gt;\/)/.test(line) ? `<span class="quote">${linked}</span>` : linked;
    })
    .join('<br>');
}

function hasMedia(p: ArcPost): boolean {
  return !!p.media?.media_link;
}

function fourchanTim(m: ArcMedia): number | null {
  try {
    const tim = (JSON.parse(m.exif ?? '{}') as { tim?: unknown }).tim;
    return typeof tim === 'number' ? tim : null;
  } catch {
    return null;
  }
}

function toPost(p: ArcPost, board: string): Post {
  const no = Number(p.num);
  const thread = Number(p.thread_num);
  const post: Post = {
    no,
    resto: no === thread ? 0 : thread,
    time: p.timestamp,
    now: p.fourchan_date ?? '',
    sub: p.title ? escapeHtml(p.title) : undefined,
    com: commentHtml(p.comment ?? ''),
    archived: 1,
  };
  const m = p.media;
  const orig = m?.media_orig ?? '';
  const dot = orig.lastIndexOf('.');
  if (!m || dot < 0) return post;
  const ext = orig.slice(dot);
  const name = m.media_filename ?? orig;
  const thumb = m.thumb_link ?? m.media_link ?? undefined;
  const tim = thumbsOnly(board) ? fourchanTim(m) : null;
  const files = thumbsOnly(board)
    ? { src: tim ? `/img/${board}/${tim}${ext}?archive=0` : thumb, fallback: thumb, still: tim ? undefined : 1 }
    : { src: m.media_link ?? undefined };
  return {
    ...post,
    tim: Number(orig.slice(0, dot)),
    ext,
    filename: name.endsWith(ext) ? name.slice(0, -ext.length) : name,
    fsize: Number(m.media_size),
    w: Number(m.media_w),
    h: Number(m.media_h),
    ...files,
    thumb,
    original: m.media_link ?? undefined,
    filedeleted: m.banned === '1' || !m.media_link ? 1 : undefined,
  };
}

function repliesOf(t: ArcThread): ArcPost[] {
  return Object.values(t.posts ?? {}).filter((p) => p.subnum === '0');
}

async function arc<T>(board: string, query: string): Promise<T> {
  const host = archiveOf(board);
  if (!host) throw new HttpError(404);
  const res = await fetch(`https://${host}/_/api/chan/${query}`, { referrerPolicy: 'no-referrer' });
  if (!res.ok) throw new HttpError(res.status);
  const data = (await res.json()) as T & { error?: string };
  if (data.error) throw new HttpError(404);
  return data;
}

export function archiveUrl(board: string, no: number): string {
  return `https://${archiveOf(board)}/${board}/thread/${no}/`;
}

const threads = new Map<string, Promise<Post[]>>();

export function loadArchivedThread(board: string, no: number): Promise<Post[]> {
  const key = `${board}/${no}`;
  let p = threads.get(key);
  if (!p) {
    p = fetchArchivedThread(board, no);
    p.catch(() => threads.delete(key));
    threads.set(key, p);
  }
  return p;
}

async function fetchArchivedThread(board: string, no: number): Promise<Post[]> {
  const t = (await arc<Record<string, ArcThread>>(board, `thread/?board=${board}&num=${no}`))[no];
  if (!t) throw new HttpError(404);
  const replies = repliesOf(t).sort((a, b) => Number(a.num) - Number(b.num));
  const op = toPost(t.op, board);
  op.replies = replies.length;
  op.images = replies.filter(hasMedia).length;
  return [op, ...replies.map((p) => toPost(p, board))];
}

export async function loadArchivePage(board: string, page: number): Promise<Post[]> {
  const threads = Object.values(await arc<Record<string, ArcThread>>(board, `index/?board=${board}&page=${page}`));
  const bumped = (t: ArcThread): number => Math.max(t.op.timestamp, ...repliesOf(t).map((p) => p.timestamp));
  return threads
    .sort((a, b) => bumped(b) - bumped(a))
    .map((t) => {
      const last = repliesOf(t);
      const op = toPost(t.op, board);
      op.replies = (t.omitted ?? 0) + last.length;
      op.images = (t.images_omitted ?? 0) + last.filter(hasMedia).length;
      return op;
    });
}

interface ArcSearch {
  '0'?: { posts: ArcPost[] };
  meta?: { total_found?: number };
}

async function search(board: string, text: string, page: number): Promise<ArcSearch> {
  const q = new URLSearchParams({ boards: board, type: 'op', page: String(page) });
  if (text) q.set('text', text);
  return arc<ArcSearch>(board, `search/?${q}`);
}

export async function searchArchive(board: string, text: string, page: number): Promise<{ posts: Post[]; total: number | null }> {
  const d = await search(board, text, page);
  return { posts: (d['0']?.posts ?? []).map((p) => toPost(p, board)), total: d.meta?.total_found ?? null };
}

const counts = new Map<string, Promise<number | null>>();

export function countArchive(board: string): Promise<number | null> {
  let c = counts.get(board);
  if (!c) {
    c = search(board, '', 1).then((d) => d.meta?.total_found ?? null);
    c.catch(() => counts.delete(board));
    counts.set(board, c);
  }
  return c;
}
