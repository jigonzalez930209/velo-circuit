# Part 3 — Circuit Model and DSL ✅

## Goal

Define robust translation between the Boukamp DSL, the semantic AST, the editable graph, and visual metadata.

## Required Models

- `Semantic AST`: faithful to the Boukamp language. ✅
  - `src/core/domain/circuit.ts` — `CircuitNode`, `ElementKind`, `ELEMENT_KINDS`
- `Editable graph`: nodes, ports, connections, and groups. ✅
  - `src/core/domain/graph.ts` — `EditableGraph`, `ElementNode`, `Port`, `Connection`
- `View model`: positions, bounds, layers, anchors, and visual states. ✅
  - Layout computed via `src/core/layout/layout-engine.ts` → `buildLayout()`
- `Document model`: complete snapshot for persistence and future collaboration. ✅
  - `src/core/domain/document.ts` — `CircuitDocument`, `ViewportState`, `SelectionState`, `HistoryState`

## Integration Strategy with the Existing Parser

- Wrap the current module in `CircuitParserAdapter`. ✅ — `src/core/parser-bridge/index.ts`
- Translate external AST to internal canonical types. ✅
- Isolate parse and validation errors in a uniform format. ✅ — `LexError`, `ParseError`, `ValidationIssue`
- Allow the parser to be swapped in the future without rewriting the editor. ✅

## Conversion Operations

- `dsl -> ast` ✅ — `parseBoukamp()` in `parser-bridge/parser.ts`
- `ast -> graph` ✅ — `buildLayout()` in `layout/layout-engine.ts`
- `graph -> ast` ✅ — `astToGraph()` in `domain/translator.ts`
- `ast -> dsl` ✅ — `serialize()` in `parser-bridge/serializer.ts`
- `ast -> validation issues` ✅ — `validate()` in `parser-bridge/validate.ts`

## Normalization Rules

- Stable internal IDs for visual nodes and branches. ✅ — `node-${counter}` in `translator.ts`
- Preserve semantics even when visual layout changes. ✅
- Always serialize in canonical form to avoid noisy diffs. ✅ — `serialize()` produces canonical DSL
- Keep visual metadata outside the pure DSL. ✅ — `CircuitDocument.metadata`

## Minimum Document State ✅

```ts
// src/core/domain/document.ts
interface CircuitDocument {
  ast: CircuitNode;
  graph: EditableGraph;
  viewport: ViewportState;
  selection: SelectionState;
  history: HistoryState;
  diagnostics: Diagnostic[];
  metadata: DocumentMetadata;
}
```

## Work by Sub-Phases

1. Shared base types. ✅
2. Adapter for the current parser. ✅ — `CircuitParserAdapter` via `createAdapter()`
3. AST <-> graph translator. ✅ — `src/core/domain/translator.ts`
4. JSON persistence model. ✅ — `src/core/domain/persistence.ts`
5. Incremental validation rules. ✅ — `src/core/parser-bridge/validate.ts`

## Tests

- Round-trip: `parseBoukamp(dsl) -> serialize() == dsl` ✅
- Duplicate ID detection ✅
- Valid Randles circuit passes with no errors ✅

## Acceptance Criteria ✅

- Every significant visual operation can be converted back to DSL. ✅
- Importing and exporting a circuit loses no semantic information. ✅
- Parse and validation errors are reflected in UI with clear location. ✅

## Next

→ [Part 4 — SVG Render and Theme System](./04-svg-render-and-themes.md)