import type { RenderTheme, ThemeColors } from './symbols.js';

export const DARK_THEME: RenderTheme = {
  colors: {
    stroke: '#f8fafc',
    fill: '#0f172a', // Deeper background for better contrast
    text: '#f1f5f9',
    highlight: '#38bdf8',
    error: '#f87171',
    warning: '#fbbf24',
    grid: '#1e293b',
  },
  strokeWidth: 2.0,
  fontSize: 12,
  fontFamily: 'monospace',
  elementWidth: 80,
  elementHeight: 40,
};

export type ThemeMode = 'light' | 'dark';

export const THEMES: Record<ThemeMode, RenderTheme> = {
  light: {
    colors: {
      stroke: '#1e293b',
      fill: '#ffffff',
      text: '#0f172a',
      highlight: '#3b82f6',
      error: '#ef4444',
      warning: '#f59e0b',
      grid: '#94a3b8', // Much darker grid color for light mode
    },
    strokeWidth: 1.5,
    fontSize: 12,
    fontFamily: 'monospace',
    elementWidth: 80,
    elementHeight: 40,
  },
  dark: DARK_THEME,
};

export function getTheme(mode: ThemeMode): RenderTheme {
  return THEMES[mode] ?? THEMES.light;
}

export function toggleTheme(current: ThemeMode): ThemeMode {
  return current === 'light' ? 'dark' : 'light';
}

export function buildThemeCSS(theme: RenderTheme): string {
  return `
    .circuit-editor {
      --ce-stroke: ${theme.colors.stroke};
      --ce-fill: ${theme.colors.fill};
      --ce-text: ${theme.colors.text};
      --ce-highlight: ${theme.colors.highlight};
      --ce-error: ${theme.colors.error};
      --ce-warning: ${theme.colors.warning};
      --ce-grid: ${theme.colors.grid};
      --ce-stroke-width: ${theme.strokeWidth};
      --ce-font-size: ${theme.fontSize}px;
      --ce-font-family: ${theme.fontFamily};
      --ce-element-width: ${theme.elementWidth}px;
      --ce-element-height: ${theme.elementHeight}px;
      background-color: ${theme.colors.fill};
      color: ${theme.colors.text};
      user-select: none;
    }
    .circuit-node rect { stroke: var(--ce-stroke); fill: var(--ce-fill); }
    .circuit-node:hover rect { stroke: var(--ce-highlight); }
    .circuit-node.selected rect { stroke: var(--ce-highlight); stroke-width: calc(var(--ce-stroke-width) * 1.5); }
    .circuit-node text { fill: var(--ce-text); font-weight: 500; }
    .circuit-connection path { stroke: var(--ce-stroke); fill: none; }
    .circuit-junction circle { fill: var(--ce-stroke); }
    
    /* Element-specific colors for extra wow factor */
    .circuit-node[data-kind="R"] { --ce-R-stroke: #f87171; }
    .circuit-node[data-kind="C"] { --ce-C-stroke: #60a5fa; }
    .circuit-node[data-kind="L"] { --ce-L-stroke: #34d399; }
    .circuit-node[data-kind="Q"] { --ce-Q-stroke: #fbbf24; }
    .circuit-node[data-kind="W"], .circuit-node[data-kind="Ws"], .circuit-node[data-kind="Wo"] { --ce-W-stroke: #a78bfa; --ce-Ws-stroke: #a78bfa; --ce-Wo-stroke: #a78bfa; }
  `.trim();
}