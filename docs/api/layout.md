# Layout API

Position circuit nodes deterministically from an AST.

## buildLayout

```ts
import { buildLayout } from 'velo-circuit-editor'

const graph = buildLayout(ast)
// → EditableGraph
```

## computeBounds

```ts
import { computeBounds } from 'velo-circuit-editor'

const bounds = computeBounds(graph)
// → { width, height, minX, minY }
```

## Layout Options

```ts
import { DEFAULT_LAYOUT_OPTIONS } from 'velo-circuit-editor'

buildLayout(ast, {
  horizontalSpacing: 80,  // default: 60
  verticalSpacing: 50,     // default: 40
  elementWidth: 100,      // default: 80
  elementHeight: 50,       // default: 40
  parallelWidth: 150,      // default: 120
})
```

## EditableGraph Structure

```ts
interface EditableGraph {
  nodes: Map<string, ElementNode>
  connections: Connection[]
  rootNodeId: string
}

interface ElementNode {
  nodeId: string
  circuitNode: CircuitNode
  visualX: number
  visualY: number
  width: number
  height: number
  ports: Port[]
}
```

## Resetting Node ID Counter

```ts
import { resetNodeIdCounter } from 'velo-circuit-editor'

resetNodeIdCounter()
```

## Use with Renderer

```ts
import { buildLayout, computeBounds } from 'velo-circuit-editor'
import { renderCircuit, DEFAULT_THEME } from 'velo-circuit-editor'

const graph = buildLayout(ast)
const bounds = computeBounds(graph)

const svg = renderCircuit(graph, {
  panX: -bounds.minX + 20,
  panY: -bounds.minY + 20,
  zoom: 1,
  width: bounds.width,
  height: bounds.height,
}, { theme: DEFAULT_THEME, showGrid: true })
```