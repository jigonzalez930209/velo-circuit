import type { CircuitDocument } from '../domain/document.js';
import type { CircuitNode, ElementKind } from '../domain/circuit.js';
import type { EditableGraph } from '../domain/graph.js';
import type { EditorCommand, LoadCircuitCommand } from '../domain/commands.js';
import type { ValidationResult } from '../domain/validation.js';
import type { EditorPlugin } from '../plugins/types.js';
import { PluginRegistry } from '../plugins/types.js';
import { createElement } from '../domain/circuit.js';
import { createStore } from '../state/store.js';
import { createAdapter } from '../parser-bridge/index.js';
import { buildLayout, computeBounds } from '../layout/layout-engine.js';
import { renderCircuit } from '../render-svg/renderer.js';
import { defaultViewport } from '../domain/document.js';
import { makeCommandId } from '../domain/commands.js';
import { serialize } from '../parser-bridge/serializer.js';
import { validate } from '../parser-bridge/validate.js';
import {
  generateNextElementId,
  computeNextParamOffset,
  insertElementIntoSeries,
  insertElementIntoParallel,
  deleteElementRecursive,
  wrapInParallel,
  wrapInSeries,
  collectElementIds,
  insertAfterTarget,
  insertBeforeTarget,
  addParallelToTarget,
  moveElementLeft,
  moveElementRight,
  getElementContext,
  type ParentContext,
} from './commands-builder.js';

export type EditorEventType =
  | 'mount'
  | 'destroy'
  | 'ast-changed'
  | 'selection-changed'
  | 'viewport-changed'
  | 'render'
  | 'command'
  | 'error'
  | 'validation';

export interface EditorEvent {
  type: EditorEventType;
  payload?: unknown;
}

export type EventHandler = (event: EditorEvent) => void;

export interface EditorOptions {
  initialDsl?: string;
  width?: number;
  height?: number;
  onEvent?: EventHandler;
  plugins?: EditorPlugin[];
}

export type InsertMode = 'series' | 'parallel';

export interface EditorInstance {
  mount(container: HTMLElement, options?: EditorOptions): void;
  destroy(): void;
  getValue(): string;
  setValue(dsl: string): void;
  getShowParams(): boolean;
  setShowParams(show: boolean): void;
  updateParams(targetId: string, params: number[]): void;
  getDocument(): CircuitDocument;
  dispatch(command: EditorCommand): void;
  on(event: EditorEventType, handler: EventHandler): () => void;
  undo(): void;
  redo(): void;
  render(): string;

  // High-level API
  insertElement(kind: ElementKind, mode?: InsertMode): void;
  deleteElement(targetId: string): void;
  wrapInParallel(targetId: string, kind: ElementKind): void;
  wrapInSeries(targetId: string, kind: ElementKind, after?: boolean): void;
  getInsertMode(): InsertMode;
  setInsertMode(mode: InsertMode): void;
  getValidation(): ValidationResult;
  getElementIds(): string[];

  // Positional / contextual API
  insertRelative(targetId: string, kind: ElementKind, position: 'before' | 'after' | 'parallel'): void;
  moveLeft(targetId: string): void;
  moveRight(targetId: string): void;
  getContext(targetId: string): ParentContext;
  select(elementId: string): void;
  deselect(): void;
  getSelectedId(): string | null;
  getContainer(): HTMLElement | null;
}

const DEFAULT_WIDTH = 800;
const DEFAULT_HEIGHT = 600;

