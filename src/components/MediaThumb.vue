<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import type { Media } from '../lib/media';
import { observeVideo, onNear, unobserveNear, unobserveVideo } from '../lib/inview';
import LazyImage from './LazyImage.vue';

const props = defineProps<{ m: Media; hoverPlay?: boolean }>();

const video = ref<HTMLVideoElement | null>(null);
const frame = ref<HTMLCanvasElement | null>(null);
const failed = ref(false);
const hovered = ref(false);
const near = ref(false);
const drawn = ref(false);
const gif = computed(() => props.m.name.toLowerCase().endsWith('.gif'));
let image: HTMLImageElement | null = null;

onMounted(() => {
  if (!video.value) return;
  onNear(video.value, () => {
    near.value = true;
    prime();
  });
  if (!props.hoverPlay) observeVideo(video.value);
});
onBeforeUnmount(() => {
  if (!video.value) return;
  unobserveNear(video.value);
  unobserveVideo(video.value);
});

watch(
  () => props.hoverPlay,
  (hoverPlay) => {
    if (hoverPlay && gif.value) draw();
    if (!video.value) return;
    if (!hoverPlay) {
      observeVideo(video.value);
      return;
    }
    unobserveVideo(video.value);
    rewind(video.value);
    prime();
  },
);

async function prime(): Promise<void> {
  await nextTick();
  if (props.hoverPlay && near.value && video.value?.readyState === 0) video.value.load();
}

function rewind(el: HTMLVideoElement): void {
  el.pause();
  el.currentTime = 0;
}

function draw(): void {
  const c = frame.value;
  if (!image?.naturalWidth || !c) return;
  c.width = image.naturalWidth;
  c.height = image.naturalHeight;
  c.getContext('2d')?.drawImage(image, 0, 0);
  drawn.value = true;
}

function onImageLoad(e: Event): void {
  image = e.target as HTMLImageElement;
  if (props.hoverPlay && gif.value) draw();
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
    :poster="hoverPlay ? undefined : m.thumb"
    :style="hoverPlay ? { backgroundImage: `url(${m.thumb})` } : undefined"
    muted
    loop
    playsinline
    :preload="hoverPlay && near ? 'metadata' : 'none'"
    @mouseenter="sound(true)"
    @mouseleave="sound(false)"
    @pointerenter="hover(true, $event)"
    @pointerleave="hover(false, $event)"
    @error="failed = true"
  ></video>
  <template v-else>
    <LazyImage
      :src="m.video ? m.fallback! : m.src"
      :thumb="m.thumb"
      :fallback="m.fallback"
      @load="onImageLoad"
      @pointerenter="hover(true, $event)"
      @pointerleave="hover(false, $event)"
    />
    <canvas v-if="gif" v-show="hoverPlay && drawn && !hovered" ref="frame" class="media media--frame" aria-hidden="true"></canvas>
  </template>
</template>
