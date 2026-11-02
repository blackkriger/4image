<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { loadBoards } from '../lib/api';
import { archiveOf, boardPath } from '../lib/archives';
import { groupBoards, type BoardGroup } from '../lib/boards';
import { setTitle } from '../lib/title';

const SKELETON = [8, 10, 15, 14, 10, 6, 13];

const route = useRoute();
const archive = computed(() => !!route.meta.archive);
const all = ref<BoardGroup[]>([]);
const failed = ref(false);
const groups = computed(() =>
  archive.value
    ? all.value.map((g) => ({ ...g, boards: g.boards.filter((b) => archiveOf(b.board)) })).filter((g) => g.boards.length)
    : all.value,
);

onMounted(async () => {
  setTitle();
  try {
    all.value = groupBoards(await loadBoards());
  } catch {
    failed.value = true;
  }
});
</script>

<template>
  <main class="wrap wrap--full page">
    <h1 class="sr-only">Boards</h1>
    <p v-if="failed" class="empty">Could not load boards.</p>
    <div v-if="!groups.length && !failed" class="boards" aria-hidden="true">
      <section v-for="(rows, i) in SKELETON" :key="i" class="boards__group">
        <span class="sk sk-line label" style="width: 120px"></span>
        <div v-for="r in rows" :key="r" class="boardrow">
          <span class="sk sk-line boardrow__code"></span>
          <span class="sk sk-line" style="width: 140px"></span>
        </div>
      </section>
    </div>
    <div class="boards">
      <section v-for="g in groups" :key="g.title" class="boards__group">
        <h2 class="label">{{ g.title }}<span v-if="g.nsfw" class="accent"> (NSFW)</span></h2>
        <RouterLink v-for="b in g.boards" :key="b.board" :to="boardPath(b.board, archive)" class="boardrow">
          <span class="mono boardrow__code">/{{ b.board }}/</span>
          <span>{{ b.title }}</span>
        </RouterLink>
      </section>
    </div>
  </main>
</template>
