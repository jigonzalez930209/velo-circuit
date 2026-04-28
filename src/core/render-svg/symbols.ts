import type { CircuitNode, ElementKind } from '../domain/circuit.js';
import { ELEMENT_KINDS } from '../domain/circuit.js';

export interface ThemeColors {
  stroke: string;
  fill: string;
  text: string;
  highlight: string;
  error: string;
  warning: string;
  grid: string;
}

export interface RenderTheme {
  colors: ThemeColors;
  strokeWidth: number;
  fontSize: number;
  fontFamily: string;
  elementWidth: number;
  elementHeight: number;
}

export const DEFAULT_THEME: RenderTheme = {
  colors: {
    stroke: 'var(--ce-text, #1a1a2e)',
    fill: 'var(--ce-surface, #ffffff)',
    text: 'var(--ce-text, #16213e)',
    highlight: 'var(--ce-accent, #4cc9f0)',
    error: 'var(--ce-error, #e63946)',
    warning: 'var(--ce-warn, #f4a261)',
    grid: 'var(--ce-border, #e0e0e0)',
  },
  strokeWidth: 2.5,
  fontSize: 12,
  fontFamily: 'monospace',
  elementWidth: 80,
  elementHeight: 40,
};

/**
 * Standard electrical schematic symbols as SVG.
 * All symbols fit within a 80×40 viewBox with connection terminals at (0,20) and (80,20).
 */
export function buildSvgElementSymbol(kind: ElementKind, theme: RenderTheme): string {
  const label = ELEMENT_KINDS.get(kind)?.label ?? String(kind);
  const { strokeWidth, fontSize, fontFamily, colors } = theme;
  const sw = strokeWidth;
  const kindStroke = `var(--ce-${kind}-stroke, ${colors.stroke})`;

  switch (kind) {
    // ─── Resistor: zigzag (American standard) ───
    case 'R' as ElementKind: {
      return `<g>
        <line x1="0" y1="20" x2="15" y2="20" stroke="${kindStroke}" stroke-width="${sw}" />
        <polyline points="15,20 20,8 26,32 32,8 38,32 44,8 50,32 56,8 62,32 65,20"
          stroke="${kindStroke}" stroke-width="${sw}" fill="none" stroke-linejoin="round" />
        <line x1="65" y1="20" x2="80" y2="20" stroke="${kindStroke}" stroke-width="${sw}" />
      </g>`;
    }

    // ─── Capacitor: two parallel plates ───
    case 'C' as ElementKind: {
      return `<g>
        <line x1="0" y1="20" x2="35" y2="20" stroke="${kindStroke}" stroke-width="${sw}" />
        <line x1="35" y1="6" x2="35" y2="34" stroke="${kindStroke}" stroke-width="${sw * 1.8}" />
        <line x1="45" y1="6" x2="45" y2="34" stroke="${kindStroke}" stroke-width="${sw * 1.8}" />
        <line x1="45" y1="20" x2="80" y2="20" stroke="${kindStroke}" stroke-width="${sw}" />
      </g>`;
    }

    // ─── Inductor: semicircular coils (4 bumps) ───
    case 'L' as ElementKind: {
      return `<g>
        <line x1="0" y1="20" x2="16" y2="20" stroke="${kindStroke}" stroke-width="${sw}" />
        <path d="M16,20 A6,6 0 0 1 28,20 A6,6 0 0 1 40,20 A6,6 0 0 1 52,20 A6,6 0 0 1 64,20"
          stroke="${kindStroke}" stroke-width="${sw}" fill="none" />
        <line x1="64" y1="20" x2="80" y2="20" stroke="${kindStroke}" stroke-width="${sw}" />
      </g>`;
    }

    // ─── CPE (Q): angled capacitor plate + straight plate ───
    case 'Q' as ElementKind: {
      return `<g>
        <line x1="0" y1="20" x2="35" y2="20" stroke="${kindStroke}" stroke-width="${sw}" />
        <line x1="35" y1="6" x2="35" y2="34" stroke="${kindStroke}" stroke-width="${sw * 1.8}" />
        <line x1="45" y1="10" x2="41" y2="30" stroke="${kindStroke}" stroke-width="${sw * 1.6}" />
        <line x1="45" y1="20" x2="80" y2="20" stroke="${kindStroke}" stroke-width="${sw}" />
        <text x="40" y="4" text-anchor="middle" font-size="${fontSize * 0.7}" font-family="${fontFamily}" fill="${kindStroke}" font-style="italic">n</text>
      </g>`;
    }

    // ─── Warburg Infinite (W): 45° diagonal line ───
    case 'W' as ElementKind: {
      return `<g>
        <line x1="0" y1="20" x2="25" y2="20" stroke="${kindStroke}" stroke-width="${sw}" />
        <line x1="25" y1="32" x2="55" y2="8" stroke="${kindStroke}" stroke-width="${sw * 1.4}" />
        <line x1="25" y1="8" x2="25" y2="32" stroke="${kindStroke}" stroke-width="${sw}" />
        <line x1="55" y1="20" x2="80" y2="20" stroke="${kindStroke}" stroke-width="${sw}" />
      </g>`;
    }

    // ─── Warburg Short (Ws): Warburg with short-circuit bar at end ───
    case 'Ws' as ElementKind: {
      return `<g>
        <line x1="0" y1="20" x2="22" y2="20" stroke="${kindStroke}" stroke-width="${sw}" />
        <line x1="22" y1="32" x2="52" y2="8" stroke="${kindStroke}" stroke-width="${sw * 1.4}" />
        <line x1="22" y1="8" x2="22" y2="32" stroke="${kindStroke}" stroke-width="${sw}" />
        <line x1="52" y1="8" x2="52" y2="32" stroke="${kindStroke}" stroke-width="${sw}" />
        <line x1="52" y1="20" x2="80" y2="20" stroke="${kindStroke}" stroke-width="${sw}" />
        <text x="37" y="38" text-anchor="middle" font-size="${fontSize * 0.65}" font-family="${fontFamily}" fill="${kindStroke}">s</text>
      </g>`;
    }

    // ─── Warburg Open (Wo): Warburg with open bar at end ───
    case 'Wo' as ElementKind: {
      return `<g>
        <line x1="0" y1="20" x2="22" y2="20" stroke="${kindStroke}" stroke-width="${sw}" />
        <line x1="22" y1="32" x2="52" y2="8" stroke="${kindStroke}" stroke-width="${sw * 1.4}" />
        <line x1="22" y1="8" x2="22" y2="32" stroke="${kindStroke}" stroke-width="${sw}" />
        <line x1="48" y1="8" x2="56" y2="8" stroke="${kindStroke}" stroke-width="${sw}" />
        <line x1="48" y1="32" x2="56" y2="32" stroke="${kindStroke}" stroke-width="${sw}" />
        <line x1="52" y1="20" x2="80" y2="20" stroke="${kindStroke}" stroke-width="${sw}" />
        <text x="37" y="38" text-anchor="middle" font-size="${fontSize * 0.65}" font-family="${fontFamily}" fill="${kindStroke}">o</text>
      </g>`;
    }

    // ─── Gerischer (G): diffusion-reaction element ───
    case 'G' as ElementKind: {
      return `<g>
        <line x1="0" y1="20" x2="14" y2="20" stroke="${kindStroke}" stroke-width="${sw}" />
        <rect x="14" y="8" width="52" height="24" stroke="${kindStroke}" stroke-width="${sw}" fill="${colors.fill}" rx="4" />
        <path d="M22,26 C30,12 38,28 46,14 C50,10 54,10 58,14"
          stroke="${kindStroke}" stroke-width="${sw * 0.9}" fill="none" />
        <text x="40" y="24" text-anchor="middle" font-size="${fontSize * 0.8}" font-family="${fontFamily}" fill="${kindStroke}">G</text>
        <line x1="66" y1="20" x2="80" y2="20" stroke="${kindStroke}" stroke-width="${sw}" />
      </g>`;
    }

    // ─── Parallel Diffusion Warburg (Pdw): paired diffusion paths ───
    case 'Pdw' as ElementKind: {
      return `<g>
        <line x1="0" y1="20" x2="14" y2="20" stroke="${kindStroke}" stroke-width="${sw}" />
        <line x1="14" y1="10" x2="24" y2="10" stroke="${kindStroke}" stroke-width="${sw}" />
        <line x1="14" y1="30" x2="24" y2="30" stroke="${kindStroke}" stroke-width="${sw}" />
        <line x1="24" y1="18" x2="48" y2="6" stroke="${kindStroke}" stroke-width="${sw * 1.1}" />
        <line x1="24" y1="34" x2="48" y2="22" stroke="${kindStroke}" stroke-width="${sw * 1.1}" />
        <line x1="48" y1="10" x2="66" y2="10" stroke="${kindStroke}" stroke-width="${sw}" />
        <line x1="48" y1="30" x2="66" y2="30" stroke="${kindStroke}" stroke-width="${sw}" />
        <line x1="66" y1="20" x2="80" y2="20" stroke="${kindStroke}" stroke-width="${sw}" />
        <text x="40" y="22" text-anchor="middle" font-size="${fontSize * 0.65}" font-family="${fontFamily}" fill="${kindStroke}">PDW</text>
      </g>`;
    }

    // ─── Fallback: generic box ───
    default: {
      return `<g>
        <rect x="10" y="5" width="60" height="30" stroke="${kindStroke}" stroke-width="${sw}" fill="${colors.fill}" rx="2" />
        <text x="40" y="24" text-anchor="middle" font-size="${fontSize}" font-family="${fontFamily}" fill="${kindStroke}">${label}</text>
      </g>`;
    }
  }
}

