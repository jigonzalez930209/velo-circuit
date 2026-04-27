import type { CircuitNode, ElementKind } from '../domain/circuit.js';
import { ELEMENT_KINDS, traverseNodes } from '../domain/circuit.js';
import { serialize } from '../parser-bridge/serializer.js';
import { validate } from '../parser-bridge/validate.js';
import type { ValidationIssue } from '../domain/validation.js';

/**
 * DSL Equation Editor — Word-like visual editor for Boukamp DSL.
 *
 * Renders the DSL as interactive visual chips instead of raw text.
 * Each element (R0, C1, etc.) is a styled chip. Operators (-, p()) are visual.
 * Supports cursor positioning, click-to-select, and real-time validation.
 */

export interface EquationEditorConfig {
  readonly?: boolean;
  showValidation?: boolean;
  compact?: boolean;
  onDslChange?: (dsl: string) => void;
  onElementClick?: (elementId: string) => void;
  onCursorMove?: (position: number) => void;
}

interface ChipData {
  type: 'element' | 'series-op' | 'parallel-open' | 'parallel-close' | 'comma' | 'cursor-slot';
  value: string;
  elementKind?: string;
  elementId?: number;
  position: number;
  hasError?: boolean;
}

/** Element kind → color mapping for chips */
const ELEMENT_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  R: { bg: '#fee2e2', border: '#f87171', text: '#991b1b' },
  C: { bg: '#dbeafe', border: '#60a5fa', text: '#1e3a8a' },
  L: { bg: '#d1fae5', border: '#34d399', text: '#064e3b' },
  Q: { bg: '#fef3c7', border: '#fbbf24', text: '#78350f' },
  W: { bg: '#ede9fe', border: '#a78bfa', text: '#4c1d95' },
  Ws: { bg: '#ede9fe', border: '#8b5cf6', text: '#4c1d95' },
  Wo: { bg: '#ede9fe', border: '#7c3aed', text: '#4c1d95' },
};

const DARK_ELEMENT_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  R: { bg: '#450a0a', border: '#f87171', text: '#fecaca' },
  C: { bg: '#172554', border: '#60a5fa', text: '#bfdbfe' },
  L: { bg: '#022c22', border: '#34d399', text: '#a7f3d0' },
  Q: { bg: '#422006', border: '#fbbf24', text: '#fef3c7' },
  W: { bg: '#2e1065', border: '#a78bfa', text: '#e0e7ff' },
  Ws: { bg: '#2e1065', border: '#8b5cf6', text: '#e0e7ff' },
  Wo: { bg: '#2e1065', border: '#7c3aed', text: '#e0e7ff' },
};

/**
 * Convert an AST into a flat list of visual chips for rendering.
 */
export function astToChips(ast: CircuitNode): ChipData[] {
  const chips: ChipData[] = [];
  let pos = 0;

  function walk(node: CircuitNode): void {
    switch (node.type) {
      case 'element': {
        chips.push({
          type: 'element',
          value: `${node.kind}${node.id}`,
          elementKind: node.kind as string,
          elementId: node.id,
          position: pos++,
        });
        break;
      }
      case 'series': {
        for (let i = 0; i < node.children.length; i++) {
          if (i > 0) {
            chips.push({ type: 'series-op', value: '—', position: pos++ });
          }
          walk(node.children[i]);
        }
        break;
      }
      case 'parallel': {
        chips.push({ type: 'parallel-open', value: 'p(', position: pos++ });
        for (let i = 0; i < node.children.length; i++) {
          if (i > 0) {
            chips.push({ type: 'comma', value: ',', position: pos++ });
          }
          walk(node.children[i]);
        }
        chips.push({ type: 'parallel-close', value: ')', position: pos++ });
        break;
      }
    }
  }

  walk(ast);
  return chips;
}

/**
 * Mark chips that have validation errors.
 */
export function annotateChipsWithErrors(chips: ChipData[], issues: ValidationIssue[]): ChipData[] {
  const errorIds = new Set<string>();
  for (const issue of issues) {
    if (issue.type === 'error' && 'elementKind' in issue && 'elementId' in issue) {
      errorIds.add(`${issue.elementKind}${issue.elementId}`);
    }
  }

  return chips.map(chip => ({
    ...chip,
    hasError: chip.type === 'element' && errorIds.has(chip.value),
  }));
}

/**
 * Build the visual equation editor HTML.
 */
