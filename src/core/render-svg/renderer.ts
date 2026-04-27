import type { EditableGraph, ElementNode, Connection } from '../domain/graph.js';
import type { CircuitNode } from '../domain/circuit.js';
import type { ViewportState } from '../domain/document.js';
import { buildSvgElementSymbol, buildParallelSymbol, buildSeriesSymbol, buildJunctionDot, DEFAULT_THEME, type RenderTheme } from './symbols.js';
import { parseBoukamp } from '../parser-bridge/index.js';
import { buildLayout } from '../layout/index.js';

export interface SvgRenderOptions {
  theme?: RenderTheme;
  showGrid?: boolean;
  showLabels?: boolean;
  selectedNodeIds?: Set<string>;
  width?: number | string;
  height?: number | string;
  viewBox?: string;
}

function worldToScreen(x: number, y: number, viewport: ViewportState): { sx: number; sy: number } {
  return {
    sx: (x + viewport.panX) * viewport.zoom,
    sy: (y + viewport.panY) * viewport.zoom,
  };
}

function buildGridSvg(viewport: ViewportState, theme: RenderTheme): string {
  const patternId = `grid-pattern`;
  return `
    <defs>
      <pattern id="${patternId}" width="20" height="20" patternUnits="userSpaceOnUse" 
        patternTransform="translate(${viewport.panX}, ${viewport.panY}) scale(${viewport.zoom})">
        <line x1="0" y1="0" x2="20" y2="0" stroke="var(--ce-grid)" stroke-width="0.2" stroke-dasharray="2,4" />
        <line x1="0" y1="0" x2="0" y2="20" stroke="var(--ce-grid)" stroke-width="0.2" stroke-dasharray="2,4" />
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#${patternId})" pointer-events="none" />
  `.trim();
}


function buildConnectionPath(from: { x: number; y: number }, to: { x: number; y: number }): string {
  const dx = Math.abs(to.x - from.x);
  const dy = Math.abs(to.y - from.y);

  // If primarily horizontal, use straight line or gentle bezier
  if (dy < 2) {
    return `M ${from.x} ${from.y} L ${to.x} ${to.y}`;
  }

  // For connections with vertical offset (parallel branches), use smooth bezier
  const midX = (from.x + to.x) / 2;
  return `M ${from.x} ${from.y} C ${midX} ${from.y} ${midX} ${to.y} ${to.x} ${to.y}`;
}

function isJunctionNode(node: ElementNode): boolean {
  return node.circuitNode.type === 'parallel' && 
    (node.circuitNode as any).children?.length === 0;
}

