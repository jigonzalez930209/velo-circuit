import type { CircuitNode, ElementKind } from '../domain/circuit.js';
import { ELEMENT_KINDS } from '../domain/circuit.js';
import { serialize } from '../parser-bridge/serializer.js';
import { validate } from '../parser-bridge/validate.js';
import type { ValidationIssue } from '../domain/validation.js';

export interface PropertiesPanelConfig {
  showLabels?: boolean;
  editable?: boolean;
}

export function buildPropertiesPanelHTML(node: CircuitNode | null, config?: PropertiesPanelConfig): string {
  if (!node) {
    return `<div class="ce-props-panel">
      <div class="ce-props-header">Properties</div>
      <div class="ce-props-empty">No element selected</div>
    </div>`;
  }

  const isElement = node.type === 'element';
  const def = isElement ? ELEMENT_KINDS.get(node.kind) : null;

  const header = `<div class="ce-props-header">Properties</div>`;

  let body = '';

  if (isElement) {
    body += `<div class="ce-props-row">
      <label class="ce-props-label">Type</label>
      <span class="ce-props-value">${def?.label ?? node.kind}</span>
    </div>`;

    body += `<div class="ce-props-row">
      <label class="ce-props-label">Code</label>
      <code class="ce-props-value">${node.kind}${node.id}</code>
    </div>`;

    body += `<div class="ce-props-row">
      <label class="ce-props-label">ID</label>
      <span class="ce-props-value">${node.id}</span>
    </div>`;

    body += `<div class="ce-props-row">
      <label class="ce-props-label">Param Offset</label>
      <span class="ce-props-value">${node.paramOffset}</span>
    </div>`;

    if (def?.params) {
      for (let i = 0; i < def.params.length; i++) {
        const paramName = def.params[i];
        body += `<div class="ce-props-row">
          <label class="ce-props-label">${paramName}</label>
          <input class="ce-props-input" type="number" data-param-index="${i}" value="1.0" step="any" />
        </div>`;
      }
    }
  } else {
    body += `<div class="ce-props-row">
      <label class="ce-props-label">Structure</label>
      <span class="ce-props-value">${node.type}</span>
    </div>`;

    body += `<div class="ce-props-row">
      <label class="ce-props-label">Children</label>
      <span class="ce-props-value">${node.children.length}</span>
    </div>`;

    body += `<div class="ce-props-row">
      <label class="ce-props-label">DSL</label>
      <code class="ce-props-dsl">${serialize(node)}</code>
    </div>`;
  }

  return `<div class="ce-props-panel">
    ${header}
    <div class="ce-props-body">${body}</div>
  </div>`;
}

export function buildDiagnosticsPanelHTML(issues: ValidationIssue[]): string {
  if (issues.length === 0) {
    return `<div class="ce-diags-panel">
      <div class="ce-diags-header">Diagnostics</div>
      <div class="ce-diags-empty">No issues</div>
    </div>`;
  }

  const itemHtml = issues.map(issue => {
    const icon = issue.type === 'error' ? '⚠' : '⚡';
    const cls = issue.type === 'error' ? 'diag-error' : 'diag-warning';
    return `<div class="ce-diags-item ${cls}">
      <span class="ce-diags-icon">${icon}</span>
      <span class="ce-diags-message">${issue.message}</span>
    </div>`;
  }).join('');

  return `<div class="ce-diags-panel">
    <div class="ce-diags-header">Diagnostics (${issues.length})</div>
    <div class="ce-diags-body">${itemHtml}</div>
  </div>`;
}

export function buildDslPanelHTML(dsl: string, readonly = true): string {
  return `<div class="ce-dsl-panel">
    <div class="ce-dsl-header">
      <span>Boukamp DSL</span>
      <button class="ce-dsl-copy-btn" title="Copy DSL" data-action="copy-dsl">📋</button>
    </div>
    <textarea class="ce-dsl-textarea" ${readonly ? 'readonly' : ''} spellcheck="false">${dsl}</textarea>
  </div>`;
}

