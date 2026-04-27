# Randles Circuit

The Randles circuit is one of the most common equivalent circuit models in EIS. It models the interface between an electrode and an electrolyte.

## DSL

```
R0-p(R1,C1)
```

## Structure

```
        ┌──[ C1 ]──┐
[ R0 ]──┤          ├──
        └──[ R1 ]──┘
```

## Why Parallel Matters

The parallel branch `p(R1,C1)` represents the charge-transfer resistance (`R1`) in parallel with the double-layer capacitance (`C1`).

## Code

```ts
import { createEditor } from 'velo-circuit-editor'

const editor = createEditor()

editor.mount(document.getElementById('canvas'), {
  initialDsl: 'R0-p(R1,C1)',
  width: 700,
  height: 400,
})

editor.on('ast-changed', () => {
  const dsl = editor.getValue()
  document.getElementById('dsl-display').textContent = dsl
})
```

## Validation

```ts
const result = editor.getValidation()
if (result.hasErrors) {
  for (const issue of result.issues) {
    console.error(issue.message)
  }
}
```

## Adding Warburg

Extend the Randles model with a Warburg element to model diffusion:

```ts
editor.setValue('R0-p(R1,C1)-Wo2')
```

This adds a finite-length Warburg open element in series with the Randles branch, modeling semi-infinite diffusion.

## Using CPE Instead of Capacitor

Replace the ideal capacitor with a CPE for more realistic modeling:

```ts
editor.setValue('R0-p(R1,Q1)-Wo2')
```

The CPE element `Q` models non-ideal capacitive behavior with a fractional exponent `n`.

## Next

[Explore Warburg elements](/examples/warburg-elements)