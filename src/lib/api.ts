export interface Board {
  board: string;
  title: string;
  ws_board: number;
}

export interface Post {
  no: number;
  resto: number;
  time: number;
  now: string;
  sub?: string;
  com?: string;
  tim?: number;
  ext?: string;
  filename?: string;
  fsize?: number;
  w?: number;
  h?: number;
  filedeleted?: number;
  replies?: number;
  images?: number;
  last_modified?: number;
  archived?: number;
  closed?: number;
}

export type LoadStatus = 'loading' | 'ready' | 'missing' | 'failed';

export class HttpError extends Error {
  constructor(readonly status: number) {
    super(`HTTP ${status}`);
  }
}

export function failStatus(e: unknown): LoadStatus {
  return e instanceof HttpError && e.status === 404 ? 'missing' : 'failed';
}

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`/api/${path}`);
  if (!res.ok) throw new HttpError(res.status);
  return (await res.json()) as T;
}

let boards: Promise<Board[]> | null = null;

export function loadBoards(): Promise<Board[]> {
  boards ??= get<{ boards: Board[] }>('boards.json').then(
    (r) => r.boards,
    (e) => {
      boards = null;
      throw e;
    },
  );
  return boards;
}

export async function loadCatalog(board: string): Promise<Post[]> {
  const pages = await get<{ threads: Post[] }[]>(`${board}/catalog.json`);
  return pages.flatMap((p) => p.threads);
}

export async function loadThread(board: string, no: number): Promise<Post[]> {
  return (await get<{ posts: Post[] }>(`${board}/thread/${no}.json`)).posts;
}
