# Vue 3

## Basic Usage

```vue
<template>
  <div>
    <div ref="editorContainer" style="width: 800px; height: 600px;" />
    <pre>{{ dsl }}</pre>
    <button @click="setDsl('R0-C1')">Reset</button>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { createEditor } from 'velo-circuit-editor/adapters/vue'

const editorContainer = ref<HTMLDivElement | null>(null)
const dsl = ref('R0-p(R1,C1)-Wo2')
let editor: EditorInstance | null = null

onMounted(() => {
  if (!editorContainer.value) return

  const { createVueCircuitEditor } = require('velo-circuit-editor/adapters/vue')
  editor = createVueCircuitEditor(editorContainer.value, {
    initialDsl: dsl.value,
    onDslChange: (newDsl: string) => { dsl.value = newDsl },
  })
})

onUnmounted(() => {
  editor?.destroy()
})
</script>
```

## v-model Support

```vue
<template>
  <CircuitEditor v-model="circuitDsl" />
</template>

<script setup lang="ts">
import { ref } from 'vue'
const circuitDsl = ref('R0-C1')
</script>
```

## Mount by ID

```js
import { mountVueCircuitEditor } from 'velo-circuit-editor/adapters/vue'

const editor = mountVueCircuitEditor('editor-container', {
  initialDsl: 'R0-p(R1,C1)-Wo2',
  onDslChange: (dsl) => console.log(dsl),
})
```

## Props

| Prop | Type | Emits | Description |
|------|------|--------|-------------|
| `modelValue` | `string` | `update:modelValue` | v-model bound DSL |
| `initialDsl` | `string` | — | Initial circuit |
| `width` | `number` | — | Canvas width |
| `height` | `number` | — | Canvas height |

---

## Complete Playground Example

This is a complete, copy-pasteable implementation of an interactive playground using the `useCircuitEditor` composable. It mirrors the vanilla playground exactly!

```vue
<template>
  <div class="playground-container" style="display: flex; flex-direction: column; gap: 1rem; padding: 1rem; background: #1e1e1e; color: white; border-radius: 8px;">
    
    <!-- Top Toolbar -->
    <div class="toolbar" style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
      <button @click="appendSeries('R')" :style="btnStyle">Resistor (R)</button>
      <button @click="appendSeries('C')" :style="btnStyle">Capacitor (C)</button>
      <button @click="appendSeries('L')" :style="btnStyle">Inductor (L)</button>
      <div style="flex: 1;"></div>
      <button @click="editorRef?.undo()" :style="btnStyle">Undo</button>
      <button @click="editorRef?.redo()" :style="btnStyle">Redo</button>
    </div>

    <!-- Editor Canvas Container -->
    <div 
      ref="containerRef" 
      style="width: 100%; height: 400px; border: 1px solid #333; border-radius: 4px; overflow: hidden;"
    ></div>

    <!-- State Diagnostics -->
    <div class="diagnostics" style="background: #000; padding: 1rem; border-radius: 4px; font-family: monospace;">
      <strong>Current DSL:</strong> {{ dsl || 'Empty Circuit' }}
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useCircuitEditor } from 'velo-circuit-editor/adapters/vue';

const dsl = ref('R0-p(R1,C1)');

// Initialize the editor with our Vue Composable adapter
const { containerRef, editorRef } = useCircuitEditor({
  value: dsl,
  onDslChange: (newDsl) => {
    dsl.value = newDsl;
  }
});

const appendSeries = (elementCode: string) => {
  if (!editorRef.value) return;
  const current = editorRef.value.getValue();
  editorRef.value.setValue(current ? \`\${current}-\${elementCode}\` : elementCode);
};

const btnStyle = {
  padding: '6px 12px',
  background: '#3a3a3a',
  color: 'white',
  border: '1px solid #555',
  borderRadius: '4px',
  cursor: 'pointer'
};
</script>
```