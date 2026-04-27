import type { CircuitNode } from './circuit';
import type { ValidationIssue } from './validation';

export interface Diagnostic {
  id: string;
  issue: ValidationIssue;
  nodeId?: string;
  startOffset: number;
  endOffset: number;
}

export function makeDiagnostic(
  id: string,
  issue: ValidationIssue,
  startOffset: number,
  endOffset: number,
  nodeId?: string,
): Diagnostic {
  return { id, issue, nodeId, startOffset, endOffset };
}

export function filterErrors(diagnostics: Diagnostic[]): Diagnostic[] {
  return diagnostics.filter(d => d.issue.type === 'error');
}

export function filterWarnings(diagnostics: Diagnostic[]): Diagnostic[] {
  return diagnostics.filter(d => d.issue.type === 'warning');
}