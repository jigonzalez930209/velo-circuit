import type { ViewportState } from '../domain/document.js';

export interface ViewportController {
  pan(deltaX: number, deltaY: number): ViewportState;
  zoom(factor: number, centerX: number, centerY: number): ViewportState;
  zoomToFit(bounds: { width: number; height: number; minX: number; minY: number }, containerWidth: number, containerHeight: number, padding?: number): ViewportState;
  centerOn(x: number, y: number): ViewportState;
  reset(): ViewportState;
  resize(width: number, height: number): ViewportState;
}

const MIN_ZOOM = 0.1;
const MAX_ZOOM = 5;

export function createViewportController(initial: ViewportState): ViewportController {
  let state: ViewportState = { ...initial };

  function emit(): void {
    state = { ...state };
  }

  return {
    pan(deltaX: number, deltaY: number): ViewportState {
      state = { ...state, panX: state.panX + deltaX, panY: state.panY + deltaY };
      emit();
      return state;
    },

    zoom(factor: number, centerX: number, centerY: number): ViewportState {
      const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, state.zoom * factor));
      const zoomRatio = newZoom / state.zoom;

      const worldX = (centerX / state.zoom) - state.panX;
      const worldY = (centerY / state.zoom) - state.panY;
      const newPanX = (centerX / newZoom) - worldX;
      const newPanY = (centerY / newZoom) - worldY;

      state = { ...state, zoom: newZoom, panX: newPanX, panY: newPanY };
      emit();
      return state;
    },

    zoomToFit(bounds: { width: number; height: number; minX: number; minY: number }, containerWidth: number, containerHeight: number, padding = 40): ViewportState {
      const availableW = containerWidth - padding * 2;
      const availableH = containerHeight - padding * 2;

      const scaleX = availableW / bounds.width;
      const scaleY = availableH / bounds.height;
      const zoom = Math.min(scaleX, scaleY, MAX_ZOOM);

      const centerX = bounds.minX + bounds.width / 2;
      const centerY = bounds.minY + bounds.height / 2;
      const panX = containerWidth / (2 * zoom) - centerX;
      const panY = containerHeight / (2 * zoom) - centerY;

      state = { ...state, zoom, panX, panY };
      emit();
      return state;
    },

    centerOn(x: number, y: number): ViewportState {
      const panX = state.width / (2 * state.zoom) - x;
      const panY = state.height / (2 * state.zoom) - y;
      state = { ...state, panX, panY };
      emit();
      return state;
    },

    reset(): ViewportState {
      state = { panX: 0, panY: 0, zoom: 1, width: state.width, height: state.height };
      emit();
      return state;
    },

    resize(width: number, height: number): ViewportState {
      state = { ...state, width, height };
      emit();
      return state;
    },
  };
}

export function parseWheelZoom(event: WheelEvent): { factor: number; centerX: number; centerY: number } {
  const delta = -event.deltaY;
  const factor = delta > 0 ? 1.1 : 0.9;
  return { factor, centerX: event.offsetX, centerY: event.offsetY };
}

export function parsePointerPan(event: PointerEvent, lastX: number, lastY: number): { deltaX: number; deltaY: number } {
  return { deltaX: event.clientX - lastX, deltaY: event.clientY - lastY };
}

export function getZoomLevelLabel(zoom: number): string {
  return `${Math.round(zoom * 100)}%`;
}