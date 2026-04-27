# Velo Circuit Editor

Framework-agnostic SVG circuit editor based on the Boukamp DSL notation for electrochemical impedance spectroscopy (EIS).

## Features

- Parse and serialize the Boukamp DSL notation (`R0-p(R1,C1)-Wo2`)
- Visual circuit editor with SVG rendering
- Framework-agnostic core — no external UI dependencies
- Official adapters: React, Vue, Angular, Astro, Svelte, Vanilla
- Dark and light theme support
- Undo/redo, drag, zoom, pan
- Real-time validation and diagnostics

## Quick Start

```bash
# Install
npm install

# Type check
npm run typecheck

# Run tests
npm test

# Build
npm run build
```

## Usage (Vanilla)

```ts
import { createEditor } from 'velo-circuit-editor';

const editor = createEditor();
editor.mount(document.getElementById('canvas'), {
  initialDsl: 'R0-p(R1,C1)-Wo2',
  width: 800,
  height: 600,
});

// React to changes
editor.on('ast-changed', () => {
  console.log(editor.getValue()); // "R0-p(R1,C1)-Wo2"
});

// Update from DSL
editor.setValue('R0-C1-L2');

// Get full document state
const doc = editor.getDocument();

// Undo / redo
editor.undo();
editor.redo();
```

## Supported Element Types

| Code | Element |
|------|---------|
| `R` | Resistor |
| `C` | Capacitor |
| `L` | Inductor |
| `Q` | CPE (Constant Phase Element) |
| `W` | Warburg Infinite |
| `Ws` | Warburg Short |
| `Wo` | Warburg Open |

## Architecture

```
src/core/
  domain/        — circuit types, AST, graph, document, commands, validation
  state/          — reactive store with undo/redo
  parser-bridge/  — lexer, parser, serializer, validator
  layout/         — automatic node positioning
  render-svg/     — SVG generation, themes, viewport
  editor/         — editor controller, toolbar, panels, interaction
src/adapters/     — React, Vue, Angular, Astro, Svelte, Vanilla
```

## License

MIT