function buildNodeElement(node: ElementNode, viewport: ViewportState, theme: RenderTheme, isSelected: boolean): string {
  const { sx, sy } = worldToScreen(node.visualX, node.visualY, viewport);
  const sw = node.width * viewport.zoom;
  const sh = node.height * viewport.zoom;

  // Junction nodes render as dots, not boxes
  if (isJunctionNode(node)) {
    const cx = sx + sw / 2;
    const cy = sy + sh / 2;
    return `<g id="${node.nodeId}" class="circuit-junction" data-node-id="${node.nodeId}">
      <circle cx="${cx}" cy="${cy}" r="${3 * viewport.zoom}" fill="${theme.colors.stroke}" />
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
  const selectionStroke = isSelected ? theme.colors.highlight : 'transparent';
  const selectionWidth = isSelected ? theme.strokeWidth * 2 : 0;
  const elementIdAttr = label ? ` data-element-id="${label}"` : '';

  return `
    <g id="${node.nodeId}" transform="translate(${sx}, ${sy})" class="circuit-node" data-node-id="${node.nodeId}"${elementIdAttr}>
      <rect class="node-hit" x="-4" y="-4" width="${sw + 8}" height="${sh + 22}" fill="transparent" />
      <rect class="node-bg" x="-2" y="-2" width="${sw + 4}" height="${sh + 4}"
        fill="none" stroke="${selectionStroke}" stroke-width="${selectionWidth}"
        rx="6" stroke-dasharray="${isSelected ? '0' : ''}" />
      <svg width="${sw}" height="${sh}" viewBox="0 0 ${theme.elementWidth} ${theme.elementHeight}">
        ${innerSvg}
      </svg>
      ${label ? `<text class="node-label" x="${sw / 2}" y="${sh + 14}" text-anchor="middle" font-size="${theme.fontSize}" font-family="${theme.fontFamily}" fill="${theme.colors.text}">${label}</text>` : ''}
    </g>
  `;
}

function buildConnectionElement(conn: Connection, graph: EditableGraph, viewport: ViewportState, theme: RenderTheme): string {
  const fromNode = graph.nodes.get(conn.fromNodeId);
  const toNode = graph.nodes.get(conn.toNodeId);

  if (!fromNode || !toNode) return '';

  const fromPort = fromNode.ports.find(p => p.id === conn.fromPortId);
  const toPort = toNode.ports.find(p => p.id === conn.toPortId);

  if (!fromPort || !toPort) return '';

  // Port positions are already in world coordinates
  const fp = worldToScreen(fromPort.x, fromPort.y, viewport);
  const tp = worldToScreen(toPort.x, toPort.y, viewport);
  const path = buildConnectionPath({ x: fp.sx, y: fp.sy }, { x: tp.sx, y: tp.sy });

  return `<path d="${path}" stroke="${theme.colors.stroke}" stroke-width="${theme.strokeWidth}" fill="none" class="circuit-connection" data-from="${conn.fromNodeId}" data-to="${conn.toNodeId}" />`;
}

export function renderCircuit(
  graph: EditableGraph,
  viewport: ViewportState,
  options: SvgRenderOptions,
): string {
  const theme = options.theme ?? DEFAULT_THEME;
  const width = options.width ?? '100%';
  const height = options.height ?? '100%';
  const viewBoxAttr = options.viewBox ? ` viewBox="${options.viewBox}"` : '';

  const nodeElements: string[] = [];
  const connectionElements: string[] = [];

  for (const node of graph.nodes.values()) {
    const isSelected = options.selectedNodeIds?.has(node.nodeId) ?? false;
    nodeElements.push(buildNodeElement(node, viewport, theme, isSelected));
  }

  for (const conn of graph.connections) {
    connectionElements.push(buildConnectionElement(conn, graph, viewport, theme));
  }

  const grid = options.showGrid !== false ? buildGridSvg(viewport, theme) : '';

  return `
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"${viewBoxAttr} class="circuit-editor">
  <style>
    .circuit-node { cursor: pointer; }
    .circuit-node:hover .node-bg { stroke: ${theme.colors.highlight}; stroke-width: 2; }
    .circuit-connection { transition: stroke 0.15s; }
    .circuit-connection:hover { stroke: ${theme.colors.highlight}; stroke-width: 2; }
    .circuit-junction { pointer-events: none; }
  </style>
  ${grid}
  <g id="connections">${connectionElements.join('')}</g>
  <g id="nodes">${nodeElements.join('')}</g>
</svg>`.trim();
}

export function renderCircuitToElement(container: HTMLElement, svgString: string): void {
  container.innerHTML = svgString;
}

/**
 * Utility to generate a perfectly cropped SVG string directly from a DSL string.
 * This is useful for rendering quick icons, thumbnails, or previews outside of the full editor.
 */
export function renderDslToSvg(dsl: string, options?: SvgRenderOptions): string {
  const ast = parseBoukamp(dsl);
  if ('type' in ast && (ast.type === 'lex' || ast.type === 'parse')) return '';

  const graph = buildLayout(ast as any);

  // Compute precise bounding box from the graph layout
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const node of graph.nodes.values()) {
    minX = Math.min(minX, node.visualX);
    minY = Math.min(minY, node.visualY);
    maxX = Math.max(maxX, node.visualX + node.width);
    maxY = Math.max(maxY, node.visualY + node.height);
  }

  // If empty, return fallback bounds
  if (minX === Infinity) {
    minX = 0; minY = 0; maxX = 100; maxY = 100;
  }

  // Add a 10px padding around the content
  const padding = 10;
  const viewBox = `${minX - padding} ${minY - padding} ${(maxX - minX) + padding * 2} ${(maxY - minY) + padding * 2}`;

  return renderCircuit(graph, { zoom: 1, panX: 0, panY: 0, width: 0, height: 0 }, {
    ...options,
    viewBox,
  });
}

export function extractSvgString(graph: EditableGraph, viewport: ViewportState, options: Partial<SvgRenderOptions> = {}): string {
  return renderCircuit(graph, viewport, { ...options, width: options.width ?? viewport.width, height: options.height ?? viewport.height });
}