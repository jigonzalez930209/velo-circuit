# Astro

Astro islands require client-side hydration. The circuit editor is mounted only in the browser.

## Astro Component

```astro
---
// Editor.astro
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
      console.log(editor.getValue())
    })
  }
</script>
```

## Client Directive

Use `client:load` if you need the editor interactive immediately:

```astro
---
import CircuitEditor from './Editor.astro'
---
<CircuitEditor client:load initialDsl="R0-p(R1,C1)" />

## Static Build

The editor is always client-side. Astro's static build handles this naturally — the component renders an empty container on the server, and the script hydrates it in the browser.

## Multiple Editors

```js
const editors = new Map()

document.querySelectorAll('[data-circuit-editor]').forEach(el => {
  const id = (el as HTMLElement).dataset.circuitEditor
  if (id) {
    editors.set(id, mountAstroCircuitEditor(el as HTMLElement, { id }))
  }
})

// Cleanup on navigate
window.addEventListener('beforeunload', () => {
  editors.forEach(e => e.destroy())
})
```