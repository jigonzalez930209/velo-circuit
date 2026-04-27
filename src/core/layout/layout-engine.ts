import type { CircuitNode, ElementKind } from '../domain/circuit.js';
import type { EditableGraph, ElementNode, Port, Connection } from '../domain/graph.js';

export interface LayoutOptions {
  horizontalSpacing: number;
  verticalSpacing: number;
  elementWidth: number;
  elementHeight: number;
  parallelWidth: number;
  padding: number;
}

export const DEFAULT_LAYOUT_OPTIONS: LayoutOptions = {
  horizontalSpacing: 60,
  verticalSpacing: 40,
  elementWidth: 80,
  elementHeight: 40,
  parallelWidth: 120,
  padding: 40,
};

interface LayoutResult {
  width: number;
  height: number;
  /** IDs of the leftmost/rightmost connectable leaf nodes */
  leftPorts: string[];
  rightPorts: string[];
}

let nodeIdCounter = 0;

function nextNodeId(): string {
  return `node-${++nodeIdCounter}`;
}

/**
 * Build a correctly-structured editable graph from a CircuitNode AST.
 *
 * Key principles:
 * - Only element (leaf) nodes are placed in the nodes map
 * - Series: children laid out left-to-right, connections between consecutive children's right→left ports
 * - Parallel: junction nodes at left/right, children stacked vertically, junctions connect to each branch
 */
