<script setup lang="ts">
import { computed } from 'vue';
import type { Post } from '../lib/api';
import type { Media } from '../lib/media';
import type { Popup } from '../lib/popups';
import { backlinksOf } from '../lib/text';
import PostView from './PostView.vue';

const props = defineProps<{ popups: Popup[]; byNo: Map<number, Post>; media: Map<number, Media>; op: number; backlinks?: Map<number, number[]> }>();

const links = computed(() => props.backlinks ?? backlinksOf(props.byNo.values()));
const emit = defineEmits<{ (e: 'open', no: number): void }>();
</script>

<template>
  <div
    v-for="(pop, i) in popups"
    :key="`${i}-${pop.no}`"
    class="popup post"
    role="tooltip"
    :data-level="i + 1"
    :style="{ left: `${pop.left}px`, top: pop.top != null ? `${pop.top}px` : undefined, bottom: pop.bottom != null ? `${pop.bottom}px` : undefined }"
  >
    <PostView :post="byNo.get(pop.no)!" :media="media.get(pop.no) ?? null" :op="op" :backlinks="links.get(pop.no)" @open="emit('open', $event)" />
  </div>
</template>
