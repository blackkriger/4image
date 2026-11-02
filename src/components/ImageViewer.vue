<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { ExternalLink, X } from 'lucide-vue-next';
import { formatSize, type Media } from '../lib/media';
import type { Post } from '../lib/api';
import { useQuotePopups } from '../lib/popups';
import { postBody, postLink } from '../lib/text';
import { stored } from '../lib/storage';
import ViewerStrip from './ViewerStrip.vue';
import QuotePopups from './QuotePopups.vue';

const props = defineProps<{ items: Media[]; index: number | null; byNo: Map<number, Post>; op: number }>();
const emit = defineEmits<{ (e: 'update:index', v: number | null): void; (e: 'quote', no: number): void }>();

const MIN_ZOOM = 1;
const MAX_ZOOM = 6;
const SWIPE_PX = 60;
const PRELOAD_AHEAD = 2;
const PRELOAD_BEHIND = 1;
const TEXT_KEY = '4image:post-text';
const POS_KEY = '4image:post-pos';

function savedPostPos(): { x: number; y: number } {
  const [x, y] = (stored.get(POS_KEY) ?? '').split(',').map(Number);
  const fits = Math.abs(x) < window.innerWidth && Math.abs(y) < window.innerHeight;
  return Number.isFinite(x) && Number.isFinite(y) && fits ? { x, y } : { x: 0, y: 0 };
}

const zoom = ref(1);
const pan = ref({ x: 0, y: 0 });
const showText = ref(stored.get(TEXT_KEY) === '1');
const postPos = ref(savedPostPos());
const stage = ref<HTMLElement | null>(null);
const failed = ref(false);
const dir = ref(1);

const open = computed(
  () => props.index != null && props.index >= 0 && props.index < props.items.length
);
const current = computed(() => (open.value ? props.items[props.index as number] : null));
const count = computed(() => props.items.length);
const fallen = computed(() => failed.value && !!current.value?.fallback);
const src = computed(() => (current.value ? (fallen.value ? current.value.fallback! : current.value.src) : ''));
const nearby = computed(() => {
  if (props.index == null || !open.value) return [];
  const offsets = [
    ...Array.from({ length: PRELOAD_AHEAD }, (_, i) => (i + 1) * dir.value),
    ...Array.from({ length: PRELOAD_BEHIND }, (_, i) => -(i + 1) * dir.value),
  ];
  const n = count.value;
  const picked = new Set(offsets.map((d) => (((props.index as number) + d) % n + n) % n));
  picked.delete(props.index);
  return [...picked].map((i) => props.items[i]);
});

function onMediaError(): void {
  failed.value = true;
}
const text = computed(() => (current.value && showText.value ? postBody(props.byNo.get(current.value.no)?.com ?? '', props.op) : ''));
const mediaByNo = computed(() => new Map(props.items.map((m) => [m.no, m])));
const quotes = useQuotePopups(() => props.byNo);

const router = useRouter();

function close(): void {
  emit('update:index', null);
}

function onPostClick(e: MouseEvent): void {
  const link = postLink((e.target as Element).closest?.('a')?.getAttribute('href') ?? '');
  if (!link) return;
  e.preventDefault();
  if ('thread' in link) {
    close();
    router.push(`/${link.board}/${link.thread}`);
    return;
  }
  quotes.close();
  emit('quote', link.post);
}

function openMedia(no: number): void {
  const i = props.items.findIndex((m) => m.no === no);
  if (i >= 0) emit('update:index', i);
}

function resetView(): void {
  zoom.value = 1;
  pan.value = { x: 0, y: 0 };
}

function go(dir: number): void {
  if (props.index == null || count.value < 2) return;
  emit('update:index', (props.index + dir + count.value) % count.value);
}

watch(() => props.index, (i, prev) => {
  if (i != null && prev != null && i !== prev) dir.value = (i > prev) !== (Math.abs(i - prev) > count.value / 2) ? 1 : -1;
  resetView();
  failed.value = false;
});
watch(showText, (on) => stored.set(TEXT_KEY, on ? '1' : '0'));

function onWheel(ev: WheelEvent): void {
  if (current.value?.video) return;
  ev.preventDefault();
  const box = stage.value?.getBoundingClientRect();
  if (!box) return;
  const cx = ev.clientX - box.left - box.width / 2;
  const cy = ev.clientY - box.top - box.height / 2;
  const old = zoom.value;
  const next = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, old * (ev.deltaY < 0 ? 1.2 : 1 / 1.2)));
  if (next === old) return;
  pan.value =
    next === MIN_ZOOM
      ? { x: 0, y: 0 }
      : {
          x: cx - (cx - pan.value.x) * (next / old),
          y: cy - (cy - pan.value.y) * (next / old),
        };
  zoom.value = next;
}

let drag: { sx: number; sy: number; bx: number; by: number; touch: boolean } | null = null;

function onPointerDown(ev: PointerEvent): void {
  if (ev.button !== 0) return;
  ev.preventDefault();
  drag = { sx: ev.clientX, sy: ev.clientY, bx: pan.value.x, by: pan.value.y, touch: ev.pointerType === 'touch' };
  (ev.currentTarget as HTMLElement).setPointerCapture(ev.pointerId);
}

