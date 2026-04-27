import { createEditor, type EditorInstance, type EditorOptions, allPlugins } from '../../core/index.js';

export interface VanillaEditorOptions extends EditorOptions {
  container: HTMLElement;
}

export interface VanillaEditorInstance {
  destroy(): void;
  getValue(): string;
  setValue(dsl: string): void;
  on(event: string, handler: (...args: unknown[]) => void): () => void;
  undo(): void;
  redo(): void;
}

export function mountCircuitEditor(options: VanillaEditorOptions): VanillaEditorInstance {
  const { container, ...editorOptions } = options;
  const editor = createEditor({ plugins: allPlugins() });

  editor.mount(container, editorOptions);

  return {
    destroy(): void {
      editor.destroy();
    },

    getValue(): string {
      return editor.getValue();
    },

    setValue(dsl: string): void {
      editor.setValue(dsl);
    },

    on(event: string, handler: (...args: unknown[]) => void): () => void {
      return editor.on(event as never, (e) => handler(e.type, e.payload));
    },

    undo(): void {
      editor.undo();
    },

    redo(): void {
      editor.redo();
    },
  };
}

export function unmountCircuitEditor(instance: VanillaEditorInstance): void {
  instance.destroy();
}

export function createCircuitEditorVanilla(containerId: string, initialDsl?: string): VanillaEditorInstance {
  const container = document.getElementById(containerId);
  if (!container) throw new Error(`Container with id "${containerId}" not found`);
  return mountCircuitEditor({ container, initialDsl });
}