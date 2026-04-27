import type { CircuitNode } from '../domain/circuit.js';
import type { EditableGraph, NodePosition } from '../domain/graph.js';
import type {
  CircuitDocument,
  HistoryState,
  SelectionState,
  ViewportState,
} from '../domain/document.js';
import type { Diagnostic } from '../domain/diagnostics.js';
import type { EditorCommand } from '../domain/commands.js';
import { cloneNode, createElement, createSeries, createParallel, ElementKind } from '../domain/circuit.js';
import { emptyGraph } from '../domain/graph.js';
import { defaultViewport, emptySelection, emptyHistory, emptyMetadata } from '../domain/document.js';
import type { ValidationResult } from '../domain/validation.js';
import { deleteElementRecursive, insertElementIntoSeries, insertElementIntoParallel } from '../editor/commands-builder.js';

export type StoreEventType =
  | 'ast-changed'
  | 'selection-changed'
  | 'viewport-changed'
  | 'graph-changed'
  | 'diagnostics-changed'
  | 'history-changed';

export type StoreEventListener = (event: StoreEvent) => void;

export interface StoreEvent {
  type: StoreEventType;
  payload: unknown;
}

export interface EditorStore {
  getDocument(): CircuitDocument;
  getAst(): CircuitNode;
  getGraph(): EditableGraph;
  getSelection(): SelectionState;
  getViewport(): ViewportState;
  getDiagnostics(): Diagnostic[];
  dispatch(command: EditorCommand): void;
  undo(): void;
  redo(): void;
  canUndo(): boolean;
  canRedo(): boolean;
  subscribe(listener: StoreEventListener): () => void;
}

interface StoreState {
  ast: CircuitNode;
  graph: EditableGraph;
  viewport: ViewportState;
  selection: SelectionState;
  history: HistoryState;
  diagnostics: Diagnostic[];
  metadata: import('../domain/document.js').DocumentMetadata;
}

const MAX_HISTORY = 50;

function createEmptyDocument(): CircuitDocument {
  return {
    ast: createElement('R' as unknown as ElementKind, 0, 0),
    graph: emptyGraph(),
    viewport: defaultViewport(),
    selection: emptySelection(),
    history: emptyHistory(),
    diagnostics: [],
    metadata: emptyMetadata(),
  };
}

function pushHistory(state: StoreState, entry: { ast: CircuitNode; selection: string[] }): HistoryState {
  const past = [...state.history.past, { ...entry, timestamp: Date.now() }].slice(-MAX_HISTORY);
  return { past, future: [] };
}

function applyCommand(state: StoreState, command: EditorCommand): Partial<StoreState> {
  switch (command.type) {
    case 'insert-element': {
      const element = createElement(command.kind, command.elementId, command.paramOffset);
      const newAst = insertIntoAst(state.ast, element, command.parentId, command.position);
      return {
        ast: newAst,
        history: pushHistory(state, { ast: cloneNode(state.ast), selection: [...state.selection.selectedNodeIds] }),
        metadata: { ...state.metadata, modifiedAt: Date.now() },
      };
    }
    case 'delete-node': {
      const targetId = command.nodeId;
      const newAst = deleteElementRecursive(state.ast, targetId);
      return {
        ast: newAst,
        selection: emptySelection(),
        history: pushHistory(state, { ast: cloneNode(state.ast), selection: [...state.selection.selectedNodeIds] }),
        metadata: { ...state.metadata, modifiedAt: Date.now() },
      };
    }
    case 'load-circuit': {
      return {
        ast: command.ast,
        selection: emptySelection(),
        history: pushHistory(state, { ast: cloneNode(state.ast), selection: [...state.selection.selectedNodeIds] }),
        metadata: { ...state.metadata, modifiedAt: Date.now() },
      };
    }
    case 'import-dsl': {
      // Handled externally through the editor; this is a no-op at store level
      return {};
    }
    case 'set-selection': {
      return {
        selection: {
          selectedNodeIds: new Set(command.selectedIds),
          focusedNodeId: command.selectedIds[command.selectedIds.length - 1] ?? null,
        },
      };
    }
    case 'viewport-change': {
      const payload = command as unknown as { panX: number; panY: number; zoom: number; width: number; height: number };
      return { viewport: { ...state.viewport, ...payload } };
    }
    case 'move-node': {
      // Move is handled at layout level — we don't change positions in the AST
      return {};
    }
    case 'update-params': {
      const ast = updateParamsRecursive(state.ast, command.nodeId, command.params);
      return { ast };
    }
    case 'toggle-params': {
      return { metadata: { ...state.metadata, showParams: command.show } };
    }
    default:
      return {};
  }
}

