# Astro

Astro islands require client-side hydration. The circuit editor is mounted only in the browser.

## Installation

```bash
npm install velo-circuit-editor
# or
pnpm add velo-circuit-editor
```

## Basic Astro Component

```astro
---
// src/components/CircuitEditor.astro
---

<div id="circuit-editor" style="width: 800px; height: 600px;"></div>

<script>
  import { mountAstroCircuitEditor } from 'velo-circuit-editor/adapters/astro'

  const container = document.getElementById('circuit-editor')
  if (container) {
    const editor = mountAstroCircuitEditor(container, {
      id: 'main-editor',
      initialDsl: 'R0-p(R1,C1)-Wo2',
    })

    editor.on('ast-changed', () => {
      console.log('DSL changed:', editor.getValue())
    })
  }
</script>
```

## With Client Directive

For interactive editors that load immediately:

```astro
---
// src/components/CircuitPlayground.astro
import CircuitEditor from './CircuitEditor.astro'
---

<CircuitEditor client:load initialDsl="R0-p(R1,C1)" />
```

## Using the Adapter API

### `mountAstroCircuitEditor`

Mounts an editor to a container element:

```astro
<script>
  import { mountAstroCircuitEditor } from 'velo-circuit-editor/adapters/astro'

  const container = document.getElementById('editor')
  if (container) {
    const editor = mountAstroCircuitEditor(container, {
      initialDsl: 'R0-C1',
      width: 800,
      height: 600,
      id: 'my-editor', // Optional: enables getAstroCircuitEditor
    })

    // Listen for changes
    editor.on('ast-changed', () => {
      console.log(editor.getValue())
    })
  }
</script>
```

### `getAstroCircuitEditor`

Retrieve a previously mounted editor by ID:

```astro
<script>
  import { getAstroCircuitEditor } from 'velo-circuit-editor/adapters/astro'

  // Get editor mounted with id 'main-editor'
  const editor = getAstroCircuitEditor('main-editor')
  if (editor) {
    editor.setValue('R0-p(R1,C1)-Wo2')
  }
</script>
```

### `unmountAstroCircuitEditor`

Clean up an editor instance:

```astro
<script>
  import { unmountAstroCircuitEditor } from 'velo-circuit-editor/adapters/astro'

  // Later, when navigating away or cleaning up
  unmountAstroCircuitEditor('main-editor')
</script>
```

## Complete Playground Example

Full-featured circuit playground with toolbar:

```astro
---
// src/components/CircuitPlayground.astro
---

<div class="playground-container">
  <div class="toolbar">
    <button data-element="R">Resistor (R)</button>
    <button data-element="C">Capacitor (C)</button>
    <button data-element="L">Inductor (L)</button>
    <button data-element="Q">CPE (Q)</button>
    <button data-element="W">Warburg (W)</button>
    <div class="spacer"></div>
    <button id="undo-btn">Undo</button>
    <button id="redo-btn">Redo</button>
  </div>

  <div id="circuit-editor" class="editor-container"></div>

  <div class="diagnostics">
    <strong>DSL:</strong> <span id="dsl-display">R0-p(R1,C1)</span>
  </div>
</div>

<script>
  import { mountAstroCircuitEditor, getAstroCircuitEditor } from 'velo-circuit-editor/adapters/astro'

  const container = document.getElementById('circuit-editor')!
  const dslDisplay = document.getElementById('dsl-display')!

  const editor = mountAstroCircuitEditor(container, {
    id: 'playground-editor',
    initialDsl: 'R0-p(R1,C1)',
  })

  editor.on('ast-changed', () => {
    dslDisplay.textContent = editor.getValue()
  })

  // Toolbar buttons
  document.querySelectorAll('[data-element]').forEach(btn => {
    btn.addEventListener('click', () => {
      const element = btn.getAttribute('data-element')!
      const current = editor.getValue()
      editor.setValue(current ? `${current}-${element}` : element)
    })
  })

  document.getElementById('undo-btn')?.addEventListener('click', () => {
    editor.undo()
  })

  document.getElementById('redo-btn')?.addEventListener('click', () => {
    editor.redo()
  })
</script>

<style>
  .playground-container {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding: 1rem;
    background: #1e1e1e;
    color: white;
    border-radius: 8px;
    height: 500px;
  }

  .toolbar {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  .toolbar button {
    padding: 6px 12px;
    background: #3a3a3a;
    color: white;
    border: 1px solid #555;
    border-radius: 4px;
    cursor: pointer;
  }

  .toolbar button:hover {
    background: #4a4a4a;
  }

  .spacer {
    flex: 1;
  }

  .editor-container {
    flex: 1;
    border: 1px solid #333;
    border-radius: 4px;
    overflow: hidden;
  }

  .diagnostics {
    background: #000;
    padding: 1rem;
    border-radius: 4px;
    font-family: monospace;
  }
</style>
```

## Multiple Editors

Managing several circuit editors on one page:

```astro
<script>
  import { mountAstroCircuitEditor } from 'velo-circuit-editor/adapters/astro'

  const editors = new Map()

  // Mount all editors found on the page
  document.querySelectorAll('[data-circuit-editor]').forEach(el => {
    const htmlEl = el as HTMLElement
    const id = htmlEl.dataset.circuitEditor || `editor-${editors.size}`
    editors.set(id, mountAstroCircuitEditor(htmlEl, { id }))
  })

  // Cleanup on page unload (important for SPA navigation)
  window.addEventListener('beforeunload', () => {
    editors.forEach(editor => editor.destroy())
    editors.clear()
  })

  // Or expose to window for debugging
  (window as any).__circuitEditors = editors
</script>
```

Usage:

```astro
<div data-circuit-editor="editor-1" style="width:400px;height:300px;"></div>
<div data-circuit-editor="editor-2" style="width:400px;height:300px;"></div>
```

## Static Build Behavior

The editor is always client-side:

1. **Server**: Astro renders an empty container `<div>`
2. **Browser**: The `<script>` tag mounts the editor
3. **Hydration**: User sees the interactive editor after JS loads

This means:
- No SEO content from the editor itself (it's interactive UI)
- Works with any Astro page rendering mode (SSG, SSR, hybrid)

## Framework-Specific Notes

### React/Vue/Svelte Islands

If using Astro with React/Vue/Svelte components:

```astro
---
// Use the framework component directly
import { CircuitEditor } from './CircuitEditor.tsx' // React example
---

<CircuitEditor client:load initialDsl="R0-p(R1,C1)" />
```

The Astro adapter is specifically for **vanilla JS** mounting within `.astro` files.

## API Reference

| Function | Description |
|----------|-------------|
| `mountAstroCircuitEditor(element, options)` | Mount editor to element |
| `getAstroCircuitEditor(id)` | Get mounted editor by ID |
| `unmountAstroCircuitEditor(id)` | Destroy editor by ID |
| `createAstroEditorWidget(containerId, options)` | Generate widget HTML string |