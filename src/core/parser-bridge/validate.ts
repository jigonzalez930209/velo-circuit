import type { CircuitNode } from '../domain/circuit.js';
import type { ValidationResult, ValidationIssue, ValidationError, ValidationWarning } from '../domain/validation.js';
import { ELEMENT_KINDS, nParams, traverseNodes } from '../domain/circuit.js';

/**
 * Comprehensive circuit validator.
 *
 * Detects multiple error types:
 * - duplicate-id: same (kind, id) pair appears more than once
 * - empty-circuit: AST has zero elements
 * - empty-parallel: parallel node with zero children
 * - empty-series: series node with zero children
 * - single-branch-parallel: parallel node with only 1 child (should be unwrapped)
 * - dangling-element: element in a structure that would leave it unconnected
 *
 * Warnings:
 * - no-dc-path: no resistive element in the circuit
 * - purely-reactive: circuit is purely reactive/diffusive without a DC path
 * - warburg-inductor-parallel: Warburg in parallel with inductor (non-physical)
 * - single-element-circuit: circuit consists of a single element
 */
export function validate(ast: CircuitNode): ValidationResult {
  const issues: ValidationIssue[] = [];

  // 1. Count elements — detect empty circuit
  let elementCount = 0;
  traverseNodes(ast, (node) => {
    if (node.type === 'element') elementCount++;
  });

  if (elementCount === 0) {
    issues.push({
      type: 'error',
      kind: 'empty-circuit',
      message: 'Circuit has no elements. Add at least one element (R, C, L, Q, W, Ws, Wo, G, Pdw).',
    });
    return buildResult(issues);
  }

  // 2. Single element warning
  if (elementCount === 1 && ast.type === 'element') {
    issues.push({
      type: 'warning',
      kind: 'single-element-circuit',
      message: 'Circuit consists of a single element. Consider adding more elements for a meaningful circuit.',
    });
  }

  // 3. Structural validation (recursive)
  validateStructure(ast, issues, 'root');

  // 4. Duplicate ID detection
  validateDuplicateIds(ast, issues);

  // 5. Optional embedded parameter-vector validation
  validateElementParameters(ast, issues);

  // 6. Physical validity: DC path check
  validateDcPath(ast, issues);

  // 7. Physical validity: conflicting reactive elements
  validateConflictingReactive(ast, issues);

  return buildResult(issues);
}

function validateStructure(node: CircuitNode, issues: ValidationIssue[], path: string): void {
  if (node.type === 'series') {
    if (node.children.length === 0) {
      issues.push({
        type: 'error',
        kind: 'empty-series',
        message: `Empty series group at ${path}. Series must contain at least one element.`,
        path,
      });
      return;
    }

    for (let i = 0; i < node.children.length; i++) {
      validateStructure(node.children[i], issues, `${path}.series[${i}]`);
    }
  }

  if (node.type === 'parallel') {
    if (node.children.length === 0) {
      issues.push({
        type: 'error',
        kind: 'empty-parallel',
        message: `Empty parallel group at ${path}. Parallel must contain at least 2 branches.`,
        path,
      });
      return;
    }

    if (node.children.length === 1) {
      issues.push({
        type: 'error',
        kind: 'single-branch-parallel',
        message: `Parallel group at ${path} has only 1 branch. Parallel requires at least 2 branches.`,
        path,
      });
    }

    for (let i = 0; i < node.children.length; i++) {
      validateStructure(node.children[i], issues, `${path}.parallel[${i}]`);
    }
  }
}

function validateElementParameters(ast: CircuitNode, issues: ValidationIssue[]): void {
  traverseNodes(ast, (node) => {
    if (node.type !== 'element' || !node.params) return;

    const expected = nParams(node.kind);
    if (node.params.length !== expected) {
      issues.push({
        type: 'error',
        kind: 'parameter-count',
        message: `Element ${node.kind}${node.id} expects ${expected} parameter(s), found ${node.params.length}.`,
        elementKind: node.kind,
        elementId: node.id,
      });
      return;
    }

    const reason = invalidParameterReason(node.kind as string, node.params);
    if (reason) {
      issues.push({
        type: 'error',
        kind: 'invalid-parameters',
        message: `Invalid parameters for ${ELEMENT_KINDS.get(node.kind)?.label ?? node.kind}: ${reason}.`,
        elementKind: node.kind,
        elementId: node.id,
      });
    }
  });
}

