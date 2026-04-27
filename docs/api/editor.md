# Editor API

The editor is the main entry point for building interactive circuit editors.

## createEditor

```ts
import { createEditor } from 'velo-circuit-editor'

const editor = createEditor()
```

## mount

```ts
editor.mount(container, options)
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `initialDsl` | `string` | `undefined` | Initial circuit DSL |
| `width` | `number` | `800` | Canvas width |
| `height` | `number` | `600` | Canvas height |
| `onEvent` | `EventHandler` | `undefined` | Global event handler |

## getValue / setValue

```ts
const dsl = editor.getValue()
// → 'R0-p(R1,C1)-Wo2'

editor.setValue('R0-C1-L2')
```

## getDocument

```ts
const doc = editor.getDocument()
// → CircuitDocument
```

## dispatch

```ts
import type { InsertElementCommand } from 'velo-circuit-editor'

editor.dispatch({
  type: 'insert-element',
  kind: ElementKind.Capacitor,
  elementId: 3,
  paramOffset: 0,
  parentId: null,
  position: -1,
} as InsertElementCommand)
```

## Events

```ts
editor.on('mount', () => console.log('ready'))
editor.on('ast-changed', () => update())
editor.on('selection-changed', () => updateSelection())
editor.on('viewport-changed', () => updateViewport())
editor.on('render', (e) => container.innerHTML = e.payload as string)
editor.on('error', (e) => showError(e.payload))
editor.on('command', (e) => log(e.payload))

// Returns unsubscribe function
const unsub = editor.on('ast-changed', handler)
unsub()
```

## undo / redo

```ts
editor.undo()
editor.redo()
```

## destroy

```ts
editor.destroy()
```

## Toolbar and Panels

```ts
import { buildToolbarHTML, buildToolbarCSS } from 'velo-circuit-editor'

document.head.innerHTML += `<style>${buildToolbarCSS()}</style>`
toolbar.innerHTML = buildToolbarHTML()
```

```ts
import { buildPropertiesPanelHTML, buildDiagnosticsPanelHTML } from 'velo-circuit-editor'

sidebar.innerHTML = buildPropertiesPanelHTML(node) +
                    buildDiagnosticsPanelHTML(issues)
```

## Interaction

```ts
import { attachInteractionEvents } from 'velo-circuit-editor'

attachInteractionEvents(container, {
  onToolSelect: (id) => selectTool(id),
  onToolAction: (id) => performAction(id),
})
```