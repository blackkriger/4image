import type { Post } from './api';
import { mediaOf, tile, type Media } from './media';
import { plainText } from './text';

export interface ThreadCard {
  no: number;
  subject: string;
  text: string;
  replies: number | null;
  images: number | null;
  media: Media | null;
  style: { flex: string; aspectRatio: string };
}

export function toCard(board: string, t: Post): ThreadCard {
  const m = mediaOf(board, t);
  return {
    no: t.no,
    subject: plainText(t.sub ?? ''),
    text: plainText(t.com ?? ''),
    replies: t.replies ?? null,
    images: t.images == null ? null : t.images + (m ? 1 : 0),
    media: m,
    style: tile(m?.w ?? 1, m?.h ?? 1),
  };
}

export function stats(images: number, replies: number): string {
  return `${images} images, ${replies} replies`;
}
