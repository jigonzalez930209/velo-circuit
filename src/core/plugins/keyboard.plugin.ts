import type { EditorPlugin, PluginContext } from './types.js';

export function keyboardPlugin(): EditorPlugin {
  let ctx: PluginContext;
  let selectedId: string | null = null;

  function onKeyDown(e: KeyboardEvent) {
    // Skip when typing in inputs
    const tag = (e.target as HTMLElement).tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

    const ctrl = e.ctrlKey || e.metaKey;

    if (ctrl && e.key === 'z') { e.preventDefault(); ctx.editor.undo(); return; }
    if (ctrl && e.key === 'y') { e.preventDefault(); ctx.editor.redo(); return; }
    if (e.key === 'Escape') { ctx.emit('deselect-element'); ctx.emit('hide-element-picker'); return; }
    if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId) {
      e.preventDefault();
      const id = selectedId;
      ctx.emit('deselect-element');
      ctx.editor.deleteElement(id);
      return;
    }
    if (e.key === 'ArrowLeft' && selectedId) { e.preventDefault(); ctx.editor.moveLeft(selectedId); return; }
    if (e.key === 'ArrowRight' && selectedId) { e.preventDefault(); ctx.editor.moveRight(selectedId); return; }
    if (e.key === 'f' || e.key === 'F') { ctx.emit('fit-view'); return; }
    if (e.key === '0' && !ctrl) { ctx.emit('reset-view'); return; }
  }

  return {
    name: 'keyboard',
    install(c) {
      ctx = c;
      ctx.on('selection-changed', (data) => { selectedId = (data as string) ?? null; });
      document.addEventListener('keydown', onKeyDown);
    },
    destroy() {
      document.removeEventListener('keydown', onKeyDown);
    },
  };
}
