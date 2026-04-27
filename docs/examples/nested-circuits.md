# Nested Circuits

Circuits can have arbitrarily deep nesting of series and parallel groups.

## Single Nesting

A parallel branch inside a parallel:

```
p(R0,p(C1,Q2))
```

Structure:
```
        ┌──[ C1 ]──┐
        │           │
[ R0 ]──┤           ├──
        │           │
        └──[ Q2 ]──┘
```

## Double Nesting

```ts
editor.setValue('p(R0,p(C1,p(Q2,Wo3)))')
```

## Series Inside Parallel

Use series elements within parallel branches:

```ts
editor.setValue('R0-p(R1,C1)')
// R0 in series with a parallel group of R1 and C1
```

## Arbitrary Depth

```ts
// Deep nesting is supported without limit
editor.setValue('R0-p(R1,p(C1,p(Q2,Wo3)))')
```

## Validation

Deep circuits are validated for duplicate IDs:

```ts
const result = parseBoukamp('p(R0,p(R0,C1))')
// error: R0 appears more than once. Each element must have a unique identifier.
```

## Performance

The layout engine handles deep circuits deterministically:

```ts
const graph = buildLayout(ast)
const bounds = computeBounds(graph)
// graph.nodes.size reflects total element count + junction nodes
```

## Example Use Case

Modeling a multi-layer electrochemical cell:

```
R0-p(R1,C1)-p(R2,Q2)
```

## Next

[Model CPE and complex elements](/examples/cpe-and-complex)