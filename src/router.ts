import { createRouter, createWebHistory } from 'vue-router';
import Boards from './routes/Boards.vue';
import Catalog from './routes/Catalog.vue';
import Thread from './routes/Thread.vue';

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: Boards },
    {
      path: '/:board([a-z0-9]+)',
      component: Catalog,
      children: [{ path: ':thread(\\d+)', component: Thread }],
    },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
  scrollBehavior(to, from, saved) {
    if (saved) return saved;
    return to.params.board === from.params.board ? false : { top: 0 };
  },
});
