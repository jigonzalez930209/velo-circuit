import { describe, it, expect } from 'vitest';
import { parseBoukamp, serialize, validate, tokenize } from '../src/core/parser-bridge/index.js';
import { ElementKind } from '../src/core/domain/circuit.js';
import type { CircuitNode } from '../src/core/domain/circuit.js';

function isParseFailure(result: ReturnType<typeof parseBoukamp>): boolean {
  return result.type === 'lex' || result.type === 'parse';
}

function expectCircuit(dsl: string): CircuitNode {
  const result = parseBoukamp(dsl);
  expect(isParseFailure(result)).toBe(false);
  if (isParseFailure(result)) {
    throw new Error(`expected valid circuit: ${dsl}`);
  }
  return result as CircuitNode;
}

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

  it('tokenizes Gerischer and PDW codes', () => {
    const gerischer = tokenize('G0');
    if (Array.isArray(gerischer)) expect(gerischer[0].value).toBe('G');
    const pdw = tokenize('Pdw3');
    if (Array.isArray(pdw)) expect(pdw[0].value).toBe('Pdw');
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

  it('parses Gerischer and PDW reference circuits', () => {
    expect(parseBoukamp('G0')).toHaveProperty('type', 'element');
    expect(parseBoukamp('Pdw0')).toHaveProperty('type', 'element');
    expect(parseBoukamp('R0-p(Q1,R2-Pdw3)')).toHaveProperty('type', 'series');
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
    const result = expectCircuit(dsl);
    const output = serialize(result);
    expect(output).toBe(dsl);
  });

  it('round-trips the unified spectroz DSL examples', () => {
    for (const dsl of ['G0', 'Pdw0', 'R0-p(Q1,R2-Pdw3)', 'R0-p(Ws1,Wo2)-G3']) {
      expect(serialize(expectCircuit(dsl))).toBe(dsl);
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
    const result = expectCircuit(dsl);
    const diagnostics = validate(result);
    expect(diagnostics.hasErrors).toBe(false);
  });

  it('validates embedded PDW parameter arity and domain', () => {
    const wrongArity = expectCircuit('Pdw0[1e-10,1e-11,0.5]');
    expect(validate(wrongArity).hasErrors).toBe(true);

    const invalidTheta = expectCircuit('Pdw0[1e-10,1e-11,1.2,4.2e-4]');
    expect(validate(invalidTheta).hasErrors).toBe(true);

    const valid = expectCircuit('Pdw0[1e-10,1e-11,0.6,4.2e-4]');
    expect(validate(valid).hasErrors).toBe(false);
  });
});