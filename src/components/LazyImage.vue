<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { markFailed, markLoaded } from '../lib/media';
import { observeNear, unobserveNear } from '../lib/inview';

const props = defineProps<{ src: string; thumb?: string | null; fallback?: string }>();

const img = ref<HTMLImageElement | null>(null);
const current = ref(props.src);

watch(
  () => props.src,
  (src) => (current.value = src),
);

function onError(e: Event): void {
  if (props.fallback && current.value !== props.fallback) current.value = props.fallback;
  else markFailed(e);
}
const placeholder = computed(() => (props.thumb && props.thumb !== props.src ? { '--thumb': `url(${props.thumb})` } : undefined));

onMounted(() => {
  if (placeholder.value && img.value) observeNear(img.value);
});
onBeforeUnmount(() => {
  if (img.value) unobserveNear(img.value);
});
</script>

<template>
  <img
    ref="img"
    class="media"
    :src="current"
    :data-thumbed="fallback && current === fallback ? '' : undefined"
    :style="placeholder"
    alt=""
    loading="lazy"
    decoding="async"
    @load="markLoaded"
    @error="onError"
  />
</template>
