import type { EditorPlugin, PluginContext } from './types.js';

const CSS = `
.ce-sidebar {
  width: 300px; border-left: 1px solid var(--ce-border);
  overflow-y: auto; background: var(--ce-surface); display: flex; flex-direction: column;
}
@media (max-width: 1000px) {
  .ce-sidebar { display: none !important; }
}
.ce-panel { border-bottom: 1px solid var(--ce-border); }
.ce-panel-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 6px 12px; background: var(--ce-soft);
  font: 600 9px var(--ce-font); text-transform: uppercase;
  letter-spacing: .5px; color: var(--ce-text-secondary);
}
.ce-panel-body { padding: 8px 12px; }
.ce-panel-btn {
  padding: 3px 8px; border: 1px solid var(--ce-border); border-radius: 4px;
  background: var(--ce-surface); cursor: pointer;
  font: 400 9px var(--ce-font); color: var(--ce-text-secondary); transition: all .12s;
}
.ce-panel-btn:hover { background: var(--ce-hover); border-color: var(--ce-accent); }
`;

export interface PanelPluginOptions {
  container?: HTMLElement | string;
}

/** Creates or gets the default sidebar container, shared by dsl/diagnostics/export plugins if no override is provided */
export function getOrCreateSidebar(ctx: PluginContext): HTMLDivElement {
  let sidebar = ctx.container.querySelector('.ce-sidebar') as HTMLDivElement;
  if (!sidebar) {
    ctx.injectCSS('sidebar', CSS);
    sidebar = document.createElement('div');
    sidebar.className = 'ce-sidebar';
    const workspace = ctx.container.querySelector('.ce-workspace') || ctx.container;
    workspace.appendChild(sidebar);
  }
  return sidebar;
}

function resolveContainer(ctx: PluginContext, selector?: HTMLElement | string): HTMLElement {
  if (selector instanceof HTMLElement) return selector;
  if (typeof selector === 'string') {
    const el = document.querySelector(selector);
    if (el) return el as HTMLElement;
  }
  return getOrCreateSidebar(ctx);
}

// ──── DSL Panel ────

const DSL_CSS = `
.ce-dsl-input {
  width: 100%; min-height: 55px; padding: 8px;
  border: 1px solid var(--ce-border); border-radius: 6px;
  font: 13px var(--ce-font-mono); resize: vertical;
  background: var(--ce-bg); color: var(--ce-text); line-height: 1.4;
}
.ce-dsl-input:focus {
  outline: none; border-color: var(--ce-accent);
  box-shadow: 0 0 0 3px var(--ce-accent-alpha);
}
`;

export function dslPanelPlugin(opts?: PanelPluginOptions): EditorPlugin {
  let ctx: PluginContext;
  let textarea: HTMLTextAreaElement;

  return {
    name: 'dsl-panel',
    install(c) {
      ctx = c;
      ctx.injectCSS('dsl-panel', DSL_CSS);

      ctx.injectCSS('dsl-panel', DSL_CSS);

      const targetContainer = resolveContainer(ctx, opts?.container);
      const panel = document.createElement('div');
      panel.className = 'ce-panel';
      panel.innerHTML = `
        <div class="ce-panel-header">
          <span>Boukamp DSL</span>
          <button class="ce-panel-btn" data-act="copy">📋</button>
        </div>
        <div class="ce-panel-body">
          <textarea class="ce-dsl-input" spellcheck="false"></textarea>
        </div>`;
      targetContainer.appendChild(panel);

      textarea = panel.querySelector('.ce-dsl-input')!;
      textarea.value = ctx.editor.getValue();

      textarea.addEventListener('change', () => ctx.editor.setValue(textarea.value.trim()));
      textarea.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault(); ctx.editor.setValue(textarea.value.trim());
        }
      });

      panel.querySelector('[data-act="copy"]')?.addEventListener('click', () => {
        navigator.clipboard.writeText(ctx.editor.getValue()).catch(() => {});
      });

      ctx.editor.on('ast-changed', () => { textarea.value = ctx.editor.getValue(); });
    },
    destroy() {},
  };
}

