import type { CircuitNode } from './circuit';
import type { Diagnostic } from './diagnostics';

export interface ViewportState {
  panX: number;
  panY: number;
  zoom: number;
  width: number;
  height: number;
}

export interface SelectionState {
  selectedNodeIds: Set<string>;
  focusedNodeId: string | null;
}

export interface HistoryEntry {
  ast: CircuitNode;
  selection: string[];
  timestamp: number;
}

export interface HistoryState {
  past: HistoryEntry[];
  future: HistoryEntry[];
}

export interface DocumentMetadata {
  name: string;
  version: number;
  createdAt: number;
  modifiedAt: number;
  showParams: boolean;
}

export interface CircuitDocument {
  ast: CircuitNode;
  graph: import('./graph.js').EditableGraph;
  viewport: ViewportState;
  selection: SelectionState;
  history: HistoryState;
  diagnostics: Diagnostic[];
  metadata: DocumentMetadata;
}

export function defaultViewport(): ViewportState {
  return { panX: 0, panY: 0, zoom: 1, width: 800, height: 600 };
}

export function emptySelection(): SelectionState {
  return { selectedNodeIds: new Set(), focusedNodeId: null };
}

export function emptyHistory(): HistoryState {
  return { past: [], future: [] };
}

export function emptyMetadata(): DocumentMetadata {
  const now = Date.now();
  return { name: 'Untitled Circuit', version: 1, createdAt: now, modifiedAt: now, showParams: false };
}