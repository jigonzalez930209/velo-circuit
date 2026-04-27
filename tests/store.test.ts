import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createStore, type EditorStore } from '../src/core/state/store.js';

describe('store', () => {
  let store: EditorStore;

  beforeEach(() => {
    store = createStore();
  });

  it('createStore returns a store instance', () => {
    expect(store).toBeDefined();
    expect(typeof store.getAst).toBe('function');
    expect(typeof store.dispatch).toBe('function');
    expect(typeof store.subscribe).toBe('function');
  });

  it('starts with a default AST', () => {
    const ast = store.getAst();
    expect(ast).toBeTruthy();
    expect(ast.type).toBe('element');
  });

  it('getDocument returns complete document', () => {
    const doc = store.getDocument();
    expect(doc).toHaveProperty('ast');
    expect(doc).toHaveProperty('viewport');
    expect(doc).toHaveProperty('selection');
    expect(doc).toHaveProperty('history');
    expect(doc).toHaveProperty('diagnostics');
    expect(doc).toHaveProperty('metadata');
  });

  it('canUndo returns false initially', () => {
    expect(store.canUndo()).toBe(false);
  });

  it('canRedo returns false initially', () => {
    expect(store.canRedo()).toBe(false);
  });

  it('subscribe returns an unsubscribe function', () => {
    const unsubscribe = store.subscribe(() => {});
    expect(typeof unsubscribe).toBe('function');
    unsubscribe();
  });

  it('subscription is called on state change', () => {
    let callCount = 0;
    const unsubscribe = store.subscribe(() => { callCount++; });
    // Trigger a state change
    store.dispatch({
      type: 'load-circuit',
      id: 'test',
      timestamp: Date.now(),
      description: 'test',
      ast: store.getAst()
    });
    expect(callCount).toBeGreaterThan(0);
    unsubscribe();
  });

  it('can dispatch load-circuit command', async () => {
    const { parseBoukamp, serialize } = await import('../src/core/parser-bridge/index.js');
    const circuit = parseBoukamp('R0-C1');
    if (!('type' in circuit)) {
      store.dispatch({
        type: 'load-circuit',
        id: 'test-1',
        timestamp: Date.now(),
        description: 'Load circuit',
        ast: circuit
      });
    }
    const dsl = serialize(store.getAst());
    expect(dsl).toBeTruthy();
  });

  it('getAst returns current ast', () => {
    const ast = store.getAst();
    expect(ast).toBeDefined();
    expect(ast).toHaveProperty('type');
  });

  it('multiple subscribers are notified', () => {
    let count1 = 0;
    let count2 = 0;
    const unsub1 = store.subscribe(() => { count1++; });
    const unsub2 = store.subscribe(() => { count2++; });
    store.dispatch({
      type: 'load-circuit',
      id: 'test',
      timestamp: Date.now(),
      description: 'test',
      ast: store.getAst()
    });
    expect(count1).toBe(count2);
    unsub1();
    unsub2();
  });

  it('unsubscribe stops notifications', () => {
    let count = 0;
    const unsubscribe = store.subscribe(() => { count++; });
    unsubscribe();
    store.dispatch({
      type: 'load-circuit',
      id: 'test',
      timestamp: Date.now(),
      description: 'test',
      ast: store.getAst()
    });
    expect(count).toBe(0);
  });
});