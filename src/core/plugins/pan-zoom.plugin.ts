import type { EditorPlugin, PluginContext } from './types.js';

const CSS = `
.ce-canvas {
  flex: 1; position: relative; overflow: hidden; cursor: grab;
  background-color: var(--ce-bg);
  touch-action: none;
}
.ce-canvas.ce-panning { cursor: grabbing; }
.ce-canvas svg {
  position: absolute; top: 0; left: 0;
  overflow: visible;
}
.ce-canvas svg text {
  text-rendering: geometricPrecision;
}
.ce-canvas svg path,
.ce-canvas svg line,
.ce-canvas svg polyline,
.ce-canvas svg circle,
.ce-canvas svg rect {
  shape-rendering: geometricPrecision;
}
.ce-grid-container {
  position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none;
  background-image: radial-gradient(circle, var(--ce-grid-dot, #333) 1px, transparent 1px);
  background-size: 20px 20px;
}
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
  let canvasResizeObserver: ResizeObserver | null = null;
  let removeWindowResizeListener: (() => void) | null = null;
  let zoom = 1, panX = 0, panY = 0;
  let isPanning = false, panStartX = 0, panStartY = 0;
  const activePointers = new Map<number, { x: number; y: number }>();
  let pinchDistance = 0;
  let pinchMid = { x: 0, y: 0 };
  let contentBBox = { x: 0, y: 0, width: 0, height: 0 };
  const MIN_ZOOM = 0.25, MAX_ZOOM = 4.0;
  const MIN_PAN_MARGIN = 50;

  function clampPan(): void {
    // Only used by fitView — keeps content within reasonable bounds.
    // NOT called during interactive pan/zoom to avoid jumps.
    updateContentBBox();
    if (contentBBox.width === 0 && contentBBox.height === 0) return;
    const r = canvasEl.getBoundingClientRect();
    const margin = MIN_PAN_MARGIN;
    const leftEdge  = contentBBox.x * zoom + panX;
    const rightEdge = (contentBBox.x + contentBBox.width)  * zoom + panX;
    const topEdge    = contentBBox.y * zoom + panY;
    const bottomEdge = (contentBBox.y + contentBBox.height) * zoom + panY;
    if (leftEdge  > r.width  - margin && rightEdge < margin) {
      // content entirely off-screen: re-center
      panX = r.width / 2 - (contentBBox.x + contentBBox.width / 2) * zoom;
      panY = r.height / 2 - (contentBBox.y + contentBBox.height / 2) * zoom;
    }
  }

  function applyTransform() {
    const svg = canvasEl.querySelector('svg');
    const scene = svg?.querySelector('#scene');
    if (scene instanceof SVGGElement) {
      // Keep pan/zoom in SVG space to preserve vector sharpness at high zoom.
      scene.setAttribute('transform', `matrix(${zoom} 0 0 ${zoom} ${panX} ${panY})`);
    }
    zoomLabelEl.textContent = Math.round(zoom * 100) + '%';
    ctx.emit('viewport-changed', { zoom, panX, panY });
  }

  function updateContentBBox(): void {
    const svg = canvasEl.querySelector('svg');
    if (!svg) return;
    
    const nodesGroup = svg.querySelector('#nodes') as SVGGElement | null;
    if (nodesGroup) {
      try {
        const bbox = nodesGroup.getBBox();
        if (bbox.width > 0 || bbox.height > 0) {
          contentBBox = bbox;
        }
      } catch (e) {
        contentBBox = { x: 0, y: 0, width: 800, height: 600 };
      }
    } else {
      contentBBox = { x: 0, y: 0, width: 800, height: 600 };
    }
  }

  function fitView() {
    updateContentBBox();
    const r = canvasEl.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) return;

    if (contentBBox.width === 0 && contentBBox.height === 0) {
      // Empty circuit — reset to default
      zoom = 1;
      panX = r.width / 2;
      panY = r.height / 2;
      applyTransform();
      return;
    }

    const padding = 40;
    const scaleX = (r.width  - padding * 2) / contentBBox.width;
    const scaleY = (r.height - padding * 2) / contentBBox.height;
    zoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, Math.min(scaleX, scaleY)));

    // Center the content
    panX = (r.width  - contentBBox.width  * zoom) / 2 - contentBBox.x * zoom;
    panY = (r.height - contentBBox.height * zoom) / 2 - contentBBox.y * zoom;

    applyTransform();
  }

  function resetView() {
    fitView();
  }

  // Event handlers
  function onWheel(e: WheelEvent) {
    e.preventDefault();
    const f = e.deltaY < 0 ? 1.08 : 0.92;
    const oldZ = zoom;
    zoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom * f));
    // Zoom toward the mouse cursor: keep the world point under mouse fixed
    const rect = canvasEl.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    panX = mx - (mx - panX) * (zoom / oldZ);
    panY = my - (my - panY) * (zoom / oldZ);
    // No clampPan here — that causes jumps
    applyTransform();
  }

  function onPointerDown(e: PointerEvent) {
    if (e.pointerType === 'touch') {
      activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      canvasEl.setPointerCapture(e.pointerId);
      const nodeEl = (e.target as Element).closest?.('[data-element-id]');

      if (activePointers.size >= 2) {
        isPanning = false;
        const points = Array.from(activePointers.values());
        const a = points[0];
        const b = points[1];
        pinchDistance = Math.hypot(b.x - a.x, b.y - a.y);
        pinchMid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
      } else if (!nodeEl) {
        startPan(e);
      }
      return;
    }

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
    if (e.pointerType === 'touch' && activePointers.has(e.pointerId)) {
      const prev = activePointers.get(e.pointerId)!;
      activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

      if (activePointers.size >= 2) {
        isPanning = false;
        const points = Array.from(activePointers.values());
        const a = points[0];
        const b = points[1];
        const dist = Math.hypot(b.x - a.x, b.y - a.y);
        const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };

        const rect = canvasEl.getBoundingClientRect();
        const mx = mid.x - rect.left;
        const my = mid.y - rect.top;

        // Two-finger drag pans the view.
        panX += mid.x - pinchMid.x;
        panY += mid.y - pinchMid.y;

        // Two-finger pinch zooms around gesture midpoint.
        if (pinchDistance > 0) {
          const oldZ = zoom;
          const factor = dist / pinchDistance;
          zoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom * factor));
          panX = mx - (mx - panX) * (zoom / oldZ);
          panY = my - (my - panY) * (zoom / oldZ);
        }

        pinchDistance = dist;
        pinchMid = mid;
        applyTransform();
        return;
      }

      if (isPanning) {
        panX += e.clientX - prev.x;
        panY += e.clientY - prev.y;
        applyTransform();
      }
      return;
    }

    if (!isPanning) return;
    panX += e.clientX - panStartX;
    panY += e.clientY - panStartY;
    panStartX = e.clientX;
    panStartY = e.clientY;
    // No clampPan during drag — it causes jumps
    applyTransform();
  }

  function onPointerUp(e: PointerEvent) {
    if (activePointers.has(e.pointerId)) {
      activePointers.delete(e.pointerId);
      if (activePointers.size < 2) pinchDistance = 0;
    }
    if (canvasEl.hasPointerCapture?.(e.pointerId)) {
      canvasEl.releasePointerCapture(e.pointerId);
    }
    if (isPanning) {
      isPanning = false;
      canvasEl.classList.remove('ce-panning');
    }
  }

  function syncViewportSizeFromCanvas() {
    const rect = canvasEl.getBoundingClientRect();
    const width = Math.max(1, Math.floor(rect.width));
    const height = Math.max(1, Math.floor(rect.height));
    ctx.editor.dispatch({
      type: 'viewport-change',
      panX,
      panY,
      zoom,
      width,
      height,
    });
  }

  return {
    name: 'pan-zoom',
    install(c) {
      ctx = c;
      ctx.injectCSS('pan-zoom', CSS);
      const workspace = ctx.container.querySelector('.ce-workspace') || ctx.container;
      canvasEl = document.createElement('div');
      canvasEl.className = 'ce-canvas';
      
      const gridContainer = document.createElement('div');
      gridContainer.className = 'ce-grid-container';
      canvasEl.appendChild(gridContainer);
      
      workspace.appendChild(canvasEl);
      zoomLabelEl = document.createElement('div');
      zoomLabelEl.className = 'ce-zoom-label';
      zoomLabelEl.textContent = '100%';
      canvasEl.appendChild(zoomLabelEl);

      canvasEl.addEventListener('wheel', onWheel, { passive: false });
      canvasEl.addEventListener('pointerdown', onPointerDown);
      canvasEl.addEventListener('pointermove', onPointerMove);
      canvasEl.addEventListener('pointerup', onPointerUp);
      canvasEl.addEventListener('pointercancel', onPointerUp);

      if (typeof ResizeObserver !== 'undefined') {
        canvasResizeObserver = new ResizeObserver(() => {
          syncViewportSizeFromCanvas();
        });
        canvasResizeObserver.observe(canvasEl);
      } else if (typeof window !== 'undefined') {
        const onWindowResize = () => syncViewportSizeFromCanvas();
        window.addEventListener('resize', onWindowResize);
        removeWindowResizeListener = () => window.removeEventListener('resize', onWindowResize);
      }
      syncViewportSizeFromCanvas();

      // Re-apply transform after re-render (SVG is recreated each time)
      let firstRender = true;
      ctx.editor.on('render', () => {
        updateContentBBox();
        requestAnimationFrame(() => {
          if (firstRender) {
            firstRender = false;
            fitView();
          } else {
            // Just re-apply the existing transform — don't clamp/fit
            applyTransform();
          }
        });
      });

      // Listen for fit/reset commands from other plugins
      ctx.on('fit-view', () => fitView());
      ctx.on('reset-view', () => resetView());
    },
    destroy() {
      if (canvasResizeObserver) {
        canvasResizeObserver.disconnect();
        canvasResizeObserver = null;
      }
      if (removeWindowResizeListener) {
        removeWindowResizeListener();
        removeWindowResizeListener = null;
      }
      canvasEl?.removeEventListener('wheel', onWheel);
      canvasEl?.removeEventListener('pointerdown', onPointerDown);
      canvasEl?.removeEventListener('pointermove', onPointerMove);
      canvasEl?.removeEventListener('pointerup', onPointerUp);
      canvasEl?.removeEventListener('pointercancel', onPointerUp);
      canvasEl?.remove();
    },
    getZoom: () => zoom,
    getPan: () => ({ x: panX, y: panY }),
    fitView,
    resetView,
    setZoom(z: number) { zoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, z)); clampPan(); applyTransform(); },
  };
}
