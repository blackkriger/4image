<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';
import type { Media } from '../lib/media';
import { observeVideo, unobserveVideo } from '../lib/inview';
import LazyImage from './LazyImage.vue';

defineProps<{ m: Media }>();

const video = ref<HTMLVideoElement | null>(null);
const failed = ref(false);

onMounted(() => {
  if (video.value) observeVideo(video.value);
});
onBeforeUnmount(() => {
  if (video.value) unobserveVideo(video.value);
});

function sound(on: boolean): void {
  if (!video.value || (on && navigator.userActivation?.hasBeenActive === false)) return;
  video.value.muted = !on;
}
</script>

<template>
  <video
    v-if="m.video && !(failed && m.fallback)"
    ref="video"
    class="media"
    :src="m.src"
    :poster="m.thumb"
    muted
    loop
    playsinline
    preload="none"
    @mouseenter="sound(true)"
    @mouseleave="sound(false)"
    @error="failed = true"
  ></video>
  <LazyImage v-else :src="m.video ? m.fallback! : m.src" :thumb="m.thumb" :fallback="m.fallback" />
</template>
