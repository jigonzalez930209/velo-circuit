import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createVueCircuitEditor, mountVueCircuitEditor, type VueEditorInstance } from '../../src/adapters/vue/index.js';

describe('vue adapter', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    container.remove();
  });

  it('createVueCircuitEditor creates an instance', () => {
    const instance = createVueCircuitEditor(container, {});
    expect(instance).toBeDefined();
    expect(typeof instance.getValue).toBe('function');
    expect(typeof instance.setValue).toBe('function');
    expect(typeof instance.undo).toBe('function');
    expect(typeof instance.redo).toBe('function');
    expect(typeof instance.destroy).toBe('function');
    instance.destroy();
  });

  it('createVueCircuitEditor accepts initialDsl', () => {
    const instance = createVueCircuitEditor(container, { initialDsl: 'R0-C1' });
    expect(instance.getValue()).toBe('R0-C1');
    instance.destroy();
  });

  it('createVueCircuitEditor accepts width and height', () => {
    const instance = createVueCircuitEditor(container, { width: 800, height: 600 });
    expect(instance).toBeDefined();
    instance.destroy();
  });

  it('setValue updates the DSL', () => {
    const instance = createVueCircuitEditor(container, {});
    instance.setValue('R0-p(R1,C1)');
    expect(instance.getValue()).toBe('R0-p(R1,C1)');
    instance.destroy();
  });

  it('onDslChange callback is triggered', () => {
    let capturedDsl = '';
    const instance = createVueCircuitEditor(container, {
      onDslChange: (dsl) => { capturedDsl = dsl; }
    });
    instance.setValue('R0-C1');
    expect(capturedDsl).toBe('R0-C1');
    instance.destroy();
  });

  it('undo/redo work correctly', () => {
    const instance = createVueCircuitEditor(container, { initialDsl: 'R0' });
    instance.setValue('R0-C1');
    instance.undo();
    expect(instance.getValue()).toBe('R0');
    instance.redo();
    expect(instance.getValue()).toBe('R0-C1');
    instance.destroy();
  });

  it('onEvent callback is triggered on error', () => {
    let eventReceived = false;
    const instance = createVueCircuitEditor(container, {
      onEvent: () => { eventReceived = true; }
    });
    instance.setValue('INVALID-X99');
    expect(eventReceived).toBe(true);
    instance.destroy();
  });

  it('mountVueCircuitEditor works with container id', () => {
    container.id = 'vue-test-container';
    const instance = mountVueCircuitEditor('vue-test-container', { initialDsl: 'R0' });
    expect(instance.getValue()).toBe('R0');
    instance.destroy();
  });

  it('mountVueCircuitEditor throws for missing container', () => {
    expect(() => mountVueCircuitEditor('non-existent', {})).toThrow();
  });

  it('destroy cleans up without error', () => {
    const instance = createVueCircuitEditor(container, {});
    expect(() => instance.destroy()).not.toThrow();
  });

  it('multiple instances can coexist', () => {
    const container2 = document.createElement('div');
    document.body.appendChild(container2);

    const instance1 = createVueCircuitEditor(container, { initialDsl: 'R0' });
    const instance2 = createVueCircuitEditor(container2, { initialDsl: 'C0' });

    expect(instance1.getValue()).toBe('R0');
    expect(instance2.getValue()).toBe('C0');

    instance1.destroy();
    instance2.destroy();
    container2.remove();
  });

  it('setValue after destroy does not error', () => {
    const instance = createVueCircuitEditor(container, {});
    instance.destroy();
    expect(() => instance.setValue('R0')).not.toThrow();
  });
});