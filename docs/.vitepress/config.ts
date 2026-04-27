import { defineConfig } from 'vitepress';
import { resolve } from 'path';

export default defineConfig({
  base: '/velo-circuit/',
  title: 'Velo Circuit Editor',
  description: 'Framework-agnostic SVG circuit editor based on the Boukamp DSL',
  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }],
  ],
  vite: {
    resolve: {
      alias: {
        '/src/core': resolve(__dirname, '../../src/core'),
        '/src/adapters': resolve(__dirname, '../../src/adapters'),
      },
    },
    optimizeDeps: {
      include: ['vue', 'react', 'react-dom'],
    },
  },
  themeConfig: {
    logo: '/favicon.svg',
    nav: [
      { text: 'Guide', link: '/guide/getting-started', activeMatch: '/guide/' },
      { text: 'Examples', link: '/examples/basic-circuit', activeMatch: '/examples/' },
      { text: 'API', link: '/api/core', activeMatch: '/api/' },
      { text: 'Adapters', link: '/adapters/vanilla', activeMatch: '/adapters/' },
      { text: 'Reference', link: '/reference/boukamp-syntax', activeMatch: '/reference/' },
      { text: 'Playground', link: '/playground/', activeMatch: '/playground/' },
    ],
    sidebar: {
      '/guide/': [
        { text: 'Guide', items: [
          { text: 'Getting Started', link: '/guide/getting-started' },
          { text: 'Architecture', link: '/guide/architecture' },
          { text: 'Core Concepts', link: '/guide/core-concepts' },
          { text: 'Boukamp DSL', link: '/guide/boukamp-dsl' },
        ]},
      ],
      '/examples/': [
        { text: 'Examples', items: [
          { text: 'Basic Circuit', link: '/examples/basic-circuit' },
          { text: 'Randles Circuit', link: '/examples/randles-circuit' },
          { text: 'Warburg Elements', link: '/examples/warburg-elements' },
          { text: 'Nested Circuits', link: '/examples/nested-circuits' },
          { text: 'CPE and Complex', link: '/examples/cpe-and-complex' },
        ]},
      ],
      '/api/': [
        { text: 'API', items: [
          { text: 'Core', link: '/api/core' },
          { text: 'Editor', link: '/api/editor' },
          { text: 'Parser', link: '/api/parser' },
          { text: 'Layout', link: '/api/layout' },
          { text: 'Render & Themes', link: '/api/render' },
        ]},
      ],
      '/adapters/': [
        { text: 'Adapters', items: [
          { text: 'Vanilla JS', link: '/adapters/vanilla' },
          { text: 'React', link: '/adapters/react' },
          { text: 'Vue 3', link: '/adapters/vue' },
          { text: 'Angular', link: '/adapters/angular' },
          { text: 'Astro', link: '/adapters/astro' },
          { text: 'Svelte', link: '/adapters/svelte' },
        ]},
      ],
      '/reference/': [
        { text: 'Reference', items: [
          { text: 'Boukamp Syntax', link: '/reference/boukamp-syntax' },
          { text: 'Element Types', link: '/reference/element-types' },
        ]},
      ],
      '/playground/': [
        { text: 'Playground', items: [
          { text: 'Overview', link: '/playground/' },
        ]},
      ],
    },
    socialLinks: [
      { icon: 'github', link: 'https://github.com/velo-circuit/velo-circuit' },
    ],
  },
});
