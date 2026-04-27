# Changelog

All notable changes to this project will be documented in this file.

## [0.1.0] — 2026-04-26

### Added

- `core/domain/circuit.ts` — ElementKind, CircuitNode, ELEMENT_KINDS, traversal helpers
- `core/domain/graph.ts` — EditableGraph, ElementNode, Port, Connection
- `core/domain/document.ts` — CircuitDocument, ViewportState, SelectionState, HistoryState
- `core/domain/validation.ts` — ValidationError, ValidationWarning, ValidationIssue
- `core/domain/commands.ts` — All editor command types
- `core/domain/diagnostics.ts` — Diagnostic, filterErrors, filterWarnings
- `core/domain/translator.ts` — astToGraph(), graphToAst()
- `core/domain/persistence.ts` — serializeCircuit(), deserializeCircuit(), circuitToJson()
- `core/state/store.ts` — createStore() with undo/redo and pub/sub
- `core/parser-bridge/lexer.ts` — tokenize() with position tracking
- `core/parser-bridge/parser.ts` — parseBoukamp() recursive descent parser
- `core/parser-bridge/serializer.ts` — serialize() AST → canonical Boukamp DSL
- `core/parser-bridge/validate.ts` — duplicate ID detection, DC path warnings
- `core/layout/layout-engine.ts` — buildLayout(), computeBounds()
- `core/render-svg/symbols.ts` — SVG symbols for R, C, L, Q, W, Ws, Wo; DEFAULT_THEME
- `core/render-svg/renderer.ts` — renderCircuit()
- `core/render-svg/renderer-ex.ts` — renderCircuitEx(), renderDocument(), extractSvgSnapshot()
- `core/render-svg/themes.ts` — DARK_THEME, light/dark themes, buildThemeCSS()
- `core/render-svg/viewport.ts` — createViewportController(), zoom, pan, fit-to-view
- `core/editor/core.ts` — createEditor() with mount, getValue, setValue, dispatch, undo/redo, events
- `core/editor/toolbar.ts` — buildToolbarHTML(), buildToolbarCSS(), element palette
- `core/editor/panels.ts` — buildPropertiesPanelHTML(), buildDiagnosticsPanelHTML(), buildDslPanelHTML()
- `core/editor/interaction.ts` — attachInteractionEvents(), pointer, drag, pan, zoom, keyboard
- `core/editor/commands-builder.ts` — buildInsertElementCommand(), buildDeleteNodeCommand(), etc.
- Adapters: vanilla, react, vue, angular, astro, svelte
- Tests: 45 passing (parser, editor, layout, integration)
- TypeScript strict mode, no external runtime dependencies