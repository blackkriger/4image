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

const near = new IntersectionObserver(
  (entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      e.target.setAttribute('data-near', '');
      near.unobserve(e.target);
    }
  },
  { rootMargin: '300px' },
);

export const observeVideo = (el: HTMLVideoElement): void => videos.observe(el);
export const unobserveVideo = (el: HTMLVideoElement): void => videos.unobserve(el);
export const observeNear = (el: Element): void => near.observe(el);
export const unobserveNear = (el: Element): void => near.unobserve(el);
