import { createRouter, createWebHistory } from 'vue-router';
import About from './routes/About.vue';
import Boards from './routes/Boards.vue';
import Catalog from './routes/Catalog.vue';
import Thread from './routes/Thread.vue';

const thread = [{ path: ':thread(\\d+)', component: Thread }];

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: Boards },
    { path: '/archive', component: Boards, meta: { archive: true } },
    { path: '/about', name: 'about', component: About },
    { path: '/:board([a-z0-9]+)', component: Catalog, children: thread },
    { path: '/:board([a-z0-9]+)/archive', component: Catalog, meta: { archive: true }, children: thread },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
  scrollBehavior(to, from, saved) {
    if (saved) return saved;
    return to.params.board === from.params.board && !!to.meta.archive === !!from.meta.archive ? false : { top: 0 };
  },
});
