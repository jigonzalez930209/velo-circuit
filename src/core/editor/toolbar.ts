import type { ElementKind } from '../domain/circuit.js';
import { ELEMENT_KINDS } from '../domain/circuit.js';

export interface ToolbarAction {
  id: string;
  label: string;
  icon?: string;
  shortcut?: string;
  disabled?: boolean;
  group?: string;
}

export interface ToolbarConfig {
  showLabels?: boolean;
  compact?: boolean;
  orientation?: 'horizontal' | 'vertical';
}

export interface ToolbarState {
  selectedTool: string | null;
  activeGroup: string | null;
}

const ELEMENT_TOOLBAR_ITEMS: ToolbarAction[] = [
  { id: 'tool-element-R', label: 'Resistor (R)', shortcut: 'R', group: 'elements' },
  { id: 'tool-element-C', label: 'Capacitor (C)', shortcut: 'C', group: 'elements' },
  { id: 'tool-element-L', label: 'Inductor (L)', shortcut: 'L', group: 'elements' },
  { id: 'tool-element-Q', label: 'CPE (Q)', shortcut: 'Q', group: 'elements' },
  { id: 'tool-element-W', label: 'Warburg (W)', shortcut: 'W', group: 'elements' },
  { id: 'tool-element-Ws', label: 'Warburg Short (Ws)', shortcut: 'S', group: 'elements' },
  { id: 'tool-element-Wo', label: 'Warburg Open (Wo)', shortcut: 'O', group: 'elements' },
];

const STRUCTURE_TOOLBAR_ITEMS: ToolbarAction[] = [
  { id: 'tool-series', label: 'Add Series (-)', shortcut: '-', group: 'structure' },
  { id: 'tool-parallel', label: 'Add Parallel (p)', shortcut: 'P', group: 'structure' },
  { id: 'tool-delete', label: 'Delete Selected', shortcut: 'Del', group: 'structure' },
  { id: 'tool-duplicate', label: 'Duplicate', shortcut: 'Ctrl+D', group: 'structure' },
];

const NAVIGATION_TOOLBAR_ITEMS: ToolbarAction[] = [
  { id: 'tool-zoom-in', label: 'Zoom In', shortcut: '+', group: 'navigation' },
  { id: 'tool-zoom-out', label: 'Zoom Out', shortcut: '-', group: 'navigation' },
  { id: 'tool-fit', label: 'Fit to View', shortcut: 'F', group: 'navigation' },
  { id: 'tool-reset-view', label: 'Reset View', shortcut: '0', group: 'navigation' },
  { id: 'tool-undo', label: 'Undo', shortcut: 'Ctrl+Z', group: 'navigation' },
  { id: 'tool-redo', label: 'Ctrl+Y', shortcut: 'Ctrl+Y', group: 'navigation' },
];

export const TOOLBAR_GROUPS = {
  elements: { label: 'Elements', items: ELEMENT_TOOLBAR_ITEMS },
  structure: { label: 'Structure', items: STRUCTURE_TOOLBAR_ITEMS },
  navigation: { label: 'Navigation', items: NAVIGATION_TOOLBAR_ITEMS },
};

export function buildToolbarHTML(config?: ToolbarConfig): string {
  const orientation = config?.orientation ?? 'horizontal';
  const showLabels = config?.showLabels ?? true;
  const compact = config?.compact ?? false;

  const groupSections = Object.entries(TOOLBAR_GROUPS).map(([groupKey, group]) => {
    const itemsHtml = group.items.map(item => {
      const iconOrLabel = item.icon ?? item.label;
      const labelHtml = showLabels ? `<span class="ce-toolbar-label">${item.label}</span>` : '';
      const shortcutHtml = item.shortcut ? `<kbd class="ce-toolbar-shortcut">${item.shortcut}</kbd>` : '';

      return `<button class="ce-toolbar-btn" data-tool-id="${item.id}" title="${item.label}${shortcutHtml ? ` (${item.shortcut})` : ''}">
        ${iconOrLabel}
        ${labelHtml}
        ${shortcutHtml}
      </button>`;
    }).join('');

    return `<div class="ce-toolbar-group" data-group="${groupKey}">
      <span class="ce-toolbar-group-label">${group.label}</span>
      <div class="ce-toolbar-items">${itemsHtml}</div>
    </div>`;
  }).join('');

  return `<div class="ce-toolbar ce-toolbar-${orientation}${compact ? ' compact' : ''}" role="toolbar" aria-label="Circuit Editor Toolbar">
    ${groupSections}
  </div>`;
}

