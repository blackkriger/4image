<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import type { Post } from '../lib/api';
import type { Media } from '../lib/media';
import { postLink, quotedIn } from '../lib/text';
import PostView from './PostView.vue';

interface Popup {
  no: number;
  left: number;
  top?: number;
  bottom?: number;
}

const props = defineProps<{ posts: Post[]; byNo: Map<number, Post>; media: Map<number, Media> }>();
const emit = defineEmits<{ (e: 'open', no: number): void }>();

const OPEN_MS = 120;
const CLOSE_MS = 250;

const router = useRouter();
const popups = ref<Popup[]>([]);
let closeTimer = 0;
let openTimer = 0;

const op = computed(() => props.posts[0]?.no ?? 0);
const shown = computed(() => {
  const gone = popups.value.findIndex((p) => !props.byNo.has(p.no));
  return gone < 0 ? popups.value : popups.value.slice(0, gone);
});
const backlinks = computed(() => {
  const map = new Map<number, number[]>();
  for (const p of props.posts) {
    for (const n of new Set(quotedIn(p.com ?? ''))) {
      const list = map.get(n);
      if (list) list.push(p.no);
      else map.set(n, [p.no]);
    }
  }
  return map;
});

function quoteAt(target: EventTarget | null): { a: HTMLElement; no: number } | null {
  const a = (target as Element | null)?.closest?.<HTMLElement>('a.quotelink[href^="#p"]');
  const no = Number(a?.getAttribute('href')?.slice(2));
  return a && props.byNo.has(no) ? { a, no } : null;
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

function open(a: HTMLElement, no: number, level: number): void {
  const r = a.getBoundingClientRect();
  const left = Math.max(8, Math.min(r.left, window.innerWidth - 456));
  const below = r.bottom < window.innerHeight * 0.6;
  const popup: Popup = below ? { no, left, top: r.bottom + 6 } : { no, left, bottom: window.innerHeight - r.top + 6 };
  popups.value = [...popups.value.slice(0, level), popup];
}

function onOut(e: MouseEvent): void {
  if (quoteAt(e.target)) clearTimeout(openTimer);
  if ((e.relatedTarget as Element | null)?.closest?.('.popup, a.quotelink')) return;
  clearTimeout(closeTimer);
  closeTimer = window.setTimeout(close, CLOSE_MS);
}

function close(): void {
  clearTimeout(openTimer);
  popups.value = [];
}

function onClick(e: MouseEvent): void {
  const link = postLink((e.target as Element).closest?.('a')?.getAttribute('href') ?? '');
  if (!link) return;
  e.preventDefault();
  if ('thread' in link) {
    router.push(`/${link.board}/${link.thread}`);
    return;
  }
  close();
  document.getElementById(`p${link.post}`)?.scrollIntoView({ block: 'start' });
}

onMounted(() => window.addEventListener('scroll', close, { capture: true, passive: true }));
onBeforeUnmount(() => {
  clearTimeout(closeTimer);
  clearTimeout(openTimer);
  window.removeEventListener('scroll', close, { capture: true });
});
</script>

<template>
  <div class="posts" @mouseover="onOver" @mouseout="onOut" @click="onClick">
    <article v-for="p in posts" :id="`p${p.no}`" :key="p.no" :data-no="p.no" class="post">
      <PostView :post="p" :media="media.get(p.no) ?? null" :op="op" :backlinks="backlinks.get(p.no)" @open="emit('open', $event)" />
    </article>
    <div
      v-for="(pop, i) in shown"
      :key="`${i}-${pop.no}`"
      class="popup post"
      role="tooltip"
      :data-level="i + 1"
      :style="{ left: `${pop.left}px`, top: pop.top != null ? `${pop.top}px` : undefined, bottom: pop.bottom != null ? `${pop.bottom}px` : undefined }"
    >
      <PostView :post="byNo.get(pop.no)!" :media="media.get(pop.no) ?? null" :op="op" @open="emit('open', $event)" />
    </div>
  </div>
</template>
