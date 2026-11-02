<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { Search } from 'lucide-vue-next';
import { failStatus, loadBoards, loadCatalog, type LoadStatus, type Post } from '../lib/api';
import { archiveOf, boardPath, loadArchivePage, searchArchive } from '../lib/archives';
import { stats, toCard, type ThreadCard } from '../lib/cards';
import { skeletonRatios, tile } from '../lib/media';
import { stored } from '../lib/storage';
import { setTitle } from '../lib/title';
import { hintIfCut } from '../lib/hint';
import MediaThumb from '../components/MediaThumb.vue';

type Sort = 'bump' | 'images' | 'replies' | 'new';

const SORT_KEY = '4image:sort';

const SORTS: [Sort, string][] = [
  ['bump', 'Bump order'],
  ['images', 'Most images'],
  ['replies', 'Replies'],
  ['new', 'Newest'],
];

const SKELETON = skeletonRatios(24).map((ar) => tile(ar, 1));
const MORE_SKELETON = SKELETON.slice(0, 6);
const MORE_PX = 800;
const CHAIN_MS = 1500;

const route = useRoute();
const board = computed(() => route.params.board as string);
const archive = computed(() => !!route.meta.archive);
const base = computed(() => boardPath(board.value, archive.value));
const title = ref('');
const cards = ref<ThreadCard[]>([]);
const status = ref<LoadStatus>('loading');
const savedSort = stored.get(SORT_KEY);
const sort = ref<Sort>(SORTS.some(([id]) => id === savedSort) ? (savedSort as Sort) : 'bump');

const query = ref('');
const searched = ref('');
const page = ref(1);
const ended = ref(false);
const busy = ref(false);
const moreFailed = ref(false);
const sentinel = ref<HTMLElement | null>(null);
let live = new Set<number>();
let run = 0;

watch(sort, (s) => stored.set(SORT_KEY, s));

async function load(): Promise<void> {
  const id = ++run;
  const b = board.value;
  status.value = 'loading';
  cards.value = [];
  title.value = '';
  try {
    const [boards, threads] = await Promise.all([loadBoards().catch(() => []), archive.value ? loadCatalog(b).catch(() => []) : loadCatalog(b)]);
    if (id !== run) return;
    title.value = boards.find((x) => x.board === b)?.title ?? '';
    if (!route.params.thread) setTitle(b, title.value);
    if (!archive.value) {
      cards.value = threads.map((t) => toCard(b, t));
      status.value = 'ready';
      return;
    }
    if (!archiveOf(b)) {
      status.value = 'missing';
      return;
    }
    live = new Set(threads.map((t) => t.no));
    restart();
  } catch (e) {
    if (id === run) status.value = failStatus(e);
  }
}

function restart(): void {
  run++;
  cards.value = [];
  page.value = 1;
  ended.value = false;
  moreFailed.value = false;
  busy.value = false;
  status.value = 'loading';
  loadMore();
}

async function loadMore(): Promise<void> {
  if (busy.value || ended.value) return;
  const id = run;
  const b = board.value;
  const q = searched.value;
  busy.value = true;
  moreFailed.value = false;
  let posts: Post[] = [];
  try {
    posts = q ? await searchArchive(b, q, page.value) : await loadArchivePage(b, page.value);
  } catch (e) {
    if (id !== run) return;
    busy.value = false;
    if (failStatus(e) === 'missing') {
      ended.value = true;
      status.value = 'ready';
    } else if (status.value === 'loading') status.value = 'failed';
    else moreFailed.value = true;
    return;
  }
  if (id !== run) return;
  const seen = new Set(cards.value.map((c) => c.no));
  cards.value = [...cards.value, ...posts.filter((p) => !live.has(p.no) && !seen.has(p.no)).map((p) => archiveCard(b, p))];
  page.value++;
  ended.value = !posts.length;
  busy.value = false;
  status.value = 'ready';
  await nextTick();
  if (nearEnd()) setTimeout(() => id === run && nearEnd() && loadMore(), CHAIN_MS);
}

function archiveCard(b: string, p: Post): ThreadCard {
  const c = toCard(b, p);
  return c.media ? { ...c, media: { ...c.media, src: c.media.thumb, video: false } } : c;
}

function nearEnd(): boolean {
  return !!sentinel.value && sentinel.value.getBoundingClientRect().top < window.innerHeight + MORE_PX;
}

