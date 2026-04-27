import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createReactCircuitEditor, type ReactEditorProps, type ReactEditorInstance } from '../../src/adapters/react/index.js';

describe('react adapter', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    container.remove();
  });

  it('createReactCircuitEditor creates an instance', () => {
    const instance = createReactCircuitEditor(container, {});
    expect(instance).toBeDefined();
    expect(typeof instance.getValue).toBe('function');
    expect(typeof instance.setValue).toBe('function');
    expect(typeof instance.undo).toBe('function');
    expect(typeof instance.redo).toBe('function');
    expect(typeof instance.destroy).toBe('function');
    instance.destroy();
  });

  it('createReactCircuitEditor accepts initialDsl', () => {
    const instance = createReactCircuitEditor(container, { initialDsl: 'R0-C1' });
    expect(instance.getValue()).toBe('R0-C1');
    instance.destroy();
  });

  it('createReactCircuitEditor accepts width and height', () => {
    const instance = createReactCircuitEditor(container, { width: 800, height: 600 });
    expect(instance).toBeDefined();
    instance.destroy();
  });

  it('setValue updates the DSL', () => {
    const instance = createReactCircuitEditor(container, {});
    instance.setValue('R0-p(R1,C1)');
    expect(instance.getValue()).toBe('R0-p(R1,C1)');
    instance.destroy();
  });

  it('on registers event handlers and returns unsubscribe', () => {
    const instance = createReactCircuitEditor(container, {});
    let eventFired = false;
    const unsubscribe = instance.on('ast-changed', () => { eventFired = true; });
    instance.setValue('R0-C1');
    expect(eventFired).toBe(true);
    unsubscribe();
    instance.destroy();
  });

  it('on can register multiple handlers', () => {
    const instance = createReactCircuitEditor(container, {});
    let count1 = 0;
    let count2 = 0;
    const unsub1 = instance.on('ast-changed', () => { count1++; });
    const unsub2 = instance.on('ast-changed', () => { count2++; });
    instance.setValue('R0');
    expect(count1).toBe(1);
    expect(count2).toBe(1);
    unsub1();
    unsub2();
    instance.destroy();
  });

  it('undo/redo work correctly', () => {
    const instance = createReactCircuitEditor(container, { initialDsl: 'R0' });
    instance.setValue('R0-C1');
    instance.undo();
    expect(instance.getValue()).toBe('R0');
    instance.redo();
    expect(instance.getValue()).toBe('R0-C1');
    instance.destroy();
  });

  it('onChange callback is triggered', () => {
    const onChange = vi.fn();
    const instance = createReactCircuitEditor(container, { onChange });
    instance.setValue('R0-C1');
    expect(onChange).toHaveBeenCalledWith('R0-C1');
    instance.destroy();
  });

  it('onEvent callback is triggered on error', () => {
    const onEvent = vi.fn();
    const instance = createReactCircuitEditor(container, { onEvent });
    instance.setValue('INVALID-X99');
    // Error events should be emitted
    instance.destroy();
  });

  it('value prop syncs to editor', () => {
    const instance = createReactCircuitEditor(container, { value: 'R0-C1' });
    expect(instance.getValue()).toBe('R0-C1');
    instance.destroy();
  });

  it('controlled value changes are reflected', () => {
    const instance = createReactCircuitEditor(container, {});
    instance.setValue('R0');
    expect(instance.getValue()).toBe('R0');
    instance.destroy();
  });

  it('destroy cleans up without error', () => {
    const instance = createReactCircuitEditor(container, {});
    expect(() => instance.destroy()).not.toThrow();
  });

  it('multiple instances can coexist', () => {
    const container2 = document.createElement('div');
    document.body.appendChild(container2);

    const instance1 = createReactCircuitEditor(container, { initialDsl: 'R0' });
    const instance2 = createReactCircuitEditor(container2, { initialDsl: 'C0' });

    expect(instance1.getValue()).toBe('R0');
    expect(instance2.getValue()).toBe('C0');

    instance1.destroy();
    instance2.destroy();
    container2.remove();
  });
});