import { defineConfig } from 'vite';
import { resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  build: {
    lib: {
      entry: {
        'core/index': resolve(__dirname, 'src/core/index.ts'),
        'adapters/vanilla/index': resolve(__dirname, 'src/adapters/vanilla/index.ts'),
        'adapters/react/index': resolve(__dirname, 'src/adapters/react/index.ts'),
        'adapters/vue/index': resolve(__dirname, 'src/adapters/vue/index.ts'),
        'adapters/svelte/index': resolve(__dirname, 'src/adapters/svelte/index.ts'),
        'adapters/angular/index': resolve(__dirname, 'src/adapters/angular/index.ts'),
        'adapters/astro/index': resolve(__dirname, 'src/adapters/astro/index.ts'),
      },
      formats: ['es'],
    },
    rollupOptions: {
      external: ['react', 'react-dom', 'vue', 'svelte', '@angular/core'],
      output: {
        globals: {},
      },
    },
    outDir: 'dist',
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      '@core': resolve(__dirname, 'src/core'),
      '@adapters': resolve(__dirname, 'src/adapters'),
    },
  },
});