function updateParamsRecursive(ast: CircuitNode, nodeId: string, params: number[]): CircuitNode {
  if (ast.type === 'element') {
    if (`${ast.kind}${ast.id}` === nodeId) {
      return { ...ast, params: [...params] };
    }
    return ast;
  }
  if (ast.type === 'series') {
    return { ...ast, children: ast.children.map(c => updateParamsRecursive(c, nodeId, params)) };
  }
  if (ast.type === 'parallel') {
    return { ...ast, children: ast.children.map(c => updateParamsRecursive(c, nodeId, params)) };
  }
  return ast;
}

function insertIntoAst(ast: CircuitNode, element: CircuitNode, parentId: string | null, position: number): CircuitNode {
  if (parentId === null) {
    if (ast.type === 'element') return createSeries([ast, element]);
    if (ast.type === 'series') {
      const children = [...ast.children];
      const safePos = Math.max(0, Math.min(position >= 0 ? position : children.length, children.length));
      children.splice(safePos, 0, element);
      return createSeries(children);
    }
    return createSeries([ast, element]);
  }
  return ast;
}

export function createStore(initial?: Partial<CircuitDocument>): EditorStore {
  let current: StoreState = {
    ast: initial?.ast ?? createElement(ElementKind.Resistor, 0, 0),
    graph: initial?.graph ?? emptyGraph(),
    viewport: initial?.viewport ?? defaultViewport(),
    selection: initial?.selection ?? emptySelection(),
    history: initial?.history ?? emptyHistory(),
    diagnostics: initial?.diagnostics ?? [],
    metadata: initial?.metadata ?? emptyMetadata(),
  };

  const listeners = new Set<StoreEventListener>();

  function emit(type: StoreEventType, payload: unknown): void {
    const event: StoreEvent = { type, payload };
    listeners.forEach(l => l(event));
  }

  function notifyChanges(changes: Partial<StoreState>): void {
    if (changes.ast !== undefined) emit('ast-changed', changes.ast);
    if (changes.graph !== undefined) emit('graph-changed', changes.graph);
    if (changes.selection !== undefined) emit('selection-changed', changes.selection);
    if (changes.viewport !== undefined) emit('viewport-changed', changes.viewport);
    if (changes.diagnostics !== undefined) emit('diagnostics-changed', changes.diagnostics);
    if (changes.history !== undefined) emit('history-changed', changes.history);
  }

  return {
    getDocument(): CircuitDocument {
      return current as unknown as CircuitDocument;
    },
    getAst(): CircuitNode {
      return current.ast;
    },
    getGraph(): EditableGraph {
      return current.graph;
    },
    getSelection(): SelectionState {
      return current.selection;
    },
    getViewport(): ViewportState {
      return current.viewport;
    },
    getDiagnostics(): Diagnostic[] {
      return current.diagnostics;
    },
    dispatch(command: EditorCommand): void {
      const changes = applyCommand(current, command);
      current = { ...current, ...changes };
      notifyChanges(changes);
    },
    undo(): void {
      if (current.history.past.length === 0) return;
      const past = [...current.history.past];
      const entry = past.pop()!;
      const futureEntry = { ast: cloneNode(current.ast), selection: [...current.selection.selectedNodeIds], timestamp: Date.now() };
      const changes: Partial<StoreState> = {
        ast: entry.ast,
        history: { past, future: [futureEntry, ...current.history.future] },
      };
      current = { ...current, ...changes };
      notifyChanges(changes);
    },
    redo(): void {
      if (current.history.future.length === 0) return;
      const future = [...current.history.future];
      const entry = future.shift()!;
      const pastEntry = { ast: cloneNode(current.ast), selection: [...current.selection.selectedNodeIds], timestamp: Date.now() };
      const changes: Partial<StoreState> = {
        ast: entry.ast,
        history: { past: [...current.history.past, pastEntry], future },
      };
      current = { ...current, ...changes };
      notifyChanges(changes);
    },
    canUndo(): boolean {
      return current.history.past.length > 0;
    },
    canRedo(): boolean {
      return current.history.future.length > 0;
    },
    subscribe(listener: StoreEventListener): () => void {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}