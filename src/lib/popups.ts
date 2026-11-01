import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import type { Post } from './api';

export interface Popup {
  no: number;
  left: number;
  top?: number;
  bottom?: number;
}

const OPEN_MS = 120;
const CLOSE_MS = 250;

export function useQuotePopups(byNo: () => Map<number, Post>) {
  const popups = ref<Popup[]>([]);
  let closeTimer = 0;
  let openTimer = 0;

  const shown = computed(() => {
    const gone = popups.value.findIndex((p) => !byNo().has(p.no));
    return gone < 0 ? popups.value : popups.value.slice(0, gone);
  });

  function quoteAt(target: EventTarget | null): { a: HTMLElement; no: number } | null {
    const a = (target as Element | null)?.closest?.<HTMLElement>('a.quotelink[href^="#p"]');
    const no = Number(a?.getAttribute('href')?.slice(2));
    return a && byNo().has(no) ? { a, no } : null;
  }

  function open(a: HTMLElement, no: number, level: number): void {
    const r = a.getBoundingClientRect();
    const left = Math.max(8, Math.min(r.left, window.innerWidth - 456));
    const below = r.bottom < window.innerHeight * 0.6;
    const popup: Popup = below ? { no, left, top: r.bottom + 6 } : { no, left, bottom: window.innerHeight - r.top + 6 };
    popups.value = [...popups.value.slice(0, level), popup];
  }

  function close(): void {
    clearTimeout(openTimer);
    popups.value = [];
  }

  function onOver(e: MouseEvent): void {
    const level = Number((e.target as Element).closest?.('[data-level]')?.getAttribute('data-level') ?? 0);
    const hit = quoteAt(e.target);
    if (!hit && !level) return;
    clearTimeout(closeTimer);
    if (!hit) {
      if (popups.value.length > level) closeTimer = window.setTimeout(() => (popups.value = popups.value.slice(0, level)), CLOSE_MS);
      return;
    }
    clearTimeout(openTimer);
    openTimer = window.setTimeout(() => open(hit.a, hit.no, level), OPEN_MS);
  }

  function onOut(e: MouseEvent): void {
    if (quoteAt(e.target)) clearTimeout(openTimer);
    if ((e.relatedTarget as Element | null)?.closest?.('.popup, a.quotelink')) return;
    clearTimeout(closeTimer);
    closeTimer = window.setTimeout(close, CLOSE_MS);
  }

  onMounted(() => window.addEventListener('scroll', close, { capture: true, passive: true }));
  onBeforeUnmount(() => {
    clearTimeout(closeTimer);
    clearTimeout(openTimer);
    window.removeEventListener('scroll', close, { capture: true });
  });

  return { shown, onOver, onOut, close };
}
