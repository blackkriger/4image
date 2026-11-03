const videos = new IntersectionObserver(
  (entries) => {
    for (const e of entries) {
      const video = e.target as HTMLVideoElement;
      if (e.isIntersecting) video.play().catch(() => {});
      else video.pause();
    }
  },
  { rootMargin: '100px' },
);

const nearCallbacks = new WeakMap<Element, () => void>();

const near = new IntersectionObserver(
  (entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      e.target.setAttribute('data-near', '');
      nearCallbacks.get(e.target)?.();
      nearCallbacks.delete(e.target);
      near.unobserve(e.target);
    }
  },
  { rootMargin: '300px' },
);

export const observeVideo = (el: HTMLVideoElement): void => videos.observe(el);
export const unobserveVideo = (el: HTMLVideoElement): void => videos.unobserve(el);
export const observeNear = (el: Element): void => near.observe(el);
export const unobserveNear = (el: Element): void => {
  nearCallbacks.delete(el);
  near.unobserve(el);
};
export const onNear = (el: Element, fn: () => void): void => {
  nearCallbacks.set(el, fn);
  near.observe(el);
};
