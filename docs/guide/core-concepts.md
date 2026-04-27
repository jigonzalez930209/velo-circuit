# Core Concepts

## AST Model

The abstract syntax tree is the canonical representation of a circuit:

```ts
type CircuitNode =
  | { type: 'element'; kind: ElementKind; id: number; paramOffset: number }
  | { type: 'series'; children: CircuitNode[] }
  | { type: 'parallel'; children: CircuitNode[] }
```

For the DSL string `R0-p(R1,C1)`:

```
Series
├── Element(R, id=0)
└── Parallel
    ├── Element(R, id=1)
    └── Element(C, id=1)
```

## The Command System

Every change to the circuit goes through a command:

```ts
// Load a circuit from DSL
dispatch({ type: 'load-circuit', ast })

// Select nodes
dispatch({ type: 'set-selection', selectedIds: ['node-3'] })

// Insert an element
dispatch({ type: 'insert-element', kind: 'C', elementId: 2, paramOffset: 0 })

// Move a node
dispatch({ type: 'move-node', nodeId: 'node-1', deltaX: 10, deltaY: 0 })

// Delete a node
dispatch({ type: 'delete-node', nodeId: 'node-1' })
```

## The Editor Store

The store holds the full document and notifies subscribers on every change:

```ts
const store = createStore()
store.getAst()           // → CircuitNode
store.getViewport()       // → ViewportState
store.getSelection()      // → SelectionState
store.getDiagnostics()    // → Diagnostic[]

store.subscribe(event => {
  if (event.type === 'ast-changed') { /* re-render */ }
})

store.undo() // revert last command
store.redo() // reapply last undone command
```

## Event System

The editor emits typed events:

```ts
editor.on('mount', () => { console.log('ready') })
editor.on('ast-changed', () => updateUI(editor.getValue()))
editor.on('selection-changed', () => updateSelection())
editor.on('error', e => showError(e.payload))
editor.on('render', svg => container.innerHTML = svg)
```

## Theming

Two built-in themes:

```ts
import { DEFAULT_THEME, DARK_THEME, getTheme } from 'velo-circuit-editor'

renderCircuit(graph, viewport, { themeMode: 'dark' })
// or
renderCircuit(graph, viewport, { theme: DARK_THEME })
```

## Next

- [Learn the Boukamp DSL](/guide/boukamp-dsl)