export function buildPropertiesCSS(): string {
  return `
    .ce-props-panel, .ce-diags-panel, .ce-dsl-panel {
      font-family: system-ui, sans-serif;
      font-size: 12px;
      border: 1px solid #e0e0e0;
      border-radius: 6px;
      background: #fff;
      overflow: hidden;
    }
    .ce-props-header, .ce-diags-header, .ce-dsl-header {
      padding: 8px 12px;
      font-weight: 600;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      background: #f5f5f5;
      border-bottom: 1px solid #e0e0e0;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .ce-props-empty, .ce-diags-empty {
      padding: 16px 12px;
      color: #999;
      text-align: center;
    }
    .ce-props-body, .ce-diags-body {
      padding: 8px;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .ce-props-row {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .ce-props-label {
      min-width: 80px;
      color: #666;
      font-size: 11px;
    }
    .ce-props-value {
      color: #333;
      font-weight: 500;
    }
    .ce-props-dsl {
      font-family: monospace;
      font-size: 11px;
      color: #555;
      word-break: break-all;
    }
    .ce-props-input {
      flex: 1;
      padding: 4px 6px;
      border: 1px solid #d0d0d0;
      border-radius: 4px;
      font-size: 12px;
      font-family: monospace;
      width: 80px;
    }
    .ce-props-input:focus {
      outline: none;
      border-color: #4cc9f0;
    }
    .ce-diags-item {
      display: flex;
      align-items: flex-start;
      gap: 6px;
      padding: 4px 6px;
      border-radius: 4px;
    }
    .diag-error {
      background: #fef2f2;
      color: #b91c1c;
    }
    .diag-warning {
      background: #fffbeb;
      color: #92400e;
    }
    .ce-diags-icon { flex-shrink: 0; }
    .ce-diags-message { font-size: 11px; line-height: 1.4; }
    .ce-dsl-textarea {
      width: 100%;
      min-height: 80px;
      padding: 8px;
      border: none;
      resize: vertical;
      font-family: monospace;
      font-size: 11px;
      line-height: 1.5;
      box-sizing: border-box;
      background: #fafafa;
      color: #333;
    }
    .ce-dsl-textarea:focus { outline: none; background: #f0f8ff; }
    .ce-dsl-copy-btn {
      background: none;
      border: none;
      cursor: pointer;
      font-size: 12px;
      padding: 2px 4px;
      border-radius: 3px;
    }
    .ce-dsl-copy-btn:hover { background: #e0e0e0; }
  `.trim();
}

export function attachPropertiesEvents(container: HTMLElement, handlers: {
  onParamChange: (nodeId: string, paramIndex: number, value: number) => void;
  onDslChange: (dsl: string) => void;
}): () => void {
  const inputs = container.querySelectorAll<HTMLInputElement>('.ce-props-input');
  const cleanup: (() => void)[] = [];

  for (const input of inputs) {
    const handler = (e: Event) => {
      const nodeId = (input.closest('[data-node-id]') as HTMLElement)?.dataset.nodeId ?? '';
      const paramIndex = parseInt(input.dataset.paramIndex ?? '0', 10);
      const value = parseFloat(input.value);
      if (!isNaN(value)) handlers.onParamChange(nodeId, paramIndex, value);
    };
    input.addEventListener('change', handler);
    cleanup.push(() => input.removeEventListener('change', handler));
  }

  const textarea = container.querySelector<HTMLTextAreaElement>('.ce-dsl-textarea');
  if (textarea) {
    const handler = (e: Event) => {
      handlers.onDslChange((e.target as HTMLTextAreaElement).value);
    };
    textarea.addEventListener('change', handler);
    cleanup.push(() => textarea.removeEventListener('change', handler));
  }

  const copyBtn = container.querySelector<HTMLButtonElement>('[data-action="copy-dsl"]');
  if (copyBtn) {
    const handler = () => {
      const dsl = container.querySelector<HTMLTextAreaElement>('.ce-dsl-textarea')?.value ?? '';
      navigator.clipboard.writeText(dsl).catch(() => {});
    };
    copyBtn.addEventListener('click', handler);
    cleanup.push(() => copyBtn.removeEventListener('click', handler));
  }

  return () => cleanup.forEach(fn => fn());
}