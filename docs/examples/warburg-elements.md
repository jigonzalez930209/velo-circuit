# Warburg Elements

Warburg elements model diffusion processes in electrochemical systems. Three variants exist.

## Three Warburg Types

### Infinite Warburg (`W`)

Models semi-infinite linear diffusion. 45° line on Nyquist plot.

```ts
editor.setValue('R0-p(R1,C1)-W2')
```

### Warburg Short (`Ws`)

Diffusion through a finite layer with transmissive boundary.

```
R0-p(R1,C1)-Ws2
```

### Warburg Open (`Wo`)

Diffusion to a reflecting boundary. Common in coated electrodes.

```ts
editor.setValue('R0-p(R1,C1)-Wo2')
```

## When to Use Each

| Type | Use Case | Nyquist Shape |
|------|---------|---------------|
| `W` | Semi-infinite diffusion | 45° line |
| `Ws` | Finite layer, transmissive boundary | Curved arc |
| `Wo` | Finite layer, reflecting boundary | Vertical spike |

## Physical Meaning

- `W` — ions diffuse freely into the electrolyte
- `Ws` — diffusion limited by a finite layer thickness
- `Wo` — diffusion with reflecting boundary at electrode surface

## SVG Symbols

Each Warburg type has a distinct SVG symbol:
- **W**: Diagonal line at 45° with vertical bar
- **Ws**: Warburg symbol with capped (short-circuit) end bar
- **Wo**: Warburg symbol with open end bars

## Full Randles-Warburg Model

```ts
// Randles with finite Warburg (common in batteries and fuel cells)
editor.setValue('R0-p(R1,C1)-Wo2')

// Or with CPE instead of pure capacitor
editor.setValue('R0-p(R1,Q1)-Wo2')
```

## Next

[Build nested circuits](/examples/nested-circuits)