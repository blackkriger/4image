<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ArrowUp, ChevronLeft, ExternalLink, X } from 'lucide-vue-next';
import { failStatus, loadThread, type LoadStatus, type Post } from '../lib/api';
import { stats, type ThreadCard } from '../lib/cards';
import { gridTile, mediaOf, skeletonRatios } from '../lib/media';
import { plainText } from '../lib/text';
import { setTitle } from '../lib/title';
import { hintIfCut } from '../lib/hint';
import { stored } from '../lib/storage';
import TopBar from '../components/TopBar.vue';
import ThreadRail from '../components/ThreadRail.vue';
import MediaThumb from '../components/MediaThumb.vue';
import ThreadPosts from '../components/ThreadPosts.vue';
import ImageViewer from '../components/ImageViewer.vue';
import UpdatedAgo from '../components/UpdatedAgo.vue';

const TEXT_KEY = '4image:text';
const SKELETON = skeletonRatios(6).map((ar) => gridTile(ar, 1));
const REFRESH_MS = 20000;
const MAX_REFRESH_MS = 60000;
const TOP_BUTTON_PX = 600;

const props = defineProps<{ threads: ThreadCard[] }>();

const route = useRoute();
const router = useRouter();
const board = computed(() => route.params.board as string);
const no = computed(() => Number(route.params.thread));

const posts = ref<Post[]>([]);
const status = ref<LoadStatus>('loading');
const updatedAt = ref(0);
const textMode = ref(stored.get(TEXT_KEY) === '1');
const viewerNo = ref<number | null>(null);
const state = ref<'live' | 'closed' | 'archived' | 'deleted'>('live');
const scroller = ref<HTMLElement | null>(null);
const scrolled = ref(false);

const op = computed(() => posts.value[0]);
const card = computed(() => props.threads.find((t) => t.no === no.value));
const title = computed(() => {
  const p = op.value;
  if (p) return plainText(p.sub ?? '') || plainText(p.com ?? '') || `No.${p.no}`;
  return card.value ? card.value.subject || card.value.text : '';
});
const media = computed(() => posts.value.flatMap((p) => mediaOf(board.value, p) ?? []));
const railThreads = computed(() => {
  const p = op.value;
  if (!p) return props.threads;
  return props.threads.map((t) => (t.no === p.no ? { ...t, images: media.value.length, replies: p.replies ?? 0 } : t));
});
const tiles = computed(() => media.value.map((m) => ({ m, style: gridTile(m.w, m.h) })));
const mediaByNo = computed(() => new Map(media.value.map((m) => [m.no, m])));
const postsByNo = computed(() => new Map(posts.value.map((p) => [p.no, p])));
const viewer = computed<number | null>({
  get: () => {
    const i = media.value.findIndex((m) => m.no === viewerNo.value);
    return i < 0 ? null : i;
  },
  set: (i) => (viewerNo.value = i == null ? null : (media.value[i]?.no ?? null)),
});

const signature = (list: Post[]): string =>
  `${list.length}:${list.at(-1)?.no}:${list.filter((p) => p.filedeleted).length}:${list[0]?.archived ?? 0}:${list[0]?.closed ?? 0}`;

async function load(): Promise<boolean> {
  const b = board.value;
  const n = no.value;
  try {
    const list = await loadThread(b, n);
    if (b !== board.value || n !== no.value) return false;
    updatedAt.value = Date.now();
    state.value = list[0]?.archived ? 'archived' : list[0]?.closed ? 'closed' : 'live';
    const changed = signature(list) !== signature(posts.value);
    if (changed) posts.value = list;
    status.value = 'ready';
    return changed;
  } catch (e) {
    if (b !== board.value || n !== no.value) return false;
    if (status.value === 'ready' && failStatus(e) === 'missing') state.value = 'deleted';
    else status.value = failStatus(e);
    return false;
  }
}

let timer = 0;
let delay = REFRESH_MS;

function schedule(): void {
  clearTimeout(timer);
  timer = window.setTimeout(async () => {
    if (document.visibilityState === 'visible' && status.value === 'ready' && (state.value === 'live' || state.value === 'closed')) {
      delay = (await load()) ? REFRESH_MS : Math.min(delay * 1.5, MAX_REFRESH_MS);
    }
    schedule();
  }, delay);
}

watch(
  [board, no],
  () => {
    posts.value = [];
    status.value = 'loading';
    state.value = 'live';
    viewerNo.value = null;
    delay = REFRESH_MS;
    scroller.value?.scrollTo({ top: 0 });
    load();
    schedule();
  },
  { immediate: true },
);

watch(
  title,
  (t) => {
    if (t) setTitle(board.value, t);
  },
  { immediate: true },
);


function openMedia(n: number): void {
  const i = media.value.findIndex((m) => m.no === n);
  if (i >= 0) viewer.value = i;
}

function anchorNo(): number | null {
  const box = scroller.value;
  if (!box) return null;
  const top = box.getBoundingClientRect().top + 80;
  for (const el of box.querySelectorAll<HTMLElement>('[data-no]')) {
    if (el.getBoundingClientRect().bottom > top) return Number(el.dataset.no);
  }
  return null;
}

