import type { CircuitNode } from './circuit';

export interface Port {
  id: string;
  side: 'left' | 'right' | 'top' | 'bottom';
  x: number;
  y: number;
}

export interface ElementNode {
  nodeId: string;
  circuitNode: CircuitNode;
  visualX: number;
  visualY: number;
  width: number;
  height: number;
  ports: Port[];
}

export interface Connection {
  id: string;
  fromNodeId: string;
  fromPortId: string;
  toNodeId: string;
  toPortId: string;
}

export interface EditableGraph {
  nodes: Map<string, ElementNode>;
  connections: Connection[];
  rootNodeId: string | null;
}

export interface NodePosition {
  x: number;
  y: number;
}

export interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function nodeBounds(node: ElementNode): Bounds {
  return {
    x: node.visualX,
    y: node.visualY,
    width: node.width,
    height: node.height,
  };
}

export function emptyGraph(): EditableGraph {
  return { nodes: new Map(), connections: [], rootNodeId: null };
}