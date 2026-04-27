import type { CircuitNode } from './circuit';

export interface ParseResult {
  ast: CircuitNode;
  warnings: import('./validation').ValidationWarning[];
}

export interface ParseError {
  type: 'lex' | 'parse';
  position: number;
  message: string;
  found: string;
}

export interface SerializeResult {
  dsl: string;
  errors: SerializeError[];
}

export interface SerializeError {
  position: number;
  message: string;
}

export interface CircuitParserPort {
  parse(dsl: string): ParseResult | ParseError;
  serialize(ast: CircuitNode): SerializeResult;
}

export interface CircuitValidator {
  validate(ast: CircuitNode): import('./validation').ValidationResult;
}