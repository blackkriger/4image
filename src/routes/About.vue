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
          <span class="mono muted">{{ a.boards.map((b) => `/${b}/`).join(' ') }}</span>
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
      </div>
      <p>4image is open source on <a href="https://github.com/blackkriger/4image" target="_blank" rel="noopener noreferrer">GitHub</a>, where bug reports and feature requests are welcome.</p>
    </section>

    <section class="about__section">
      <h2 class="about__label mono">Support</h2>
      <p>Hosting is paid out of pocket. If 4image is useful to you, you can <a href="https://boosty.to/blackkriger/donate" target="_blank" rel="noopener noreferrer" class="about__strong">help cover it</a>.</p>
    </section>
  </main>
</template>
