import type { EditorPlugin, PluginContext } from './types.js';
import { ELEMENT_KINDS, type CircuitNode, type ElementKind } from '../domain/circuit.js';

const CSS = `
.ce-sel-toolbar {
  display: none; position: absolute; z-index: 100;
  background: var(--ce-surface); border: 1px solid var(--ce-border);
  border-radius: 8px; box-shadow: 0 4px 16px var(--ce-shadow);
  padding: 4px; gap: 2px; align-items: center; white-space: nowrap;
  animation: ceStFade .12s ease-out;
}
.ce-sel-toolbar.ce-visible { display: flex; }
@keyframes ceStFade { from { opacity:0; transform:translateY(4px) } to { opacity:1; transform:translateY(0) } }
.ce-st-btn {
  padding: 3px 8px; border: 1px solid var(--ce-border); border-radius: 4px;
  background: var(--ce-surface); cursor: pointer;
  font: 500 10px var(--ce-font); color: var(--ce-text-secondary);
  transition: all .1s; display: flex; align-items: center; gap: 3px;
}
.ce-st-btn:hover { background: var(--ce-hover); border-color: var(--ce-accent); color: var(--ce-accent); }
.ce-st-btn.ce-danger:hover { background: var(--ce-error-bg); border-color: var(--ce-error); color: var(--ce-error); }
.ce-st-btn:disabled { opacity: .3; cursor: default; }
.ce-st-sep { width: 1px; height: 18px; background: var(--ce-border); margin: 0 2px; }
.ce-st-label { font: 600 10px var(--ce-font-mono); color: var(--ce-accent); padding: 0 4px; }
.ce-st-params { display: flex; align-items: center; gap: 4px; padding: 0 4px; }
.ce-st-param-group { display: flex; align-items: center; gap: 2px; }
.ce-st-param-lbl { font: 500 9px var(--ce-font); color: var(--ce-text-secondary); }
.ce-st-param-inp {
  width: 40px; padding: 2px 4px; font: 400 10px var(--ce-font-mono);
  border: 1px solid var(--ce-border); border-radius: 3px; background: var(--ce-bg);
  color: var(--ce-text); text-align: right;
}
.ce-st-param-inp:focus { outline: none; border-color: var(--ce-accent); }
`;

