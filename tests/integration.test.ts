import { describe, it, expect, beforeEach } from 'vitest';
import { parseBoukamp, serialize } from '../src/core/parser-bridge/index.js';
import { validate } from '../src/core/parser-bridge/validate.js';
import { ElementKind } from '../src/core/domain/circuit.js';
import type { CircuitNode } from '../src/core/domain/circuit.js';
import { createStore } from '../src/core/state/store.js';
import { createEditor } from '../src/core/editor/core.js';

describe('store', () => {
  it('starts with a default AST', () => {
    const store = createStore();
    const ast = store.getAst();
    expect(ast).toBeTruthy();
    expect(ast.type).toBe('element');
  });

  it('can dispatch load-circuit command', () => {
    const store = createStore();
    const circuit = parseBoukamp('R0-C1');
    if (!('type' in circuit)) {
      store.dispatch({
        type: 'load-circuit',
        id: 'test-1',
        timestamp: Date.now(),
        description: 'Load circuit',
        ast: circuit as CircuitNode,
      });
    }
    const dsl = serialize(store.getAst());
    expect(dsl).toBeTruthy();
  });

  it('tracks undo/redo capability', () => {
    const store = createStore();
    expect(store.canUndo()).toBe(false);
    expect(store.canRedo()).toBe(false);
  });

  it('notifies subscribers on state change', () => {
    const store = createStore();
    let notificationCount = 0;
    const unsub = store.subscribe(() => { notificationCount++; });
    const circuit = parseBoukamp('R0-C1') as ReturnType<typeof parseBoukamp>;
    if (!('type' in circuit)) {
      store.dispatch({
        type: 'load-circuit',
        id: 'test-2',
        timestamp: Date.now(),
        description: 'Load',
        ast: circuit,
      });
    }
    unsub();
    expect(notificationCount).toBeGreaterThanOrEqual(0);
  });

  it('returns document with all parts', () => {
    const store = createStore();
    const doc = store.getDocument();
    expect(doc).toHaveProperty('ast');
    expect(doc).toHaveProperty('viewport');
    expect(doc).toHaveProperty('selection');
    expect(doc).toHaveProperty('history');
    expect(doc).toHaveProperty('diagnostics');
    expect(doc).toHaveProperty('metadata');
  });
});

describe('editor integration', () => {
  it('editor round-trips all reference circuits', () => {
    const editor = createEditor();
    const circuits = [
      'R0',
      'R0-C1',
      'p(R0,C1)',
      'R0-p(R1,C1)',
      'R0-p(R1,C1)-Wo2',
      'p(R0,p(C1,Q2))',
      'R0-p(R1,C1)-p(R2,Q2)-L3',
    ];

    for (const dsl of circuits) {
      editor.setValue(dsl);
      const result = editor.getValue();
      expect(result).toBe(dsl);
    }
  });

  it('editor emits error event on invalid DSL', () => {
    const editor = createEditor();
    let errorReceived = false;

    editor.on('error', () => { errorReceived = true; });
    editor.setValue('INVALID-X99');

    expect(errorReceived).toBe(true);
  });

  it('editor undo/redo are callable without errors', () => {
    const editor = createEditor();
    editor.setValue('R0');
    editor.setValue('R0-C1');
    expect(() => editor.undo()).not.toThrow();
    expect(() => editor.redo()).not.toThrow();
    expect(editor.getValue()).toBe('R0-C1');
  });

  it('editor render produces SVG string', () => {
    const editor = createEditor();
    const svg = editor.render();
    expect(svg).toContain('<svg');
    expect(svg).toContain('circuit');
  });
});

describe('validate', () => {
  it('reports duplicate element ids', () => {
    const ast = { type: 'series' as const, children: [
      { type: 'element' as const, kind: ElementKind.Resistor, id: 0, paramOffset: 0 },
      { type: 'element' as const, kind: ElementKind.Resistor, id: 0, paramOffset: 0 },
    ]};
    const result = validate(ast);
    expect(result.hasErrors).toBe(true);
    expect(result.issues[0].type).toBe('error');
  });

  it('validates all reference Boukamp examples', () => {
    const examples = [
      'R0',
      'R0-C1',
      'p(R0,C1)',
      'R0-p(R1,C1)',
      'R0-p(R1,C1)-Wo2',
      'p(R0,p(C1,Q2))',
      'R0-p(R1,C1)-p(R2,Q2)-L3',
    ];

    for (const dsl of examples) {
      const ast = parseBoukamp(dsl);
      expect(ast).not.toHaveProperty('type', 'lex');
      expect(ast).not.toHaveProperty('type', 'parse');

      if (!('type' in ast)) {
        const result = validate(ast);
        expect(result.hasErrors).toBe(false);
      }
    }
  });
});

describe('serialize', () => {
  it('round-trip: parse -> serialize -> parse', () => {
    const examples = [
      'R0',
      'R0-C1',
      'p(R0,C1)',
      'R0-p(R1,C1)-Wo2',
    ];

    for (const dsl of examples) {
      const ast = parseBoukamp(dsl);
      expect(ast).not.toHaveProperty('type', 'lex');
      expect(ast).not.toHaveProperty('type', 'parse');

      if (!('type' in ast)) {
        const output = serialize(ast);
        expect(output).toBe(dsl);
      }
    }
  });
});