import { createEditor, type EditorInstance, type EditorEvent } from '../../core/index.js';

export interface AngularEditorAdapter {
  mount(container: HTMLElement, options?: { initialDsl?: string; width?: number; height?: number }): EditorInstance;
  createComponent(container: HTMLElement, options?: { initialDsl?: string; width?: number; height?: number }): {
    getValue: () => string;
    setValue: (dsl: string) => void;
    undo: () => void;
    redo: () => void;
    destroy: () => void;
    dslChange: { emit: (dsl: string) => void };
    editorEvent: { emit: (e: { type: string; payload?: unknown }) => void };
  };
}

export function createAngularCircuitEditorAdapter(): AngularEditorAdapter {
  function mount(container: HTMLElement, options?: { initialDsl?: string; width?: number; height?: number }): EditorInstance {
    const editor = createEditor();
    editor.mount(container, options);
    return editor;
  }

  function createComponent(container: HTMLElement, options?: { initialDsl?: string; width?: number; height?: number }) {
    const editor = mount(container, options);

    const dslChangeHandlers: ((dsl: string) => void)[] = [];
    const editorEventHandlers: ((e: { type: string; payload?: unknown }) => void)[] = [];

    editor.on('ast-changed', () => {
      dslChangeHandlers.forEach(h => h(editor.getValue()));
    });

    editor.on('error', (e) => {
      editorEventHandlers.forEach(h => h({ type: e.type, payload: e.payload }));
    });

    return {
      getValue: () => editor.getValue(),
      setValue: (dsl: string) => editor.setValue(dsl),
      undo: () => editor.undo(),
      redo: () => editor.redo(),
      destroy: () => editor.destroy(),
      dslChange: {
        emit: (dsl: string) => dslChangeHandlers.forEach(h => h(dsl)),
      },
      editorEvent: {
        emit: (e: { type: string; payload?: unknown }) => editorEventHandlers.forEach(h => h(e)),
      },
    };
  }

  return { mount, createComponent };
}

export const CircuitEditorNgModule = {
  declarations: [] as unknown[],
  exports: [] as unknown[],
};