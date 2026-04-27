export type ValidationErrorKind =
  | 'duplicate-id'
  | 'unknown-code'
  | 'mismatched-parens'
  | 'empty-circuit'
  | 'empty-parallel'
  | 'empty-series'
  | 'single-branch-parallel'
  | 'dangling-element'
  | 'syntax-error';

export type ValidationWarningKind =
  | 'no-dc-path'
  | 'conflicting-reactive'
  | 'purely-reactive'
  | 'warburg-inductor-parallel'
  | 'single-element-circuit';

export interface ValidationError {
  type: 'error';
  kind: ValidationErrorKind;
  message: string;
  position?: number;
  elementKind?: string;
  elementId?: number;
  path?: string;
}

export interface ValidationWarning {
  type: 'warning';
  kind: ValidationWarningKind;
  message: string;
  position?: number;
  path?: string;
}

export type ValidationIssue = ValidationError | ValidationWarning;

export interface ValidationResult {
  issues: ValidationIssue[];
  hasErrors: boolean;
  hasWarnings: boolean;
}

export function emptyValidationResult(): ValidationResult {
  return { issues: [], hasErrors: false, hasWarnings: false };
}

export function mergeValidationResults(results: ValidationResult[]): ValidationResult {
  const issues = results.flatMap(r => r.issues);
  return {
    issues,
    hasErrors: issues.some(i => i.type === 'error'),
    hasWarnings: issues.some(i => i.type === 'warning'),
  };
}

export function formatIssue(issue: ValidationIssue): string {
  const prefix = issue.type === 'error' ? '✖' : '⚠';
  const path = issue.path ? ` at ${issue.path}` : '';
  return `${prefix} [${issue.kind}]${path}: ${issue.message}`;
}