function onPointerMove(ev: PointerEvent): void {
  if (!drag) return;
  pan.value = { x: drag.bx + (ev.clientX - drag.sx), y: drag.by + (ev.clientY - drag.sy) };
}

function onPointerUp(ev: PointerEvent): void {
  const swipe = drag?.touch ? ev.clientX - drag.sx : 0;
  drag = null;
  (ev.currentTarget as HTMLElement).releasePointerCapture?.(ev.pointerId);
  if (zoom.value === MIN_ZOOM && Math.abs(swipe) > SWIPE_PX) go(swipe < 0 ? 1 : -1);
}

let postDrag: { sx: number; sy: number; bx: number; by: number } | null = null;

function onPostDown(ev: PointerEvent): void {
  if (ev.button !== 0 || (ev.target as Element).closest('a')) return;
  postDrag = { sx: ev.clientX, sy: ev.clientY, bx: postPos.value.x, by: postPos.value.y };
  (ev.currentTarget as HTMLElement).setPointerCapture(ev.pointerId);
}

function onPostMove(ev: PointerEvent): void {
  if (!postDrag) return;
  postPos.value = { x: postDrag.bx + ev.clientX - postDrag.sx, y: postDrag.by + ev.clientY - postDrag.sy };
}

function onPostUp(ev: PointerEvent): void {
  if (postDrag) stored.set(POS_KEY, `${postPos.value.x},${postPos.value.y}`);
  postDrag = null;
  (ev.currentTarget as HTMLElement).releasePointerCapture?.(ev.pointerId);
}

function onKey(ev: KeyboardEvent): void {
  if (!open.value) return;
  if (ev.key === 'Escape') {
    ev.stopPropagation();
    close();
  } else if (ev.key === 'ArrowLeft') go(-1);
  else if (ev.key === 'ArrowRight') go(1);
}

watch(open, (isOpen) => {
  if (isOpen) window.addEventListener('keydown', onKey, true);
  else window.removeEventListener('keydown', onKey, true);
});
onUnmounted(() => window.removeEventListener('keydown', onKey, true));
</script>

<template>
  <Teleport to="body">
    <div v-if="open && current" class="viewer">
      <div class="viewer__bar">
        <div class="viewer__info">
          <span class="mono viewer__n">{{ (index ?? 0) + 1 }} <span class="viewer__dim">/ {{ count }}</span></span>
          <span class="mono viewer__name">{{ current.name }}</span>
          <span class="mono viewer__meta">{{ formatSize(current.size) }}, {{ current.w }}×{{ current.h }}</span>
        </div>
        <ViewerStrip :items="items" :index="index ?? 0" @pick="emit('update:index', $event)" @step="go" />
        <div class="viewer__actions">
          <button v-if="!current.video" class="vbtn mono" type="button" aria-label="Reset zoom" @click="resetView">
            {{ Math.round(zoom * 100) }}%
          </button>
          <button class="vbtn" type="button" :aria-pressed="showText" @click="showText = !showText">
            Show post text
          </button>
          <a class="vbtn vbtn--icon" :href="current.original ?? current.src" target="_blank" rel="noopener noreferrer" aria-label="Open original">
            <ExternalLink class="ic" />
          </a>
          <button class="vbtn vbtn--icon" type="button" aria-label="Close viewer" @click="close">
            <X class="ic" />
          </button>
        </div>
      </div>

      <div class="viewer__body" @click.self="close">
        <div ref="stage" class="viewer__stage" @wheel="onWheel" @click.self="close">
          <video
            v-if="current.video && !fallen"
            :key="current.src"
            class="viewer__media"
            :src="current.src"
            :poster="current.thumb"
            controls
            autoplay
            loop
            playsinline
            @error="onMediaError"
          ></video>
          <img
            v-else
            :key="src"
            :src="src"
            :alt="current.name"
            class="viewer__media viewer__img"
            draggable="false"
            :style="{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, backgroundImage: `url(${current.thumb})` }"
            @pointerdown="onPointerDown"
            @pointermove="onPointerMove"
            @pointerup="onPointerUp"
            @pointercancel="onPointerUp"
            @dblclick="resetView"
            @error="onMediaError"
          />
        </div>
        <div v-if="showText" class="viewer__quotes" @mouseover="quotes.onOver" @mouseout="quotes.onOut" @click="onPostClick">
          <aside
            class="viewer__post"
            :style="{ '--dx': `${postPos.x}px`, '--dy': `${postPos.y}px` }"
            @pointerdown="onPostDown"
            @pointermove="onPostMove"
            @pointerup="onPostUp"
            @pointercancel="onPostUp"
          >
            <span class="mono viewer__dim">No.{{ current.no }}</span>
            <div v-if="text" class="postbody" v-html="text"></div>
            <span v-else class="viewer__dim">No text</span>
          </aside>
          <QuotePopups :popups="quotes.shown.value" :by-no="byNo" :media="mediaByNo" :op="op" @open="openMedia" />
        </div>
      </div>
      <div class="viewer__preload" aria-hidden="true">
        <template v-for="m in nearby" :key="m.src">
          <video v-if="m.video" :src="m.src" preload="auto" muted playsinline></video>
          <img v-else :src="m.src" alt="" decoding="async" />
        </template>
      </div>
    </div>
  </Teleport>
</template>
