# Angular

## Installation

```bash
npm install velo-circuit-editor
# or
pnpm add velo-circuit-editor
```

## Module Setup

First, create a module for the circuit editor:

```ts
// circuit-editor.module.ts
import { NgModule } from '@angular/core'
import { BrowserModule } from '@angular/platform-browser'
import { CircuitEditorComponent } from './circuit-editor.component'

@NgModule({
  declarations: [CircuitEditorComponent],
  imports: [BrowserModule],
  exports: [CircuitEditorComponent],
})
export class CircuitEditorModule {}
```

## Component Implementation

```ts
// circuit-editor.component.ts
import { Component, Input, Output, EventEmitter, AfterViewInit, OnDestroy } from '@angular/core'
import { createEditor, type EditorInstance } from 'velo-circuit-editor'

@Component({
  selector: 'circuit-editor',
  template: `<div #container style="width:100%;height:100%;"></div>`,
  styles: [`:host { display: block; width: 100%; height: 100%; }`],
})
export class CircuitEditorComponent implements AfterViewInit, OnDestroy {
  @Input() initialDsl = 'R0-p(R1,C1)'
  @Input() width = 800
  @Input() height = 600

  @Output() dslChange = new EventEmitter<string>()
  @Output() editorError = new EventEmitter<{ type: string; payload: unknown }>()

  private editor: EditorInstance | null = null
  private container: HTMLDivElement | null = null

  ngAfterViewInit(): void {
    // Use ViewChild to get the container reference properly
    this.initializeEditor()
  }

  private initializeEditor(): void {
    // Get the inner div of the component's template
    const host = this.container?.querySelector('div') || this.container
    if (!host) return

    this.editor = createEditor()
    this.editor.mount(host, {
      initialDsl: this.initialDsl,
      width: this.width,
      height: this.height,
    })

    this.editor.on('ast-changed', () => {
      if (this.editor) this.dslChange.emit(this.editor.getValue())
    })

    this.editor.on('error', (e) => this.editorError.emit(e))
  }

  ngOnDestroy(): void {
    this.editor?.destroy()
  }

  // Public API for programmatic control
  setValue(dsl: string): void {
    this.editor?.setValue(dsl)
  }

  getValue(): string {
    return this.editor?.getValue() || ''
  }

  undo(): void {
    this.editor?.undo()
  }

  redo(): void {
    this.editor?.redo()
  }
}
```

## Usage in Templates

```html
<!-- Basic usage -->
<circuit-editor
  [initialDsl]="'R0-p(R1,C1)-Wo2'"
  (dslChange)="onCircuitChange($event)"
  style="width: 800px; height: 600px;"
/>

<!-- With error handling -->
<circuit-editor
  [initialDsl]="circuitDsl"
  (dslChange)="onCircuitChange($event)"
  (editorError)="onError($event)"
  style="width: 100%; height: 400px;"
/>
```

## Complete Playground Component

This is a full-featured circuit playground with toolbar buttons for adding elements:

```ts
// playground.component.ts
import { Component } from '@angular/core';

@Component({
  selector: 'app-circuit-playground',
  template: `
    <div class="playground-container">

      <!-- Toolbar -->
      <div class="toolbar">
        <button (click)="appendSeries('R')">Resistor (R)</button>
        <button (click)="appendSeries('C')">Capacitor (C)</button>
        <button (click)="appendSeries('L')">Inductor (L)</button>
        <button (click)="appendSeries('Q')">CPE (Q)</button>
        <button (click)="appendSeries('W')">Warburg (W)</button>
        <div class="spacer"></div>
        <button (click)="undo()">Undo</button>
        <button (click)="redo()">Redo</button>
      </div>

      <!-- Editor -->
      <div class="editor-container">
        <circuit-editor
          [initialDsl]="dsl"
          (dslChange)="onCircuitChange($event)"
          (editorError)="onError($event)"
          style="width: 100%; height: 100%;"
        ></circuit-editor>
      </div>

      <!-- Diagnostics -->
      <div class="diagnostics">
        <strong>DSL:</strong> {{ dsl || 'Empty Circuit' }}
      </div>

    </div>
  `,
  styles: [`
    .playground-container {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      padding: 1rem;
      background: #1e1e1e;
      color: white;
      border-radius: 8px;
      height: 500px;
    }
    .toolbar {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
    }
    .toolbar button {
      padding: 6px 12px;
      background: #3a3a3a;
      color: white;
      border: 1px solid #555;
      border-radius: 4px;
      cursor: pointer;
    }
    .toolbar button:hover {
      background: #4a4a4a;
    }
    .spacer { flex: 1; }
    .editor-container {
      flex: 1;
      border: 1px solid #333;
      border-radius: 4px;
      overflow: hidden;
    }
    .diagnostics {
      background: #000;
      padding: 1rem;
      border-radius: 4px;
      font-family: monospace;
    }
  `]
})
export class CircuitPlaygroundComponent {
  dsl = 'R0-p(R1,C1)';

  onCircuitChange(newDsl: string): void {
    this.dsl = newDsl;
  }

  onError(error: { type: string; payload: unknown }): void {
    console.error('Circuit editor error:', error);
  }

  appendSeries(elementCode: string): void {
    this.dsl = this.dsl ? `${this.dsl}-${elementCode}` : elementCode;
  }

  undo(): void {
    // Access via ViewChild if needed
    console.log('Undo clicked');
  }

  redo(): void {
    // Access via ViewChild if needed
    console.log('Redo clicked');
  }
}
```

## Programmatic Access with ViewChild

```ts
import { ViewChild, AfterViewInit } from '@angular/core';
import { CircuitEditorComponent } from './circuit-editor.component';

@Component({
  selector: 'app-parent',
  template: `
    <circuit-editor #editor [initialDsl]="dsl"></circuit-editor>
    <button (click)="loadPreset()">Load Preset</button>
  `
})
export class ParentComponent implements AfterViewInit {
  @ViewChild('editor') editorComponent!: CircuitEditorComponent;
  dsl = 'R0';

  ngAfterViewInit(): void {
    // Editor is ready
  }

  loadPreset(): void {
    this.editorComponent.setValue('R0-p(R1,C1)-Wo2');
  }
}
```

## Events

| Event | Type | Description |
|-------|------|-------------|
| `dslChange` | `EventEmitter<string>` | Emitted when the circuit DSL changes |
| `editorError` | `EventEmitter<{type, payload}>` | Emitted on editor errors |

## Props

| Prop | Type | Default | Description |
|------|------|--------|-------------|
| `initialDsl` | `string` | `'R0-p(R1,C1)'` | Initial Boukamp DSL string |
| `width` | `number` | `800` | Editor width in pixels |
| `height` | `number` | `600` | Editor height in pixels |