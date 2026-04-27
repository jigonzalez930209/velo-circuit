---
layout: home

hero:
  name: Velo Circuit Editor
  text: Framework-agnostic SVG circuit editor for electrochemical impedance spectroscopy
  tagline: No external dependencies · Pure SVG · TypeScript · 45 tests passing
  actions:
    - theme: brand
      text: Get Started
      link: /guide/getting-started
    - theme: alt
      text: View Examples
      link: /examples/basic-circuit
    - theme: alt
      text: API Reference
      link: /api/core

features:
  - icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none"><defs><linearGradient id="gf1" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#4cc9f0"/><stop offset="100%" style="stop-color:#4361ee"/></linearGradient></defs><circle cx="32" cy="32" r="26" stroke="url(#gf1)" stroke-width="3"/><circle cx="32" cy="32" r="18" stroke="url(#gf1)" stroke-width="2" stroke-dasharray="4 3"/><circle cx="32" cy="32" r="8" fill="url(#gf1)"/></svg>'
    title: Zero Dependencies
    details: The core runs without any external runtime dependencies. Only TypeScript and Vitest for development.
  - icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none"><defs><linearGradient id="gf2" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#4cc9f0"/><stop offset="100%" style="stop-color:#4361ee"/></linearGradient></defs><rect x="8" y="12" width="48" height="40" rx="4" stroke="url(#gf2)" stroke-width="3"/><path d="M8 24h48M8 40h48" stroke="url(#gf2)" stroke-width="1.5" opacity="0.5"/><circle cx="16" cy="18" r="2.5" fill="#ef4444"/><circle cx="24" cy="18" r="2.5" fill="#f59e0b"/><circle cx="32" cy="18" r="2.5" fill="#22c55e"/><path d="M20 52h24" stroke="url(#gf2)" stroke-width="3" stroke-linecap="round"/></svg>'
    title: Framework Agnostic
    details: Official adapters for React, Vue, Angular, Astro, Svelte, and Vanilla JS — same API everywhere.
  - icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none"><defs><linearGradient id="gf3" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#4cc9f0"/><stop offset="100%" style="stop-color:#4361ee"/></linearGradient></defs><rect x="6" y="6" width="52" height="52" rx="8" stroke="url(#gf3)" stroke-width="3"/><rect x="14" y="14" width="36" height="36" rx="4" stroke="url(#gf3)" stroke-width="2" opacity="0.5"/><circle cx="32" cy="32" r="12" stroke="url(#gf3)" stroke-width="3"/><path d="M32 20v-8M32 44v8M20 32h-8M44 32h8" stroke="url(#gf3)" stroke-width="2" stroke-linecap="round"/></svg>'
    title: SVG Only
    details: Every pixel is rendered with SVG primitives. No canvas, no WebGL, no external diagram libraries.
  - icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none"><defs><linearGradient id="gf4" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#4cc9f0"/><stop offset="100%" style="stop-color:#4361ee"/></linearGradient></defs><path d="M16 32h8l4-8 8 16 8-16 8 16 4-8h8" stroke="url(#gf4)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" fill="none"/><circle cx="32" cy="32" r="4" fill="url(#gf4)"/></svg>'
    title: Boukamp DSL
    details: Parse and serialize the standard Boukamp notation used in electrochemical impedance spectroscopy.
  - icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none"><defs><linearGradient id="gf5" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#4cc9f0"/><stop offset="100%" style="stop-color:#4361ee"/></linearGradient></defs><path d="M32 8L8 20v24L32 56l24-12V20L32 8z" stroke="url(#gf5)" stroke-width="3" stroke-linejoin="round"/><path d="M32 8v48M8 20l48 24M56 20L8 44" stroke="url(#gf5)" stroke-width="1.5" opacity="0.5"/></svg>'
    title: Strict TypeScript
    details: Full type safety in strict mode with zero type errors across the entire codebase.
  - icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none"><defs><linearGradient id="gf6" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#4cc9f0"/><stop offset="100%" style="stop-color:#4361ee"/></linearGradient></defs><circle cx="32" cy="28" r="20" stroke="url(#gf6)" stroke-width="3"/><path d="M32 8v8M32 40v8M12 28h8M44 28h8" stroke="url(#gf6)" stroke-width="2" stroke-linecap="round" opacity="0.5"/><path d="M20 48l8 8 16-16" stroke="url(#gf6)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><circle cx="32" cy="28" r="6" fill="url(#gf6)"/></svg>'
    title: Test Coverage
    details: 45 tests covering lexer, parser, serializer, layout, renderer, editor, and integration.
---