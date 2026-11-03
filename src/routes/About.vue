<script setup lang="ts">
import { onMounted } from 'vue';
import { ARCHIVES, hostName } from '../lib/archives';
import { setTitle } from '../lib/title';

const archives = Object.entries(ARCHIVES).map(([host, boards]) => ({ host, name: hostName(host), boards }));

onMounted(() => setTitle());
</script>

<template>
  <main class="wrap about">
    <div class="about__intro">
      <h1 class="about__title"><span class="accent">4</span>image</h1>
      <p class="about__lead">An image-first viewer for 4chan. Boards open as a gallery, threads as a grid of images, GIFs and videos.</p>
    </div>

    <section class="about__section">
      <h2 class="about__label mono">Archives</h2>
      <p>Threads that are gone from 4chan load from public archives. Thanks to them for keeping the history.</p>
      <div class="about__archives">
        <div v-for="a in archives" :key="a.host" class="about__archive">
          <a :href="`https://${a.host}`" target="_blank" rel="noopener noreferrer">{{ a.name }}</a>
          <span class="mono muted about__boards">
            <span v-for="b in a.boards" :key="b">/{{ b }}/</span>
          </span>
        </div>
      </div>
    </section>

    <section class="about__section">
      <h2 class="about__label mono">Not 4chan</h2>
      <p>4image is an independent viewer and is not affiliated with 4chan. Posts and files belong to their authors, and this site only displays them with a short-lived cache.</p>
    </section>

    <section class="about__section">
      <div class="about__by">
        <h2 class="about__label mono">Made by <a href="https://github.com/blackkriger" target="_blank" rel="noopener noreferrer">blackkriger</a></h2>
        <a href="https://x.com/blackkriger" target="_blank" rel="noopener noreferrer" class="about__social" aria-label="blackkriger on X">
          <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
        </a>
        <a href="https://t.me/lodosstousenki" target="_blank" rel="noopener noreferrer" class="about__social" aria-label="blackkriger on Telegram">
          <svg viewBox="3.95 5.5 14.2 14.2" fill="currentColor" aria-hidden="true">
            <path d="M16.906 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
          </svg>
        </a>
      </div>
      <p>4image is open source on <a href="https://github.com/blackkriger/4image" target="_blank" rel="noopener noreferrer">GitHub</a>, where bug reports and feature requests are welcome.</p>
    </section>

    <section class="about__section">
      <h2 class="about__label mono">Support</h2>
      <p>Hosting is paid out of pocket. If 4image is useful to you, you can <a href="https://boosty.to/blackkriger/donate" target="_blank" rel="noopener noreferrer" class="about__strong">help cover it</a>.</p>
    </section>
  </main>
</template>
