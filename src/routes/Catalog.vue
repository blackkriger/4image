<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { failStatus, loadBoards, loadCatalog, type LoadStatus } from '../lib/api';
import { stats, toCard, type ThreadCard } from '../lib/cards';
import { skeletonRatios, tile } from '../lib/media';
import { stored } from '../lib/storage';
import { setTitle } from '../lib/title';
import { hintIfCut } from '../lib/hint';
import LazyImage from '../components/LazyImage.vue';

type Sort = 'bump' | 'images' | 'replies' | 'new';

const SORT_KEY = '4image:sort';

const SORTS: [Sort, string][] = [
  ['bump', 'Bump order'],
  ['images', 'Most images'],
  ['replies', 'Replies'],
  ['new', 'Newest'],
];

const SKELETON = skeletonRatios(24).map((ar) => tile(ar, 1));

const route = useRoute();
const board = computed(() => route.params.board as string);
const title = ref('');
const cards = ref<ThreadCard[]>([]);
const status = ref<LoadStatus>('loading');
const savedSort = stored.get(SORT_KEY);
const sort = ref<Sort>(SORTS.some(([id]) => id === savedSort) ? (savedSort as Sort) : 'bump');

watch(sort, (s) => stored.set(SORT_KEY, s));

async function load(b: string): Promise<void> {
  status.value = 'loading';
  cards.value = [];
  title.value = '';
  try {
    const [boards, threads] = await Promise.all([loadBoards().catch(() => []), loadCatalog(b)]);
    if (b !== board.value) return;
    title.value = boards.find((x) => x.board === b)?.title ?? '';
    if (!route.params.thread) setTitle(b, title.value);
    cards.value = threads.map((t) => toCard(b, t));
    status.value = 'ready';
  } catch (e) {
    if (b === board.value) status.value = failStatus(e);
  }
}

watch(board, load, { immediate: true });
watch(
  () => route.params.thread,
  (thread) => {
    if (!thread && title.value) setTitle(board.value, title.value);
  },
);

const shown = computed(() => {
  const list = cards.value.slice();
  if (sort.value === 'images') list.sort((a, b) => b.images - a.images);
  else if (sort.value === 'replies') list.sort((a, b) => b.replies - a.replies);
  else if (sort.value === 'new') list.sort((a, b) => b.no - a.no);
  return list;
});
</script>

<template>
  <main class="wrap wrap--full page">
    <div class="catalog__head">
      <h1 class="catalog__title"><span class="mono accent">/{{ board }}/</span>{{ title }}</h1>
      <span v-if="status === 'ready'" class="mono muted small">{{ cards.length }} threads</span>
      <span class="grow"></span>
      <div class="seg" role="group" aria-label="Sort">
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

    <p v-if="status === 'missing'" class="empty">No such board.</p>
    <p v-else-if="status === 'failed'" class="empty">Could not load the catalog.</p>

    <div class="justify catalog__grid">
      <template v-if="status === 'loading'">
        <div v-for="(s, i) in SKELETON" :key="i" class="card" :style="{ flex: s.flex }" aria-hidden="true">
          <div class="card__thumb sk" :style="{ aspectRatio: s.aspectRatio }"></div>
          <span class="sk sk-line" style="width: 60%"></span>
          <span class="sk sk-line" style="width: 90%"></span>
        </div>
      </template>
      <RouterLink v-for="c in shown" :key="c.no" :to="`/${board}/${c.no}`" class="card" :style="{ flex: c.style.flex }">
        <div class="card__thumb" :style="{ aspectRatio: c.style.aspectRatio }">
          <LazyImage v-if="c.image" :src="c.image" :thumb="c.thumb" />
        </div>
        <div class="clamp card__text" @mouseenter="hintIfCut($event, `${c.subject} ${c.text}`.trim())">
          <strong v-if="c.subject">{{ c.subject }}</strong>
          {{ c.text }}
        </div>
        <div class="mono muted small">{{ stats(c.images, c.replies) }}</div>
      </RouterLink>
      <div class="justify__end" aria-hidden="true"></div>
    </div>

    <RouterView v-slot="{ Component }">
      <component :is="Component" :threads="shown" />
    </RouterView>
  </main>
</template>
