import type { EditableGraph, ElementNode, Connection } from '../domain/graph.js';
import type { CircuitDocument, ViewportState } from '../domain/document.js';
import type { RenderTheme } from './symbols.js';
import { buildSvgElementSymbol, buildParallelSymbol, buildSeriesSymbol, buildJunctionDot, DEFAULT_THEME } from './symbols.js';
import { getTheme, buildThemeCSS, type ThemeMode } from './themes.js';

export interface InteractionOverlay {
  type: 'hover' | 'selected' | 'error' | 'warning' | 'focus';
  nodeId: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface RenderOptions {
  theme?: RenderTheme;
  themeMode?: ThemeMode;
  showGrid?: boolean;
  showLabels?: boolean;
  showHandles?: boolean;
  selectedNodeIds?: Set<string>;
  focusedNodeId?: string | null;
  overlays?: InteractionOverlay[];
  width: number;
  height: number;
}



function buildGridLayer(width: number, height: number, viewport: ViewportState, theme: RenderTheme): string {
  const gridLines: string[] = [];
  const step = 20;
  const scaledStep = step * viewport.zoom;
  const offsetX = (viewport.panX * viewport.zoom) % scaledStep;
  const offsetY = (viewport.panY * viewport.zoom) % scaledStep;

  for (let x = offsetX; x < width; x += scaledStep) {
    gridLines.push(`<line x1="${x}" y1="0" x2="${x}" y2="${height}" stroke="${theme.colors.grid}" stroke-width="0.5" opacity="0.4"/>`);
  }
  for (let y = offsetY; y < height; y += scaledStep) {
    gridLines.push(`<line x1="0" y1="${y}" x2="${width}" y2="${y}" stroke="${theme.colors.grid}" stroke-width="0.5" opacity="0.4"/>`);
  }

  return `<g id="grid" class="layer-grid">${gridLines.join('')}</g>`;
}

function buildHandleRect(x: number, y: number, size: number, theme: RenderTheme): string {
  return `<rect x="${x - size / 2}" y="${y - size / 2}" width="${size}" height="${size}" fill="${theme.colors.highlight}" stroke="${theme.colors.fill}" stroke-width="1" rx="2" class="resize-handle"/>`;
}

function isJunctionNode(node: ElementNode): boolean {
  return node.circuitNode.type === 'parallel' && 
    (node.circuitNode as any).children?.length === 0;
}

function buildNodeElement(
  node: ElementNode,
  theme: RenderTheme,
  isSelected: boolean,
  isFocused: boolean,
  showHandles: boolean,
): string {
  const x = node.visualX;
  const y = node.visualY;
  const w = node.width;
  const h = node.height;
  const { strokeWidth, colors } = theme;

  // Junction nodes render as dots
  if (isJunctionNode(node)) {
    const cx = x + w / 2;
    const cy = y + h / 2;
    return `<g id="node-${node.nodeId}" class="circuit-junction" data-node-id="${node.nodeId}">
      <circle cx="${cx}" cy="${cy}" r="3" fill="${colors.stroke}" />
    </g>`;
  }

  const circuit = node.circuitNode;
  let innerSvg = '';

  if (circuit.type === 'element') {
    innerSvg = buildSvgElementSymbol(circuit.kind, theme);
  } else if (circuit.type === 'parallel') {
    innerSvg = buildParallelSymbol(theme);
  } else if (circuit.type === 'series') {
    innerSvg = buildSeriesSymbol(theme);
  }

  const label = circuit.type === 'element' ? `${circuit.kind}${circuit.id}` : '';
  const selectionColor = isSelected ? colors.highlight : 'transparent';
  const selStrokeWidth = isSelected ? strokeWidth * 2 : 0;

  let handleRects = '';
  if (showHandles && (isSelected || isFocused)) {
    const handleSize = 8;
    const cx = w / 2;
    const cy = h / 2;
    const handlePositions = [
      [0, cy],
      [w, cy],
      [cx, 0],
      [cx, h],
    ];
    for (const [hx, hy] of handlePositions) {
      handleRects += buildHandleRect(hx, hy, handleSize, theme);
    }
  }

  return `
    <g id="node-${node.nodeId}" class="circuit-node${isSelected ? ' selected' : ''}${isFocused ? ' focused' : ''}" data-node-id="${node.nodeId}" transform="translate(${x}, ${y})">
      <rect class="node-bg" x="-2" y="-2" width="${w + 4}" height="${h + 4}" fill="none" stroke="${selectionColor}" stroke-width="${selStrokeWidth}" rx="6"/>
      <svg class="node-symbol" width="${w}" height="${h}" viewBox="0 0 ${theme.elementWidth} ${theme.elementHeight}">
        ${innerSvg}
      </svg>
      ${label ? `<text class="node-label" x="${w / 2}" y="${h + 14}" text-anchor="middle" font-size="${theme.fontSize}" font-family="${theme.fontFamily}" fill="${colors.text}">${label}</text>` : ''}
      ${handleRects}
    </g>
  `.trim();
}

function buildConnectionPath(from: { x: number; y: number }, to: { x: number; y: number }): string {
  const dy = Math.abs(to.y - from.y);
  if (dy < 2) {
    return `M ${from.x} ${from.y} L ${to.x} ${to.y}`;
  }
  const midX = (from.x + to.x) / 2;
  return `M ${from.x} ${from.y} C ${midX} ${from.y} ${midX} ${to.y} ${to.x} ${to.y}`;
}

function buildConnectionElement(conn: Connection, graph: EditableGraph, theme: RenderTheme): string {
  const fromNode = graph.nodes.get(conn.fromNodeId);
  const toNode = graph.nodes.get(conn.toNodeId);
  if (!fromNode || !toNode) return '';

  const fromPort = fromNode.ports.find(p => p.id === conn.fromPortId);
  const toPort = toNode.ports.find(p => p.id === conn.toPortId);
  if (!fromPort || !toPort) return '';

  // Port positions are in world coordinates — use directly
  const path = buildConnectionPath({ x: fromPort.x, y: fromPort.y }, { x: toPort.x, y: toPort.y });

  return `<path class="circuit-connection" d="${path}" stroke="${theme.colors.stroke}" stroke-width="${theme.strokeWidth}" fill="none" data-from="${conn.fromNodeId}" data-to="${conn.toNodeId}"/>`;
}

function buildOverlayElement(overlay: InteractionOverlay, theme: RenderTheme): string {
  const x = overlay.x;
  const y = overlay.y;
  const w = overlay.width;
  const h = overlay.height;

  let color = theme.colors.highlight;
  let dasharray = '4,2';

  if (overlay.type === 'error') {
    color = theme.colors.error;
    dasharray = '6,3';
  } else if (overlay.type === 'warning') {
    color = theme.colors.warning;
    dasharray = '5,2';
  } else if (overlay.type === 'focus') {
    color = theme.colors.highlight;
    dasharray = '3,2';
  }

  return `<rect class="overlay-${overlay.type}" x="${x}" y="${y}" width="${w}" height="${h}" fill="none" stroke="${color}" stroke-width="2" stroke-dasharray="${dasharray}" rx="2" opacity="0.7"/>`;
}

function buildDecoratorsLayer(overlays: InteractionOverlay[], theme: RenderTheme): string {
  return `<g id="overlays" class="layer-overlays">${overlays.map(o => buildOverlayElement(o, theme)).join('')}</g>`;
}

export function renderCircuitEx(
  graph: EditableGraph,
  _viewport: ViewportState,
  options: RenderOptions,
): string {
  const resolvedTheme = options.themeMode ? getTheme(options.themeMode) : (options.theme ?? DEFAULT_THEME);
  const { width, height } = options;
  const { colors, strokeWidth } = resolvedTheme;

  const nodeElements: string[] = [];
  const connectionElements: string[] = [];

  for (const node of graph.nodes.values()) {
    const isSelected = options.selectedNodeIds?.has(node.nodeId) ?? false;
    const isFocused = node.nodeId === options.focusedNodeId;
    nodeElements.push(buildNodeElement(node, resolvedTheme, isSelected, isFocused, options.showHandles ?? false));
  }

  for (const conn of graph.connections) {
    connectionElements.push(buildConnectionElement(conn, graph, resolvedTheme));
  }

  const overlays = options.overlays ? buildDecoratorsLayer(options.overlays, resolvedTheme) : '';

  return `<svg xmlns="http://www.w3.org/2000/svg" class="circuit-editor" width="${width}" height="${height}" overflow="visible">
  <defs>
    <style>
      .circuit-node { cursor: pointer; }
      .circuit-node:hover .node-bg { stroke: ${colors.highlight}; stroke-width: 2; }
      .circuit-node.selected .node-bg { stroke: ${colors.highlight}; stroke-width: ${strokeWidth * 2}; }
      .circuit-node .resize-handle { cursor: nwse-resize; }
      .circuit-node .resize-handle:hover { fill: ${colors.highlight}; }
      .circuit-connection { transition: stroke 0.15s; }
      .circuit-connection:hover { stroke: ${colors.highlight}; stroke-width: 2; }
      .circuit-junction { pointer-events: none; }
    </style>
  </defs>
  <g id="connections" class="layer-connections">${connectionElements.join('')}</g>
  <g id="nodes" class="layer-nodes">${nodeElements.join('')}</g>
  ${overlays}
</svg>`.trim();
}

export function renderDocument(
  document: CircuitDocument,
  options?: Partial<RenderOptions>,
): string {
  const opts: RenderOptions = {
    width: document.viewport.width,
    height: document.viewport.height,
    showGrid: true,
    showHandles: true,
    selectedNodeIds: document.selection.selectedNodeIds,
    focusedNodeId: document.selection.focusedNodeId,
    ...options,
  };

  return renderCircuitEx(document.graph, document.viewport, opts);
}

export function extractSvgSnapshot(graph: EditableGraph, viewport: ViewportState, options: Partial<RenderOptions> = {}): string {
  const opts: RenderOptions = {
    width: options.width ?? viewport.width,
    height: options.height ?? viewport.height,
    showGrid: false,
    showHandles: false,
    ...options,
  };

  return renderCircuitEx(graph, viewport, opts);
}

export function exportSvgWithStyles(svg: string, theme: RenderTheme): string {
  const styleBlock = `<style>${buildThemeCSS(theme)}</style>`;
  return svg.replace('</svg>', `${styleBlock}</svg>`);
}