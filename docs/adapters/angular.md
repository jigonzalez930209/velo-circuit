# Angular

## Module Setup

```ts
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

## Component

```ts
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

  ngAfterViewInit(): void {
    const host = document.querySelector('circuit-editor > div') as HTMLDivElement
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
}
```

## Usage

```html
<circuit-editor
  [initialDsl]="'R0-p(R1,C1)-Wo2'"
  (dslChange)="onCircuitChange($event)"
  (editorError)="onError($event)"
  style="width: 800px; height: 600px;"
/>
```

## Programmatic Access

Inject via a service or `@ViewChild`:

```ts
@ViewChild(CircuitEditorComponent) editor!: CircuitEditorComponent

@ViewChild(CircuitEditorComponent) editor!: CircuitEditorComponent

ngAfterViewInit() {
  // Can be called manually if needed
  // this.editor.editor.setValue('R0-C1')
}
```

---

## Complete Playground Example

This is a complete, copy-pasteable implementation of an interactive playground using the Angular Adapter. It mirrors the vanilla playground exactly!

### `playground.component.ts`

```ts
import { Component } from '@angular/core';

@Component({
  selector: 'app-circuit-playground',
  template: \`
    <div class="playground-container" style="display: flex; flex-direction: column; gap: 1rem; padding: 1rem; background: #1e1e1e; color: white; border-radius: 8px;">
      
      <!-- Top Toolbar -->
      <div class="toolbar" style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
        <button (click)="appendSeries('R')" class="btn">Resistor (R)</button>
        <button (click)="appendSeries('C')" class="btn">Capacitor (C)</button>
        <button (click)="appendSeries('L')" class="btn">Inductor (L)</button>
      </div>

      <!-- Editor Canvas Container -->
      <div style="width: 100%; height: 400px; border: 1px solid #333; border-radius: 4px; overflow: hidden;">
        <circuit-editor
          [initialDsl]="dsl"
          (dslChange)="onCircuitChange($event)"
          style="width: 100%; height: 100%;"
        ></circuit-editor>
      </div>

      <!-- State Diagnostics -->
      <div class="diagnostics" style="background: #000; padding: 1rem; border-radius: 4px; font-family: monospace;">
        <strong>Current DSL:</strong> {{ dsl || 'Empty Circuit' }}
      </div>

    </div>
  \`,
  styles: [\`
    .btn {
      padding: 6px 12px;
      background: #3a3a3a;
      color: white;
      border: 1px solid #555;
      border-radius: 4px;
      cursor: pointer;
    }
  \`]
})
export class CircuitPlaygroundComponent {
  dsl = 'R0-p(R1,C1)';

  onCircuitChange(newDsl: string) {
    this.dsl = newDsl;
  }

  appendSeries(elementCode: string) {
    // In Angular, we can use two-way binding or update the view child directly.
    this.dsl = this.dsl ? \`\${this.dsl}-\${elementCode}\` : elementCode;
  }
}
```