export function buildEquationEditorHTML(ast: CircuitNode, config?: EquationEditorConfig): string {
  const chips = astToChips(ast);
  const validation = config?.showValidation !== false ? validate(ast) : null;
  const annotated = validation ? annotateChipsWithErrors(chips, validation.issues) : chips;

  const chipsHtml = annotated.map((chip, idx) => {
    switch (chip.type) {
      case 'element': {
        const colors = ELEMENT_COLORS[chip.elementKind ?? 'R'];
        const errorCls = chip.hasError ? ' chip-error' : '';
        const kindLabel = ELEMENT_KINDS.get(chip.elementKind as ElementKind)?.label ?? chip.elementKind;
        return `<button class="ce-eq-chip ce-eq-element${errorCls}" 
          data-element-id="${chip.value}" 
          data-chip-index="${idx}"
          style="--chip-bg:${colors.bg};--chip-border:${colors.border};--chip-text:${colors.text}"
          title="${kindLabel} (${chip.value})"
          draggable="true">
          <span class="ce-eq-chip-code">${chip.value}</span>
        </button>`;
      }
      case 'series-op':
        return `<span class="ce-eq-operator ce-eq-series" data-chip-index="${idx}">
          <span class="ce-eq-dash">—</span>
        </span>`;
      case 'parallel-open':
        return `<span class="ce-eq-bracket ce-eq-paren-open" data-chip-index="${idx}">
          <span class="ce-eq-p-label">p</span><span class="ce-eq-paren">(</span>
        </span>`;
      case 'parallel-close':
        return `<span class="ce-eq-bracket ce-eq-paren-close" data-chip-index="${idx}">
          <span class="ce-eq-paren">)</span>
        </span>`;
      case 'comma':
        return `<span class="ce-eq-operator ce-eq-comma" data-chip-index="${idx}">,</span>`;
      default:
        return '';
    }
  }).join('');

  // Insert cursor slots between chips
  const cursorSlots = `<div class="ce-eq-cursor-slot" data-slot="end" title="Click to insert element here"></div>`;

  const validationHtml = validation && validation.issues.length > 0
    ? `<div class="ce-eq-validation">
        ${validation.issues.map(i => `<span class="ce-eq-issue ce-eq-issue-${i.type}" title="${i.message}">
          ${i.type === 'error' ? '✖' : '⚠'} ${i.message}
        </span>`).join('')}
      </div>`
    : '';

  const dsl = serialize(ast);

  return `<div class="ce-equation-editor${config?.compact ? ' compact' : ''}${config?.readonly ? ' readonly' : ''}">
    <div class="ce-eq-header">
      <span class="ce-eq-title">Circuit Expression</span>
      <code class="ce-eq-dsl-preview">${dsl}</code>
    </div>
    <div class="ce-eq-chips-container" role="textbox" aria-label="Circuit equation" tabindex="0">
      ${chipsHtml}
      ${cursorSlots}
    </div>
    ${validationHtml}
  </div>`;
}

/**
 * Build the CSS for the equation editor.
 */
