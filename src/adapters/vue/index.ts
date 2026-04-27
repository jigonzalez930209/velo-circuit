import { 
  createEditor, 
  type EditorInstance, 
  type EditorOptions, 
  type EditorEvent, 
  allPlugins 
} from '../../core/index.js';

export interface VueEditorInstance {
  setValue(dsl: string): void;
  getValue(): string;
  undo(): void;
  redo(): void;
  destroy(): void;
}

export function createVueCircuitEditor(container: HTMLElement, options: {
  initialDsl?: string;
  width?: number;
  height?: number;
  onDslChange?: (dsl: string) => void;
  onEvent?: (e: { type: string; payload?: unknown }) => void;
}): VueEditorInstance {
  const editor = createEditor({ plugins: allPlugins() });

  editor.mount(container, {
    initialDsl: options.initialDsl,
    width: options.width,
    height: options.height,
  });

  editor.on('ast-changed', () => {
    options.onDslChange?.(editor.getValue());
  });

  if (options.onEvent) {
    const handler = (e: { type: string; payload?: unknown }) => options.onEvent!(e);
    editor.on('error', handler as Parameters<typeof editor.on>[1]);
  }

  return {
    setValue(dsl: string) { editor.setValue(dsl); },
    getValue() { return editor.getValue(); },
    undo() { editor.undo(); },
    redo() { editor.redo(); },
    destroy() { editor.destroy(); },
  };
}

export function mountVueCircuitEditor(containerId: string, options: {
  initialDsl?: string;
  width?: number;
  height?: number;
  onDslChange?: (dsl: string) => void;
}): VueEditorInstance {
  const container = document.getElementById(containerId);
  if (!container) throw new Error(`Container #${containerId} not found`);
  return createVueCircuitEditor(container, options);
}

import { ref, watch, onMounted, onBeforeUnmount, type Ref } from 'vue';

export function useCircuitEditor(options: {
  initialDsl?: string;
  value?: Ref<string>;
  width?: number;
  height?: number;
  onDslChange?: (dsl: string) => void;
  onEvent?: (e: { type: string; payload?: unknown }) => void;
}): {
  containerRef: Ref<HTMLElement | null>;
  editorRef: Ref<VueEditorInstance | null>;
} {
  const containerRef = ref<HTMLElement | null>(null);
  const editorRef = ref<VueEditorInstance | null>(null);

  onMounted(() => {
    if (!containerRef.value) return;
    
    const editor = createVueCircuitEditor(containerRef.value, {
      ...options,
      initialDsl: options.value?.value ?? options.initialDsl,
      onDslChange: (dsl) => {
        // If controlled, we don't immediately set the value ref to avoid circular updates,
        // we just emit the change. The parent is responsible for updating the value ref.
        options.onDslChange?.(dsl);
      }
    });
    
    editorRef.value = editor;
  });

  onBeforeUnmount(() => {
    if (editorRef.value) {
      editorRef.value.destroy();
      editorRef.value = null;
    }
  });

  // Sync incoming value changes
  if (options.value) {
    watch(options.value, (newVal) => {
      if (editorRef.value && newVal !== editorRef.value.getValue()) {
        editorRef.value.setValue(newVal);
      }
    });
  }

  return { containerRef, editorRef };
}