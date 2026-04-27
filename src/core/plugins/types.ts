import type { EditorInstance } from '../editor/core.js';

// ──── Plugin Interface ────

export interface EditorPlugin {
  /** Unique plugin name */
  readonly name: string;
  /** Install plugin into the editor. Called during mount(). */
  install(ctx: PluginContext): void;
  /** Cleanup DOM, listeners, etc. Called during destroy(). */
  destroy(): void;
}

export interface PluginContext {
  editor: EditorInstance;
  container: HTMLElement;
  /** Get another installed plugin by name */
  getPlugin<T extends EditorPlugin>(name: string): T | null;
  /** Inject scoped CSS (idempotent — only injects once per id) */
  injectCSS(id: string, css: string): void;
  /** Create and append a DOM element to the container */
  createLayer(className: string, position?: 'prepend' | 'append'): HTMLDivElement;
  /** Emit a custom plugin event */
  emit(event: string, data?: unknown): void;
  /** Listen for a custom plugin event */
  on(event: string, handler: (data?: unknown) => void): () => void;
}

// ──── Plugin Registry ────

export class PluginRegistry {
  private plugins: EditorPlugin[] = [];
  private pluginMap = new Map<string, EditorPlugin>();
  private eventHandlers = new Map<string, Set<(data?: unknown) => void>>();
  private injectedCSS = new Set<string>();

  register(plugin: EditorPlugin): void {
    this.plugins.push(plugin);
    this.pluginMap.set(plugin.name, plugin);
  }

  getPlugin<T extends EditorPlugin>(name: string): T | null {
    return (this.pluginMap.get(name) as T) ?? null;
  }

  createContext(editor: EditorInstance, container: HTMLElement): PluginContext {
    const self = this;
    return {
      editor,
      container,
      getPlugin: <T extends EditorPlugin>(name: string) => self.getPlugin<T>(name),
      injectCSS: (id: string, css: string) => {
        if (self.injectedCSS.has(id)) return;
        self.injectedCSS.add(id);
        const style = document.createElement('style');
        style.setAttribute('data-ce-plugin', id);
        style.textContent = css;
        document.head.appendChild(style);
      },
      createLayer: (className: string, position: 'prepend' | 'append' = 'append') => {
        const div = document.createElement('div');
        div.className = className;
        if (position === 'prepend') container.prepend(div);
        else container.appendChild(div);
        return div;
      },
      emit: (event: string, data?: unknown) => {
        self.eventHandlers.get(event)?.forEach(h => h(data));
      },
      on: (event: string, handler: (data?: unknown) => void) => {
        if (!self.eventHandlers.has(event)) self.eventHandlers.set(event, new Set());
        self.eventHandlers.get(event)!.add(handler);
        return () => self.eventHandlers.get(event)?.delete(handler);
      },
    };
  }

  installAll(editor: EditorInstance, container: HTMLElement): void {
    const ctx = this.createContext(editor, container);
    for (const plugin of this.plugins) {
      plugin.install(ctx);
    }
  }

  destroyAll(): void {
    for (const plugin of [...this.plugins].reverse()) {
      plugin.destroy();
    }
    // Remove injected CSS
    for (const id of this.injectedCSS) {
      document.querySelector(`style[data-ce-plugin="${id}"]`)?.remove();
    }
    this.plugins = [];
    this.pluginMap.clear();
    this.eventHandlers.clear();
    this.injectedCSS.clear();
  }
}

// ──── Plugin factory helper ────
export type PluginFactory<T extends EditorPlugin = EditorPlugin> = () => T;
