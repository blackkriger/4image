<script setup lang="ts">
import { computed } from 'vue';
import { CornerDownRight } from 'lucide-vue-next';
import type { Post } from '../lib/api';
import { formatSize, type Media } from '../lib/media';
import { plainText, sanitize } from '../lib/text';
import LazyImage from './LazyImage.vue';

const props = defineProps<{ post: Post; media: Media | null; op: number; backlinks?: number[] }>();
const emit = defineEmits<{ (e: 'open', no: number): void }>();

const subject = computed(() => plainText(props.post.sub ?? ''));
const date = computed(() => props.post.now.replace(/\s*\((\w+)\)\s*/, ' ($1) '));
const body = computed(() =>
  sanitize(props.post.com ?? '').replaceAll(`&gt;&gt;${props.op}</a>`, `&gt;&gt;${props.op} (OP)</a>`),
);
const thumb = computed(() => {
  const m = props.media;
  if (!m) return null;
  const scale = 160 / Math.max(m.w, m.h);
  return { width: `${Math.round(m.w * scale)}px`, height: `${Math.round(m.h * scale)}px` };
});
</script>

<template>
  <div class="post__meta mono">
    <span v-if="subject" class="post__subject">{{ subject }}</span>
    <a :href="`#p${post.no}`" class="post__no">No.{{ post.no }}</a>
    <span>{{ date }}</span>
    <span v-if="media">{{ media.name }}, {{ formatSize(media.size) }}, {{ media.w }}×{{ media.h }}</span>
  </div>
  <div class="post__main">
    <button v-if="media && thumb" type="button" class="post__thumb" :style="thumb" :aria-label="`Open ${media.name}`" @click="emit('open', post.no)">
      <LazyImage :src="media.video ? media.thumb : media.src" :thumb="media.thumb" />
    </button>
    <div class="postbody" v-html="body"></div>
  </div>
  <div v-if="backlinks?.length" class="post__backlinks mono">
    <CornerDownRight class="ic" aria-hidden="true" />
    <a v-for="n in backlinks" :key="n" :href="`#p${n}`" class="quotelink">&gt;&gt;{{ n }}</a>
  </div>
</template>
