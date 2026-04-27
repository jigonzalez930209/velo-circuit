export type ElementCode = 'R' | 'C' | 'L' | 'Q' | 'W' | 'Ws' | 'Wo';

export enum ElementKind {
  Resistor = 'R',
  Capacitor = 'C',
  Inductor = 'L',
  Cpe = 'Q',
  WarburgInfinite = 'W',
  WarburgShort = 'Ws',
  WarburgOpen = 'Wo',
}

export interface ElementKindDef {
  code: ElementCode;
  label: string;
  nParams: number;
  params: string[];
}

export const ELEMENT_KINDS: ReadonlyMap<ElementKind, ElementKindDef> = new Map([
  [ElementKind.Resistor, { code: 'R', label: 'Resistor', nParams: 1, params: ['R (Ω)'] }],
  [ElementKind.Capacitor, { code: 'C', label: 'Capacitor', nParams: 1, params: ['C (F)'] }],
  [ElementKind.Inductor, { code: 'L', label: 'Inductor', nParams: 1, params: ['L (H)'] }],
  [ElementKind.Cpe, { code: 'Q', label: 'CPE', nParams: 2, params: ['Q₀ (S·sⁿ)', 'n'] }],
  [ElementKind.WarburgInfinite, { code: 'W', label: 'Warburg (infinite)', nParams: 1, params: ['σ (Ω·s⁻½)'] }],
  [ElementKind.WarburgShort, { code: 'Ws', label: 'Warburg (short)', nParams: 2, params: ['Y₀ (S·s½)', 'B (s½)'] }],
  [ElementKind.WarburgOpen, { code: 'Wo', label: 'Warburg (open)', nParams: 2, params: ['Y₀ (S·s½)', 'B (s½)'] }],
]);

export interface ElementSlot {
  kind: ElementKind;
  id: number;
  paramOffset: number;
}

export interface SeriesNode {
  type: 'series';
  children: CircuitNode[];
}

export interface ParallelNode {
  type: 'parallel';
  children: CircuitNode[];
}

export type CircuitNode =
  | { type: 'element'; kind: ElementKind; id: number; paramOffset: number; params?: number[] }
  | SeriesNode
  | ParallelNode;

export function elementKindFromCode(code: string): ElementKind | null {
  if (code === 'R') return ElementKind.Resistor;
  if (code === 'C') return ElementKind.Capacitor;
  if (code === 'L') return ElementKind.Inductor;
  if (code === 'Q') return ElementKind.Cpe;
  if (code === 'W') return ElementKind.WarburgInfinite;
  if (code === 'Ws') return ElementKind.WarburgShort;
  if (code === 'Wo') return ElementKind.WarburgOpen;
  return null;
}

export function elementKindToCode(kind: ElementKind): ElementCode {
  return kind as string as ElementCode;
}

export function createElement(kind: ElementKind, id: number, paramOffset: number, params?: number[]): CircuitNode {
  return { type: 'element', kind, id, paramOffset, params };
}

export function createSeries(children: CircuitNode[]): CircuitNode {
  if (children.length === 1) return children[0];
  return { type: 'series', children };
}

export function createParallel(children: CircuitNode[]): CircuitNode {
  if (children.length === 1) return children[0];
  return { type: 'parallel', children };
}

export function nodeParameterCount(node: CircuitNode): number {
  switch (node.type) {
    case 'element':
      return node.paramOffset + nParams(node.kind);
    case 'series':
    case 'parallel':
      return Math.max(0, ...node.children.map(nodeParameterCount));
  }
}

export function nParams(kind: ElementKind): number {
  switch (kind) {
    case ElementKind.Resistor:
    case ElementKind.Capacitor:
    case ElementKind.Inductor:
    case ElementKind.WarburgInfinite:
      return 1;
    case ElementKind.Cpe:
    case ElementKind.WarburgShort:
    case ElementKind.WarburgOpen:
      return 2;
  }
}

export function traverseNodes(
  node: CircuitNode,
  visitor: (node: CircuitNode, depth: number) => void,
  depth = 0,
): void {
  visitor(node, depth);
  if (node.type === 'series' || node.type === 'parallel') {
    for (const child of node.children) {
      traverseNodes(child, visitor, depth + 1);
    }
  }
}

export function cloneNode(node: CircuitNode): CircuitNode {
  switch (node.type) {
    case 'element':
      return { ...node };
    case 'series':
      return { type: 'series', children: node.children.map(cloneNode) };
    case 'parallel':
      return { type: 'parallel', children: node.children.map(cloneNode) };
  }
}