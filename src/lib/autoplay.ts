import { ref } from 'vue';
import { stored } from './storage';

const KEY = '4image:autoplay';

export const autoplay = ref(stored.get(KEY) !== '0');

export function toggleAutoplay(): void {
  autoplay.value = !autoplay.value;
  stored.set(KEY, autoplay.value ? '1' : '0');
}
