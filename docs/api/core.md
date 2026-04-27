# Core API

The core module exports all domain types, the parser bridge, and the state system.

## Types

### ElementKind

```ts
import { ElementKind } from 'velo-circuit-editor'

ElementKind.Resistor      // 'R'
ElementKind.Capacitor    // 'C'
ElementKind.Inductor     // 'L'
ElementKind.Cpe           // 'Q'
ElementKind.WarburgInfinite // 'W'
ElementKind.WarburgShort   // 'Ws'
ElementKind.WarburgOpen    // 'Wo'
```

### CircuitNode

```ts
import type { CircuitNode } from 'velo-circuit-editor'

type CircuitNode =
  | { type: 'element'; kind: ElementKind; id: number; paramOffset: number }
  | { type: 'series'; children: CircuitNode[] }
  | { type: 'parallel'; children: CircuitNode[] }
```

### EditableGraph

```ts
import type { EditableGraph } from 'velo-circuit-editor'

interface EditableGraph {
  nodes: Map<string, ElementNode>
  connections: Connection[]
  rootNodeId: string | null
}
```

## Serialization

```ts
import { serialize, deserialize } from 'velo-circuit-editor'

const dsl = serialize(ast)
// → 'R0-p(R1,C1)-Wo2'

const ast = deserialize(dsl)
```

## Validation

```ts
import { validate } from 'velo-circuit-editor'

const result = validate(ast)
// → { issues: [], hasErrors: false, hasWarnings: false }
```

## Persistence

```ts
import { serializeCircuit, deserializeCircuit } from 'velo-circuit-editor'

const doc = serializeCircuit(ast, { name: 'My Circuit' })
// → { version: 1, dsl: 'R0-C1', ast: {...}, metadata: {...} }

JSON.stringify(doc, null, 2)
```

## ELEMENT_KINDS Map

```ts
import { ELEMENT_KINDS } from 'velo-circuit-editor'

for (const [kind, def] of ELEMENT_KINDS) {
  console.log(def.code, def.label, def.nParams)
}
// R Resistor 1
// C Capacitor 1
// Q CPE 2
// ...
```