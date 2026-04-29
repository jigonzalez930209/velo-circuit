import type { EditorPlugin, PluginContext } from './types.js';

const KINDS = ['R', 'C', 'L', 'Q', 'W', 'Ws', 'Wo', 'G', 'Pdw'] as const;

const CSS = `
.ce-toolbar {
  display: flex; align-items: center; gap: 6px; padding: 6px 12px;
  background: var(--ce-surface); border-bottom: 1px solid var(--ce-border); flex-wrap: wrap;
}
.ce-tb-group { display: flex; align-items: center; gap: 3px; }
.ce-tb-label {
  font: 600 9px var(--ce-font); text-transform: uppercase;
  letter-spacing: .5px; color: var(--ce-text-secondary); margin-right: 2px;
}
.ce-tb-sep { width: 1px; height: 22px; background: var(--ce-border); margin: 0 6px; }
.ce-tb-el {
  padding: 4px 10px; border: 2px solid var(--ce-border); border-radius: 5px;
  background: var(--ce-surface); cursor: pointer;
  font: 700 12px var(--ce-font-mono); transition: all .12s; line-height: 1.2;
}
.ce-tb-el:hover { transform: translateY(-1px); box-shadow: 0 2px 6px var(--ce-shadow); }
.ce-tb-el:active { transform: scale(.96); }
.ce-tb-el[data-kind="R"]  { border-color: #f87171; color: #dc2626; }
.ce-tb-el[data-kind="R"]:hover  { background: var(--ce-R-bg); }
.ce-tb-el[data-kind="C"]  { border-color: #60a5fa; color: #2563eb; }
.ce-tb-el[data-kind="C"]:hover  { background: var(--ce-C-bg); }
.ce-tb-el[data-kind="L"]  { border-color: #34d399; color: #059669; }
.ce-tb-el[data-kind="L"]:hover  { background: var(--ce-L-bg); }
.ce-tb-el[data-kind="Q"]  { border-color: #fbbf24; color: #d97706; }
.ce-tb-el[data-kind="Q"]:hover  { background: var(--ce-Q-bg); }
.ce-tb-el[data-kind="W"], .ce-tb-el[data-kind="Ws"], .ce-tb-el[data-kind="Wo"]
  { border-color: #a78bfa; color: #7c3aed; }
.ce-tb-el[data-kind="W"]:hover, .ce-tb-el[data-kind="Ws"]:hover, .ce-tb-el[data-kind="Wo"]:hover
  { background: var(--ce-W-bg); }
.ce-tb-el[data-kind="G"]  { border-color: #22d3ee; color: #0891b2; }
.ce-tb-el[data-kind="G"]:hover  { background: var(--ce-G-bg, #cffafe); }
.ce-tb-el[data-kind="Pdw"]  { border-color: #c084fc; color: #9333ea; }
.ce-tb-el[data-kind="Pdw"]:hover  { background: var(--ce-Pdw-bg, #f3e8ff); }
.ce-tb-mode {
  padding: 4px 11px; border: 1px solid var(--ce-border); border-radius: 5px;
  background: var(--ce-surface); cursor: pointer;
  font: 600 10px var(--ce-font); color: var(--ce-text-secondary); transition: all .12s;
}
.ce-tb-mode.ce-active { background: var(--ce-accent); border-color: var(--ce-accent); color: #fff; }
.ce-tb-action {
  padding: 4px 10px; border: 1px solid var(--ce-border); border-radius: 5px;
  background: var(--ce-surface); cursor: pointer;
  font: 500 10px var(--ce-font); color: var(--ce-text-secondary); transition: all .12s;
}
.ce-tb-action:hover { background: var(--ce-hover); border-color: var(--ce-accent); }
.ce-tb-action.ce-active { background: var(--ce-accent); border-color: var(--ce-accent); color: #fff; }
.ce-tb-theme {
  padding: 4px 8px; border: 1px solid var(--ce-border); border-radius: 5px;
  background: var(--ce-surface); cursor: pointer; font-size: 13px; line-height: 1;
  transition: all .12s;
}
.ce-tb-theme:hover { background: var(--ce-hover); }
.ce-tb-dsl-mobile {
  display: none;
  align-items: center;
  gap: 6px;
  width: 100%;
}
.ce-tb-dsl-input {
  flex: 1;
  min-width: 220px;
  padding: 5px 8px;
  border: 1px solid var(--ce-border);
  border-radius: 6px;
  background: var(--ce-bg);
  color: var(--ce-text);
  font: 500 12px var(--ce-font-mono);
}
.ce-tb-dsl-input:focus {
  outline: none;
  border-color: var(--ce-accent);
  box-shadow: 0 0 0 2px var(--ce-accent-alpha);
}
@media (max-width: 1000px) {
  .ce-toolbar {
    gap: 5px;
    padding: 6px 8px;
  }
  .ce-tb-sep {
    display: none;
  }
  .ce-tb-dsl-mobile {
    display: flex;
    order: 100;
    margin-top: 4px;
  }
}
`;

