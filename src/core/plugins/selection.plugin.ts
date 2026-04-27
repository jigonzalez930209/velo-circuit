import type { EditorPlugin, PluginContext } from './types.js';

const CSS = `
.ce-canvas .circuit-node { cursor: pointer; }
.ce-canvas .circuit-node:hover .node-bg { stroke: var(--ce-accent) !important; stroke-width: 2 !important; }
.ce-canvas .circuit-node.ce-selected .node-bg {
  stroke: var(--ce-accent) !important; stroke-width: 2.5 !important;
  filter: drop-shadow(0 0 4px var(--ce-accent-alpha));
}
`;

export function selectionPlugin(): EditorPlugin {
  let ctx: PluginContext;
  let selectedId: string | null = null;

  function select(id: string) {
    selectedId = id;
    ctx.editor.select(id);
    highlight();
    ctx.emit('selection-changed', id);
  }

  function deselect() {
    selectedId = null;
    ctx.editor.deselect();
    highlight();
    ctx.emit('selection-changed', null);
  }

  function getSelectedId(): string | null {
    return selectedId;
  }

  function highlight() {
    const canvas = ctx.container.querySelector('.ce-canvas');
    if (!canvas) return;
    canvas.querySelectorAll('.circuit-node').forEach(n => n.classList.remove('ce-selected'));
    if (!selectedId) return;
    const node = canvas.querySelector(`[data-element-id="${selectedId}"]`);
    if (node) node.classList.add('ce-selected');
  }

  function onClick(e: MouseEvent) {
    const nodeEl = (e.target as Element).closest?.('[data-element-id]');
    if (nodeEl && e.button === 0) {
      e.stopPropagation();
      select((nodeEl as HTMLElement).dataset.elementId!);
      return;
    }
    if (e.button === 0 && !nodeEl) {
      deselect();
    }
  }

  return {
    name: 'selection',
    install(c) {
      ctx = c;
      ctx.injectCSS('selection', CSS);

      const canvas = ctx.container.querySelector('.ce-canvas');
      canvas?.addEventListener('click', onClick as EventListener);

      // Re-highlight after re-render
      ctx.editor.on('render', () => requestAnimationFrame(highlight));
      ctx.editor.on('ast-changed', () => requestAnimationFrame(highlight));

      // Expose API via events
      ctx.on('select-element', (data) => select(data as string));
      ctx.on('deselect-element', () => deselect());
      ctx.on('get-selected-id', (cb) => (cb as (id: string | null) => void)(selectedId));
    },
    destroy() {
      const canvas = ctx?.container?.querySelector('.ce-canvas');
      canvas?.removeEventListener('click', onClick as EventListener);
    },
  };
}
