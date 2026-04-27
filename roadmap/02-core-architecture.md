# Part 2 — Core Architecture ✅

## Goal

Design a modular core that clearly separates domain, state, rendering, interaction, and adapters.

## Main Layers

- `core/domain`: circuit types, rules, commands, and contracts. ✅
- `core/parser-bridge`: interface with the existing Boukamp parser/serializer. ✅
- `core/state`: internal store, history, and selection. ✅
- `core/layout`: geometry and route calculations. ✅
- `core/render-svg`: SVG tree generation and updates. ✅
- `core/editor`: event orchestration and interactions. ✅
- `adapters/*`: per-framework bindings. [Pending — Phase 6]

## Implemented Modules

```
src/core/
  domain/
    circuit.ts      → ElementKind enum, CircuitNode, ELEMENT_KINDS, traversal helpers
    graph.ts        → EditableGraph, ElementNode, Port, Connection
    document.ts     → CircuitDocument, ViewportState, SelectionState, HistoryState
    validation.ts   → ValidationError, ValidationWarning, ValidationIssue
    commands.ts     → All command types: insert, delete, move, load, viewport-change, etc.
    diagnostics.ts  → Diagnostic, filterErrors, filterWarnings
    translator.ts   → astToGraph(), graphToAst()
    persistence.ts  → serializeCircuit(), deserializeCircuit(), circuitToJson()
  parser-bridge/
    lexer.ts        → tokenize() with position tracking
    parser.ts       → parseBoukamp() recursive descent parser
    serializer.ts   → serialize() AST → canonical Boukamp DSL
    validate.ts     → validate() duplicate ID detection, DC path warnings
    index.ts        → createAdapter(), parseBoukamp, serialize, validate exports
  state/
    store.ts        → createStore() with undo/redo and pub/sub
  layout/
    layout-engine.ts → buildLayout(), computeBounds()
  render-svg/
    symbols.ts       → SVG symbols for R, C, L, Q, W, Ws, Wo; DEFAULT_THEME
    renderer.ts      → renderCircuit(), renderCircuitToElement(), extractSvgString()
  editor/
    index.ts        → createEditor() — mount, getValue, setValue, dispatch, undo, redo, on
```

## Key Contracts

- `CircuitParserAdapter`: parses DSL to AST and serializes AST to DSL. ✅
- `LayoutEngine`: translates AST/graph to boxes, ports, and connections. ✅
- `SvgRenderer`: paints and updates SVG primitives. ✅
- `EditorController`: exposes commands, events, and lifecycle. ✅
- `HostAdapter`: connects the editor to each host framework. [Pending — Phase 6]

## Architectural Decisions

- Use a command-driven architecture to ease `undo/redo`. ✅
- Keep state immutable at public operation level, even if internally optimized. ✅
- Separate `semantic model` from `visual model`. ✅
- Define a small, stable API for the host: `mount`, `update`, `destroy`, `getState`, `dispatch`. ✅

## Core Internal Phases

1. Define contracts and base types. ✅
2. Implement store and command system. ✅
3. Implement deterministic layout. ✅
4. Implement incremental SVG renderer. ✅
5. Implement editor controller. ✅

## Tests

- `tests/parser.test.ts` — 18 tests: lexer, parser, serializer, validator ✅
- `tests/editor.test.ts` — 5 tests: createEditor, mount, setValue/getValue, undo/redo ✅
- **23/23 tests passing**

## Exit Criteria

✅ Architecture is ready — `core` runs in a simple DOM environment without React or any other framework.

## Next

→ [Part 3 — Circuit Model and DSL ✅](./03-circuit-model-and-dsl.md)