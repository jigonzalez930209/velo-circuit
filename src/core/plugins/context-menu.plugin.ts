import type { EditorPlugin, PluginContext } from './types.js';

const CSS = `
.ce-ctx-menu {
  display: none; position: fixed; z-index: 200; min-width: 180px;
  background: var(--ce-surface); border: 1px solid var(--ce-border);
  border-radius: 8px; box-shadow: 0 8px 24px var(--ce-shadow);
  padding: 4px; font-size: 11px; animation: ceCtxFade .1s ease-out;
}
.ce-ctx-menu.ce-visible { display: block; }
@keyframes ceCtxFade { from { opacity:0; transform:scale(.96) } to { opacity:1; transform:scale(1) } }
.ce-ctx-item {
  display: flex; align-items: center; gap: 6px; width: 100%;
  padding: 5px 8px; border: none; background: transparent; cursor: pointer;
  border-radius: 4px; color: var(--ce-text); text-align: left; transition: background .08s;
  font: 400 11px var(--ce-font);
}
.ce-ctx-item:hover { background: var(--ce-hover); }
.ce-ctx-item.ce-danger:hover { background: var(--ce-error-bg); color: var(--ce-error); }
.ce-ctx-item:disabled { opacity: .4; cursor: default; }
.ce-ctx-icon { width: 16px; text-align: center; font-size: 12px; }
.ce-ctx-label { flex: 1; }
.ce-ctx-short { font-size: 9px; color: var(--ce-text-secondary); }
.ce-ctx-sep { height: 1px; margin: 3px 6px; background: var(--ce-border); }
`;

export function contextMenuPlugin(): EditorPlugin {
  let ctx: PluginContext;
  let menuEl: HTMLDivElement;
  let outsideHandler: ((e: MouseEvent) => void) | null = null;

  function show(x: number, y: number, nid: string | null) {
    let html = '';
    if (nid) {
      const ectx = ctx.editor.getContext(nid);
      html = `
        <button class="ce-ctx-item" data-act="before"><span class="ce-ctx-icon">←</span><span class="ce-ctx-label">Add Before (Series)</span></button>
        <button class="ce-ctx-item" data-act="after"><span class="ce-ctx-icon">→</span><span class="ce-ctx-label">Add After (Series)</span></button>
        <button class="ce-ctx-item" data-act="parallel"><span class="ce-ctx-icon">∥</span><span class="ce-ctx-label">Add in Parallel</span></button>
        <div class="ce-ctx-sep"></div>
        <button class="ce-ctx-item" data-act="moveL" ${ectx.canMoveLeft?'':'disabled'}><span class="ce-ctx-icon">◀</span><span class="ce-ctx-label">Move Left</span><span class="ce-ctx-short">←</span></button>
        <button class="ce-ctx-item" data-act="moveR" ${ectx.canMoveRight?'':'disabled'}><span class="ce-ctx-icon">▶</span><span class="ce-ctx-label">Move Right</span><span class="ce-ctx-short">→</span></button>
        <div class="ce-ctx-sep"></div>
        <button class="ce-ctx-item ce-danger" data-act="delete"><span class="ce-ctx-icon">🗑</span><span class="ce-ctx-label">Delete</span><span class="ce-ctx-short">Del</span></button>`;
    } else {
      html = `
        <button class="ce-ctx-item" data-act="addEl"><span class="ce-ctx-icon">+</span><span class="ce-ctx-label">Add Element...</span></button>
        <div class="ce-ctx-sep"></div>
        <button class="ce-ctx-item" data-act="fit"><span class="ce-ctx-icon">🔍</span><span class="ce-ctx-label">Fit to View</span><span class="ce-ctx-short">F</span></button>
        <button class="ce-ctx-item" data-act="reset"><span class="ce-ctx-icon">↺</span><span class="ce-ctx-label">Reset View</span><span class="ce-ctx-short">0</span></button>`;
    }
    menuEl.innerHTML = html;
    menuEl.style.left = x + 'px';
    menuEl.style.top = y + 'px';
    menuEl.classList.add('ce-visible');

    menuEl.querySelectorAll('.ce-ctx-item').forEach(item => {
      item.addEventListener('click', (e) => {
        e.stopPropagation(); // prevent outside click handlers or canvas selection
        handleAction((item as HTMLElement).dataset.act!, nid, e as MouseEvent);
        hide();
      });
    });

    outsideHandler = (e: MouseEvent) => {
      if (!menuEl.contains(e.target as Node)) hide();
    };
    setTimeout(() => document.addEventListener('mousedown', outsideHandler!), 10);
  }

  function hide() {
    menuEl.classList.remove('ce-visible');
    if (outsideHandler) {
      document.removeEventListener('mousedown', outsideHandler);
      outsideHandler = null;
    }
  }

  function handleAction(act: string, nid: string | null, evt: MouseEvent) {
    const r = (evt.target as HTMLElement).getBoundingClientRect();
    switch (act) {
      case 'before':
        ctx.emit('open-element-picker', { targetId: nid, position: 'before', x: r.left, y: r.bottom + 4 });
        break;
      case 'after':
        ctx.emit('open-element-picker', { targetId: nid, position: 'after', x: r.left, y: r.bottom + 4 });
        break;
      case 'parallel':
        ctx.emit('open-element-picker', { targetId: nid, position: 'parallel', x: r.left, y: r.bottom + 4 });
        break;
      case 'moveL': if (nid) ctx.editor.moveLeft(nid); break;
      case 'moveR': if (nid) ctx.editor.moveRight(nid); break;
      case 'delete':
        if (nid) { ctx.emit('deselect-element'); ctx.editor.deleteElement(nid); }
        break;
      case 'addEl':
        ctx.emit('open-element-picker', { targetId: '__root__', position: 'after', x: r.left, y: r.bottom + 4 });
        break;
      case 'fit': ctx.emit('fit-view'); break;
      case 'reset': ctx.emit('reset-view'); break;
    }
  }

  function onContextMenu(e: MouseEvent) {
    e.preventDefault();
    ctx.emit('hide-element-picker');
    const nodeEl = (e.target as Element).closest?.('[data-element-id]');
    const nid = nodeEl ? (nodeEl as HTMLElement).dataset.elementId! : null;
    if (nid) ctx.emit('select-element', nid);
    show(e.clientX, e.clientY, nid);
  }

  return {
    name: 'context-menu',
    install(c) {
      ctx = c;
      ctx.injectCSS('context-menu', CSS);

      menuEl = document.createElement('div');
      menuEl.className = 'ce-ctx-menu';
      menuEl.addEventListener('pointerdown', (e) => e.stopPropagation());
      document.body.appendChild(menuEl);

      const canvas = ctx.container.querySelector('.ce-canvas');
      canvas?.addEventListener('contextmenu', onContextMenu as EventListener);
    },
    destroy() {
      hide();
      menuEl?.remove();
      const canvas = ctx?.container?.querySelector('.ce-canvas');
      canvas?.removeEventListener('contextmenu', onContextMenu as EventListener);
    },
  };
}
