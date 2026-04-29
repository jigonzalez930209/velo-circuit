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

function buildNodeElement(node: ElementNode, theme: RenderTheme, isSelected: boolean): string {
  const x = node.visualX;
  const y = node.visualY;
  const w = node.width;
  const h = node.height;

  // Junction nodes render as dots, not boxes
  if (isJunctionNode(node)) {
    const cx = x + w / 2;
    const cy = y + h / 2;
    return `<g id="${node.nodeId}" class="circuit-junction" data-node-id="${node.nodeId}">
      <circle cx="${cx}" cy="${cy}" r="3" fill="${theme.colors.stroke}" />
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
    <g id="${node.nodeId}" transform="translate(${x}, ${y})" class="circuit-node" data-node-id="${node.nodeId}"${elementIdAttr}>
      <rect class="node-hit" x="-4" y="-4" width="${w + 8}" height="${h + 22}" fill="transparent" />
      <rect class="node-bg" x="-2" y="-2" width="${w + 4}" height="${h + 4}"
        fill="none" stroke="${selectionStroke}" stroke-width="${selectionWidth}"
        rx="6" stroke-dasharray="${isSelected ? '0' : ''}" />
      <svg width="${w}" height="${h}" viewBox="0 0 ${theme.elementWidth} ${theme.elementHeight}">
        ${innerSvg}
      </svg>
      ${label ? `<text class="node-label" x="${w / 2}" y="${h + 14}" text-anchor="middle" font-size="${theme.fontSize}" font-family="${theme.fontFamily}" fill="${theme.colors.text}">${label}</text>` : ''}
    </g>
  `;
}

function buildConnectionElement(conn: Connection, graph: EditableGraph, theme: RenderTheme): string {
  const fromNode = graph.nodes.get(conn.fromNodeId);
  const toNode = graph.nodes.get(conn.toNodeId);

  if (!fromNode || !toNode) return '';

  const fromPort = fromNode.ports.find(p => p.id === conn.fromPortId);
  const toPort = toNode.ports.find(p => p.id === conn.toPortId);

  if (!fromPort || !toPort) return '';

  // Port positions are already in world coordinates — use them directly
  const path = buildConnectionPath({ x: fromPort.x, y: fromPort.y }, { x: toPort.x, y: toPort.y });

  return `<path d="${path}" stroke="${theme.colors.stroke}" stroke-width="${theme.strokeWidth}" fill="none" class="circuit-connection" data-from="${conn.fromNodeId}" data-to="${conn.toNodeId}" />`;
}

export function renderCircuit(
  graph: EditableGraph,
  _viewport: ViewportState,
  options: SvgRenderOptions,
): string {
  const theme = options.theme ?? DEFAULT_THEME;
  // SVG is rendered in pure world coordinates.
  // The pan-zoom plugin applies CSS transform for pan/zoom — no viewport baked in here.
  const width = options.width ?? '100%';
  const height = options.height ?? '100%';
  const viewBoxAttr = options.viewBox ? ` viewBox="${options.viewBox}"` : '';

  const nodeElements: string[] = [];
  const connectionElements: string[] = [];

  for (const node of graph.nodes.values()) {
    const isSelected = options.selectedNodeIds?.has(node.nodeId) ?? false;
    nodeElements.push(buildNodeElement(node, theme, isSelected));
  }

  for (const conn of graph.connections) {
    connectionElements.push(buildConnectionElement(conn, graph, theme));
  }

  return `
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"${viewBoxAttr} class="circuit-editor" overflow="visible">
  <style>
    .circuit-node { cursor: pointer; }
    .circuit-node:hover .node-bg { stroke: ${theme.colors.highlight}; stroke-width: 2; }
    .circuit-connection { transition: stroke 0.15s; }
    .circuit-connection:hover { stroke: ${theme.colors.highlight}; stroke-width: 2; }
    .circuit-junction { pointer-events: none; }
  </style>
  <g id="scene">
    <g id="connections">${connectionElements.join('')}</g>
    <g id="nodes">${nodeElements.join('')}</g>
  </g>
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