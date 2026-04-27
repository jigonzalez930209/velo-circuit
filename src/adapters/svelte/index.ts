import { createEditor, type EditorInstance, type EditorOptions, allPlugins } from '../../core/index.js';

export interface SvelteEditorOptions extends EditorOptions {
  value?: string;
  readonly?: boolean;
  width?: number;
  height?: number;
}

export interface SvelteEditorEvents {
  change: CustomEvent<string>;
  error: CustomEvent<{ type: string; payload: unknown }>;
}

export function createSvelteCircuitEditor(element: HTMLElement, options?: SvelteEditorOptions): EditorInstance {
  const editor = createEditor({ plugins: allPlugins() });
  editor.mount(element, options);

  editor.on('ast-changed' as never, () => {
    const event = new CustomEvent('change', { detail: editor.getValue() });
    element.dispatchEvent(event);
  });

  editor.on('error' as never, (e) => {
    const event = new CustomEvent('error', { detail: { type: e.type, payload: e.payload } });
    element.dispatchEvent(event);
  });

  return editor;
}

export function getSvelteEditorEvents(element: HTMLElement): string[] {
  return ['change', 'error'];
}

export function circuitEditor(node: HTMLElement, options: SvelteEditorOptions = {}) {
  let editor = createSvelteCircuitEditor(node, options);

  if (options.value !== undefined) {
    editor.setValue(options.value);
  }

  return {
    update(newOptions: SvelteEditorOptions) {
      if (newOptions.value !== undefined && newOptions.value !== editor.getValue()) {
        editor.setValue(newOptions.value);
      }
    },
    destroy() {
      editor.destroy();
    }
  };
}