<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue';

const props = defineProps<{ at: number }>();

const now = ref(Date.now());
const clock = window.setInterval(() => (now.value = Date.now()), 1000);
const seconds = computed(() => Math.max(0, Math.round((now.value - props.at) / 1000)));

onBeforeUnmount(() => clearInterval(clock));
</script>

<template>updated {{ seconds }}s ago</template>