export function buildToolbarCSS(): string {
  return `
    .ce-toolbar {
      display: flex;
      gap: 8px;
      padding: 8px;
      background: #f8f9fa;
      border-bottom: 1px solid #e0e0e0;
      font-family: system-ui, sans-serif;
      font-size: 13px;
      user-select: none;
    }
    .ce-toolbar.vertical {
      flex-direction: column;
      border-bottom: none;
      border-right: 1px solid #e0e0e0;
    }
    .ce-toolbar-group {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .ce-toolbar-group-label {
      font-size: 10px;
      font-weight: 600;
      text-transform: uppercase;
      color: #666;
      letter-spacing: 0.5px;
      padding: 0 4px;
    }
    .ce-toolbar-items {
      display: flex;
      gap: 4px;
      flex-wrap: wrap;
    }
    .ce-toolbar.vertical .ce-toolbar-items {
      flex-direction: column;
    }
    .ce-toolbar-btn {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 6px 10px;
      border: 1px solid #d0d0d0;
      border-radius: 4px;
      background: #fff;
      cursor: pointer;
      font-size: 12px;
      color: #333;
      transition: background 0.15s, border-color 0.15s;
    }
    .ce-toolbar-btn:hover {
      background: #e8f4fd;
      border-color: #4cc9f0;
    }
    .ce-toolbar-btn:active {
      background: #d0e8f7;
    }
    .ce-toolbar-btn[aria-pressed="true"] {
      background: #4cc9f0;
      border-color: #4cc9f0;
      color: #fff;
    }
    .ce-toolbar-btn:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }
    .ce-toolbar-shortcut {
      font-size: 10px;
      padding: 1px 4px;
      background: #eee;
      border-radius: 3px;
      color: #666;
    }
    .ce-toolbar.compact .ce-toolbar-btn {
      padding: 4px 6px;
    }
    .ce-toolbar.compact .ce-toolbar-label {
      display: none;
    }
  `.trim();
}

export function attachToolbarEvents(container: HTMLElement, handlers: {
  onToolSelect: (toolId: string) => void;
  onToolAction: (action: string) => void;
}): () => void {
  const buttons = container.querySelectorAll<HTMLButtonElement>('.ce-toolbar-btn');
  const cleanup: (() => void)[] = [];

  for (const btn of buttons) {
    const toolId = btn.dataset.toolId ?? '';

    const downHandler = (e: Event) => {
      e.preventDefault();
      handlers.onToolSelect(toolId);
    };

    btn.addEventListener('mousedown', downHandler);
    cleanup.push(() => btn.removeEventListener('mousedown', downHandler));

    btn.addEventListener('click', () => {
      handlers.onToolAction(toolId);
    });
  }

  return () => cleanup.forEach(fn => fn());
}

export function setToolbarButtonState(container: HTMLElement, toolId: string, pressed: boolean): void {
  const btn = container.querySelector<HTMLButtonElement>(`[data-tool-id="${toolId}"]`);
  if (btn) btn.setAttribute('aria-pressed', String(pressed));
}

export function enableToolbarButton(container: HTMLElement, toolId: string, enabled: boolean): void {
  const btn = container.querySelector<HTMLButtonElement>(`[data-tool-id="${toolId}"]`);
  if (btn) btn.disabled = !enabled;
}