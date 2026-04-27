import type { CircuitNode } from '../domain/circuit.js';
import type { ParseResult } from './parser.js';
import type { ValidationResult } from '../domain/validation.js';
import { parseBoukamp } from './parser.js';
import { serialize } from './serializer.js';
import { validate } from './validate.js';

export interface ParseOutput {
  ast: CircuitNode;
  dsl: string;
  diagnostics: ValidationResult;
}

export interface CircuitParserAdapter {
  parse(dsl: string): ParseOutput | { error: ParseResult };
  serialize(ast: CircuitNode): string;
  validate(ast: CircuitNode): ValidationResult;
}

export function createAdapter(): CircuitParserAdapter {
  return {
    parse(dsl: string): ParseOutput | { error: ParseResult } {
      const result = parseBoukamp(dsl);

      if ('type' in result && (result.type === 'lex' || result.type === 'parse')) {
        return {
          error: result,
          diagnostics: { issues: [{ type: 'error', kind: 'syntax' as never, message: (result as { message: string }).message, position: (result as { position: number }).position }], hasErrors: true, hasWarnings: false }
        } as unknown as { error: ParseResult };
      }

      const diagnostics = validate(result as CircuitNode);
      return { ast: result as CircuitNode, dsl, diagnostics };
    },
    serialize(ast: CircuitNode): string {
      return serialize(ast);
    },
    validate(ast: CircuitNode): ValidationResult {
      return validate(ast);
    },
  };
}

export { parseBoukamp } from './parser.js';
export { serialize } from './serializer.js';
export { validate } from './validate.js';
export { tokenize } from './lexer.js';
export type { Token, LexError } from './lexer.js';
export type { ParseError } from './parser.js';