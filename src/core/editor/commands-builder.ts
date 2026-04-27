import type { CircuitNode, ElementKind } from '../domain/circuit.js';
import { createElement, createSeries, createParallel, traverseNodes, cloneNode, nParams } from '../domain/circuit.js';

export interface InsertOptions {
  parentId?: string | null;
  position?: number;
  id?: number;
  paramOffset?: number;
}

export function buildInsertElementCommand(
  kind: ElementKind,
  options?: InsertOptions,
): import('../domain/commands.js').InsertElementCommand {
  const id = options?.id ?? 0;
  const paramOffset = options?.paramOffset ?? 0;
  return {
    type: 'insert-element',
    id: `cmd-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    timestamp: Date.now(),
    description: `Insert ${kind}${id}`,
    kind,
    elementId: id,
    paramOffset,
    parentId: options?.parentId ?? null,
    position: options?.position ?? -1,
  };
}

export function buildDeleteNodeCommand(nodeId: string, serializedSubtree?: unknown): import('../domain/commands.js').DeleteNodeCommand {
  return {
    type: 'delete-node',
    id: `cmd-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    timestamp: Date.now(),
    description: `Delete node ${nodeId}`,
    nodeId,
    serializedSubtree: serializedSubtree ?? {},
  };
}

export function buildMoveNodeCommand(nodeId: string, deltaX: number, deltaY: number): import('../domain/commands.js').MoveNodeCommand {
  return {
    type: 'move-node',
    id: `cmd-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    timestamp: Date.now(),
    description: `Move node ${nodeId}`,
    nodeId,
    deltaX,
    deltaY,
  };
}

export function buildSetSelectionCommand(selectedIds: string[]): import('../domain/commands.js').SetSelectionCommand {
  return {
    type: 'set-selection',
    id: `cmd-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    timestamp: Date.now(),
    description: `Select ${selectedIds.join(', ') || 'none'}`,
    selectedIds,
  };
}

/**
 * Insert element into a series structure at a given position.
 */
export function insertElementIntoSeries(ast: CircuitNode, element: CircuitNode, position: number): CircuitNode {
  if (ast.type === 'series') {
    const children = [...ast.children];
    const safePos = Math.max(0, Math.min(position, children.length));
    children.splice(safePos, 0, element);
    return createSeries(children);
  }
  // Wrap existing node + new element in a series
  if (position === 0) {
    return createSeries([element, ast]);
  }
  return createSeries([ast, element]);
}

/**
 * Insert element as a new parallel branch alongside the existing circuit.
 */
export function insertElementIntoParallel(ast: CircuitNode, element: CircuitNode): CircuitNode {
  if (ast.type === 'parallel') {
    return createParallel([...ast.children, element]);
  }
  return createParallel([ast, element]);
}

/**
 * Wrap a specific element inside a parallel group with a new element.
 * Finds the target by its string ID (e.g. "R0"), wraps it in p(target, newElement).
 */
export function wrapInParallel(ast: CircuitNode, targetId: string, newElement: CircuitNode): CircuitNode {
  return transformNode(ast, targetId, (node) => {
    return createParallel([cloneNode(node), newElement]);
  });
}

/**
 * Wrap a specific element into a series with a new element.
 */
export function wrapInSeries(ast: CircuitNode, targetId: string, newElement: CircuitNode, after = true): CircuitNode {
  return transformNode(ast, targetId, (node) => {
    return after
      ? createSeries([cloneNode(node), newElement])
      : createSeries([newElement, cloneNode(node)]);
  });
}

/**
 * Recursively delete an element from any depth in the AST.
 * Returns the modified AST, or a fallback single element if the entire tree would be deleted.
 */
export function deleteElementRecursive(ast: CircuitNode, targetId: string): CircuitNode {
  if (ast.type === 'element') {
    const id = `${ast.kind}${ast.id}`;
    if (id === targetId) {
      // Cannot delete the only element; return a default
      return createElement('R' as unknown as ElementKind, 0, 0);
    }
    return ast;
  }

  if (ast.type === 'series' || ast.type === 'parallel') {
    const filtered = ast.children
      .map(child => {
        if (child.type === 'element' && `${child.kind}${child.id}` === targetId) {
          return null;
        }
        if (child.type === 'series' || child.type === 'parallel') {
          const result = deleteElementRecursive(child, targetId);
          return result;
        }
        return child;
      })
      .filter((child): child is CircuitNode => child !== null);

    if (filtered.length === 0) {
      return createElement('R' as unknown as ElementKind, 0, 0);
    }
    if (filtered.length === 1) {
      return filtered[0];
    }

    return ast.type === 'series'
      ? createSeries(filtered)
      : createParallel(filtered);
  }

  return ast;
}

/**
 * Delete an element from a series specifically.
 */
export function deleteElementFromSeries(ast: CircuitNode, targetId: string): CircuitNode {
  return deleteElementRecursive(ast, targetId);
}

