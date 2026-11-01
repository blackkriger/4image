<script setup lang="ts">
import { nextTick, ref, watch } from 'vue';
import { stats, type ThreadCard } from '../lib/cards';
import LazyImage from './LazyImage.vue';

const props = defineProps<{ board: string; threads: ThreadCard[]; current: number }>();

const rail = ref<HTMLElement | null>(null);
let placed = false;

watch(
  () => [props.current, props.threads.length],
  async () => {
    await nextTick();
    const active = rail.value?.querySelector('[aria-current="page"]');
    if (!active) return;
    active.scrollIntoView({ block: placed ? 'nearest' : 'center' });
    placed = true;
  },
  { immediate: true },
);
</script>

<template>
  <nav ref="rail" class="rail" aria-label="Threads">
    <RouterLink v-for="t in threads" :key="t.no" :to="`/${board}/${t.no}`" class="rail__item">
      <div class="rail__thumb" :style="{ aspectRatio: t.style.aspectRatio }">
        <LazyImage v-if="t.image" :src="t.image" :thumb="t.thumb" />
      </div>
      <span class="clamp rail__title">
        <strong v-if="t.subject">{{ t.subject }}</strong>
        {{ t.text }}
      </span>
      <span class="mono muted rail__meta">{{ stats(t.images, t.replies) }}</span>
    </RouterLink>
  </nav>
</template>
