import https from 'node:https';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

const agent = process.env.HTTPS_PROXY ? new https.Agent({ proxyEnv: process.env }) : undefined;

export default defineConfig({
  plugins: [vue()],
  server: {
    host: '127.0.0.1',
    port: 5175,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'https://a.4cdn.org',
        changeOrigin: true,
        agent,
        rewrite: (p) => p.replace(/^\/api/, ''),
      },
      '/img': {
        target: 'https://i.4cdn.org',
        changeOrigin: true,
        agent,
        rewrite: (p) => p.replace(/^\/img/, ''),
      },
    },
  },
});
