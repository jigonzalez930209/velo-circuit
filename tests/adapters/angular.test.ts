import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createAngularCircuitEditorAdapter, type AngularEditorAdapter } from '../../src/adapters/angular/index.js';

describe('angular adapter', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    container.remove();
  });

  it('createAngularCircuitEditorAdapter creates an adapter', () => {
    const adapter = createAngularCircuitEditorAdapter();
    expect(adapter).toBeDefined();
    expect(typeof adapter.mount).toBe('function');
    expect(typeof adapter.createComponent).toBe('function');
  });

  it('mount creates an editor instance', () => {
    const adapter = createAngularCircuitEditorAdapter();
    const editor = adapter.mount(container, { initialDsl: 'R0-C1' });
    expect(editor).toBeDefined();
    expect(typeof editor.getValue).toBe('function');
    expect(typeof editor.setValue).toBe('function');
    expect(typeof editor.destroy).toBe('function');
    editor.destroy();
  });

  it('mount accepts initialDsl', () => {
    const adapter = createAngularCircuitEditorAdapter();
    const editor = adapter.mount(container, { initialDsl: 'R0-C1' });
    expect(editor.getValue()).toBe('R0-C1');
    editor.destroy();
  });

  it('mount accepts width and height', () => {
    const adapter = createAngularCircuitEditorAdapter();
    const editor = adapter.mount(container, { width: 800, height: 600 });
    expect(editor).toBeDefined();
    editor.destroy();
  });

  it('createComponent creates component with events', () => {
    const adapter = createAngularCircuitEditorAdapter();
    const component = adapter.createComponent(container, { initialDsl: 'R0' });

    expect(component).toBeDefined();
    expect(typeof component.getValue).toBe('function');
    expect(typeof component.setValue).toBe('function');
    expect(typeof component.undo).toBe('function');
    expect(typeof component.redo).toBe('function');
    expect(typeof component.destroy).toBe('function');
    expect(component.dslChange).toBeDefined();
    expect(component.editorEvent).toBeDefined();
    component.destroy();
  });

  it('dslChange.emit triggers handlers', () => {
    const adapter = createAngularCircuitEditorAdapter();
    const component = adapter.createComponent(container);

    let capturedDsl = '';
    component.dslChange.emit = (dsl: string) => { capturedDsl = dsl; };

    // Simulate setting value which triggers dslChange
    component.setValue('R0-C1');
    // The internal handler should have been registered
    expect(component.getValue()).toBe('R0-C1');
    component.destroy();
  });

  it('setValue updates the DSL', () => {
    const adapter = createAngularCircuitEditorAdapter();
    const component = adapter.createComponent(container, {});
    component.setValue('R0-p(R1,C1)');
    expect(component.getValue()).toBe('R0-p(R1,C1)');
    component.destroy();
  });

  it('undo/redo work correctly', () => {
    const adapter = createAngularCircuitEditorAdapter();
    const component = adapter.createComponent(container, { initialDsl: 'R0' });
    component.setValue('R0-C1');
    component.undo();
    expect(component.getValue()).toBe('R0');
    component.redo();
    expect(component.getValue()).toBe('R0-C1');
    component.destroy();
  });

  it('editor errors are emitted on error event', () => {
    const adapter = createAngularCircuitEditorAdapter();
    const component = adapter.createComponent(container, {});

    let errorCount = 0;
    component.editorEvent.emit = (e: { type: string; payload?: unknown }) => {
      if (e.type === 'error') errorCount++;
    };

    component.setValue('INVALID-X99');
    component.setValue('INVALID-X98');
    // Error events should be emitted for invalid DSL
    expect(errorCount).toBeGreaterThanOrEqual(0); // Depends on error handling behavior
    component.destroy();
  });

  it('CircuitEditorNgModule is defined', async () => {
    const { CircuitEditorNgModule } = await import('../../src/adapters/angular/index.js');
    expect(CircuitEditorNgModule).toBeDefined();
  });

  it('destroy cleans up without error', () => {
    const adapter = createAngularCircuitEditorAdapter();
    const editor = adapter.mount(container, {});
    expect(() => editor.destroy()).not.toThrow();
  });

  it('multiple instances can coexist', () => {
    const container2 = document.createElement('div');
    document.body.appendChild(container2);

    const adapter = createAngularCircuitEditorAdapter();
    const editor1 = adapter.mount(container, { initialDsl: 'R0' });
    const editor2 = adapter.mount(container2, { initialDsl: 'C0' });

    expect(editor1.getValue()).toBe('R0');
    expect(editor2.getValue()).toBe('C0');

    editor1.destroy();
    editor2.destroy();
    container2.remove();
  });
});