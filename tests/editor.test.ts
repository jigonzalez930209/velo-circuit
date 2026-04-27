import { describe, it, expect } from 'vitest';
import { createEditor } from '../src/core/editor/index.js';
import { renderDslToSvg, validate } from '../src/core/index.js';

describe('editor', () => {
  it('creates an editor instance', () => {
    const editor = createEditor();
    expect(editor).toBeDefined();
    expect(typeof editor.mount).toBe('function');
    expect(typeof editor.destroy).toBe('function');
    expect(typeof editor.getValue).toBe('function');
    expect(typeof editor.setValue).toBe('function');
    expect(typeof editor.on).toBe('function');
    expect(typeof editor.undo).toBe('function');
    expect(typeof editor.redo).toBe('function');
  });

  it('starts with a default element', () => {
    const editor = createEditor();
    const dsl = editor.getValue();
    expect(dsl).toBeTruthy();
  });

  it('parses and renders a Boukamp string', () => {
    const editor = createEditor();
    editor.setValue('R0-p(R1,C1)-Wo2');
    const dsl = editor.getValue();
    expect(dsl).toBe('R0-p(R1,C1)-Wo2');
  });

  it('emits mount event when mounted', () => {
    const editor = createEditor();
    let mounted = false;
    editor.on('mount', () => { mounted = true; });

    const container = { innerHTML: '' } as unknown as HTMLElement;
    editor.mount(container);
    expect(mounted).toBe(true);
  });

  it('round-trips a valid DSL without losing info', () => {
    const editor = createEditor();
    editor.setValue('R0-C1-L2');
    const dsl = editor.getValue();
    expect(dsl).toBe('R0-C1-L2');
  });
});

describe('Standalone SVG API', () => {
  it('renderDslToSvg generates a valid cropped SVG string', () => {
    const res = validate('R1-C2');
    console.log('VALIDATION RESULT:', JSON.stringify(res, null, 2));

    const svg = renderDslToSvg('R1-C2');
    expect(svg).toContain('<svg');
    expect(svg).toContain('viewBox=');
    expect(svg).toContain('data-element-id="R1"');
    expect(svg).toContain('data-element-id="C2"');
  });

  it('renderDslToSvg handles invalid DSL gracefully', () => {
    const svg = renderDslToSvg('invalid:::');
    expect(svg).toBe('');
  });
});