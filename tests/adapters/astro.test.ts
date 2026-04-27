import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  mountAstroCircuitEditor,
  unmountAstroCircuitEditor,
  getAstroCircuitEditor,
  createAstroEditorWidget
} from '../../src/adapters/astro/index.js';

describe('astro adapter', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    container.id = 'astro-test-container';
    document.body.appendChild(container);
  });

  afterEach(() => {
    container.remove();
  });

  it('mountAstroCircuitEditor creates an editor instance', () => {
    const editor = mountAstroCircuitEditor(container);
    expect(editor).toBeDefined();
    expect(typeof editor.getValue).toBe('function');
    expect(typeof editor.setValue).toBe('function');
    expect(typeof editor.undo).toBe('function');
    expect(typeof editor.redo).toBe('function');
    expect(typeof editor.destroy).toBe('function');
    editor.destroy();
  });

  it('mountAstroCircuitEditor accepts initialDsl', () => {
    const editor = mountAstroCircuitEditor(container, { initialDsl: 'R0-C1' });
    expect(editor.getValue()).toBe('R0-C1');
    editor.destroy();
  });

  it('mountAstroCircuitEditor accepts width and height', () => {
    const editor = mountAstroCircuitEditor(container, { width: 800, height: 600 });
    expect(editor).toBeDefined();
    editor.destroy();
  });

  it('mountAstroCircuitEditor stores editor by id', () => {
    const editor = mountAstroCircuitEditor(container, { id: 'my-editor' });
    const retrieved = getAstroCircuitEditor('my-editor');
    expect(retrieved).toBe(editor);
    editor.destroy();
  });

  it('getAstroCircuitEditor returns undefined for unknown id', () => {
    const result = getAstroCircuitEditor('non-existent');
    expect(result).toBeUndefined();
  });

  it('setValue updates the DSL', () => {
    const editor = mountAstroCircuitEditor(container);
    editor.setValue('R0-p(R1,C1)');
    expect(editor.getValue()).toBe('R0-p(R1,C1)');
    editor.destroy();
  });

  it('unmountAstroCircuitEditor destroys the editor', () => {
    const editor = mountAstroCircuitEditor(container, { id: 'to-unmount' });
    unmountAstroCircuitEditor('to-unmount');
    // Editor should be destroyed
  });

  it('unmountAstroCircuitEditor handles unknown id gracefully', () => {
    expect(() => unmountAstroCircuitEditor('unknown-id')).not.toThrow();
  });

  it('createAstroEditorWidget returns HTML string', () => {
    const widget = createAstroEditorWidget('widget-container', { initialDsl: 'R0' });
    expect(typeof widget).toBe('string');
    expect(widget).toContain('widget-container');
    expect(widget).toContain('data-circuit-editor');
    expect(widget).toContain('mountAstroCircuitEditor');
  });

  it('createAstroEditorWidget includes options in output', () => {
    const widget = createAstroEditorWidget('my-widget', {
      initialDsl: 'R0-C1',
      width: 800,
      height: 600
    });
    expect(widget).toContain('R0-C1');
    expect(widget).toContain('800');
    expect(widget).toContain('600');
  });

  it('multiple editors can be stored by different ids', () => {
    const container2 = document.createElement('div');
    container2.id = 'container-2';
    document.body.appendChild(container2);

    const editor1 = mountAstroCircuitEditor(container, { id: 'editor-1' });
    const editor2 = mountAstroCircuitEditor(container2, { id: 'editor-2' });

    editor1.setValue('R0');
    editor2.setValue('C0');

    const retrieved1 = getAstroCircuitEditor('editor-1');
    const retrieved2 = getAstroCircuitEditor('editor-2');

    expect(retrieved1?.getValue()).toBe('R0');
    expect(retrieved2?.getValue()).toBe('C0');

    editor1.destroy();
    editor2.destroy();
    container2.remove();
  });

  it('destroy cleans up without error', () => {
    const editor = mountAstroCircuitEditor(container);
    expect(() => editor.destroy()).not.toThrow();
  });

  it('on registers event handlers', () => {
    const editor = mountAstroCircuitEditor(container);
    let eventFired = false;
    const unsubscribe = editor.on('ast-changed', () => { eventFired = true; });
    editor.setValue('R0-C1');
    expect(eventFired).toBe(true);
    unsubscribe();
    editor.destroy();
  });

  it('undo/redo work correctly', () => {
    const editor = mountAstroCircuitEditor(container, { initialDsl: 'R0' });
    editor.setValue('R0-C1');
    editor.undo();
    expect(editor.getValue()).toBe('R0');
    editor.redo();
    expect(editor.getValue()).toBe('R0-C1');
    editor.destroy();
  });
});