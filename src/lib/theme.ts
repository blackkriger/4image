import { ref } from 'vue';
import { stored } from './storage';

const KEY = '4image:theme';
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
const saved = stored.get(KEY);

export const dark = ref(saved ? saved === 'dark' : prefersDark.matches);

function applyTheme(): void {
  document.documentElement.dataset.theme = dark.value ? 'dark' : 'light';
}

export function toggleTheme(): void {
  dark.value = !dark.value;
  stored.set(KEY, dark.value ? 'dark' : 'light');
  applyTheme();
}

prefersDark.addEventListener('change', (e) => {
  if (stored.get(KEY)) return;
  dark.value = e.matches;
  applyTheme();
});
applyTheme();