async function setTextMode(on: boolean): Promise<void> {
  const anchor = anchorNo();
  textMode.value = on;
  stored.set(TEXT_KEY, on ? '1' : '0');
  await nextTick();
  if (anchor == null || !scroller.value) return;
  const els = [...scroller.value.querySelectorAll<HTMLElement>('[data-no]')];
  els.find((el) => Number(el.dataset.no) >= anchor)?.scrollIntoView({ block: 'start' });
}

async function jumpToPost(n: number): Promise<void> {
  viewer.value = null;
  if (!textMode.value) await setTextMode(true);
  await nextTick();
  document.getElementById(`p${n}`)?.scrollIntoView({ block: 'start' });
}

function onScroll(): void {
  scrolled.value = (scroller.value?.scrollTop ?? 0) > TOP_BUTTON_PX;
}

function toTop(): void {
  scroller.value?.scrollTo({ top: 0, behavior: 'smooth' });
}

function onKey(e: KeyboardEvent): void {
  if (e.key === 'Escape' && viewer.value == null) router.push(`/${board.value}`);
}

onMounted(() => {
  document.documentElement.classList.add('locked');
  window.addEventListener('keydown', onKey);
});

onBeforeUnmount(() => {
  document.documentElement.classList.remove('locked');
  window.removeEventListener('keydown', onKey);
  clearTimeout(timer);
});
</script>

<template>
  <div class="thread">
    <ThreadRail :board="board" :threads="railThreads" :current="no" />
    <div ref="scroller" class="thread__main" @scroll.passive="onScroll">
      <TopBar />
      <div class="threadbar">
        <div class="wrap wrap--full threadbar__in">
          <RouterLink :to="`/${board}`" class="btn">
            <ChevronLeft class="ic" />
            <span class="threadbar__back">Catalog</span>
          </RouterLink>
          <Transition name="slide">
            <button v-if="scrolled" type="button" class="btn btn--icon" aria-label="Back to top" @click="toTop">
              <ArrowUp class="ic" />
            </button>
          </Transition>
          <div class="threadbar__title">
            <h1 v-if="title" @mouseenter="hintIfCut($event, title)">{{ title }}</h1>
            <span v-else-if="status === 'loading'" class="sk sk-line threadbar__sk-title"></span>
            <div v-if="op" class="mono muted small">
              {{ stats(media.length, op.replies ?? 0) }}<template v-if="state === 'live'">, <UpdatedAgo :at="updatedAt" /></template><template v-else>, {{ state }}</template>
            </div>
            <div v-else-if="card" class="mono muted small">{{ stats(card.images, card.replies) }}</div>
            <span v-else-if="status === 'loading'" class="sk sk-line threadbar__sk-meta"></span>
          </div>
          <button type="button" class="btn" :aria-pressed="textMode" @click="setTextMode(!textMode)">
            <span class="switch" aria-hidden="true"></span>
            Text
          </button>
          <div class="threadbar__nav">
            <a :href="`https://boards.4chan.org/${board}/thread/${no}`" target="_blank" rel="noopener noreferrer" class="btn btn--icon" aria-label="Open on 4chan">
              <ExternalLink class="ic" />
            </a>
            <RouterLink :to="`/${board}`" class="btn btn--icon" aria-label="Close thread">
              <X class="ic" />
            </RouterLink>
          </div>
        </div>
      </div>

      <div v-if="status === 'loading' && !textMode" class="wrap wrap--full justify thread__grid" aria-hidden="true">
        <div v-for="(s, i) in SKELETON" :key="i" class="tile sk" :style="s"></div>
        <div class="justify__end"></div>
      </div>
      <div v-else-if="status === 'loading'" class="thread__posts" aria-hidden="true">
        <div v-for="n in 6" :key="n" class="post">
          <span class="sk sk-line" style="width: 240px"></span>
          <div class="post__main">
            <div class="post__thumb sk" style="width: 160px; height: 110px"></div>
            <div class="postbody">
              <span class="sk sk-line" style="width: 90%"></span>
              <span class="sk sk-line" style="width: 60%"></span>
            </div>
          </div>
        </div>
      </div>
      <p v-else-if="status === 'missing'" class="empty">This thread is gone.</p>
      <p v-else-if="status === 'failed'" class="empty">Could not load the thread.</p>

      <ThreadPosts
        v-else-if="textMode"
        class="thread__posts"
        :posts="posts"
        :by-no="postsByNo"
        :media="mediaByNo"
        @open="openMedia"
      />

      <div v-else class="wrap wrap--full justify thread__grid">
        <button
          v-for="(t, i) in tiles"
          :key="t.m.no"
          type="button"
          class="tile"
          :data-no="t.m.no"
          :style="t.style"
          :aria-label="t.m.name"
          @click="viewer = i"
        >
          <MediaThumb :m="t.m" />
        </button>
        <div class="justify__end" aria-hidden="true"></div>
      </div>

      <ImageViewer v-model:index="viewer" :items="media" :by-no="postsByNo" :op="op?.no ?? 0" @quote="jumpToPost" />
    </div>
  </div>
</template>
