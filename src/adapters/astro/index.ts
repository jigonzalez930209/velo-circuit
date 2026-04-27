import { createEditor, type EditorInstance, type EditorOptions } from '../../core/index.js';

export interface AstroEditorProps extends EditorOptions {
  id?: string;
}

const STORAGE = new Map<string, EditorInstance>();

export function mountAstroCircuitEditor(element: HTMLElement, options?: AstroEditorProps): EditorInstance {
  const editor = createEditor();

  editor.mount(element, options);

  if (options?.id) {
    STORAGE.set(options.id, editor);
  }

  return editor;
}

export function unmountAstroCircuitEditor(id: string): void {
  const editor = STORAGE.get(id);
  if (editor) {
    editor.destroy();
    STORAGE.delete(id);
  }
}

export function getAstroCircuitEditor(id: string): EditorInstance | undefined {
  return STORAGE.get(id);
}

export function createAstroEditorWidget(containerId: string, options?: AstroEditorProps): string {
  return `<div id="${containerId}" data-circuit-editor="${options?.id ?? containerId}"></div>
<script type="module">
  import { mountAstroCircuitEditor } from './adapters/astro/index.js';
  const el = document.getElementById('${containerId}');
  if (el) {
    const editor = mountAstroCircuitEditor(el, ${JSON.stringify(options ?? {})});
    window.__circuitEditors = window.__circuitEditors || {};
    window.__circuitEditors['${options?.id ?? containerId}'] = editor;
  }
</script>`;
}