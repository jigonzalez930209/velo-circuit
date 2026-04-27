import type { CircuitNode, ElementKind } from '../domain/circuit.js';
import { ELEMENT_KINDS } from '../domain/circuit.js';

export type InteractionTool =
  | 'select'
  | 'pan'
  | 'insert-R'
  | 'insert-C'
  | 'insert-L'
  | 'insert-Q'
  | 'insert-W'
  | 'insert-Ws'
  | 'insert-Wo'
  | 'insert-series'
  | 'insert-parallel';

export interface InteractionState {
  activeTool: InteractionTool;
  hoveredNodeId: string | null;
  selectedNodeIds: Set<string>;
  isDragging: boolean;
  isPanning: boolean;
  dragStartX: number;
  dragStartY: number;
}

export function createInteractionState(): InteractionState {
  return {
    activeTool: 'select',
    hoveredNodeId: null,
    selectedNodeIds: new Set(),
    isDragging: false,
    isPanning: false,
    dragStartX: 0,
    dragStartY: 0,
  };
}

export function toolToElementKind(tool: InteractionTool): ElementKind | null {
  switch (tool) {
    case 'insert-R': return 'R' as unknown as ElementKind;
    case 'insert-C': return 'C' as unknown as ElementKind;
    case 'insert-L': return 'L' as unknown as ElementKind;
    case 'insert-Q': return 'Q' as unknown as ElementKind;
    case 'insert-W': return 'W' as unknown as ElementKind;
    case 'insert-Ws': return 'Ws' as unknown as ElementKind;
    case 'insert-Wo': return 'Wo' as unknown as ElementKind;
    default: return null;
  }
}

export function isInsertTool(tool: InteractionTool): boolean {
  return tool.startsWith('insert-');
}

export interface PointerEvent {
  type: 'down' | 'move' | 'up' | 'wheel' | 'keydown';
  x: number;
  y: number;
  deltaX?: number;
  deltaY?: number;
  key?: string;
  ctrlKey?: boolean;
  shiftKey?: boolean;
}

export interface ContextMenuItem {
  id: string;
  label: string;
  icon?: string;
  shortcut?: string;
  disabled?: boolean;
  separator?: boolean;
}

export interface InteractionHandler {
  onNodeClick: (nodeId: string, event: PointerEvent) => void;
  onNodeHover: (nodeId: string | null) => void;
  onCanvasClick: (x: number, y: number, event: PointerEvent) => void;
  onDragStart: (nodeId: string, x: number, y: number) => void;
  onDragMove: (nodeId: string, deltaX: number, deltaY: number) => void;
  onDragEnd: (nodeId: string) => void;
  onPanStart: (x: number, y: number) => void;
  onPanMove: (deltaX: number, deltaY: number) => void;
  onPanEnd: () => void;
  onZoom: (factor: number, centerX: number, centerY: number) => void;
  onKeyboard: (key: string, ctrl: boolean, shift: boolean) => void;
  onContextMenu: (nodeId: string | null, x: number, y: number) => void;
}

