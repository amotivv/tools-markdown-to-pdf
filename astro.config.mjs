import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import netlify from '@astrojs/netlify';

export default defineConfig({
  integrations: [tailwind()],
  output: 'server',
  adapter: netlify(),
  vite: {
    build: {
      assetsInlineLimit: 0
    }
  },
  build: {
    assets: 'assets',
    inlineStylesheets: 'never'
  }
});
