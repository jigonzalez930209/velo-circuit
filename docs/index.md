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
  - title: Zero Dependencies
    details: The core runs without any external runtime dependencies. Only TypeScript and Vitest for development.
  - title: Framework Agnostic
    details: Official adapters for React, Vue, Angular, Astro, Svelte, and Vanilla JS — same API everywhere.
  - title: SVG Only
    details: Every pixel is rendered with SVG primitives. No canvas, no WebGL, no external diagram libraries.
  - title: Boukamp DSL
    details: Parse and serialize the standard Boukamp notation used in electrochemical impedance spectroscopy.
  - title: Strict TypeScript
    details: Full type safety in strict mode with zero type errors across the entire codebase.
  - title: Test Coverage
    details: 45 tests covering lexer, parser, serializer, layout, renderer, editor, and integration.
---