/** Build context menu HTML */
export function buildContextMenuHTML(nodeId: string | null, x: number, y: number): string {
  const items: ContextMenuItem[] = nodeId
    ? [
        { id: 'ctx-delete', label: 'Delete', icon: '🗑️', shortcut: 'Del' },
        { id: 'ctx-separator-1', label: '', separator: true },
        { id: 'ctx-add-series', label: 'Add in Series →', icon: '➡️' },
        { id: 'ctx-add-parallel', label: 'Add in Parallel ↕', icon: '⬍' },
        { id: 'ctx-separator-2', label: '', separator: true },
        { id: 'ctx-wrap-parallel', label: 'Wrap in Parallel', icon: '∥' },
        { id: 'ctx-duplicate', label: 'Duplicate', icon: '📋', shortcut: 'Ctrl+D' },
        { id: 'ctx-separator-3', label: '', separator: true },
        { id: 'ctx-properties', label: 'Properties…', icon: '⚙️' },
      ]
    : [
        { id: 'ctx-add-element', label: 'Add Element Here…', icon: '➕' },
        { id: 'ctx-separator-1', label: '', separator: true },
        { id: 'ctx-paste', label: 'Paste', icon: '📋', shortcut: 'Ctrl+V', disabled: true },
        { id: 'ctx-fit-view', label: 'Fit to View', icon: '🔍', shortcut: 'F' },
        { id: 'ctx-reset-view', label: 'Reset View', icon: '↺', shortcut: '0' },
      ];

  const itemsHTML = items.map(item => {
    if (item.separator) {
      return '<div class="ce-ctx-separator"></div>';
    }
    return `<button class="ce-ctx-item${item.disabled ? ' disabled' : ''}" data-ctx-action="${item.id}" ${item.disabled ? 'disabled' : ''}>
      <span class="ce-ctx-icon">${item.icon ?? ''}</span>
      <span class="ce-ctx-label">${item.label}</span>
      ${item.shortcut ? `<span class="ce-ctx-shortcut">${item.shortcut}</span>` : ''}
    </button>`;
  }).join('');

  return `<div class="ce-context-menu" style="left:${x}px;top:${y}px" data-target-node="${nodeId ?? ''}">
    ${itemsHTML}
  </div>`;
}

/** Build context menu CSS */
export function buildContextMenuCSS(): string {
  return `
    .ce-context-menu {
      position: fixed;
      z-index: 1000;
      min-width: 200px;
      background: #ffffff;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.15);
      padding: 4px;
      font-family: system-ui, -apple-system, sans-serif;
      font-size: 12px;
      animation: ce-ctx-fade-in 0.12s ease-out;
    }
    @keyframes ce-ctx-fade-in {
      from { opacity: 0; transform: scale(0.95); }
      to { opacity: 1; transform: scale(1); }
    }
    .ce-ctx-item {
      display: flex;
      align-items: center;
      gap: 8px;
      width: 100%;
      padding: 6px 10px;
      border: none;
      background: transparent;
      cursor: pointer;
      border-radius: 4px;
      color: #1a1a2e;
      text-align: left;
      transition: background 0.1s;
    }
    .ce-ctx-item:hover:not(.disabled) {
      background: #e8f4fd;
    }
    .ce-ctx-item.disabled {
      opacity: 0.4;
      cursor: default;
    }
    .ce-ctx-icon { width: 18px; text-align: center; }
    .ce-ctx-label { flex: 1; }
    .ce-ctx-shortcut { font-size: 10px; color: #999; }
    .ce-ctx-separator { height: 1px; margin: 4px 8px; background: #e0e0e0; }
    .dark .ce-context-menu { background: #1e293b; border-color: #334155; }
    .dark .ce-ctx-item { color: #f1f5f9; }
    .dark .ce-ctx-item:hover:not(.disabled) { background: #334155; }
    .dark .ce-ctx-separator { background: #334155; }
  `.trim();
}

