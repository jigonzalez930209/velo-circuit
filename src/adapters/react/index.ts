import { createEditor, type EditorInstance, type EditorOptions, type EditorEventType, type EventHandler, allPlugins } from '../../core/index.js';

export interface ReactEditorProps {
  initialDsl?: string;
  width?: number;
  height?: number;
  value?: string;
  onChange?: (dsl: string) => void;
  onEvent?: (event: { type: EditorEventType; payload?: unknown }) => void;
}

export interface ReactEditorInstance {
  getValue(): string;
  setValue(dsl: string): void;
  on(event: EditorEventType, handler: EventHandler): () => void;
  undo(): void;
  redo(): void;
  destroy(): void;
}

export function createReactCircuitEditor(
  container: HTMLElement,
  options: ReactEditorProps,
): ReactEditorInstance {
  const editor = createEditor({ plugins: allPlugins() });

  editor.mount(container, {
    initialDsl: options.initialDsl,
    width: options.width,
    height: options.height,
  });

  if (options.value !== undefined) {
    editor.setValue(options.value);
  }

  editor.on('ast-changed', () => {
    options.onChange?.(editor.getValue());
  });

  if (options.onEvent) {
    const handler: EventHandler = (e) => options.onEvent!({ type: e.type, payload: e.payload });
    editor.on('error', handler);
  }

  return {
    getValue() { return editor.getValue(); },
    setValue(dsl: string) { editor.setValue(dsl); },
    on(event: EditorEventType, handler: EventHandler) { return editor.on(event, handler); },
    undo() { editor.undo(); },
    redo() { editor.redo(); },
    destroy() { editor.destroy(); },
  };
}

import { useEffect, useRef, type RefObject } from 'react';

export function useCircuitEditor(options: ReactEditorProps): {
  containerRef: RefObject<HTMLDivElement | null>;
  editorRef: RefObject<ReactEditorInstance | null>;
} {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<ReactEditorInstance | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    
    const editor = createReactCircuitEditor(containerRef.current, options);
    editorRef.current = editor;

    return () => {
      editor.destroy();
      editorRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only mount once

  // Sync value changes if controlled
  useEffect(() => {
    if (editorRef.current && options.value !== undefined && options.value !== editorRef.current.getValue()) {
      editorRef.current.setValue(options.value);
    }
  }, [options.value]);

  return { containerRef, editorRef };
}