export function toolbarPlugin(): EditorPlugin {
  let ctx: PluginContext;
  let barEl: HTMLDivElement;
  let dslInputEl: HTMLInputElement | null = null;
  let insertMode: 'series' | 'parallel' = 'series';
  let selectedId: string | null = null;

  return {
    name: 'toolbar',
    install(c) {
      ctx = c;
      ctx.injectCSS('toolbar', CSS);

      barEl = ctx.createLayer('ce-toolbar', 'prepend');
      barEl.innerHTML = `
        <div class="ce-tb-group">
          <span class="ce-tb-label">Add</span>
          ${KINDS.map(k => `<button class="ce-tb-el" data-kind="${k}">${k}</button>`).join('')}
        </div>
        <div class="ce-tb-sep"></div>
        <div class="ce-tb-group">
          <span class="ce-tb-label">Mode</span>
          <button class="ce-tb-mode ce-active" data-mode="series">Series —</button>
          <button class="ce-tb-mode" data-mode="parallel">Parallel ∥</button>
        </div>
        <div class="ce-tb-sep"></div>
        <div class="ce-tb-group">
          <button class="ce-tb-action" data-act="undo">↩ Undo</button>
          <button class="ce-tb-action" data-act="redo">↪ Redo</button>
        </div>
        <div class="ce-tb-sep"></div>
        <button class="ce-tb-action" data-act="params" title="Toggle parameters visibility">[P] Params</button>
        <button class="ce-tb-theme" data-act="theme" title="Toggle theme">🌓</button>
        <div class="ce-tb-dsl-mobile">
          <span class="ce-tb-label">Boukamp DSL</span>
          <input class="ce-tb-dsl-input" type="text" spellcheck="false" />
          <button class="ce-tb-action" data-act="apply-dsl">Apply</button>
        </div>`;

      // Element buttons
      barEl.querySelectorAll('.ce-tb-el').forEach(btn => {
        btn.addEventListener('click', () => {
          const kind = (btn as HTMLElement).dataset.kind!;
          if (selectedId) {
            const pos = insertMode === 'parallel' ? 'parallel' as const : 'after' as const;
            ctx.editor.insertRelative(selectedId, kind as any, pos);
          } else {
            ctx.editor.insertElement(kind as any, insertMode);
          }
        });
      });

      // Mode toggle
      barEl.querySelectorAll('.ce-tb-mode').forEach(btn => {
        btn.addEventListener('click', () => {
          insertMode = (btn as HTMLElement).dataset.mode as any;
          barEl.querySelectorAll('.ce-tb-mode').forEach(b => b.classList.remove('ce-active'));
          btn.classList.add('ce-active');
          ctx.editor.setInsertMode(insertMode);
        });
      });

      // Actions
      barEl.querySelector('[data-act="undo"]')?.addEventListener('click', () => ctx.editor.undo());
      barEl.querySelector('[data-act="redo"]')?.addEventListener('click', () => ctx.editor.redo());
      barEl.querySelector('[data-act="theme"]')?.addEventListener('click', () => ctx.emit('toggle-theme'));
      barEl.querySelector('[data-act="apply-dsl"]')?.addEventListener('click', () => {
        if (dslInputEl) ctx.editor.setValue(dslInputEl.value.trim());
      });

      dslInputEl = barEl.querySelector('.ce-tb-dsl-input') as HTMLInputElement | null;
      if (dslInputEl) {
        dslInputEl.value = ctx.editor.getValue();
        dslInputEl.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            ctx.editor.setValue(dslInputEl!.value.trim());
          }
        });
        dslInputEl.addEventListener('blur', () => {
          ctx.editor.setValue(dslInputEl!.value.trim());
        });
      }

      const paramsBtn = barEl.querySelector('[data-act="params"]') as HTMLButtonElement;
      paramsBtn?.addEventListener('click', () => {
        const show = !ctx.editor.getShowParams();
        ctx.editor.setShowParams(show);
        if (show) paramsBtn.classList.add('ce-active');
        else paramsBtn.classList.remove('ce-active');
      });

      // Track selection
      ctx.on('selection-changed', (data) => { selectedId = (data as string) ?? null; });
      ctx.editor.on('ast-changed', () => {
        if (dslInputEl) dslInputEl.value = ctx.editor.getValue();
      });
    },
    destroy() {
      barEl?.remove();
    },
  };
}
