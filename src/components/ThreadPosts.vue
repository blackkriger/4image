<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import type { Post } from '../lib/api';
import type { Media } from '../lib/media';
import { useQuotePopups } from '../lib/popups';
import { backlinksOf, postLink } from '../lib/text';
import PostView from './PostView.vue';
import QuotePopups from './QuotePopups.vue';

const props = defineProps<{ posts: Post[]; byNo: Map<number, Post>; media: Map<number, Media> }>();
const emit = defineEmits<{ (e: 'open', no: number): void }>();

const router = useRouter();
const { shown, onOver, onOut, close } = useQuotePopups(() => props.byNo);

const op = computed(() => props.posts[0]?.no ?? 0);
const backlinks = computed(() => backlinksOf(props.posts));

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
</script>

<template>
  <div class="posts" @mouseover="onOver" @mouseout="onOut" @click="onClick">
    <article v-for="p in posts" :id="`p${p.no}`" :key="p.no" :data-no="p.no" class="post">
      <PostView :post="p" :media="media.get(p.no) ?? null" :op="op" :backlinks="backlinks.get(p.no)" @open="emit('open', $event)" />
    </article>
    <QuotePopups :popups="shown" :by-no="byNo" :media="media" :op="op" :backlinks="backlinks" @open="emit('open', $event)" />
  </div>
</template>