/**
 * Delete an element from a parallel specifically.
 */
export function deleteElementFromParallel(ast: CircuitNode, targetId: string): CircuitNode {
  return deleteElementRecursive(ast, targetId);
}

/**
 * Convert a series group to parallel.
 */
export function convertSeriesToParallel(ast: CircuitNode, targetId: string): CircuitNode | null {
  return transformNode(ast, targetId, (node) => {
    if (node.type === 'series') {
      return createParallel(node.children.map(cloneNode));
    }
    return node;
  });
}

/**
 * Convert a parallel group to series.
 */
export function convertParallelToSeries(ast: CircuitNode, targetId: string): CircuitNode | null {
  return transformNode(ast, targetId, (node) => {
    if (node.type === 'parallel') {
      return createSeries(node.children.map(cloneNode));
    }
    return node;
  });
}

/**
 * Generate the next available ID for a given element kind.
 */
export function generateNextElementId(ast: CircuitNode, kind: ElementKind): number {
  let maxId = -1;

  traverseNodes(ast, (node) => {
    if (node.type === 'element' && node.kind === kind) {
      maxId = Math.max(maxId, node.id);
    }
  });

  return maxId + 1;
}

/**
 * Compute the next parameter offset for a new element.
 */
export function computeNextParamOffset(ast: CircuitNode): number {
  let maxOffset = 0;

  traverseNodes(ast, (node) => {
    if (node.type === 'element') {
      maxOffset = Math.max(maxOffset, node.paramOffset + nParams(node.kind));
    }
  });

  return maxOffset;
}

/**
 * Find a node by its string identifier (e.g. "R0", "C1").
 */
export function findNodeById(ast: CircuitNode, targetId: string): CircuitNode | null {
  if (ast.type === 'element' && `${ast.kind}${ast.id}` === targetId) return ast;
  if (ast.type === 'series' || ast.type === 'parallel') {
    for (const child of ast.children) {
      const found = findNodeById(child, targetId);
      if (found) return found;
    }
  }
  return null;
}

/**
 * Count total elements in the AST.
 */
export function countElements(ast: CircuitNode): number {
  let count = 0;
  traverseNodes(ast, (node) => {
    if (node.type === 'element') count++;
  });
  return count;
}

/**
 * Check if a circuit AST has at least one element.
 */
export function isCircuitValid(ast: CircuitNode): boolean {
  return countElements(ast) > 0;
}

/**
 * Collect all element IDs in the AST as strings (e.g. ["R0", "C1"]).
 */
export function collectElementIds(ast: CircuitNode): string[] {
  const ids: string[] = [];
  traverseNodes(ast, (node) => {
    if (node.type === 'element') {
      ids.push(`${node.kind}${node.id}`);
    }
  });
  return ids;
}

/**
 * Transform a specific node in the AST by its element ID.
 * The transformer receives the matching node and returns its replacement.
 */
function transformNode(ast: CircuitNode, targetId: string, transform: (node: CircuitNode) => CircuitNode): CircuitNode {
  if (ast.type === 'element') {
    if (`${ast.kind}${ast.id}` === targetId) {
      return transform(ast);
    }
    return ast;
  }

  if (ast.type === 'series' || ast.type === 'parallel') {
    const newChildren = ast.children.map(child => transformNode(child, targetId, transform));
    return ast.type === 'series'
      ? createSeries(newChildren)
      : createParallel(newChildren);
  }

  return ast;
}

// ──── Positional insert operations ────

function getNodeId(node: CircuitNode): string | null {
  if (node.type === 'element') return `${node.kind}${node.id}`;
  return null;
}

function nodeContains(node: CircuitNode, targetId: string): boolean {
  if (node.type === 'element') return `${node.kind}${node.id}` === targetId;
  if (node.type === 'series' || node.type === 'parallel') {
    return node.children.some(c => nodeContains(c, targetId));
  }
  return false;
}

/**
 * Insert a new element AFTER a target element in its parent series.
 * If the target is not in a series, wraps it in a new series: [target, newElement].
 */
export function insertAfterTarget(ast: CircuitNode, targetId: string, newElement: CircuitNode): CircuitNode {
  // Root is the target element itself
  if (ast.type === 'element' && `${ast.kind}${ast.id}` === targetId) {
    return createSeries([cloneNode(ast), newElement]);
  }

  if (ast.type === 'series') {
    const idx = ast.children.findIndex(c => {
      if (c.type === 'element') return `${c.kind}${c.id}` === targetId;
      return nodeContains(c, targetId);
    });

    if (idx !== -1) {
      const child = ast.children[idx];
      // If this child IS the target (element), insert after it in the series
      if (child.type === 'element' && `${child.kind}${child.id}` === targetId) {
        const newChildren = [...ast.children];
        newChildren.splice(idx + 1, 0, newElement);
        return createSeries(newChildren);
      }
      // Target is deeper — recurse into this child
      const newChildren = ast.children.map((c, i) =>
        i === idx ? insertAfterTarget(c, targetId, newElement) : c
      );
      return createSeries(newChildren);
    }
  }

  if (ast.type === 'parallel') {
    const newChildren = ast.children.map(c =>
      nodeContains(c, targetId) ? insertAfterTarget(c, targetId, newElement) : c
    );
    return createParallel(newChildren);
  }

  return ast;
}

