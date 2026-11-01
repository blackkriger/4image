<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { Moon, Sun } from 'lucide-vue-next';
import { dark, toggleTheme } from '../lib/theme';

const route = useRoute();
const board = computed(() => route.params.board as string | undefined);
const thread = computed(() => route.params.thread as string | undefined);
</script>

<template>
  <header class="topbar">
    <div class="wrap wrap--full topbar__in">
      <RouterLink to="/" class="logo"><span>4</span>image</RouterLink>
      <nav v-if="board" class="crumbs mono" aria-label="Breadcrumb">
        <span aria-hidden="true">/</span>
        <RouterLink :to="`/${board}`" :aria-current="thread ? undefined : 'page'">{{ board }}</RouterLink>
        <span aria-hidden="true">/</span>
        <span v-if="thread" aria-current="page" class="crumbs__here">{{ thread }}</span>
      </nav>
      <div class="topbar__links" :class="{ 'topbar__links--wide': board }">
        <a href="https://boosty.to/blackkriger/donate" target="_blank" rel="noopener noreferrer">Help cover hosting</a>
        <span class="topbar__by">by <a href="https://github.com/blackkriger" target="_blank" rel="noopener noreferrer">blackkriger</a></span>
        <a href="https://github.com/blackkriger/4image" target="_blank" rel="noopener noreferrer" class="topbar__repo" aria-label="4image on GitHub">
          <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M10.226 17.284c-2.965-.36-5.054-2.493-5.054-5.256 0-1.123.404-2.336 1.078-3.144-.292-.741-.247-2.314.09-2.965.898-.112 2.111.36 2.83 1.01.853-.269 1.752-.404 2.853-.404 1.1 0 1.999.135 2.807.382.696-.629 1.932-1.1 2.83-.988.315.606.36 2.179.067 2.942.72.854 1.101 2 1.101 3.167 0 2.763-2.089 4.852-5.098 5.234.763.494 1.28 1.572 1.28 2.807v2.336c0 .674.561 1.056 1.235.786 4.066-1.55 7.255-5.615 7.255-10.646C23.5 6.188 18.334 1 11.978 1 5.62 1 .5 6.188.5 12.545c0 4.986 3.167 9.12 7.435 10.669.606.225 1.19-.18 1.19-.786V20.63a2.9 2.9 0 0 1-1.078.224c-1.483 0-2.359-.808-2.987-2.313-.247-.607-.517-.966-1.034-1.033-.27-.023-.359-.135-.359-.27 0-.27.45-.471.898-.471.652 0 1.213.404 1.797 1.235.45.651.921.943 1.483.943.561 0 .92-.202 1.437-.719.382-.381.674-.718.944-.943" />
          </svg>
        </a>
      </div>
      <button type="button" class="themetoggle" :aria-label="dark ? 'Switch to light theme' : 'Switch to dark theme'" @click="toggleTheme">
        <Sun v-if="dark" class="ic" />
        <Moon v-else class="ic" />
      </button>
    </div>
  </header>
</template>
