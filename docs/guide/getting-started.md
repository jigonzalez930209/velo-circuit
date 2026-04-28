# Getting Started

## Installation

```bash
npm install velo-circuit
```

Or import directly from the source:

```ts
import { createEditor } from './src/core/index.ts'
```

## Minimal Example

```ts
import { createEditor } from 'velo-circuit'

const editor = createEditor()

editor.mount(document.getElementById('canvas'), {
  initialDsl: 'R0-p(R1,C1)-Wo2',
  width: 800,
  height: 600,
})

// React to circuit changes
editor.on('ast-changed', () => {
  const dsl = editor.getValue()
  console.log(dsl) // e.g. "R0-p(R1,C1)-Wo2"
})

// Listen for errors
editor.on('error', (e) => {
  console.error('Parse error:', e.payload)
})

// Update circuit programmatically
editor.setValue('R0-C1-L2')

// Undo / redo
editor.undo()
editor.redo()

// Cleanup
editor.destroy()
```

## What is a Circuit DSL?

Circuits are described with the Boukamp notation, used in electrochemical impedance spectroscopy (EIS).

| Symbol | Meaning | Example |
|--------|---------|---------|
| `-` | Series connection | `R0-C1` |
| `p(a,b)` | Parallel connection | `p(R0,C1)` |
| `R` | Resistor | `R0` |
| `C` | Capacitor | `C1` |
| `L` | Inductor | `L2` |
| `Q` | CPE | `Q0` |
| `W`, `Ws`, `Wo` | Warburg | `Wo3` |

## Next Steps

- [Build your first circuit](/examples/basic-circuit)
- [Understand the architecture](/guide/architecture)
- [Learn the Boukamp DSL](/guide/boukamp-dsl)