export function buildEquationEditorCSS(): string {
  return `
    .ce-equation-editor {
      font-family: system-ui, -apple-system, sans-serif;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      overflow: hidden;
      background: #ffffff;
    }

    .ce-eq-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 6px 12px;
      background: #f8f9fa;
      border-bottom: 1px solid #e0e0e0;
    }

    .ce-eq-title {
      font-size: 10px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #666;
    }

    .ce-eq-dsl-preview {
      font-size: 11px;
      font-family: 'Fira Code', 'Consolas', monospace;
      color: #4cc9f0;
      padding: 2px 6px;
      background: #f0f8ff;
      border-radius: 3px;
    }

    .ce-eq-chips-container {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 4px;
      padding: 10px 12px;
      min-height: 44px;
      cursor: text;
      transition: background 0.15s;
    }

    .ce-eq-chips-container:focus {
      outline: none;
      background: #f0f8ff;
    }

    .ce-eq-chip {
      display: inline-flex;
      align-items: center;
      gap: 2px;
      padding: 4px 10px;
      border: 2px solid var(--chip-border);
      border-radius: 6px;
      background: var(--chip-bg);
      color: var(--chip-text);
      font-size: 12px;
      font-weight: 600;
      font-family: 'Fira Code', 'Consolas', monospace;
      cursor: grab;
      user-select: none;
      transition: all 0.15s ease;
    }

    .ce-eq-chip:hover {
      transform: translateY(-1px);
      box-shadow: 0 2px 8px rgba(0,0,0,0.12);
      filter: brightness(1.05);
    }

    .ce-eq-chip:active {
      cursor: grabbing;
      transform: scale(0.95);
    }

    .ce-eq-chip.chip-error {
      border-color: #ef4444 !important;
      box-shadow: 0 0 0 2px rgba(239,68,68,0.3);
      animation: ce-shake 0.3s ease;
    }

    @keyframes ce-shake {
      0%, 100% { transform: translateX(0); }
      25% { transform: translateX(-2px); }
      75% { transform: translateX(2px); }
    }

    .ce-eq-chip.chip-selected {
      border-color: #4cc9f0 !important;
      box-shadow: 0 0 0 3px rgba(76,201,240,0.3);
    }

    .ce-eq-operator {
      display: inline-flex;
      align-items: center;
      padding: 0 4px;
      color: #888;
      font-size: 14px;
      font-weight: 700;
    }

    .ce-eq-series .ce-eq-dash {
      color: #888;
      font-size: 16px;
    }

    .ce-eq-bracket {
      display: inline-flex;
      align-items: center;
      font-size: 13px;
      font-weight: 700;
    }

    .ce-eq-p-label {
      color: #6366f1;
      font-style: italic;
      font-size: 12px;
      margin-right: 1px;
    }

    .ce-eq-paren {
      color: #6366f1;
      font-size: 16px;
    }

    .ce-eq-comma {
      color: #888;
      font-size: 14px;
      padding: 0 2px;
    }

    .ce-eq-cursor-slot {
      width: 2px;
      height: 24px;
      background: transparent;
      border-radius: 1px;
      cursor: text;
      transition: all 0.15s;
    }

    .ce-eq-cursor-slot:hover,
    .ce-eq-cursor-slot.active {
      width: 20px;
      background: rgba(76,201,240,0.2);
      border: 1px dashed #4cc9f0;
    }

    .ce-eq-validation {
      padding: 6px 12px;
      border-top: 1px solid #e0e0e0;
      background: #fefefe;
      display: flex;
      flex-direction: column;
      gap: 3px;
    }

    .ce-eq-issue {
      font-size: 11px;
      line-height: 1.4;
      padding: 2px 0;
    }

    .ce-eq-issue-error { color: #dc2626; }
    .ce-eq-issue-warning { color: #d97706; }

    .ce-equation-editor.compact .ce-eq-chips-container {
      padding: 6px 8px;
      gap: 2px;
    }

    .ce-equation-editor.compact .ce-eq-chip {
      padding: 2px 6px;
      font-size: 11px;
    }

    .ce-equation-editor.readonly .ce-eq-chip {
      cursor: default;
    }

    .ce-equation-editor.readonly .ce-eq-chip:hover {
      transform: none;
      box-shadow: none;
    }

    /* Dark mode */
    .dark .ce-equation-editor {
      background: #1e293b;
      border-color: #334155;
    }
    .dark .ce-eq-header {
      background: #0f172a;
      border-color: #334155;
    }
    .dark .ce-eq-title { color: #94a3b8; }
    .dark .ce-eq-dsl-preview { background: #0f172a; color: #38bdf8; }
    .dark .ce-eq-chips-container:focus { background: #0f172a; }
    .dark .ce-eq-operator { color: #64748b; }
    .dark .ce-eq-series .ce-eq-dash { color: #64748b; }
    .dark .ce-eq-p-label { color: #818cf8; }
    .dark .ce-eq-paren { color: #818cf8; }
    .dark .ce-eq-validation { background: #0f172a; border-color: #334155; }
  `.trim();
}

/**
 * Attach drag-and-drop and interaction events to the equation editor.
 */
export function attachEquationEditorEvents(
  container: HTMLElement,
  config: EquationEditorConfig,
): () => void {
  const cleanup: (() => void)[] = [];

  // Click on element chips
  const chips = container.querySelectorAll<HTMLButtonElement>('.ce-eq-element');
  for (const chip of chips) {
    const handler = () => {
      const elementId = chip.dataset.elementId ?? '';
      config.onElementClick?.(elementId);

      // Toggle selection
      chips.forEach(c => c.classList.remove('chip-selected'));
      chip.classList.add('chip-selected');
    };
    chip.addEventListener('click', handler);
    cleanup.push(() => chip.removeEventListener('click', handler));
  }

  // Drag start
  for (const chip of chips) {
    const dragStartHandler = (e: DragEvent) => {
      const elementId = chip.dataset.elementId ?? '';
      e.dataTransfer?.setData('text/plain', elementId);
      e.dataTransfer?.setData('application/x-circuit-element', elementId);
      chip.classList.add('dragging');
    };
    const dragEndHandler = () => {
      chip.classList.remove('dragging');
    };
    chip.addEventListener('dragstart', dragStartHandler);
    chip.addEventListener('dragend', dragEndHandler);
    cleanup.push(() => {
      chip.removeEventListener('dragstart', dragStartHandler);
      chip.removeEventListener('dragend', dragEndHandler);
    });
  }

  return () => cleanup.forEach(fn => fn());
}
