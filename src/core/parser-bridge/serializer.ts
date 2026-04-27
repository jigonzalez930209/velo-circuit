import type { CircuitNode } from '../domain/circuit.js';

/**
 * Serialize a CircuitNode AST back into Boukamp DSL notation.
 *
 * Supports N-branch parallel groups: p(a,b,c,...)
 */
export interface SerializeOptions {
  showParams?: boolean;
}

export function serialize(ast: CircuitNode, options?: SerializeOptions): string {
  switch (ast.type) {
    case 'element': {
      let str = `${ast.kind}${ast.id}`;
      if (options?.showParams && ast.params && ast.params.length > 0) {
        str += `[${ast.params.join(',')}]`;
      }
      return str;
    }
    case 'series':
      if (ast.children.length === 0) return '';
      if (ast.children.length === 1) return serialize(ast.children[0], options);
      return ast.children.map(c => serialize(c, options)).join('-');
    case 'parallel': {
      if (ast.children.length === 0) return '';
      if (ast.children.length === 1) return serialize(ast.children[0], options);
      const inner = ast.children.map(child => serialize(child, options)).join(',');
      return `p(${inner})`;
    }
    default:
      return '';
  }
}