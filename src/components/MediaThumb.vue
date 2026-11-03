<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import type { Media } from '../lib/media';
import { observeVideo, unobserveVideo } from '../lib/inview';
import LazyImage from './LazyImage.vue';

const props = defineProps<{ m: Media; hoverPlay?: boolean }>();

const video = ref<HTMLVideoElement | null>(null);
const failed = ref(false);
const hovered = ref(false);
const imageSrc = computed(() => {
  if (props.hoverPlay && !hovered.value && props.m.name.toLowerCase().endsWith('.gif')) return props.m.thumb;
  return props.m.video ? props.m.fallback! : props.m.src;
});

onMounted(() => {
  if (video.value && !props.hoverPlay) observeVideo(video.value);
});
onBeforeUnmount(() => {
  if (video.value) unobserveVideo(video.value);
});

watch(
  () => props.hoverPlay,
  (hoverPlay) => {
    if (!video.value) return;
    if (!hoverPlay) {
      observeVideo(video.value);
      return;
    }
    unobserveVideo(video.value);
    rewind(video.value);
  },
);

function rewind(el: HTMLVideoElement): void {
  el.pause();
  el.currentTime = 0;
}

function sound(on: boolean): void {
  if (!video.value || (on && navigator.userActivation?.hasBeenActive === false)) return;
  video.value.muted = !on;
}

function hover(on: boolean, e: PointerEvent): void {
  if (!props.hoverPlay || e.pointerType !== 'mouse') return;
  hovered.value = on;
  if (!video.value) return;
  if (on) video.value.play().catch(() => {});
  else rewind(video.value);
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
    @pointerenter="hover(true, $event)"
    @pointerleave="hover(false, $event)"
    @error="failed = true"
  ></video>
  <LazyImage v-else :src="imageSrc" :thumb="m.thumb" :fallback="m.fallback" @pointerenter="hover(true, $event)" @pointerleave="hover(false, $event)" />
</template>
