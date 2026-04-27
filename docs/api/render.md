# Render & Themes API

## renderCircuit

```ts
import { renderCircuit } from 'velo-circuit-editor'

const svg = renderCircuit(graph, viewport, options)
// → '<svg xmlns="...">...</svg>'
```

## renderCircuitEx

Extended renderer with themes and selection:

```ts
import { renderCircuitEx } from 'velo-circuit-editor'

const svg = renderCircuitEx(graph, viewport, {
  themeMode: 'dark',
  showGrid: true,
  showHandles: true,
  selectedNodeIds: new Set(['node-3']),
})
```

## Themes

### Light Theme

```ts
import { DEFAULT_THEME } from 'velo-circuit-editor'
```

### Dark Theme

```ts
import { DARK_THEME } from 'velo-circuit-editor'
```

### getTheme

```ts
import { getTheme, toggleTheme } from 'velo-circuit-editor'

let mode: ThemeMode = 'light'
mode = toggleTheme(mode) // 'dark'
const theme = getTheme(mode)
```

## exportSvgWithStyles

Embed CSS into the SVG string for standalone export:

```ts
import { exportSvgWithStyles } from 'velo-circuit-editor'

const standalone = exportSvgWithStyles(svg, DARK_THEME)
// Contains <style>...</style> inside the SVG
```

## Viewport Controller

```ts
import { createViewportController } from 'velo-circuit-editor'

const vc = createViewportController({ panX: 0, panY: 0, zoom: 1, width: 800, height: 600 })

// Pan
vc.pan(deltaX, deltaY)

// Zoom around center
vc.zoom(1.1, 400, 300)

// Fit circuit to container
vc.zoomToFit(bounds, 800, 600)

// Reset
vc.reset()
```

## Build SVG Symbol

```ts
import { buildSvgElementSymbol } from 'velo-circuit-editor'

const symbol = buildSvgElementSymbol('R', DEFAULT_THEME)
// → '<g>...</g>'
```