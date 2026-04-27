import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mountCircuitEditor, createCircuitEditorVanilla, unmountCircuitEditor } from '../../src/adapters/vanilla/index.js';

describe('vanilla adapter', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    container.id = 'test-container';
    document.body.appendChild(container);
  });

  it('mountCircuitEditor creates an editor instance', () => {
    const instance = mountCircuitEditor({ container });
    expect(instance).toBeDefined();
    expect(typeof instance.destroy).toBe('function');
    expect(typeof instance.getValue).toBe('function');
    expect(typeof instance.setValue).toBe('function');
    expect(typeof instance.undo).toBe('function');
    expect(typeof instance.redo).toBe('function');
    instance.destroy();
  });

  it('mountCircuitEditor accepts initialDsl', () => {
    const instance = mountCircuitEditor({ container, initialDsl: 'R0-C1' });
    expect(instance.getValue()).toBe('R0-C1');
    instance.destroy();
  });

  it('setValue updates the DSL', () => {
    const instance = mountCircuitEditor({ container });
    instance.setValue('R0-p(R1,C1)');
    expect(instance.getValue()).toBe('R0-p(R1,C1)');
    instance.destroy();
  });

  it('undo/redo are callable without errors', () => {
    const instance = mountCircuitEditor({ container, initialDsl: 'R0' });
    instance.setValue('R0-C1');
    expect(() => instance.undo()).not.toThrow();
    expect(() => instance.redo()).not.toThrow();
    instance.destroy();
  });

  it('on registers event handlers', () => {
    const instance = mountCircuitEditor({ container });
    let eventFired = false;
    const unsubscribe = instance.on('ast-changed', () => { eventFired = true; });
    instance.setValue('R0-C1');
    expect(eventFired).toBe(true);
    unsubscribe();
    instance.destroy();
  });

  it('createCircuitEditorVanilla throws for missing container', () => {
    expect(() => createCircuitEditorVanilla('non-existent-id')).toThrow();
  });

  it('createCircuitEditorVanilla works with valid id', () => {
    const instance = createCircuitEditorVanilla('test-container', 'R0');
    expect(instance.getValue()).toBe('R0');
    instance.destroy();
  });

  it('unmountCircuitEditor destroys the instance', () => {
    const instance = mountCircuitEditor({ container });
    unmountCircuitEditor(instance);
    // No error means success
  });

  it('multiple setValue calls emit events', () => {
    const instance = mountCircuitEditor({ container });
    let changeCount = 0;
    instance.on('ast-changed', () => { changeCount++; });
    instance.setValue('R0');
    instance.setValue('R0-C1');
    instance.setValue('R0-C1-L2');
    expect(changeCount).toBe(3);
    instance.destroy();
  });
});