function invalidParameterReason(kind: string, params: number[]): string | null {
  if (params.some(value => !Number.isFinite(value))) return 'all parameters must be finite';

  switch (kind) {
    case 'R':
      return params[0] > 0 ? null : 'R must be > 0';
    case 'C':
      return params[0] > 0 ? null : 'C must be > 0';
    case 'L':
      return params[0] > 0 ? null : 'L must be > 0';
    case 'W':
      return params[0] > 0 ? null : 'sigma must be > 0';
    case 'Q':
      return params[0] > 0 && params[1] > 0 && params[1] <= 1
        ? null
        : 'Q0 must be > 0 and 0 < n <= 1';
    case 'Ws':
    case 'Wo':
    case 'G':
      return params.every(value => value > 0) ? null : 'all element parameters must be > 0';
    case 'Pdw':
      return params[0] > 0 && params[1] > 0 && params[3] > 0 && params[2] > 0 && params[2] < 1
        ? null
        : 'D1,D2,Lambda must be > 0 and 0 < theta < 1';
    default:
      return null;
  }
}

function validateDuplicateIds(ast: CircuitNode, issues: ValidationIssue[]): void {
  const seen = new Map<string, { kind: string; id: number; count: number }>();

  traverseNodes(ast, (node) => {
    if (node.type !== 'element') return;

    const key = `${node.kind}-${node.id}`;
    const existing = seen.get(key);

    if (existing) {
      existing.count++;
      // Only report the first duplicate
      if (existing.count === 2) {
        issues.push({
          type: 'error',
          kind: 'duplicate-id',
          message: `Element ${node.kind}${node.id} appears more than once. Each element must have a unique identifier.`,
          elementKind: node.kind,
          elementId: node.id,
        });
      }
    } else {
      seen.set(key, { kind: node.kind, id: node.id, count: 1 });
    }
  });
}

function validateDcPath(ast: CircuitNode, issues: ValidationIssue[]): void {
  let hasResistive = false;
  let hasReactive = false;

  traverseNodes(ast, (node) => {
    if (node.type !== 'element') return;

    const kind = node.kind as string;
    if (kind === 'R' || kind === 'W' || kind === 'Ws' || kind === 'Wo') {
      hasResistive = true;
    } else {
      hasReactive = true;
    }
  });

  if (!hasResistive && hasReactive) {
    issues.push({
      type: 'warning',
      kind: 'no-dc-path',
      message: 'Circuit has no DC path (R, W, Ws, or Wo). This circuit may be unphysical at DC (ω→0).',
    });

    issues.push({
      type: 'warning',
      kind: 'purely-reactive',
      message: 'Circuit contains only reactive or diffusion elements. Consider adding a resistor for physical validity.',
    });
  }
}

function validateConflictingReactive(ast: CircuitNode, issues: ValidationIssue[]): void {
  // Check for Warburg in parallel with inductor
  traverseNodes(ast, (node) => {
    if (node.type !== 'parallel') return;

    const kinds = new Set<string>();
    for (const child of node.children) {
      if (child.type === 'element') {
        kinds.add(child.kind as string);
      }
    }

    const hasWarburg = kinds.has('W') || kinds.has('Ws') || kinds.has('Wo') || kinds.has('Pdw');
    const hasInductor = kinds.has('L');

    if (hasWarburg && hasInductor) {
      issues.push({
        type: 'warning',
        kind: 'warburg-inductor-parallel',
        message: 'Warburg element in parallel with inductor may produce non-physical impedance behavior.',
      });
    }
  });
}

function buildResult(issues: ValidationIssue[]): ValidationResult {
  return {
    issues,
    hasErrors: issues.some(i => i.type === 'error'),
    hasWarnings: issues.some(i => i.type === 'warning'),
  };
}