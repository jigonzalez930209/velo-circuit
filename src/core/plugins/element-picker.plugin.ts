import type { EditorPlugin, PluginContext } from './types.js';

const CSS = `
.ce-element-picker {
  display: none; position: absolute; z-index: 250;
  background: var(--ce-surface); border: 1px solid var(--ce-border);
  border-radius: 10px; box-shadow: 0 8px 24px var(--ce-shadow);
  padding: 8px; animation: cePickerFade .12s ease-out;
}
.ce-element-picker.ce-visible { display: block; }
@keyframes cePickerFade { from { opacity:0; transform:scale(.96) } to { opacity:1; transform:scale(1) } }
.ce-ep-title {
  font: 600 9px var(--ce-font); text-transform: uppercase;
  letter-spacing: .5px; color: var(--ce-text-secondary);
  padding: 2px 4px 6px; text-align: center;
}
.ce-ep-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 4px; }
.ce-ep-btn {
  padding: 6px 10px; border: 2px solid var(--ce-border); border-radius: 6px;
  background: var(--ce-surface); cursor: pointer;
  font: 700 13px var(--ce-font-mono); transition: all .12s; text-align: center;
}
.ce-ep-btn:hover { transform: translateY(-1px); box-shadow: 0 2px 8px var(--ce-shadow); }
.ce-ep-btn:active { transform: scale(.94); }
.ce-ep-btn[data-k="R"]  { border-color: #f87171; color: #dc2626; }
.ce-ep-btn[data-k="R"]:hover  { background: var(--ce-R-bg); }
.ce-ep-btn[data-k="C"]  { border-color: #60a5fa; color: #2563eb; }
.ce-ep-btn[data-k="C"]:hover  { background: var(--ce-C-bg); }
.ce-ep-btn[data-k="L"]  { border-color: #34d399; color: #059669; }
.ce-ep-btn[data-k="L"]:hover  { background: var(--ce-L-bg); }
.ce-ep-btn[data-k="Q"]  { border-color: #fbbf24; color: #d97706; }
.ce-ep-btn[data-k="Q"]:hover  { background: var(--ce-Q-bg); }
.ce-ep-btn[data-k="W"], .ce-ep-btn[data-k="Ws"], .ce-ep-btn[data-k="Wo"]
  { border-color: #a78bfa; color: #7c3aed; }
.ce-ep-btn[data-k="W"]:hover, .ce-ep-btn[data-k="Ws"]:hover, .ce-ep-btn[data-k="Wo"]:hover
  { background: var(--ce-W-bg); }
.ce-ep-btn[data-k="G"]  { border-color: #22d3ee; color: #0891b2; }
.ce-ep-btn[data-k="G"]:hover  { background: var(--ce-G-bg, #cffafe); }
.ce-ep-btn[data-k="Pdw"]  { border-color: #c084fc; color: #9333ea; }
.ce-ep-btn[data-k="Pdw"]:hover  { background: var(--ce-Pdw-bg, #f3e8ff); }
`;

const KINDS = ['R', 'C', 'L', 'Q', 'W', 'Ws', 'Wo', 'G', 'Pdw'];

export interface PickerRequest {
  targetId: string;
  position: 'before' | 'after' | 'parallel';
  x: number;
  y: number;
}

export function elementPickerPlugin(): EditorPlugin {
  let ctx: PluginContext;
  let pickerEl: HTMLDivElement;
  let pending: PickerRequest | null = null;
  let outsideHandler: ((e: MouseEvent) => void) | null = null;

  function show(req: PickerRequest) {
    pending = req;
    const cr = ctx.container.getBoundingClientRect();
    pickerEl.style.left = Math.max(0, req.x - cr.left) + 'px';
    pickerEl.style.top = Math.max(0, req.y - cr.top) + 'px';
    pickerEl.classList.add('ce-visible');
    outsideHandler = (e: MouseEvent) => {
      if (!pickerEl.contains(e.target as Node)) hide();
    };
    setTimeout(() => document.addEventListener('mousedown', outsideHandler!), 10);
  }

  function hide() {
    pickerEl.classList.remove('ce-visible');
    pending = null;
    if (outsideHandler) {
      document.removeEventListener('mousedown', outsideHandler);
      outsideHandler = null;
    }
  }

  function onPick(kind: string) {
    if (pending) {
      ctx.editor.insertRelative(pending.targetId, kind as any, pending.position);
    } else {
      ctx.editor.insertElement(kind as any);
    }
    hide();
  }

  return {
    name: 'element-picker',
    install(c) {
      ctx = c;
      ctx.injectCSS('element-picker', CSS);

      pickerEl = document.createElement('div');
      pickerEl.className = 'ce-element-picker';
      pickerEl.addEventListener('pointerdown', (e) => e.stopPropagation());
      pickerEl.innerHTML = `
        <div class="ce-ep-title">Select element</div>
        <div class="ce-ep-grid">
          ${KINDS.map(k => `<button class="ce-ep-btn" data-k="${k}">${k}</button>`).join('')}
        </div>`;
      ctx.container.appendChild(pickerEl);

      pickerEl.querySelectorAll('.ce-ep-btn').forEach(btn => {
        btn.addEventListener('click', () => onPick((btn as HTMLElement).dataset.k!));
      });

      // Other plugins request the picker via event
      ctx.on('open-element-picker', (data) => show(data as PickerRequest));
      ctx.on('hide-element-picker', () => hide());
    },
    destroy() {
      hide();
      pickerEl?.remove();
    },
  };
}
