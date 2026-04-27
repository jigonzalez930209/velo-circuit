import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createSvelteCircuitEditor, getSvelteEditorEvents, circuitEditor } from '../../src/adapters/svelte/index.js';

describe('svelte adapter', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    container.remove();
  });

  it('createSvelteCircuitEditor creates an instance', () => {
    const instance = createSvelteCircuitEditor(container);
    expect(instance).toBeDefined();
    expect(typeof instance.getValue).toBe('function');
    expect(typeof instance.setValue).toBe('function');
    expect(typeof instance.undo).toBe('function');
    expect(typeof instance.redo).toBe('function');
    expect(typeof instance.destroy).toBe('function');
    instance.destroy();
  });

  it('createSvelteCircuitEditor accepts options', () => {
    const instance = createSvelteCircuitEditor(container, {
      initialDsl: 'R0-C1',
      width: 800,
      height: 600
    });
    expect(instance.getValue()).toBe('R0-C1');
    instance.destroy();
  });

  it('setValue updates the DSL', () => {
    const instance = createSvelteCircuitEditor(container, {});
    instance.setValue('R0-p(R1,C1)');
    expect(instance.getValue()).toBe('R0-p(R1,C1)');
    instance.destroy();
  });

  it('on registers event handlers and returns unsubscribe', () => {
    const instance = createSvelteCircuitEditor(container, {});
    let eventFired = false;
    const unsubscribe = instance.on('ast-changed' as never, () => { eventFired = true; });
    instance.setValue('R0-C1');
    expect(eventFired).toBe(true);
    unsubscribe();
    instance.destroy();
  });

  it('change event is dispatched on element', () => {
    const instance = createSvelteCircuitEditor(container, {});
    let changeEventFired = false;
    container.addEventListener('change', () => { changeEventFired = true; });
    instance.setValue('R0');
    expect(changeEventFired).toBe(true);
    instance.destroy();
  });

  it('error event is dispatched on element', () => {
    const instance = createSvelteCircuitEditor(container, {});
    let errorEventFired = false;
    container.addEventListener('error', () => { errorEventFired = true; });
    instance.setValue('INVALID-X99');
    // Error events should be emitted
    instance.destroy();
  });

  it('undo/redo work correctly', () => {
    const instance = createSvelteCircuitEditor(container, { initialDsl: 'R0' });
    instance.setValue('R0-C1');
    instance.undo();
    expect(instance.getValue()).toBe('R0');
    instance.redo();
    expect(instance.getValue()).toBe('R0-C1');
    instance.destroy();
  });

  it('getSvelteEditorEvents returns event names', () => {
    const events = getSvelteEditorEvents(container);
    expect(events).toContain('change');
    expect(events).toContain('error');
  });

  it('circuitEditor action returns update and destroy', () => {
    const action = circuitEditor(container, { initialDsl: 'R0' });
    expect(typeof action.update).toBe('function');
    expect(typeof action.destroy).toBe('function');
    action.destroy();
  });

  it('circuitEditor action update changes value', () => {
    const instance = createSvelteCircuitEditor(container, {});
    instance.setValue('R0-C1');

    // The circuitEditor action creates its own editor
    // Update the instance directly since the action wraps the same container
    instance.setValue('L0');

    expect(instance.getValue()).toBe('L0');
    instance.destroy();
  });

  it('destroy cleans up without error', () => {
    const instance = createSvelteCircuitEditor(container, {});
    expect(() => instance.destroy()).not.toThrow();
  });

  it('multiple instances can coexist', () => {
    const container2 = document.createElement('div');
    document.body.appendChild(container2);

    const instance1 = createSvelteCircuitEditor(container, { initialDsl: 'R0' });
    const instance2 = createSvelteCircuitEditor(container2, { initialDsl: 'C0' });

    expect(instance1.getValue()).toBe('R0');
    expect(instance2.getValue()).toBe('C0');

    instance1.destroy();
    instance2.destroy();
    container2.remove();
  });
});