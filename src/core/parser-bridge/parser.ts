import type { CircuitNode, ElementKind } from '../domain/circuit.js';
import type { Token, LexError } from './lexer.js';
import { tokenize } from './lexer.js';

const ELEMENT_CODE_LIST = 'R, C, L, Q, W, Ws, Wo, G, Pdw';

export interface ParseError {
  type: 'parse';
  position: number;
  expected: string;
  found: string;
  message: string;
}

export type ParseResult = CircuitNode | LexError | ParseError;

function kindFromCode(code: string): ElementKind {
  switch (code) {
    case 'R': return 'R' as ElementKind;
    case 'C': return 'C' as ElementKind;
    case 'L': return 'L' as ElementKind;
    case 'Q': return 'Q' as ElementKind;
    case 'W': return 'W' as ElementKind;
    case 'Ws': return 'Ws' as ElementKind;
    case 'Wo': return 'Wo' as ElementKind;
    case 'G': return 'G' as ElementKind;
    case 'Pdw': return 'Pdw' as ElementKind;
    default:
      throw new Error(`Unknown element code: ${code}`);
  }
}

class Parser {
  private tokens: Token[];
  private pos = 0;
  private input: string;

  constructor(tokens: Token[], input: string) {
    this.tokens = tokens;
    this.input = input;
  }

  parse(): CircuitNode | ParseError {
    try {
      const result = this.parseCircuit();

      // Check for remaining tokens — that's an error
      if (this.pos < this.tokens.length) {
        const remaining = this.peek()!;
        return {
          type: 'parse',
          position: remaining.position,
          expected: 'end of input',
          found: remaining.value,
          message: `Unexpected token '${remaining.value}' after complete circuit expression`,
        };
      }

      return result;
    } catch (err) {
      if (err && typeof err === 'object' && 'type' in err && (err as { type: string }).type === 'parse') {
        return err as ParseError;
      }
      return {
        type: 'parse',
        position: this.currentPos(),
        expected: 'circuit',
        found: this.peek()?.value ?? 'end',
        message: String(err),
      };
    }
  }

  private currentPos(): number {
    return this.peek()?.position ?? this.input.length;
  }

  private peek(): Token | undefined {
    return this.tokens[this.pos];
  }

  private consume(): Token | undefined {
    return this.tokens[this.pos++];
  }

  private expectType(type: Token['type'], contextMessage?: string): Token {
    const tok = this.consume();
    if (!tok || tok.type !== type) {
      const position = tok?.position ?? this.input.length;
      const found = tok?.value ?? 'end of input';

      let message = `Expected ${type}`;
      if (contextMessage) message = contextMessage;
      if (tok) message += `, but found '${found}' at position ${position}`;
      else message += `, but reached end of input`;

      const err: ParseError = {
        type: 'parse',
        position,
        expected: type,
        found,
        message,
      };
      throw err;
    }
    return tok;
  }

  parseCircuit(): CircuitNode {
    const items: CircuitNode[] = [];

    items.push(this.parseAtom());

    while (this.peek()?.type === 'dash') {
      this.consume();

      // Validate there's something after the dash
      if (!this.peek()) {
        const err: ParseError = {
          type: 'parse',
          position: this.input.length,
          expected: 'element or parallel group',
          found: 'end of input',
          message: `Unexpected end of input after series operator "-". Expected an element (${ELEMENT_CODE_LIST}) or parallel group p(...)`,
        };
        throw err;
      }

      items.push(this.parseAtom());
    }

    if (items.length === 1) return items[0];
    return { type: 'series', children: items };
  }