export function buildLayout(circuit: CircuitNode, options: Partial<LayoutOptions> = {}): EditableGraph {
  nodeIdCounter = 0;
  const opts = { ...DEFAULT_LAYOUT_OPTIONS, ...options };
  const nodes = new Map<string, ElementNode>();
  const connections: Connection[] = [];
  let connectionIdCounter = 0;

  function nextConnId(): string {
    return `conn-${++connectionIdCounter}`;
  }

  function makePorts(nodeId: string, x: number, y: number, w: number, h: number): Port[] {
    return [
      { id: `${nodeId}-L`, side: 'left', x, y: y + h / 2 },
      { id: `${nodeId}-R`, side: 'right', x: x + w, y: y + h / 2 },
    ];
  }

  function addConnection(fromNodeId: string, fromPortId: string, toNodeId: string, toPortId: string): void {
    connections.push({
      id: nextConnId(),
      fromNodeId,
      fromPortId,
      toNodeId,
      toPortId,
    });
  }

  /**
   * Recursively lay out a circuit node starting at (x, y).
   * Returns layout metrics and port IDs for connecting to neighbors.
   */
  function layout(circuit: CircuitNode, x: number, y: number): LayoutResult {
    switch (circuit.type) {
      case 'element':
        return layoutElement(circuit, x, y);
      case 'series':
        return layoutSeries(circuit, x, y);
      case 'parallel':
        return layoutParallel(circuit, x, y);
      default:
        return layoutElement(
          { type: 'element', kind: 'R' as ElementKind, id: 0, paramOffset: 0 },
          x, y,
        );
    }
  }

  function layoutElement(
    circuit: { type: 'element'; kind: ElementKind; id: number; paramOffset: number },
    x: number,
    y: number,
  ): LayoutResult {
    const nodeId = nextNodeId();
    const w = opts.elementWidth;
    const h = opts.elementHeight;
    const ports = makePorts(nodeId, x, y, w, h);

    const node: ElementNode = {
      nodeId,
      circuitNode: circuit,
      visualX: x,
      visualY: y,
      width: w,
      height: h,
      ports,
    };

    nodes.set(nodeId, node);

    return {
      width: w,
      height: h,
      leftPorts: [ports[0].id],
      rightPorts: [ports[1].id],
    };
  }

  function layoutSeries(
    circuit: { type: 'series'; children: CircuitNode[] },
    x: number,
    y: number,
  ): LayoutResult {
    if (circuit.children.length === 0) {
      return { width: 0, height: 0, leftPorts: [], rightPorts: [] };
    }

    if (circuit.children.length === 1) {
      return layout(circuit.children[0], x, y);
    }

    const childResults: LayoutResult[] = [];
    let currentX = x;
    let maxHeight = 0;

    // First pass: layout all children
    for (let i = 0; i < circuit.children.length; i++) {
      const child = circuit.children[i];
      const result = layout(child, currentX, y);
      childResults.push(result);
      currentX += result.width + opts.horizontalSpacing;
      maxHeight = Math.max(maxHeight, result.height);
    }

    const totalWidth = currentX - x - opts.horizontalSpacing;

    // Second pass: create connections between consecutive children
    for (let i = 0; i < childResults.length - 1; i++) {
      const left = childResults[i];
      const right = childResults[i + 1];

      // Connect each right port of left child to each left port of right child
      for (const rightPort of left.rightPorts) {
        for (const leftPort of right.leftPorts) {
          const fromNode = findNodeByPortId(rightPort);
          const toNode = findNodeByPortId(leftPort);
          if (fromNode && toNode) {
            addConnection(fromNode.nodeId, rightPort, toNode.nodeId, leftPort);
          }
        }
      }
    }

    return {
      width: totalWidth,
      height: maxHeight,
      leftPorts: childResults[0].leftPorts,
      rightPorts: childResults[childResults.length - 1].rightPorts,
    };
  }

  function layoutParallel(
    circuit: { type: 'parallel'; children: CircuitNode[] },
    x: number,
    y: number,
  ): LayoutResult {
    if (circuit.children.length === 0) {
      return { width: 0, height: 0, leftPorts: [], rightPorts: [] };
    }

    if (circuit.children.length === 1) {
      return layout(circuit.children[0], x, y);
    }

    // Create junction nodes on left and right
    const junctionLeft = nextNodeId();
    const junctionRight = nextNodeId();
    const junctionSize = 10;

    // First pass: measure all children to get max width and total height
    const childMeasurements: { width: number; height: number }[] = [];
    let maxChildWidth = 0;
    let totalChildHeight = 0;

    for (const child of circuit.children) {
      const tempCounter = nodeIdCounter;
      // Measure without creating nodes (we'll re-layout)
      const measured = measureNode(child);
      childMeasurements.push(measured);
      maxChildWidth = Math.max(maxChildWidth, measured.width);
      totalChildHeight += measured.height;
    }

    totalChildHeight += (circuit.children.length - 1) * opts.verticalSpacing;

    // Junction positions
    const innerStartX = x + junctionSize + opts.horizontalSpacing / 2;
    const innerEndX = innerStartX + maxChildWidth;
    const totalWidth = junctionSize + opts.horizontalSpacing / 2 + maxChildWidth + opts.horizontalSpacing / 2 + junctionSize;

    // Create left junction
    const jLeftPorts = makePorts(junctionLeft, x, y, junctionSize, totalChildHeight);
    nodes.set(junctionLeft, {
      nodeId: junctionLeft,
      circuitNode: { type: 'parallel', children: [] } as unknown as CircuitNode,
      visualX: x,
      visualY: y,
      width: junctionSize,
      height: totalChildHeight,
      ports: jLeftPorts,
    });

    // Create right junction
    const rightJuncX = x + totalWidth - junctionSize;
    const jRightPorts = makePorts(junctionRight, rightJuncX, y, junctionSize, totalChildHeight);
    nodes.set(junctionRight, {
      nodeId: junctionRight,
      circuitNode: { type: 'parallel', children: [] } as unknown as CircuitNode,
      visualX: rightJuncX,
      visualY: y,
      width: junctionSize,
      height: totalChildHeight,
      ports: jRightPorts,
    });

    // Second pass: lay out children vertically, centered horizontally
    const childResults: LayoutResult[] = [];
    let currentY = y;

    for (let i = 0; i < circuit.children.length; i++) {
      const child = circuit.children[i];
      const childX = innerStartX + (maxChildWidth - childMeasurements[i].width) / 2;
      const result = layout(child, childX, currentY);
      childResults.push(result);

      // Connect left junction → child left port
      for (const leftPort of result.leftPorts) {
        const targetNode = findNodeByPortId(leftPort);
        if (targetNode) {
          addConnection(junctionLeft, jLeftPorts[0].id, targetNode.nodeId, leftPort);
        }
      }

      // Connect child right port → right junction
      for (const rightPort of result.rightPorts) {
        const targetNode = findNodeByPortId(rightPort);
        if (targetNode) {
          addConnection(targetNode.nodeId, rightPort, junctionRight, jRightPorts[1].id);
        }
      }

      currentY += result.height + opts.verticalSpacing;
    }

    return {
      width: totalWidth,
      height: totalChildHeight,
      leftPorts: [jLeftPorts[0].id],
      rightPorts: [jRightPorts[1].id],
    };
  }

  function findNodeByPortId(portId: string): ElementNode | null {
    for (const node of nodes.values()) {
      if (node.ports.some(p => p.id === portId)) {
        return node;
      }
    }
    return null;
  }

  function measureNode(circuit: CircuitNode): { width: number; height: number } {
    switch (circuit.type) {
      case 'element':
        return { width: opts.elementWidth, height: opts.elementHeight };
      case 'series': {
        if (circuit.children.length === 0) return { width: 0, height: 0 };
        let totalWidth = 0;
        let maxHeight = 0;
        for (const child of circuit.children) {
          const m = measureNode(child);
          totalWidth += m.width;
          maxHeight = Math.max(maxHeight, m.height);
        }
        totalWidth += (circuit.children.length - 1) * opts.horizontalSpacing;
        return { width: totalWidth, height: maxHeight };
      }
      case 'parallel': {
        if (circuit.children.length === 0) return { width: 0, height: 0 };
        let maxWidth = 0;
        let totalHeight = 0;
        const junctionSize = 10;
        for (const child of circuit.children) {
          const m = measureNode(child);
          maxWidth = Math.max(maxWidth, m.width);
          totalHeight += m.height;
        }
        totalHeight += (circuit.children.length - 1) * opts.verticalSpacing;
        const totalWidth = junctionSize + opts.horizontalSpacing / 2 + maxWidth + opts.horizontalSpacing / 2 + junctionSize;
        return { width: totalWidth, height: totalHeight };
      }
      default:
        return { width: opts.elementWidth, height: opts.elementHeight };
    }
  }

  // Start layout at padding offset
  const rootResult = layout(circuit, opts.padding, opts.padding);

  // Find the root node (the first node or a junction)
  const rootNodeId = nodes.keys().next().value ?? null;

  return { nodes, connections, rootNodeId };
}

export function computeBounds(graph: EditableGraph): { width: number; height: number; minX: number; minY: number } {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

  for (const node of graph.nodes.values()) {
    minX = Math.min(minX, node.visualX);
    minY = Math.min(minY, node.visualY);
    maxX = Math.max(maxX, node.visualX + node.width);
    maxY = Math.max(maxY, node.visualY + node.height);
  }

  if (minX === Infinity) return { width: 0, height: 0, minX: 0, minY: 0 };

  return {
    width: maxX - minX + 40,
    height: maxY - minY + 40,
    minX: minX - 20,
    minY: minY - 20,
  };
}

export function resetNodeIdCounter(): void {
  nodeIdCounter = 0;
}