/** Junction dot used at parallel branch points */
export function buildJunctionDot(x: number, y: number, theme: RenderTheme): string {
  return `<circle cx="${x}" cy="${y}" r="3" fill="${theme.colors.stroke}" />`;
}

export function buildParallelSymbol(theme: RenderTheme): string {
  const { strokeWidth, colors } = theme;
  return `<g>
    <line x1="0" y1="20" x2="20" y2="20" stroke="${colors.stroke}" stroke-width="${strokeWidth}" />
    <line x1="20" y1="5" x2="20" y2="35" stroke="${colors.stroke}" stroke-width="${strokeWidth}" />
    <line x1="20" y1="10" x2="100" y2="10" stroke="${colors.stroke}" stroke-width="${strokeWidth}" stroke-dasharray="4,2" />
    <line x1="20" y1="30" x2="100" y2="30" stroke="${colors.stroke}" stroke-width="${strokeWidth}" stroke-dasharray="4,2" />
    <line x1="100" y1="5" x2="100" y2="35" stroke="${colors.stroke}" stroke-width="${strokeWidth}" />
    <line x1="100" y1="20" x2="120" y2="20" stroke="${colors.stroke}" stroke-width="${strokeWidth}" />
    <text x="60" y="23" text-anchor="middle" font-size="10" font-family="monospace" fill="${colors.text}">∥</text>
  </g>`;
}

export function buildSeriesSymbol(theme: RenderTheme): string {
  const { strokeWidth, colors } = theme;
  return `<g>
    <line x1="0" y1="20" x2="120" y2="20" stroke="${colors.stroke}" stroke-width="${strokeWidth}" />
    <text x="60" y="23" text-anchor="middle" font-size="10" font-family="monospace" fill="${colors.text}">—</text>
  </g>`;
}