import type { Post } from './api';
import { mediaOf, tile } from './media';
import { plainText } from './text';

export interface ThreadCard {
  no: number;
  subject: string;
  text: string;
  replies: number;
  images: number;
  image: string | null;
  thumb: string | null;
  style: { flex: string; aspectRatio: string };
}

export function toCard(board: string, t: Post): ThreadCard {
  const m = mediaOf(board, t);
  const full = m && (t.ext === '.jpg' || t.ext === '.png') ? m.src : null;
  return {
    no: t.no,
    subject: plainText(t.sub ?? ''),
    text: plainText(t.com ?? ''),
    replies: t.replies ?? 0,
    images: (t.images ?? 0) + (m ? 1 : 0),
    image: full ?? m?.thumb ?? null,
    thumb: m?.thumb ?? null,
    style: tile(m?.w ?? 1, m?.h ?? 1),
  };
}

export function stats(images: number, replies: number): string {
  return `${images} images, ${replies} replies`;
}
