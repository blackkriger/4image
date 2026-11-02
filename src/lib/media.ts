import type { Post } from './api';

export interface Media {
  no: number;
  src: string;
  thumb: string;
  name: string;
  w: number;
  h: number;
  size: number;
  video: boolean;
  fallback?: string;
  original?: string;
  still?: { w: number; h: number };
}

const CDN = '/img';
const VIDEO = ['.webm', '.mp4'];
const MEDIA = ['.jpg', '.png', '.gif', ...VIDEO];

const SKELETON_RATIOS = [1.78, 1.33, 1, 0.8, 1.5, 1.9];

export function skeletonRatios(count: number): number[] {
  return Array.from({ length: count }, (_, i) => SKELETON_RATIOS[i % SKELETON_RATIOS.length]);
}

export function mediaOf(board: string, p: Post): Media | null {
  if (p.tim == null || !p.ext || p.filedeleted || !MEDIA.includes(p.ext)) return null;
  return {
    no: p.no,
    src: p.src ?? `${CDN}/${board}/${p.tim}${p.ext}`,
    thumb: p.thumb ?? `${CDN}/${board}/${p.tim}s.jpg`,
    name: `${p.filename ?? p.tim}${p.ext}`,
    w: p.w || 1,
    h: p.h || 1,
    size: p.fsize ?? 0,
    video: !p.still && VIDEO.includes(p.ext),
    fallback: p.fallback,
    original: p.original,
    still: p.still && p.tn_w && p.tn_h ? { w: p.tn_w, h: p.tn_h } : undefined,
  };
}

export function markLoaded(e: Event): void {
  (e.target as HTMLElement).setAttribute('data-loaded', '');
}

export function markFailed(e: Event): void {
  (e.target as HTMLElement).setAttribute('data-loaded', '');
  (e.target as HTMLElement).setAttribute('data-failed', '');
}

export function formatSize(bytes: number): string {
  return bytes >= 1048576 ? `${(bytes / 1048576).toFixed(2)} MB` : `${Math.round(bytes / 1024)} KB`;
}

export function ratio(w: number, h: number, min = 0, max = Infinity): number {
  return Math.min(max, Math.max(min, w / h));
}

export function tile(w: number, h: number, min = 0, max = Infinity): { flex: string; aspectRatio: string } {
  const ar = ratio(w, h, min, max);
  return { flex: `${ar} 1 calc(var(--row) * ${ar})`, aspectRatio: String(ar) };
}

export const gridTile = (w: number, h: number): { flex: string; aspectRatio: string } => tile(w, h, 0.4, 3);
