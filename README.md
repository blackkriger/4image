# 4image

Image-first viewer for 4chan boards and threads.

- Board catalog 
- Thread as a grid of all its images, or as a text feed with quote previews
- Image viewer with zoom, pan, keyboard and navigation 

## Development

```bash
npm install
npm run dev
```

The dev server runs on http://127.0.0.1:5175 and proxies `/api/*` to `https://a.4cdn.org` and `/img/*` to `https://i.4cdn.org`. If 4chan is only reachable through a local proxy, pass it in `HTTPS_PROXY`:

```bash
HTTPS_PROXY=http://127.0.0.1:1080 npm run dev
```

## Build

```bash
npm run build
```

The static site lands in `dist/`. In production nginx serves it and proxies `/api/*` and `/img/*` the same way, with a cache (`deploy/nginx.conf`).