export function floatingToolbarPlugin(): EditorPlugin {
  let ctx: PluginContext;
  let barEl: HTMLDivElement;
  let selectedId: string | null = null;

  function buildBar() {
    barEl.innerHTML = `
      <div class="ce-st-params" data-ref="params"></div>
      <div class="ce-st-sep" data-ref="param-sep" style="display:none"></div>
      <span class="ce-st-label" data-ref="label">—</span>
      <div class="ce-st-sep"></div>
      <button class="ce-st-btn" data-act="before" title="Add before (series)">← Before</button>
      <button class="ce-st-btn" data-act="after" title="Add after (series)">After →</button>
      <button class="ce-st-btn" data-act="parallel" title="Add in parallel">∥ Parallel</button>
      <div class="ce-st-sep"></div>
      <button class="ce-st-btn" data-act="moveL" title="Move left">◀</button>
      <button class="ce-st-btn" data-act="moveR" title="Move right">▶</button>
      <div class="ce-st-sep"></div>
      <button class="ce-st-btn ce-danger" data-act="delete" title="Delete">🗑</button>`;

    barEl.querySelectorAll('.ce-st-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation(); // prevent bubbling to canvas (which clears selection)
        const act = (btn as HTMLElement).dataset.act!;
        handleAction(act, e as MouseEvent);
      });
    });
  }

  function handleAction(act: string, evt: MouseEvent) {
    if (!selectedId) return;
    const r = (evt.target as HTMLElement).getBoundingClientRect();
    switch (act) {
      case 'before':
        ctx.emit('open-element-picker', { targetId: selectedId, position: 'before', x: r.left, y: r.bottom + 4 });
        break;
      case 'after':
        ctx.emit('open-element-picker', { targetId: selectedId, position: 'after', x: r.left, y: r.bottom + 4 });
        break;
      case 'parallel':
        ctx.emit('open-element-picker', { targetId: selectedId, position: 'parallel', x: r.left, y: r.bottom + 4 });
        break;
      case 'moveL': ctx.editor.moveLeft(selectedId); break;
      case 'moveR': ctx.editor.moveRight(selectedId); break;
      case 'delete':
        const id = selectedId;
        ctx.emit('deselect-element');
        ctx.editor.deleteElement(id);
        break;
    }
  }

  function findNode(ast: CircuitNode, id: string): CircuitNode | null {
    if (ast.type === 'element' && `${ast.kind}${ast.id}` === id) return ast;
    if (ast.type === 'series' || ast.type === 'parallel') {
      for (const child of ast.children) {
        const found = findNode(child, id);
        if (found) return found;
      }
    }
    return null;
  }

  function showFor(id: string) {
    selectedId = id;
    const label = barEl.querySelector('[data-ref="label"]') as HTMLElement;
    if (label) label.textContent = id;

    const ectx = ctx.editor.getContext(id);
    const moveL = barEl.querySelector('[data-act="moveL"]') as HTMLButtonElement;
    const moveR = barEl.querySelector('[data-act="moveR"]') as HTMLButtonElement;
    if (moveL) moveL.disabled = !ectx.canMoveLeft;
    if (moveR) moveR.disabled = !ectx.canMoveRight;

    // Handle params
    const paramsContainer = barEl.querySelector('[data-ref="params"]') as HTMLElement;
    const paramSep = barEl.querySelector('[data-ref="param-sep"]') as HTMLElement;
    const showParams = ctx.editor.getShowParams();
    
    if (showParams && paramsContainer && paramSep) {
      const node = findNode(ctx.editor.getDocument().ast, id);
      if (node && node.type === 'element') {
        const kindDef = ELEMENT_KINDS.get(node.kind);
        if (kindDef && kindDef.nParams > 0) {
          const vals = node.params || new Array(kindDef.nParams).fill(0);
          paramsContainer.innerHTML = kindDef.params.map((pLabel, i) => `
            <div class="ce-st-param-group">
              <span class="ce-st-param-lbl">${pLabel}</span>
              <input type="number" class="ce-st-param-inp" data-idx="${i}" value="${vals[i] || 0}" step="any" />
            </div>
          `).join('');
          
          paramsContainer.querySelectorAll('input').forEach(inp => {
            inp.addEventListener('change', () => {
              if (!selectedId) return;
              const newParams = [...vals];
              newParams[parseInt(inp.dataset.idx!)] = parseFloat(inp.value) || 0;
              ctx.editor.updateParams(selectedId, newParams);
            });
            // Stop propagation to avoid losing selection on click inside input
            inp.addEventListener('click', e => e.stopPropagation());
            inp.addEventListener('mousedown', e => e.stopPropagation());
          });
          
          paramsContainer.style.display = 'flex';
          paramSep.style.display = 'block';
        } else {
          paramsContainer.style.display = 'none';
          paramSep.style.display = 'none';
        }
      }
    } else if (paramsContainer && paramSep) {
      paramsContainer.style.display = 'none';
      paramSep.style.display = 'none';
    }

    // Position near node
    const canvas = ctx.container.querySelector('.ce-canvas');
    const nodeEl = canvas?.querySelector(`[data-element-id="${id}"]`);
    if (nodeEl && canvas) {
      const nr = nodeEl.getBoundingClientRect();
      const cr = canvas.getBoundingClientRect();
      barEl.style.left = Math.max(0, nr.left - cr.left + nr.width / 2 - 120) + 'px';
      barEl.style.top = Math.max(0, nr.top - cr.top - 38) + 'px';
    }
    barEl.classList.add('ce-visible');
  }

  function hide() {
    selectedId = null;
    barEl.classList.remove('ce-visible');
  }

  return {
    name: 'floating-toolbar',
    install(c) {
      ctx = c;
      ctx.injectCSS('floating-toolbar', CSS);

      barEl = document.createElement('div');
      barEl.className = 'ce-sel-toolbar';
      const canvas = ctx.container.querySelector('.ce-canvas');
      if (canvas) canvas.appendChild(barEl);
      else ctx.container.appendChild(barEl);

      buildBar();

      // Prevent pointer capture from pan-zoom
      barEl.addEventListener('pointerdown', (e) => e.stopPropagation());

      ctx.on('selection-changed', (data) => {
        if (data) showFor(data as string);
        else hide();
      });

      // Re-position after re-render to ensure DOM is updated
      ctx.editor.on('render', () => {
        if (selectedId) requestAnimationFrame(() => showFor(selectedId!));
      });
    },
    destroy() {
      barEl?.remove();
    },
  };
}
