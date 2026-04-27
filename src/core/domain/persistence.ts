import type { CircuitNode, ElementKind } from './circuit.js';
import { serialize } from '../parser-bridge/serializer.js';

export interface SerializedCircuit {
  version: number;
  dsl: string;
  ast: SerializedCircuitNode;
  metadata?: {
    name?: string;
    author?: string;
    createdAt?: number;
    modifiedAt?: number;
  };
}

export interface SerializedCircuitNode {
  type: 'element' | 'series' | 'parallel';
  kind?: string;
  id?: number;
  paramOffset?: number;
  children?: SerializedCircuitNode[];
}

export function serializeCircuit(ast: CircuitNode, metadata?: SerializedCircuit['metadata']): SerializedCircuit {
  return {
    version: 1,
    dsl: serialize(ast),
    ast: serializeAstNode(ast),
    metadata,
  };
}

function serializeAstNode(node: CircuitNode): SerializedCircuitNode {
  if (node.type === 'element') {
    return {
      type: 'element',
      kind: node.kind as string,
      id: node.id,
      paramOffset: node.paramOffset,
    };
  }
  if (node.type === 'series') {
    return {
      type: 'series',
      children: node.children.map(serializeAstNode),
    };
  }
  if (node.type === 'parallel') {
    return {
      type: 'parallel',
      children: node.children.map(serializeAstNode),
    };
  }
  return { type: 'element' };
}

export function deserializeCircuit(data: SerializedCircuit): CircuitNode | null {
  if (!data.ast) return null;
  return deserializeAstNode(data.ast);
}

function deserializeAstNode(node: SerializedCircuitNode): CircuitNode {
  if (node.type === 'element') {
    return {
      type: 'element',
      kind: node.kind as ElementKind,
      id: node.id ?? 0,
      paramOffset: node.paramOffset ?? 0,
    };
  }
  if (node.type === 'series') {
    return {
      type: 'series',
      children: (node.children ?? []).map(deserializeAstNode),
    };
  }
  if (node.type === 'parallel') {
    return {
      type: 'parallel',
      children: (node.children ?? []).map(deserializeAstNode),
    };
  }
  return { type: 'element', kind: 'R' as ElementKind, id: 0, paramOffset: 0 };
}

export function circuitToJson(ast: CircuitNode, pretty = false): string {
  const data = serializeCircuit(ast);
  return pretty ? JSON.stringify(data, null, 2) : JSON.stringify(data);
}

export function circuitFromJson(json: string): CircuitNode | null {
  try {
    const data = JSON.parse(json) as SerializedCircuit;
    return deserializeCircuit(data);
  } catch {
    return null;
  }
}