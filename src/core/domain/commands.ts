export type CommandType =
  | 'insert-element'
  | 'insert-series'
  | 'insert-parallel'
  | 'delete-node'
  | 'move-node'
  | 'convert-to-series'
  | 'convert-to-parallel'
  | 'update-params'
  | 'toggle-params'
  | 'set-selection'
  | 'viewport-change'
  | 'load-circuit'
  | 'import-dsl';

export interface ViewportChangeCommand {
  type: 'viewport-change';
  panX: number;
  panY: number;
  zoom: number;
  width: number;
  height: number;
}

export interface BaseCommand {
  id: string;
  timestamp: number;
  description: string;
}

export interface InsertElementCommand extends BaseCommand {
  type: 'insert-element';
  parentId: string | null;
  kind: import('./circuit').ElementKind;
  position: number;
  elementId: number;
  paramOffset: number;
}

export interface DeleteNodeCommand extends BaseCommand {
  type: 'delete-node';
  nodeId: string;
  serializedSubtree: unknown;
}

export interface MoveNodeCommand extends BaseCommand {
  type: 'move-node';
  nodeId: string;
  deltaX: number;
  deltaY: number;
}

export interface UpdateParamsCommand extends BaseCommand {
  type: 'update-params';
  nodeId: string;
  params: number[];
}

export interface ToggleParamsCommand extends BaseCommand {
  type: 'toggle-params';
  show: boolean;
}

export interface SetSelectionCommand extends BaseCommand {
  type: 'set-selection';
  selectedIds: string[];
}

export interface LoadCircuitCommand extends BaseCommand {
  type: 'load-circuit';
  ast: import('./circuit').CircuitNode;
}

export interface ImportDslCommand extends BaseCommand {
  type: 'import-dsl';
  dsl: string;
}

export type EditorCommand =
  | InsertElementCommand
  | DeleteNodeCommand
  | MoveNodeCommand
  | UpdateParamsCommand
  | ToggleParamsCommand
  | SetSelectionCommand
  | LoadCircuitCommand
  | ImportDslCommand
  | ViewportChangeCommand;

export function makeCommandId(): string {
  return `cmd-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}