  parseAtom(): CircuitNode {
    const tok = this.peek();

    if (!tok) {
      const err: ParseError = {
        type: 'parse',
        position: this.input.length,
        expected: 'element or parallel group',
        found: 'end of input',
        message: `Unexpected end of input. Expected an element code (${ELEMENT_CODE_LIST}) or parallel group p(...)`,
      };
      throw err;
    }

    if (tok.type === 'parallel-kw') return this.parseParallel();
    if (tok.type === 'element-code') return this.parseElement();

    const err: ParseError = {
      type: 'parse',
      position: tok.position,
      expected: 'element or parallel group',
      found: tok.value,
      message: `Unexpected token '${tok.value}' at position ${tok.position}. Expected an element code (${ELEMENT_CODE_LIST}) or parallel group p(...)`,
    };
    throw err;
  }

  parseParallel(): CircuitNode {
    this.expectType('parallel-kw', 'Expected parallel keyword "p"');
    this.expectType('lparen', 'Expected "(" after parallel keyword "p"');

    const branches: CircuitNode[] = [];

    // First branch (required)
    branches.push(this.parseCircuit());

    // Subsequent branches separated by commas (at least one more required)
    if (this.peek()?.type !== 'comma') {
      const position = this.peek()?.position ?? this.input.length;
      const found = this.peek()?.value ?? 'end of input';
      const err: ParseError = {
        type: 'parse',
        position,
        expected: 'comma',
        found,
        message: `Parallel group p(...) requires at least 2 branches separated by commas. Found '${found}' at position ${position}`,
      };
      throw err;
    }

    while (this.peek()?.type === 'comma') {
      this.consume(); // consume comma

      // Validate there's something after the comma
      if (!this.peek() || this.peek()!.type === 'rparen') {
        const position = this.peek()?.position ?? this.input.length;
        const err: ParseError = {
          type: 'parse',
          position,
          expected: 'element or parallel group',
          found: this.peek()?.value ?? 'end of input',
          message: 'Expected a circuit branch after comma in parallel group, but found nothing',
        };
        throw err;
      }

      branches.push(this.parseCircuit());
    }

    this.expectType('rparen', 'Expected closing ")" for parallel group p(...)');

    return { type: 'parallel', children: branches };
  }

  parseElement(): CircuitNode {
    const codeTok = this.expectType('element-code', `Expected element code (${ELEMENT_CODE_LIST})`);
    const idTok = this.expectType('element-id', `Expected numeric id after element code "${codeTok.value}" (e.g. ${codeTok.value}0, ${codeTok.value}1)`);

    const kind = kindFromCode(codeTok.value);
    const id = parseInt(idTok.value, 10);

    let params: number[] | undefined;

    if (this.peek()?.type === 'lbracket') {
      this.consume(); // consume '['
      params = [];

      // Parse comma-separated numbers
      let parsingParams = true;
      while (parsingParams) {
        if (this.peek()?.type === 'rbracket') {
          break;
        }

        const numTok = this.expectType('number', 'Expected number for parameter value');
        params.push(parseFloat(numTok.value));

        if (this.peek()?.type === 'comma') {
          this.consume(); // consume ','
        } else {
          parsingParams = false;
        }
      }

      this.expectType('rbracket', 'Expected "]" to close parameters');
    }

    return { type: 'element', kind, id, paramOffset: 0, params };
  }
}

export function parseBoukamp(input: string): ParseResult {
  if (!input || input.trim().length === 0) {
    return {
      type: 'parse',
      position: 0,
      expected: 'circuit',
      found: 'empty input',
      message: 'Cannot parse empty circuit string. Provide a valid Boukamp DSL expression (e.g. "R0", "R0-C1", "R0-p(R1,C1)")',
    };
  }

  const tokensOrError = tokenize(input.trim());

  if ('type' in tokensOrError && tokensOrError.type === 'lex') {
    return tokensOrError as LexError;
  }

  const tokens = tokensOrError as Token[];

  if (tokens.length === 0) {
    return {
      type: 'parse',
      position: 0,
      expected: 'circuit',
      found: 'no tokens',
      message: 'Input produced no tokens. Provide a valid Boukamp DSL expression.',
    };
  }

  const parser = new Parser(tokens, input);
  return parser.parse();
}