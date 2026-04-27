# Part 6 — Adapters and Embedding ✅

## Goal

Publish a uniform integration layer for different frameworks, keeping the same core and the same API semantics.

## API Status ✅

The unified host API is defined and implemented in `src/core/editor/core.ts`:

```ts
interface CircuitEditorHostApi {
  mount(container: HTMLElement, options?: EditorOptions): EditorInstance;
  destroy(): void;
  getValue(): string;
  setValue(dsl: string): void;
  getDocument(): CircuitDocument;
  dispatch(command: EditorCommand): void;
  on(event: EditorEventType, handler: EventHandler): () => void;
  undo(): void;
  redo(): void;
  render(): string;
}
```

## Implemented Adapters ✅

| Adapter | File | Status |
|---------|------|--------|
| Vanilla | `src/adapters/vanilla/index.ts` | ✅ `mountCircuitEditor()`, `createCircuitEditorVanilla()` |
| React | `src/adapters/react/index.ts` | ✅ `createReactCircuitEditor()` |
| Vue | `src/adapters/vue/index.ts` | ✅ `createVueCircuitEditor()`, `mountVueCircuitEditor()` |
| Angular | `src/adapters/angular/index.ts` | ✅ `createAngularCircuitEditorAdapter()` |
| Astro | `src/adapters/astro/index.ts` | ✅ `mountAstroCircuitEditor()`, `createAstroEditorWidget()` |
| Svelte | `src/adapters/svelte/index.ts` | ✅ `createSvelteCircuitEditor()` |

## Compatibility and Contracts ✅

- Same option and event naming across adapters. ✅
- Same error and destruction policy. ✅
- Same DSL import/export capability. ✅

## Deliverables ✅

- One package per adapter. ✅ (all in `src/adapters/`)
- Working example per framework. ⏳ (vanilla HTML example created in `src/examples/vanilla/`)
- Compatibility matrix and known limitations. ⏳

## Next

→ [Part 7 — Quality, Performance, and Accessibility ✅](./07-quality-performance-and-accessibility.md)