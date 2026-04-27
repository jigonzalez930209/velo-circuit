# Vanilla JS

The vanilla adapter is the reference implementation. No framework needed.

## Installation

```html
<script type="module">
  import { mountCircuitEditor } from './dist/velo-circuit-editor.es.js'
</script>
```

Or from source:

```html
<script type="module">
  import { createEditor } from './src/core/index.ts'
</script>
```

## Basic Mount

```html
<div id="editor"></div>
<div id="dsl-output"></div>

<script type="module">
  import { createEditor } from 'velo-circuit-editor'

  const editor = createEditor()
  editor.mount(document.getElementById('editor'), {
    initialDsl: 'R0-p(R1,C1)-Wo2',
    width: 800,
    height: 600,
  })

  editor.on('ast-changed', () => {
    document.getElementById('dsl-output').textContent = editor.getValue()
  })
</script>
```

## With Error Handling

```js
editor.on('error', (e) => {
  const { position, message } = e.payload
  showToast(`Error at ${position}: ${message}`)
})
```

## Dynamic Updates

```js
// From DSL input
document.getElementById('dsl-input').addEventListener('change', (e) => {
  editor.setValue(e.target.value)
})

// From element palette
document.querySelectorAll('[data-kind]').forEach(btn => {
  btn.addEventListener('click', () => {
    const kind = btn.dataset.kind
    const dsl = editor.getValue()
    editor.setValue(`${dsl}-${kind}0`)
  })
})
```

## Export

```js
const svg = editor.render()
const blob = new Blob([svg], { type: 'image/svg+xml' })
const url = URL.createObjectURL(blob)
window.open(url)
```