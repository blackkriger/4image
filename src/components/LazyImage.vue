<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { markFailed, markLoaded } from '../lib/media';
import { observeNear, unobserveNear } from '../lib/inview';

const props = defineProps<{ src: string; thumb?: string | null }>();

const img = ref<HTMLImageElement | null>(null);
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
    :src="src"
    :style="placeholder"
    alt=""
    loading="lazy"
    decoding="async"
    @load="markLoaded"
    @error="markFailed"
  />
</template>
