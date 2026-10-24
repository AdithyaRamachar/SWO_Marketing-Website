import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { resolve } from 'node:path';

// index.html is a developer index; dev/*.html are design-system and content
// demonstration pages. Phase D replaces index.html with the marketing page and
// should exclude dev/ from production builds.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      input: {
        index: resolve(import.meta.dirname, 'index.html'),
        showcase: resolve(import.meta.dirname, 'dev/showcase.html'),
        contentDemo: resolve(import.meta.dirname, 'dev/content-demo.html'),
      },
    },
  },
  test: {
    include: ['tests/**/*.test.{ts,tsx}'],
    setupFiles: ['tests/setup.ts'],
  },
});