export function createEditor(editorOpts?: { plugins?: EditorPlugin[] }): EditorInstance {
  let container: HTMLElement | null = null;
  const adapter = createAdapter();
  const store = createStore();
  const listeners = new Map<EditorEventType, Set<EventHandler>>();
  let insertMode: InsertMode = 'series';
  let unsubStore: (() => void) | null = null;
  let selectedElementId: string | null = null;
  const pluginRegistry = new PluginRegistry();

  // Register plugins from constructor
  if (editorOpts?.plugins) {
    for (const p of editorOpts.plugins) pluginRegistry.register(p);
  }

  function emit(type: EditorEventType, payload?: unknown): void {
    const event: EditorEvent = { type, payload };
    listeners.get(type)?.forEach(h => h(event));
  }

  function on(event: EditorEventType, handler: EventHandler): () => void {
    if (!listeners.has(event)) listeners.set(event, new Set());
    listeners.get(event)!.add(handler);
    return () => listeners.get(event)?.delete(handler);
  }

  function getCurrentAst(): CircuitNode {
    return store.getAst();
  }

  function rebuildGraph(): EditableGraph {
    return buildLayout(getCurrentAst());
  }

  function render(): string {
    const viewport = store.getViewport();
    const selection = store.getSelection();
    const graph = rebuildGraph();

    return renderCircuit(graph, viewport, {
      width: viewport.width || DEFAULT_WIDTH,
      height: viewport.height || DEFAULT_HEIGHT,
      showGrid: true,
      selectedNodeIds: selection.selectedNodeIds,
    });
  }

  function syncContainer(): void {
    if (!container) return;
    const svg = render();
    // Render into .ce-canvas layer if plugins created one, otherwise into container
    const target = (container.querySelector?.('.ce-canvas') as HTMLElement) || container;
    if (typeof target.querySelectorAll === 'function') {
      target.querySelectorAll('svg.circuit-editor').forEach(s => s.remove());
      target.insertAdjacentHTML('beforeend', svg);
    } else {
      (target as any).innerHTML = svg;
    }
    emit('render', svg);
  }

  function handleStoreEvent(event: { type: string; payload: unknown }): void {
    switch (event.type) {
      case 'ast-changed':
        emit('ast-changed', event.payload);
        emit('validation', validate(getCurrentAst()));
        syncContainer();
        break;
      case 'selection-changed':
        emit('selection-changed', event.payload);
        syncContainer();
        break;
      case 'viewport-changed':
        emit('viewport-changed', event.payload);
        syncContainer();
        break;
    }
  }

  function loadAst(ast: CircuitNode): void {
    store.dispatch({
      type: 'load-circuit',
      id: makeCommandId(),
      timestamp: Date.now(),
      description: 'Load circuit',
      ast,
    } as LoadCircuitCommand);
  }

  function makeNewElement(kind: ElementKind): CircuitNode {
    const currentAst = getCurrentAst();
    const nextId = generateNextElementId(currentAst, kind);
    const nextOffset = computeNextParamOffset(currentAst);
    return createElement(kind, nextId, nextOffset);
  }

  const instance: EditorInstance = {
    mount(el: HTMLElement, options?: EditorOptions): void {
      container = el;

      if (options?.initialDsl) {
        const result = adapter.parse(options.initialDsl);
        if ('error' in result) {
          emit('error', result.error);
          return;
        }
        loadAst(result.ast);
      }

      if (options?.width !== undefined || options?.height !== undefined) {
        store.dispatch({
          type: 'viewport-change',
          panX: 0,
          panY: 0,
          zoom: 1,
          width: options.width ?? DEFAULT_WIDTH,
          height: options.height ?? DEFAULT_HEIGHT,
        });
      }

      // Register additional plugins from mount options
      if (options?.plugins) {
        for (const p of options.plugins) pluginRegistry.register(p);
      }

      // Install plugins FIRST so they create .ce-canvas, .ce-workspace, etc.
      pluginRegistry.installAll(instance, container);

      // NOW subscribe to store and do initial render (plugins have created DOM layers)
      unsubStore = store.subscribe(handleStoreEvent);
      syncContainer();
      emit('mount', container);
    },

    destroy(): void {
      pluginRegistry.destroyAll();
      if (unsubStore) {
        unsubStore();
        unsubStore = null;
      }
      if (container) container.innerHTML = '';
      container = null;
      listeners.clear();
      emit('destroy');
    },

    getValue(): string {
      const showParams = store.getDocument().metadata.showParams;
      return serialize(store.getAst(), { showParams });
    },
    
    getShowParams(): boolean {
      return store.getDocument().metadata.showParams;
    },

    setShowParams(show: boolean): void {
      store.dispatch({
        id: makeCommandId(),
        timestamp: Date.now(),
        description: `Toggle params ${show ? 'on' : 'off'}`,
        type: 'toggle-params',
        show,
      });
    },

    updateParams(targetId: string, params: number[]): void {
      store.dispatch({
        id: makeCommandId(),
        timestamp: Date.now(),
        description: `Update parameters for ${targetId}`,
        type: 'update-params',
        nodeId: targetId,
        params,
      });
    },

    setValue(dsl: string): void {
      const result = adapter.parse(dsl);
      if ('error' in result) {
        emit('error', result.error);
        return;
      }
      loadAst(result.ast);
    },

    getDocument(): CircuitDocument {
      return store.getDocument();
    },

    dispatch(command: EditorCommand): void {
      store.dispatch(command);
      emit('command', command);
    },

    on,

    undo(): void {
      store.undo();
    },

    redo(): void {
      store.redo();
    },

    render(): string {
      return render();
    },

    // ──── High-level API ────

    insertElement(kind: ElementKind, mode?: InsertMode): void {
      const element = makeNewElement(kind);
      const resolvedMode = mode ?? insertMode;

      // If there's a selected element, insert relative to it
      if (selectedElementId) {
        const position = resolvedMode === 'parallel' ? 'parallel' : 'after';
        const newAst = position === 'parallel'
          ? addParallelToTarget(getCurrentAst(), selectedElementId, element)
          : insertAfterTarget(getCurrentAst(), selectedElementId, element);
        loadAst(newAst);
        return;
      }

      const currentAst = getCurrentAst();
      let newAst: CircuitNode;

      if (resolvedMode === 'parallel') {
        newAst = insertElementIntoParallel(currentAst, element);
      } else {
        newAst = insertElementIntoSeries(currentAst, element, -1);
      }

      loadAst(newAst);
    },

    deleteElement(targetId: string): void {
      const currentAst = getCurrentAst();
      const newAst = deleteElementRecursive(currentAst, targetId);
      if (selectedElementId === targetId) selectedElementId = null;
      loadAst(newAst);
    },

    wrapInParallel(targetId: string, kind: ElementKind): void {
      const element = makeNewElement(kind);
      const newAst = wrapInParallel(getCurrentAst(), targetId, element);
      loadAst(newAst);
    },

    wrapInSeries(targetId: string, kind: ElementKind, after = true): void {
      const element = makeNewElement(kind);
      const newAst = wrapInSeries(getCurrentAst(), targetId, element, after);
      loadAst(newAst);
    },

    getInsertMode(): InsertMode {
      return insertMode;
    },

    setInsertMode(mode: InsertMode): void {
      insertMode = mode;
    },

    getValidation(): ValidationResult {
      return validate(getCurrentAst());
    },

    getElementIds(): string[] {
      return collectElementIds(getCurrentAst());
    },

    // ──── Positional / contextual API ────

    insertRelative(targetId: string, kind: ElementKind, position: 'before' | 'after' | 'parallel'): void {
      const element = makeNewElement(kind);
      let newAst: CircuitNode;
      switch (position) {
        case 'before':
          newAst = insertBeforeTarget(getCurrentAst(), targetId, element);
          break;
        case 'after':
          newAst = insertAfterTarget(getCurrentAst(), targetId, element);
          break;
        case 'parallel':
          newAst = addParallelToTarget(getCurrentAst(), targetId, element);
          break;
      }
      loadAst(newAst);
    },

    moveLeft(targetId: string): void {
      const newAst = moveElementLeft(getCurrentAst(), targetId);
      loadAst(newAst);
    },

    moveRight(targetId: string): void {
      const newAst = moveElementRight(getCurrentAst(), targetId);
      loadAst(newAst);
    },

    getContext(targetId: string): ParentContext {
      return getElementContext(getCurrentAst(), targetId);
    },

    select(elementId: string): void {
      selectedElementId = elementId;
      emit('selection-changed', elementId);
    },

    deselect(): void {
      selectedElementId = null;
      emit('selection-changed', null);
    },

    getSelectedId(): string | null {
      return selectedElementId;
    },

    getContainer(): HTMLElement | null {
      return container;
    },
  };

  return instance;
}