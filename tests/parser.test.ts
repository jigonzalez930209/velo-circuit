import { describe, it, expect } from 'vitest';
import { parseBoukamp, serialize, validate, tokenize } from '../src/core/parser-bridge/index.js';
import { ElementKind } from '../src/core/domain/circuit.js';

describe('lexer', () => {
  it('tokenizes a simple resistor', () => {
    const result = tokenize('R0');
    expect(Array.isArray(result)).toBe(true);
    if (Array.isArray(result)) {
      expect(result[0].type).toBe('element-code');
      expect(result[0].value).toBe('R');
      expect(result[1].type).toBe('element-id');
      expect(result[1].value).toBe('0');
    }
  });

  it('tokenizes two-character codes Ws and Wo', () => {
    const ws = tokenize('Ws0');
    if (Array.isArray(ws)) expect(ws[0].value).toBe('Ws');
    const wo = tokenize('Wo1');
    if (Array.isArray(wo)) expect(wo[0].value).toBe('Wo');
  });

  it('tokenizes series dash', () => {
    const tokens = tokenize('R0-C1');
    if (Array.isArray(tokens)) {
      expect(tokens.find(t => t.type === 'dash')).toBeTruthy();
    }
  });

  it('tokenizes parallel group', () => {
    const tokens = tokenize('p(R0,C1)');
    if (Array.isArray(tokens)) {
      expect(tokens[0].type).toBe('parallel-kw');
      expect(tokens[1].type).toBe('lparen');
      expect(tokens[tokens.length - 1].type).toBe('rparen');
    }
  });

  it('returns lex error for unknown character', () => {
    const result = tokenize('R0-X1');
    expect(result).toHaveProperty('type');
    if ('type' in result) expect(result.type).toBe('lex');
  });
});

describe('parser', () => {
  it('parses a single element', () => {
    const result = parseBoukamp('R0');
    expect(result).not.toHaveProperty('type', 'lex');
    expect(result).not.toHaveProperty('type', 'parse');
  });

  it('parses a series circuit', () => {
    const result = parseBoukamp('R0-C1');
    expect(result).toHaveProperty('type', 'series');
    if ('children' in result) expect(result.children.length).toBe(2);
  });

  it('parses a parallel circuit', () => {
    const result = parseBoukamp('p(R0,C1)');
    expect(result).toHaveProperty('type', 'parallel');
    if ('children' in result) expect(result.children.length).toBe(2);
  });

  it('parses a Randles simplified circuit', () => {
    const result = parseBoukamp('R0-p(R1,C1)');
    expect(result).toHaveProperty('type', 'series');
  });

  it('parses a nested parallel circuit', () => {
    const result = parseBoukamp('p(R0,p(C1,Q2))');
    expect(result).toHaveProperty('type', 'parallel');
  });

  it('returns parse error for invalid syntax', () => {
    const result = parseBoukamp('R0-');
    expect(result).toHaveProperty('type', 'parse');
  });

  it('returns lex error for unknown code', () => {
    const result = parseBoukamp('X0');
    expect(result).toHaveProperty('type', 'lex');
  });
});

describe('serializer', () => {
  it('serializes a single element', () => {
    const ast = { type: 'element' as const, kind: ElementKind.Resistor, id: 0, paramOffset: 0 };
    expect(serialize(ast)).toBe('R0');
  });

  it('serializes a series circuit', () => {
    const ast = { type: 'series' as const, children: [
      { type: 'element' as const, kind: ElementKind.Resistor, id: 0, paramOffset: 0 },
      { type: 'element' as const, kind: ElementKind.Capacitor, id: 1, paramOffset: 0 },
    ]};
    expect(serialize(ast)).toBe('R0-C1');
  });

  it('serializes a parallel circuit', () => {
    const ast = { type: 'parallel' as const, children: [
      { type: 'element' as const, kind: ElementKind.Resistor, id: 0, paramOffset: 0 },
      { type: 'element' as const, kind: ElementKind.Capacitor, id: 1, paramOffset: 0 },
    ]};
    expect(serialize(ast)).toBe('p(R0,C1)');
  });

  it('round-trips R0-p(R1,C1)-Wo2', () => {
    const dsl = 'R0-p(R1,C1)-Wo2';
    const result = parseBoukamp(dsl);
    expect(result).not.toHaveProperty('type', 'lex');
    expect(result).not.toHaveProperty('type', 'parse');
    if (!('type' in result)) {
      const output = serialize(result);
      expect(output).toBe(dsl);
    }
  });
});

describe('validator', () => {
  it('reports duplicate element ids', () => {
    const ast = { type: 'series' as const, children: [
      { type: 'element' as const, kind: ElementKind.Resistor, id: 0, paramOffset: 0 },
      { type: 'element' as const, kind: ElementKind.Resistor, id: 0, paramOffset: 0 },
    ]};
    const result = validate(ast);
    expect(result.hasErrors).toBe(true);
    expect(result.issues[0].type).toBe('error');
  });

  it('passes a valid Randles circuit', () => {
    const dsl = 'R0-p(R1,C1)-Wo2';
    const result = parseBoukamp(dsl);
    expect(result).not.toHaveProperty('type', 'lex');
    expect(result).not.toHaveProperty('type', 'parse');
    if (!('type' in result)) {
      const diagnostics = validate(result);
      expect(diagnostics.hasErrors).toBe(false);
    }
  });
});