/**
 * Insert a new element BEFORE a target element in its parent series.
 */
export function insertBeforeTarget(ast: CircuitNode, targetId: string, newElement: CircuitNode): CircuitNode {
  if (ast.type === 'element' && `${ast.kind}${ast.id}` === targetId) {
    return createSeries([newElement, cloneNode(ast)]);
  }

  if (ast.type === 'series') {
    const idx = ast.children.findIndex(c => {
      if (c.type === 'element') return `${c.kind}${c.id}` === targetId;
      return nodeContains(c, targetId);
    });

    if (idx !== -1) {
      const child = ast.children[idx];
      if (child.type === 'element' && `${child.kind}${child.id}` === targetId) {
        const newChildren = [...ast.children];
        newChildren.splice(idx, 0, newElement);
        return createSeries(newChildren);
      }
      const newChildren = ast.children.map((c, i) =>
        i === idx ? insertBeforeTarget(c, targetId, newElement) : c
      );
      return createSeries(newChildren);
    }
  }

  if (ast.type === 'parallel') {
    const newChildren = ast.children.map(c =>
      nodeContains(c, targetId) ? insertBeforeTarget(c, targetId, newElement) : c
    );
    return createParallel(newChildren);
  }

  return ast;
}

/**
 * Add a new element as a parallel branch to a specific target.
 * Wraps the target in p(target, newElement).
 */
export function addParallelToTarget(ast: CircuitNode, targetId: string, newElement: CircuitNode): CircuitNode {
  return transformNode(ast, targetId, (node) => {
    return createParallel([cloneNode(node), newElement]);
  });
}

/**
 * Move an element left (earlier) in its parent series by swapping with previous sibling.
 */
export function moveElementLeft(ast: CircuitNode, targetId: string): CircuitNode {
  return moveElementInSeries(ast, targetId, -1);
}

/**
 * Move an element right (later) in its parent series by swapping with next sibling.
 */
export function moveElementRight(ast: CircuitNode, targetId: string): CircuitNode {
  return moveElementInSeries(ast, targetId, 1);
}

function moveElementInSeries(ast: CircuitNode, targetId: string, direction: -1 | 1): CircuitNode {
  if (ast.type === 'series') {
    const idx = ast.children.findIndex(c => {
      if (c.type === 'element') return `${c.kind}${c.id}` === targetId;
      return false;
    });

    if (idx !== -1) {
      const newIdx = idx + direction;
      if (newIdx >= 0 && newIdx < ast.children.length) {
        const newChildren = [...ast.children];
        [newChildren[idx], newChildren[newIdx]] = [newChildren[newIdx], newChildren[idx]];
        return createSeries(newChildren);
      }
      return ast; // Can't move further
    }

    // Not found at this level, recurse into children
    const newChildren = ast.children.map(c =>
      nodeContains(c, targetId) ? moveElementInSeries(c, targetId, direction) : c
    );
    return createSeries(newChildren);
  }

  if (ast.type === 'parallel') {
    const newChildren = ast.children.map(c =>
      nodeContains(c, targetId) ? moveElementInSeries(c, targetId, direction) : c
    );
    return createParallel(newChildren);
  }

  return ast;
}

export type ParentContext = {
  parentType: 'root' | 'series' | 'parallel';
  index: number;
  siblingCount: number;
  canMoveLeft: boolean;
  canMoveRight: boolean;
};

/**
 * Get contextual info about an element's position in the AST.
 */
export function getElementContext(ast: CircuitNode, targetId: string): ParentContext {
  // Root element
  if (ast.type === 'element' && `${ast.kind}${ast.id}` === targetId) {
    return { parentType: 'root', index: 0, siblingCount: 1, canMoveLeft: false, canMoveRight: false };
  }

  if (ast.type === 'series' || ast.type === 'parallel') {
    for (let i = 0; i < ast.children.length; i++) {
      const child = ast.children[i];
      if (child.type === 'element' && `${child.kind}${child.id}` === targetId) {
        return {
          parentType: ast.type,
          index: i,
          siblingCount: ast.children.length,
          canMoveLeft: ast.type === 'series' && i > 0,
          canMoveRight: ast.type === 'series' && i < ast.children.length - 1,
        };
      }
      if (nodeContains(child, targetId)) {
        return getElementContext(child, targetId);
      }
    }
  }

  return { parentType: 'root', index: 0, siblingCount: 1, canMoveLeft: false, canMoveRight: false };
}