import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { resolve } from 'node:path';

// index.html is the marketing homepage and the only page in the production
// build. The pages under dev/ (an index, the design-system showcase and the
// content-validation demo) are tooling: the dev server serves them at
// /dev/index.html, /dev/showcase.html and /dev/content-demo.html, but they are
// deliberately left out of `dist` so the built site is the site.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      input: { index: resolve(import.meta.dirname, 'index.html') },
    },
  },
  test: {
    include: ['tests/**/*.test.{ts,tsx}'],
    setupFiles: ['tests/setup.ts'],
  },
});
