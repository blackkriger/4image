import DOMPurify from 'dompurify';
import type { Post } from './api';

const THREAD_LINK = /^\/(\w+)\/thread\/(\d+)/;

DOMPurify.addHook('afterSanitizeAttributes', (node) => {
  if (node.tagName !== 'A') return;
  const href = node.getAttribute('href') ?? '';
  if (href.startsWith('#') || THREAD_LINK.test(href)) return;
  node.setAttribute('target', '_blank');
  node.setAttribute('rel', 'noopener noreferrer');
});

export function sanitize(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['a', 'br', 'wbr', 'span', 'b', 'i', 'u', 's', 'strong', 'em', 'pre', 'code'],
    ALLOWED_ATTR: ['href', 'class'],
  });
}

export function postBody(html: string, op: number): string {
  return sanitize(html).replaceAll(`&gt;&gt;${op}</a>`, `&gt;&gt;${op} (OP)</a>`);
}

export function plainText(html: string): string {
  if (!html) return '';
  const doc = new DOMParser().parseFromString(html.replace(/<br\s*\/?>/g, ' '), 'text/html');
  return doc.body.textContent ?? '';
}

export function quotedIn(html: string): number[] {
  return [...html.matchAll(/href="#p(\d+)"/g)].map((m) => Number(m[1]));
}

export function backlinksOf(posts: Iterable<Post>): Map<number, number[]> {
  const map = new Map<number, number[]>();
  for (const p of posts) {
    for (const n of new Set(quotedIn(p.com ?? ''))) {
      const list = map.get(n);
      if (list) list.push(p.no);
      else map.set(n, [p.no]);
    }
  }
  return map;
}

export type PostLink = { board: string; thread: string } | { post: number };

export function postLink(href: string): PostLink | null {
  const m = href.match(THREAD_LINK);
  if (m) return { board: m[1], thread: m[2] };
  return /^#p\d+$/.test(href) ? { post: Number(href.slice(2)) } : null;
}
