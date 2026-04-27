import { describe, it, expect, beforeEach, vi } from 'vitest';
import { allPlugins, minimalPlugins } from '../src/core/plugins/index.js';

describe('plugins system', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    container.remove();
  });

  it('allPlugins returns an array of plugins', () => {
    const plugins = allPlugins();
    expect(Array.isArray(plugins)).toBe(true);
    expect(plugins.length).toBeGreaterThan(0);
  });

  it('minimalPlugins returns an array of plugins', () => {
    const plugins = minimalPlugins();
    expect(Array.isArray(plugins)).toBe(true);
    expect(plugins.length).toBeGreaterThan(0);
  });

  it('allPlugins includes theme, pan-zoom, selection, and other plugins', () => {
    const plugins = allPlugins();
    const names = plugins.map(p => p.name);
    expect(names).toContain('theme');
    expect(names).toContain('pan-zoom');
    expect(names).toContain('selection');
  });

  it('minimalPlugins includes theme, pan-zoom, selection, keyboard', () => {
    const plugins = minimalPlugins();
    const names = plugins.map(p => p.name);
    expect(names).toContain('theme');
    expect(names).toContain('pan-zoom');
    expect(names).toContain('selection');
    expect(names).toContain('keyboard');
  });

  it('each plugin has a name, install and destroy methods', () => {
    const plugins = allPlugins();
    for (const plugin of plugins) {
      expect(plugin).toHaveProperty('name');
      expect(typeof plugin.name).toBe('string');
      expect(typeof plugin.install).toBe('function');
      expect(typeof plugin.destroy).toBe('function');
    }
  });

  it('plugins can be instantiated multiple times', () => {
    const plugins1 = allPlugins();
    const plugins2 = allPlugins();
    // Each call returns fresh plugin instances
    expect(plugins1).not.toBe(plugins2);
    expect(plugins1.length).toBe(plugins2.length);
  });

  it('pan-zoom plugin is included in allPlugins', () => {
    const plugins = allPlugins();
    const panZoom = plugins.find(p => p.name === 'pan-zoom');
    expect(panZoom).toBeDefined();
  });

  it('toolbar plugin is included in allPlugins', () => {
    const plugins = allPlugins();
    const toolbar = plugins.find(p => p.name === 'toolbar');
    expect(toolbar).toBeDefined();
  });

  it('context menu plugin is included in allPlugins', () => {
    const plugins = allPlugins();
    const contextMenu = plugins.find(p => p.name === 'context-menu');
    expect(contextMenu).toBeDefined();
  });

  it('element picker plugin is included in allPlugins', () => {
    const plugins = allPlugins();
    const picker = plugins.find(p => p.name === 'element-picker');
    expect(picker).toBeDefined();
  });

  it('sidebar plugins (dsl-panel, diagnostics, export-panel) are included', () => {
    const plugins = allPlugins();
    const names = plugins.map(p => p.name);
    expect(names).toContain('dsl-panel');
    expect(names).toContain('diagnostics');
    expect(names).toContain('export-panel');
  });
});