# React

## useCircuitEditor Hook

```tsx
import { useCircuitEditor } from 'velo-circuit-editor/adapters/react'

function CircuitEditor({ initialDsl = 'R0-p(R1,C1)' }: { initialDsl?: string }) {
  const containerRef = { current: null } as React.RefObject<HTMLDivElement>
  const editorRef = { current: null } as { current: EditorInstance | null }

  useEffect(() => {
    if (!containerRef.current || editorRef.current) return

    const { createEditor } = require('velo-circuit-editor')
    const editor = createEditor()
    editor.mount(containerRef.current, { initialDsl })

    editor.on('ast-changed', () => {
      // trigger re-render
    })

    editorRef.current = editor

    return () => editor.destroy()
  }, [])

  return <div ref={containerRef} style={{ width: 800, height: 600 }} />
}
```

## Controlled Component

```tsx
import { useState } from 'react'

function ControlledEditor({ value, onChange }) {
  const containerRef = useRef(null)
  const editorRef = useRef(null)

  useEffect(() => {
    if (!containerRef.current) return

    const { createEditor } = require('velo-circuit-editor')
    const editor = createEditor()
    editor.mount(containerRef.current, { initialDsl: value })

    editor.on('ast-changed', () => {
      onChange(editor.getValue())
    })

    editorRef.current = editor

    return () => editor.destroy()
  }, [])

  useEffect(() => {
    if (editorRef.current && value !== editorRef.current.getValue()) {
      editorRef.current.setValue(value)
    }
  }, [value])

  return <div ref={containerRef} />
}
```

## Controlled + Uncontrolled

```tsx
function CircuitEditor({
  defaultValue = 'R0-p(R1,C1)',
  value,
  onChange,
}: {
  defaultValue?: string
  value?: string
  onChange?: (dsl: string) => void
}) {
  // controlled if value is provided, uncontrolled otherwise
  const [internalValue, setInternalValue] = useState(defaultValue)
  const dsl = value ?? internalValue

  return (
    <div ref={useRef(null)} onMount={(el) => {
      const { createEditor } = require('velo-circuit-editor')
      const editor = createEditor()
      editor.mount(el, { initialDsl: dsl })
      editor.on('ast-changed', () => {
        const next = editor.getValue()
        setInternalValue(next)
        onChange?.(next)
      })
    }} />
  )
}
```

## Props

| `onEvent` | `(e: EditorEvent) => void` | Global event handler |

---

## Complete Playground Example

This is a complete, copy-pasteable implementation of an interactive playground using the `useCircuitEditor` hook. It mirrors the vanilla playground exactly!

```tsx
import React, { useState } from 'react';
import { useCircuitEditor } from 'velo-circuit-editor/adapters/react';

export default function CircuitPlayground() {
  const [dsl, setDsl] = useState('R0-p(R1,C1)');
  
  // Initialize the editor with our React Hook adapter
  const { containerRef, editorRef } = useCircuitEditor({
    value: dsl,
    onChange: (newDsl) => setDsl(newDsl)
  });

  const appendSeries = (elementCode: string) => {
    if (!editorRef.current) return;
    const current = editorRef.current.getValue();
    editorRef.current.setValue(current ? \`\${current}-\${elementCode}\` : elementCode);
  };

  return (
    <div className="playground-container" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1rem', background: '#1e1e1e', color: 'white', borderRadius: '8px' }}>
      
      {/* Top Toolbar */}
      <div className="toolbar" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        <button onClick={() => appendSeries('R')} style={btnStyle}>Resistor (R)</button>
        <button onClick={() => appendSeries('C')} style={btnStyle}>Capacitor (C)</button>
        <button onClick={() => appendSeries('L')} style={btnStyle}>Inductor (L)</button>
        <div style={{ flex: 1 }}></div>
        <button onClick={() => editorRef.current?.undo()} style={btnStyle}>Undo</button>
        <button onClick={() => editorRef.current?.redo()} style={btnStyle}>Redo</button>
      </div>

      {/* Editor Canvas Container */}
      <div 
        ref={containerRef} 
        style={{ width: '100%', height: '400px', border: '1px solid #333', borderRadius: '4px', overflow: 'hidden' }}
      />

      {/* State Diagnostics */}
      <div className="diagnostics" style={{ background: '#000', padding: '1rem', borderRadius: '4px', fontFamily: 'monospace' }}>
        <strong>Current DSL:</strong> {dsl || 'Empty Circuit'}
      </div>

    </div>
  );
}

const btnStyle = {
  padding: '6px 12px',
  background: '#3a3a3a',
  color: 'white',
  border: '1px solid #555',
  borderRadius: '4px',
  cursor: 'pointer'
};
```