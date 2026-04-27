export { type EditorPlugin, type PluginContext, type PluginFactory, PluginRegistry } from './types.js';
export { panZoomPlugin, type PanZoomPluginAPI } from './pan-zoom.plugin.js';
export { selectionPlugin } from './selection.plugin.js';
export { contextMenuPlugin } from './context-menu.plugin.js';
export { elementPickerPlugin } from './element-picker.plugin.js';
export { floatingToolbarPlugin } from './floating-toolbar.plugin.js';
export { keyboardPlugin } from './keyboard.plugin.js';
export { toolbarPlugin } from './toolbar.plugin.js';
export { dslPanelPlugin, diagnosticsPlugin, exportPanelPlugin } from './sidebar.plugin.js';
export { themePlugin, THEME_CSS } from './theme.plugin.js';

import type { EditorPlugin } from './types.js';
import { themePlugin } from './theme.plugin.js';
import { panZoomPlugin } from './pan-zoom.plugin.js';
import { selectionPlugin } from './selection.plugin.js';
import { contextMenuPlugin } from './context-menu.plugin.js';
import { elementPickerPlugin } from './element-picker.plugin.js';
import { floatingToolbarPlugin } from './floating-toolbar.plugin.js';
import { keyboardPlugin } from './keyboard.plugin.js';
import { toolbarPlugin } from './toolbar.plugin.js';
import { dslPanelPlugin, diagnosticsPlugin, exportPanelPlugin } from './sidebar.plugin.js';

/** All plugins — full-featured editor */
export function allPlugins(): EditorPlugin[] {
  return [
    themePlugin(),
    panZoomPlugin(),
    selectionPlugin(),
    elementPickerPlugin(),
    contextMenuPlugin(),
    floatingToolbarPlugin(),
    keyboardPlugin(),
    toolbarPlugin(),
    dslPanelPlugin(),
    diagnosticsPlugin(),
    exportPanelPlugin(),
  ];
}

/** Minimal plugins — just canvas interaction */
export function minimalPlugins(): EditorPlugin[] {
  return [
    themePlugin(),
    panZoomPlugin(),
    selectionPlugin(),
    keyboardPlugin(),
  ];
}
