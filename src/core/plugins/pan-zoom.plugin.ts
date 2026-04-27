import type { EditorPlugin, PluginContext } from './types.js';

const CSS = `
.ce-canvas {
  flex: 1; position: relative; overflow: hidden; cursor: grab;
  background-color: var(--ce-bg);
}
.ce-canvas.ce-panning { cursor: grabbing; }
.ce-canvas svg { position: absolute; top: 0; left: 0; transform-origin: 0 0; }
.ce-zoom-label {
  position: absolute; bottom: 8px; left: 8px;
  font: 500 10px var(--ce-font);
  color: var(--ce-text-secondary);
  background: var(--ce-surface-alpha);
  padding: 2px 8px; border-radius: 4px; pointer-events: none;
  backdrop-filter: blur(4px);
}
`;

export interface PanZoomPluginAPI extends EditorPlugin {
  getZoom(): number;
  getPan(): { x: number; y: number };
  fitView(): void;
  resetView(): void;
  setZoom(z: number): void;
}

export function panZoomPlugin(): PanZoomPluginAPI {
  let ctx: PluginContext;
  let canvasEl: HTMLDivElement;
  let zoomLabelEl: HTMLDivElement;
  let zoom = 1, panX = 0, panY = 0;
  let isPanning = false, panStartX = 0, panStartY = 0;
  const MIN_ZOOM = 0.5, MAX_ZOOM = 2.0;

  function applyTransform() {
    const svg = canvasEl.querySelector('svg');
    if (svg) svg.style.transform = `translate(${panX}px,${panY}px) scale(${zoom})`;
    zoomLabelEl.textContent = Math.round(zoom * 100) + '%';
    ctx.emit('viewport-changed', { zoom, panX, panY });
  }

  function fitView() {
    const svg = canvasEl.querySelector('svg');
    const nodesGroup = svg?.querySelector('#nodes') as SVGGElement | null;
    if (!svg || !nodesGroup) return;
    const r = canvasEl.getBoundingClientRect();
    
    let bbox = { x: 0, y: 0, width: 800, height: 600 };
    try {
      bbox = nodesGroup.getBBox();
      if (bbox.width === 0 || bbox.height === 0) throw new Error('Empty BBox');
    } catch (e) {
      // Fallback if SVG is not rendered or empty
      resetView();
      return;
    }

    // Add padding to bbox (20px on all sides)
    const padding = 20;
    const contentWidth = bbox.width + padding * 2;
    const contentHeight = bbox.height + padding * 2;

    zoom = Math.min(MAX_ZOOM, Math.min(r.width / contentWidth, r.height / contentHeight) * 0.95);
    // Center the bounding box (not the origin 0,0) in the container
    panX = (r.width - bbox.width * zoom) / 2 - bbox.x * zoom;
    panY = (r.height - bbox.height * zoom) / 2 - bbox.y * zoom;
    applyTransform();
  }

  function resetView() {
    zoom = 1; panX = 0; panY = 0;
    applyTransform();
  }

  // Event handlers
  function onWheel(e: WheelEvent) {
    e.preventDefault();
    const f = e.deltaY < 0 ? 1.08 : 0.92;
    const oldZ = zoom;
    zoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom * f));
    const rect = canvasEl.getBoundingClientRect();
    const mx = e.clientX - rect.left, my = e.clientY - rect.top;
    panX = mx - (mx - panX) * (zoom / oldZ);
    panY = my - (my - panY) * (zoom / oldZ);
    applyTransform();
  }

  function onPointerDown(e: PointerEvent) {
    // Middle-click or Alt+click → always pan
    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      startPan(e); return;
    }
    // Left-click on empty canvas → pan (NOT on nodes)
    const nodeEl = (e.target as Element).closest?.('[data-element-id]');
    if (e.button === 0 && !nodeEl) {
      // Small delay to let selection plugin handle click first
      startPan(e);
    }
  }

  function startPan(e: PointerEvent) {
    isPanning = true; panStartX = e.clientX; panStartY = e.clientY;
    canvasEl.classList.add('ce-panning');
    canvasEl.setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: PointerEvent) {
    if (!isPanning) return;
    panX += e.clientX - panStartX; panY += e.clientY - panStartY;
    panStartX = e.clientX; panStartY = e.clientY;
    applyTransform();
  }

  function onPointerUp(e: PointerEvent) {
    if (isPanning) {
      isPanning = false;
      canvasEl.classList.remove('ce-panning');
      canvasEl.releasePointerCapture(e.pointerId);
    }
  }

  return {
    name: 'pan-zoom',
    install(c) {
      ctx = c;
      ctx.injectCSS('pan-zoom', CSS);
      // Create canvas inside .ce-workspace if it exists
      const workspace = ctx.container.querySelector('.ce-workspace') || ctx.container;
      canvasEl = document.createElement('div');
      canvasEl.className = 'ce-canvas';
      workspace.appendChild(canvasEl);
      zoomLabelEl = document.createElement('div');
      zoomLabelEl.className = 'ce-zoom-label';
      zoomLabelEl.textContent = '100%';
      canvasEl.appendChild(zoomLabelEl);

      canvasEl.addEventListener('wheel', onWheel, { passive: false });
      canvasEl.addEventListener('pointerdown', onPointerDown);
      canvasEl.addEventListener('pointermove', onPointerMove);
      canvasEl.addEventListener('pointerup', onPointerUp);

      // Re-apply transform after re-render
      let firstRender = true;
      ctx.editor.on('render', () => requestAnimationFrame(() => {
        if (firstRender) { firstRender = false; fitView(); }
        else applyTransform();
      }));

      // Listen for fit/reset commands from other plugins
      ctx.on('fit-view', () => fitView());
      ctx.on('reset-view', () => resetView());
    },
    destroy() {
      canvasEl?.removeEventListener('wheel', onWheel);
      canvasEl?.removeEventListener('pointerdown', onPointerDown);
      canvasEl?.removeEventListener('pointermove', onPointerMove);
      canvasEl?.removeEventListener('pointerup', onPointerUp);
      canvasEl?.remove();
    },
    getZoom: () => zoom,
    getPan: () => ({ x: panX, y: panY }),
    fitView,
    resetView,
    setZoom(z: number) { zoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, z)); applyTransform(); },
  };
}