// ──── Diagnostics Panel ────

const DIAG_CSS = `
.ce-diag-ok { font-size: 10px; color: var(--ce-ok); text-align: center; padding: 6px; }
.ce-diag-item {
  display: flex; align-items: flex-start; gap: 4px; padding: 4px 6px;
  border-radius: 4px; font-size: 10px; line-height: 1.3; margin-bottom: 3px;
}
.ce-diag-item.ce-err { background: var(--ce-error-bg); color: var(--ce-error); }
.ce-diag-item.ce-warn { background: var(--ce-warn-bg); color: var(--ce-warn); }
`;

export function diagnosticsPlugin(opts?: PanelPluginOptions): EditorPlugin {
  let ctx: PluginContext;
  let contentEl: HTMLDivElement;

  function update() {
    const v = ctx.editor.getValidation();
    if (!v.issues.length) {
      contentEl.innerHTML = '<div class="ce-diag-ok">✓ No issues</div>';
      return;
    }
    contentEl.innerHTML = v.issues.map(i =>
      `<div class="ce-diag-item ${i.type === 'error' ? 'ce-err' : 'ce-warn'}">${i.type === 'error' ? '✖' : '⚠'} ${i.message}</div>`
    ).join('');
  }

  return {
    name: 'diagnostics',
    install(c) {
      ctx = c;
      ctx.injectCSS('diagnostics', DIAG_CSS);

      ctx.injectCSS('diagnostics', DIAG_CSS);

      const targetContainer = resolveContainer(ctx, opts?.container);
      const panel = document.createElement('div');
      panel.className = 'ce-panel';
      panel.innerHTML = `
        <div class="ce-panel-header">Diagnostics</div>
        <div class="ce-panel-body"><div class="ce-diag-ok">✓ No issues</div></div>`;
      targetContainer.appendChild(panel);
      contentEl = panel.querySelector('.ce-panel-body')!;

      ctx.editor.on('ast-changed', () => update());
      ctx.editor.on('validation', () => update());
    },
    destroy() {},
  };
}

// ──── Export Panel ────

const EXPORT_CSS = `
.ce-export-btns { display: flex; gap: 4px; }
.ce-export-btns button {
  flex: 1; padding: 5px; border: 1px solid var(--ce-border); border-radius: 5px;
  background: var(--ce-surface); cursor: pointer; font: 400 10px var(--ce-font);
  color: var(--ce-text-secondary); transition: all .12s;
}
.ce-export-btns button:hover { background: var(--ce-hover); border-color: var(--ce-accent); }
`;

export function exportPanelPlugin(opts?: PanelPluginOptions): EditorPlugin {
  let ctx: PluginContext;

  return {
    name: 'export-panel',
    install(c) {
      ctx = c;
      ctx.injectCSS('export-panel', EXPORT_CSS);

      ctx.injectCSS('export-panel', EXPORT_CSS);

      const targetContainer = resolveContainer(ctx, opts?.container);
      const panel = document.createElement('div');
      panel.className = 'ce-panel';
      panel.innerHTML = `
        <div class="ce-panel-header">Export</div>
        <div class="ce-panel-body">
          <div class="ce-export-btns">
            <button data-act="svg">📐 SVG</button>
            <button data-act="dsl">📋 DSL</button>
          </div>
        </div>`;
      targetContainer.appendChild(panel);

      panel.querySelector('[data-act="svg"]')?.addEventListener('click', () => {
        navigator.clipboard.writeText(ctx.editor.render()).catch(() => {});
      });
      panel.querySelector('[data-act="dsl"]')?.addEventListener('click', () => {
        navigator.clipboard.writeText(ctx.editor.getValue()).catch(() => {});
      });
    },
    destroy() {},
  };
}
