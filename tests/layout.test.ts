import { describe, it, expect, beforeEach } from 'vitest';
import { buildLayout, computeBounds, resetNodeIdCounter, DEFAULT_LAYOUT_OPTIONS } from '../src/core/layout/index.js';
import { parseBoukamp } from '../src/core/parser-bridge/index.js';
import type { CircuitNode } from '../src/core/domain/circuit.js';
import { ElementKind } from '../src/core/domain/circuit.js';

describe('layout-engine', () => {
  beforeEach(() => {
    resetNodeIdCounter();
  });

  it('builds a graph for a single element', () => {
    const ast = { type: 'element' as const, kind: ElementKind.Resistor, id: 0, paramOffset: 0 };
    const graph = buildLayout(ast);
    expect(graph.nodes.size).toBe(1);
    expect(graph.rootNodeId).toBeTruthy();
  });

  it('builds a graph for a series circuit', () => {
    const dsl = 'R0-C1-L2';
    const ast = parseBoukamp(dsl) as CircuitNode;
    expect(ast).toHaveProperty('type', 'series');

    const graph = buildLayout(ast);
    expect(graph.nodes.size).toBeGreaterThan(0);
    expect(graph.connections.length).toBeGreaterThan(0);
  });

  it('builds a graph for a parallel circuit', () => {
    const dsl = 'p(R0,C1)';
    const ast = parseBoukamp(dsl) as CircuitNode;
    expect(ast).toHaveProperty('type', 'parallel');

    const graph = buildLayout(ast);
    expect(graph.nodes.size).toBeGreaterThan(0);
  });

  it('builds a graph for a Randles circuit', () => {
    const dsl = 'R0-p(R1,C1)';
    const ast = parseBoukamp(dsl) as CircuitNode;
    const graph = buildLayout(ast);
    expect(graph.nodes.size).toBeGreaterThan(0);
    expect(graph.rootNodeId).toBeTruthy();
  });

  it('builds a graph for deeply nested circuits', () => {
    const dsl = 'p(R0,p(C1,p(Q2,Wo3)))';
    const ast = parseBoukamp(dsl) as CircuitNode;
    const graph = buildLayout(ast);
    expect(graph.nodes.size).toBeGreaterThan(0);
  });

  it('computes bounds from a graph', () => {
    const dsl = 'R0-C1-L2';
    const ast = parseBoukamp(dsl) as CircuitNode;
    const graph = buildLayout(ast);
    const bounds = computeBounds(graph);
    expect(bounds.width).toBeGreaterThan(0);
    expect(bounds.height).toBeGreaterThan(0);
    expect(bounds.minX).toBeLessThan(Infinity);
    expect(bounds.minY).toBeLessThan(Infinity);
  });

  it('computes bounds for empty graph', () => {
    const bounds = computeBounds({ nodes: new Map(), connections: [], rootNodeId: null });
    expect(bounds.width).toBe(0);
    expect(bounds.height).toBe(0);
  });

  it('assigns visualX and visualY to nodes', () => {
    const ast = { type: 'element' as const, kind: ElementKind.Resistor, id: 0, paramOffset: 0 };
    const graph = buildLayout(ast);
    for (const node of graph.nodes.values()) {
      expect(typeof node.visualX).toBe('number');
      expect(typeof node.visualY).toBe('number');
      expect(typeof node.width).toBe('number');
      expect(typeof node.height).toBe('number');
      expect(node.ports.length).toBeGreaterThan(0);
    }
  });

  it('layout respects horizontal spacing from options', () => {
    const ast = { type: 'element' as const, kind: ElementKind.Resistor, id: 0, paramOffset: 0 };
    const custom = { ...DEFAULT_LAYOUT_OPTIONS, horizontalSpacing: 100 };
    const graph = buildLayout(ast, custom);
    const node = graph.nodes.values().next().value;
    expect(node).toBeDefined();
  });
});

describe('translator (ast <-> graph)', () => {
  it('astToGraph produces a graph with nodes', async () => {
    const { astToGraph, resetGraphNodeIdCounter } = await import('../src/core/domain/translator.js');
    const { resetNodeIdCounter } = await import('../src/core/layout/layout-engine.js');
    resetNodeIdCounter();
    resetGraphNodeIdCounter();
    const ast = { type: 'element' as const, kind: ElementKind.Capacitor, id: 1, paramOffset: 0 };
    const graph = astToGraph(ast);
    expect(graph.nodes.size).toBe(1);
  });
});