export function attachInteractionEvents(container: HTMLElement, state: InteractionState, handler: InteractionHandler): () => void {
  let dragNodeId: string | null = null;
  let dragStartX = 0;
  let dragStartY = 0;
  let isPanning = false;
  let panStartX = 0;
  let panStartY = 0;
  let contextMenuEl: HTMLElement | null = null;

  function getNodeIdFromEvent(e: MouseEvent): string | null {
    const target = e.target as HTMLElement;
    const nodeEl = target.closest('[data-node-id]') as HTMLElement | null;
    return nodeEl?.dataset.nodeId ?? null;
  }

  function removeContextMenu(): void {
    if (contextMenuEl) {
      contextMenuEl.remove();
      contextMenuEl = null;
    }
  }

  function onPointerDown(e: MouseEvent): void {
    removeContextMenu();
    const nodeId = getNodeIdFromEvent(e);

    if (state.activeTool === 'pan' || (e.button === 1)) {
      isPanning = true;
      panStartX = e.clientX;
      panStartY = e.clientY;
      handler.onPanStart(e.clientX, e.clientY);
      return;
    }

    if (nodeId) {
      dragNodeId = nodeId;
      dragStartX = e.clientX;
      dragStartY = e.clientY;
      handler.onNodeClick(nodeId, { type: 'down', x: e.offsetX, y: e.offsetY });
      handler.onDragStart(nodeId, e.clientX, e.clientY);
    } else {
      handler.onCanvasClick(e.offsetX, e.offsetY, { type: 'down', x: e.offsetX, y: e.offsetY });
    }
  }

  function onPointerMove(e: MouseEvent): void {
    const nodeId = getNodeIdFromEvent(e);
    handler.onNodeHover(nodeId);

    if (isPanning) {
      const deltaX = e.clientX - panStartX;
      const deltaY = e.clientY - panStartY;
      handler.onPanMove(deltaX, deltaY);
      panStartX = e.clientX;
      panStartY = e.clientY;
      return;
    }

    if (dragNodeId) {
      const deltaX = e.clientX - dragStartX;
      const deltaY = e.clientY - dragStartY;
      if (Math.abs(deltaX) > 3 || Math.abs(deltaY) > 3) {
        state.isDragging = true;
        handler.onDragMove(dragNodeId, deltaX, deltaY);
        dragStartX = e.clientX;
        dragStartY = e.clientY;
      }
    }
  }

  function onPointerUp(e: MouseEvent): void {
    if (isPanning) {
      isPanning = false;
      handler.onPanEnd();
      return;
    }

    if (dragNodeId) {
      if (state.isDragging) {
        handler.onDragEnd(dragNodeId);
      }
      state.isDragging = false;
      dragNodeId = null;
    }
  }

  function onWheel(e: WheelEvent): void {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.1 : 0.9;
    handler.onZoom(factor, e.offsetX, e.offsetY);
  }

  function onKeyDown(e: KeyboardEvent): void {
    const key = e.key;
    const ctrl = e.ctrlKey || e.metaKey;
    const shift = e.shiftKey;

    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

    handler.onKeyboard(key, ctrl, shift);
  }

  function onContextMenu(e: MouseEvent): void {
    e.preventDefault();
    removeContextMenu();

    const nodeId = getNodeIdFromEvent(e);
    const menuHTML = buildContextMenuHTML(nodeId, e.clientX, e.clientY);

    const wrapper = document.createElement('div');
    wrapper.innerHTML = menuHTML;
    contextMenuEl = wrapper.firstElementChild as HTMLElement;

    document.body.appendChild(contextMenuEl);

    // Attach click handlers to menu items
    const items = contextMenuEl.querySelectorAll<HTMLButtonElement>('.ce-ctx-item');
    for (const item of items) {
      item.addEventListener('click', () => {
        const action = item.dataset.ctxAction ?? '';
        handler.onContextMenu(nodeId, e.offsetX, e.offsetY);
        removeContextMenu();
      });
    }

    // Close on click outside
    const closeHandler = (ev: MouseEvent) => {
      if (!contextMenuEl?.contains(ev.target as Node)) {
        removeContextMenu();
        document.removeEventListener('mousedown', closeHandler);
      }
    };
    setTimeout(() => document.addEventListener('mousedown', closeHandler), 10);
  }

  container.addEventListener('pointerdown', onPointerDown);
  container.addEventListener('pointermove', onPointerMove);
  container.addEventListener('pointerup', onPointerUp);
  container.addEventListener('wheel', onWheel, { passive: false });
  window.addEventListener('keydown', onKeyDown);
  container.addEventListener('contextmenu', onContextMenu);

  return () => {
    container.removeEventListener('pointerdown', onPointerDown);
    container.removeEventListener('pointermove', onPointerMove);
    container.removeEventListener('pointerup', onPointerUp);
    container.removeEventListener('wheel', onWheel);
    window.removeEventListener('keydown', onKeyDown);
    container.removeEventListener('contextmenu', onContextMenu);
    removeContextMenu();
  };
}

export function buildKeyboardShortcutMap(): Record<string, () => void> {
  return {
    'Escape': () => {},
    'Delete': () => {},
    'Backspace': () => {},
  };
}