function onSearch(): void {
  searched.value = query.value.trim();
  restart();
}

const observer = new IntersectionObserver(
  (entries) => {
    if (archive.value && entries.some((e) => e.isIntersecting)) loadMore();
  },
  { rootMargin: `${MORE_PX}px` },
);

onMounted(() => {
  if (sentinel.value) observer.observe(sentinel.value);
});
onBeforeUnmount(() => {
  run++;
  observer.disconnect();
});

watch(
  [board, archive],
  () => {
    query.value = '';
    searched.value = '';
    load();
  },
  { immediate: true },
);
watch(
  () => route.params.thread,
  (thread) => {
    if (!thread && title.value) setTitle(board.value, title.value);
  },
);

const shown = computed(() => {
  const list = cards.value.slice();
  if (archive.value) return list;
  if (sort.value === 'images') list.sort((a, b) => (b.images ?? 0) - (a.images ?? 0));
  else if (sort.value === 'replies') list.sort((a, b) => (b.replies ?? 0) - (a.replies ?? 0));
  else if (sort.value === 'new') list.sort((a, b) => b.no - a.no);
  return list;
});
</script>

<template>
  <main class="wrap wrap--full page">
    <div class="catalog__head">
      <h1 class="catalog__title"><span class="mono accent">/{{ board }}/</span>{{ title }}</h1>
      <span v-if="status === 'ready' && !archive" class="mono muted small">{{ cards.length }} threads</span>
      <span class="grow"></span>
      <form v-if="archive" class="search" role="search" @submit.prevent="onSearch">
        <Search class="ic" aria-hidden="true" />
        <input v-model="query" type="search" placeholder="Search archived threads" aria-label="Search archived threads" />
      </form>
      <div v-else class="seg" role="group" aria-label="Sort">
        <button
          v-for="[id, label] in SORTS"
          :key="id"
          type="button"
          :data-label="label"
          :aria-pressed="sort === id"
          @click="sort = id"
        >
          {{ label }}
        </button>
      </div>
    </div>

    <p v-if="status === 'missing'" class="empty">{{ archive ? 'No archive for this board.' : 'No such board.' }}</p>
    <p v-else-if="status === 'failed'" class="empty">{{ archive ? 'Could not load the archive.' : 'Could not load the catalog.' }}</p>
    <p v-else-if="status === 'ready' && ended && !cards.length" class="empty">No threads found.</p>

    <div class="justify catalog__grid">
      <template v-if="status === 'loading'">
        <div v-for="(s, i) in SKELETON" :key="i" class="card" :style="{ flex: s.flex }" aria-hidden="true">
          <div class="card__thumb sk" :style="{ aspectRatio: s.aspectRatio }"></div>
          <span class="sk sk-line" style="width: 60%"></span>
          <span class="sk sk-line" style="width: 90%"></span>
        </div>
      </template>
      <RouterLink v-for="c in shown" :key="c.no" :to="`${base}/${c.no}`" class="card" :style="{ flex: c.style.flex }">
        <div class="card__thumb" :class="{ nopic: !c.media }" :style="{ aspectRatio: c.style.aspectRatio }">
          <MediaThumb v-if="c.media" :m="c.media" />
        </div>
        <div class="clamp card__text" @mouseenter="hintIfCut($event, `${c.subject} ${c.text}`.trim())">
          <strong v-if="c.subject">{{ c.subject }}</strong>
          {{ c.text }}
        </div>
        <div v-if="c.images != null && c.replies != null" class="mono muted small">{{ stats(c.images, c.replies) }}</div>
      </RouterLink>
      <template v-if="busy && status === 'ready'">
        <div v-for="(s, i) in MORE_SKELETON" :key="`more-${i}`" class="card" :style="{ flex: s.flex }" aria-hidden="true">
          <div class="card__thumb sk" :style="{ aspectRatio: s.aspectRatio }"></div>
          <span class="sk sk-line" style="width: 60%"></span>
          <span class="sk sk-line" style="width: 90%"></span>
        </div>
      </template>
      <div class="justify__end" aria-hidden="true"></div>
    </div>
    <div ref="sentinel" aria-hidden="true"></div>
    <p v-if="moreFailed" class="empty">Could not load more threads.</p>

    <RouterView v-slot="{ Component }">
      <component :is="Component" :threads="shown" />
    </RouterView>
  </main>
</template>
