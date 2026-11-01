<script setup lang="ts">
import { nextTick, ref, watch } from 'vue';
import { ratio, type Media } from '../lib/media';

const WHEEL_STEP = 40;

const props = defineProps<{ items: Media[]; index: number }>();
const emit = defineEmits<{ (e: 'pick', i: number): void; (e: 'step', dir: number): void }>();

const strip = ref<HTMLElement | null>(null);
let wheelDelta = 0;

watch(
  () => props.index,
  async () => {
    await nextTick();
    strip.value?.querySelector('[aria-current="true"]')?.scrollIntoView({ inline: 'center', block: 'nearest' });
  },
  { immediate: true },
);

function onWheel(ev: WheelEvent): void {
  ev.preventDefault();
  wheelDelta += Math.abs(ev.deltaY) >= Math.abs(ev.deltaX) ? ev.deltaY : ev.deltaX;
  if (Math.abs(wheelDelta) < WHEEL_STEP) return;
  emit('step', wheelDelta > 0 ? 1 : -1);
  wheelDelta = 0;
}
</script>

<template>
  <div ref="strip" class="viewer__strip" @wheel="onWheel">
    <button
      v-for="(m, i) in items"
      :key="m.no"
      type="button"
      class="viewer__thumb"
      :aria-current="i === index"
      :aria-label="`Image ${i + 1}`"
      :style="{ aspectRatio: String(ratio(m.w, m.h, 0.5, 2)) }"
      @click="emit('pick', i)"
    >
      <img :src="m.thumb" alt="" loading="lazy" decoding="async" />
    </button>
  </div>
</template>
