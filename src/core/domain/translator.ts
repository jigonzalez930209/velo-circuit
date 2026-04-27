import type { CircuitNode } from './circuit.js';
import type { EditableGraph, ElementNode } from './graph.js';
import { ELEMENT_KINDS } from './circuit.js';

let nodeIdCounter = 0;

function nextNodeId(): string {
  return `node-${++nodeIdCounter}`;
}

export function astToGraph(ast: CircuitNode): EditableGraph {
  nodeIdCounter = 0;
  const nodes = new Map<string, ElementNode>();
  const connections: import('./graph.js').Connection[] = [];

  function buildNode(circuit: CircuitNode): ElementNode {
    if (circuit.type === 'element') {
      return buildElementNode(circuit);
    }
    if (circuit.type === 'series') {
      return buildSeriesNode(circuit);
    }
    if (circuit.type === 'parallel') {
      return buildParallelNode(circuit);
    }
    return buildElementNode({ type: 'element', kind: 'R' as import('./circuit.js').ElementKind, id: 0, paramOffset: 0 });
  }

  function buildElementNode(circuit: { type: 'element'; kind: import('./circuit.js').ElementKind; id: number; paramOffset: number }): ElementNode {
    const nodeId = nextNodeId();
    const width = 80;
    const height = 40;

    const node: ElementNode = {
      nodeId,
      circuitNode: circuit,
      visualX: 0,
      visualY: 0,
      width,
      height,
      ports: [
        { id: `${nodeId}-left`, side: 'left', x: 0, y: height / 2 },
        { id: `${nodeId}-right`, side: 'right', x: width, y: height / 2 },
      ],
    };

    nodes.set(nodeId, node);
    return node;
  }

  function buildSeriesNode(circuit: { type: 'series'; children: CircuitNode[] }): ElementNode {
    const nodeId = nextNodeId();
    const children = circuit.children.map(buildNode);
    for (const child of children) {
      nodes.set(child.nodeId, child);
    }

    let totalWidth = 0;
    let maxHeight = 0;

    for (const child of children) {
      totalWidth += child.width + 60;
      maxHeight = Math.max(maxHeight, child.height);
    }

    totalWidth = Math.max(0, totalWidth - 60);

    for (let i = 0; i < children.length - 1; i++) {
      const leftChild = children[i];
      const rightChild = children[i + 1];
      const leftPort = leftChild.ports.find(p => p.side === 'right');
      const rightPort = rightChild.ports.find(p => p.side === 'left');
      if (leftPort && rightPort) {
        connections.push({
          id: `conn-series-${i}`,
          fromNodeId: leftChild.nodeId,
          fromPortId: leftPort.id,
          toNodeId: rightChild.nodeId,
          toPortId: rightPort.id,
        });
      }
    }

    return {
      nodeId,
      circuitNode: circuit,
      visualX: 0,
      visualY: 0,
      width: totalWidth,
      height: maxHeight,
      ports: [
        { id: `${nodeId}-left`, side: 'left', x: 0, y: maxHeight / 2 },
        { id: `${nodeId}-right`, side: 'right', x: totalWidth, y: maxHeight / 2 },
      ],
    };
  }

  function buildParallelNode(circuit: { type: 'parallel'; children: CircuitNode[] }): ElementNode {
    const nodeId = nextNodeId();
    const children = circuit.children.map(buildNode);

    const totalHeight = children.reduce((sum, child) => sum + child.height, 0) + (children.length - 1) * 20;
    const maxWidth = Math.max(...children.map(c => c.width), 80);

    for (let i = 0; i < children.length; i++) {
      if (i > 0) {
        const top = children[i - 1];
        const bottom = children[i];
        const topRight = top.ports.find(p => p.side === 'right');
        const bottomRight = bottom.ports.find(p => p.side === 'right');
        if (topRight && bottomRight) {
          connections.push({
            id: `conn-p-${top.nodeId}-${bottom.nodeId}`,
            fromNodeId: top.nodeId,
            fromPortId: topRight.id,
            toNodeId: bottom.nodeId,
            toPortId: bottomRight.id,
          });
        }
      }
    }

    return {
      nodeId,
      circuitNode: circuit,
      visualX: 0,
      visualY: 0,
      width: maxWidth,
      height: totalHeight,
      ports: [
        { id: `${nodeId}-left`, side: 'left', x: 0, y: totalHeight / 2 },
        { id: `${nodeId}-right`, side: 'right', x: maxWidth, y: totalHeight / 2 },
      ],
    };
  }

  const root = buildNode(ast);

  return { nodes, connections, rootNodeId: root.nodeId };
}

export function graphToAst(graph: EditableGraph): CircuitNode | null {
  if (!graph.rootNodeId) return null;
  const root = graph.nodes.get(graph.rootNodeId);
  if (!root) return null;
  return root.circuitNode;
}

export function resetGraphNodeIdCounter(): void {
  nodeIdCounter = 0;
}