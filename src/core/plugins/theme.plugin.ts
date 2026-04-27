import type { EditorPlugin, PluginContext } from './types.js';

export const THEME_CSS = `
/* ── Light Theme (default) ── */
.ce-editor {
  --ce-bg: #f0f2f5;
  --ce-surface: #ffffff;
  --ce-surface-alpha: rgba(255,255,255,.85);
  --ce-soft: #f8f9fb;
  --ce-border: #e2e8f0;
  --ce-text: #1e293b;
  --ce-text-secondary: #64748b;
  --ce-accent: #4cc9f0;
  --ce-accent-alpha: rgba(76,201,240,.2);
  --ce-hover: #e8f4fd;
  --ce-error: #ef4444;
  --ce-error-bg: #fef2f2;
  --ce-warn: #f59e0b;
  --ce-warn-bg: #fffbeb;
  --ce-ok: #22c55e;
  --ce-shadow: rgba(0,0,0,.08);
  --ce-grid: #94a3b8;
  --ce-font: 'Inter', system-ui, -apple-system, sans-serif;
  --ce-font-mono: 'Fira Code', 'Cascadia Code', 'JetBrains Mono', monospace;
  --ce-R-bg: #fee2e2; --ce-C-bg: #dbeafe; --ce-L-bg: #d1fae5;
  --ce-Q-bg: #fef3c7; --ce-W-bg: #ede9fe;
  
  --ce-R-stroke: #dc2626; --ce-C-stroke: #2563eb; --ce-L-stroke: #059669;
  --ce-Q-stroke: #d97706; --ce-W-stroke: #7c3aed;

  display: flex; flex-direction: column; height: 100%; position: relative;
  font-family: var(--ce-font); background: var(--ce-bg); color: var(--ce-text);
  user-select: none; -webkit-user-select: none;
}
.ce-editor .ce-workspace {
  display: flex; flex: 1; overflow: hidden;
}

/* ── Dark Theme ── */
.ce-editor.ce-dark {
  --ce-bg: #0f172a;
  --ce-surface: #1e293b;
  --ce-surface-alpha: rgba(30,41,59,.9);
  --ce-soft: #1e293b;
  --ce-border: #334155;
  --ce-text: #e2e8f0;
  --ce-text-secondary: #94a3b8;
  --ce-accent: #38bdf8;
  --ce-accent-alpha: rgba(56,189,248,.25);
  --ce-hover: rgba(56,189,248,.1);
  --ce-error: #f87171;
  --ce-error-bg: rgba(248,113,113,.1);
  --ce-warn: #fbbf24;
  --ce-warn-bg: rgba(251,191,36,.1);
  --ce-ok: #4ade80;
  --ce-shadow: rgba(0,0,0,.3);
  --ce-grid: #334155;
  --ce-R-bg: rgba(248,113,113,.15); --ce-C-bg: rgba(96,165,250,.15);
  --ce-L-bg: rgba(52,211,153,.15); --ce-Q-bg: rgba(251,191,36,.15);
  --ce-W-bg: rgba(167,139,250,.15);

  --ce-R-stroke: #f87171; --ce-C-stroke: #60a5fa; --ce-L-stroke: #34d399;
  --ce-Q-stroke: #fbbf24; --ce-W-stroke: #a78bfa;
}
`;

export function themePlugin(): EditorPlugin {
  let ctx: PluginContext;
  let isDark = false;

  function applyTheme() {
    if (isDark) ctx.container.classList.add('ce-dark');
    else ctx.container.classList.remove('ce-dark');
    ctx.emit('theme-changed', isDark ? 'dark' : 'light');
  }

  function toggle() {
    isDark = !isDark;
    applyTheme();
  }

  return {
    name: 'theme',
    install(c) {
      ctx = c;
      ctx.injectCSS('theme', THEME_CSS);

      // Setup container structure
      ctx.container.classList.add('ce-editor');
      // Detect system preference
      if (window.matchMedia?.('(prefers-color-scheme: dark)').matches) {
        isDark = true;
      }
      applyTheme();

      // Create workspace wrapper (toolbar goes before, sidebar goes inside)
      const workspace = document.createElement('div');
      workspace.className = 'ce-workspace';
      ctx.container.appendChild(workspace);

      ctx.on('toggle-theme', () => toggle());
    },
    destroy() {
      ctx?.container?.classList.remove('ce-editor', 'ce-dark');
    },
  };
}
