# Svelte

## Component

```svelte
<script>
  import { onMount, onDestroy } from 'svelte'
  import { createSvelteCircuitEditor } from 'velo-circuit-editor/adapters/svelte'

  export let initialDsl = 'R0-p(R1,C1)'
  export let width = 800
  export let height = 600

  let container: HTMLDivElement
  let editor: ReturnType<typeof createSvelteCircuitEditor> | null = null

  onMount(() => {
    editor = createSvelteCircuitEditor(container, {
      initialDsl,
      width,
      height,
    })
  })

  onDestroy(() => {
    editor?.destroy()
  })
</script>

<div bind:this={container} style="width:{width}px; height:{height}px;" />
```

## Dispatcher Events

```svelte
<script>
  import { onMount } from 'svelte'
  import { createSvelteCircuitEditor } from 'velo-circuit-editor/adapters/svelte'

  let dsl = 'R0-p(R1,C1)-Wo2'
  let errors: string[] = []

  onMount(() => {
    const editor = createSvelteCircuitEditor(container, {
      initialDsl: dsl,
    })

    container.addEventListener('change', (e) => {
      dsl = (e as CustomEvent<string>).detail
    })

    container.addEventListener('error', (e) => {
      errors = [...errors, (e as CustomEvent).detail.message]
    })
  })
</script>

<pre>{dsl}</pre>
{#each errors as err}
  <p style="color:red">{err}</p>
{/each}
<div bind:this={container} />
```

## Two-Way Binding

```svelte
<script>
  export let dsl = 'R0-C1'

  import { onMount } from 'svelte'
  import { createSvelteCircuitEditor } from 'velo-circuit-editor/adapters/svelte'

  let container: HTMLDivElement

  onMount(() => {
    const editor = createSvelteCircuitEditor(container, {
      initialDsl: dsl,
    })

    container.addEventListener('change', (e) => {
      dsl = (e as CustomEvent<string>).detail
    })
  })
</script>

<input bind:value={dsl} />
<div bind:this={container} />
```

## Reactive Update

```svelte
$: if (editor && dsl !== editor.getValue()) {
  editor.setValue(dsl)
}
```

---

## Complete Playground Example

This is a complete, copy-pasteable implementation of an interactive playground using the `circuitEditor` Svelte Action. It mirrors the vanilla playground exactly!

```svelte
<script lang="ts">
  import { circuitEditor } from 'velo-circuit-editor/adapters/svelte';
  
  let dsl = 'R0-p(R1,C1)';
  let editorNode: HTMLElement;
  let editorInstance: any;

  function handleDslChange(e: CustomEvent<string>) {
    dsl = e.detail;
  }

  function appendSeries(elementCode: string) {
    // The action doesn't expose the instance directly to Svelte state easily,
    // but the node itself might have access or we can just update Svelte state.
    dsl = dsl ? \`\${dsl}-\${elementCode}\` : elementCode;
  }
</script>

<div class="playground-container" style="display: flex; flex-direction: column; gap: 1rem; padding: 1rem; background: #1e1e1e; color: white; border-radius: 8px;">
  
  <!-- Top Toolbar -->
  <div class="toolbar" style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
    <button on:click={() => appendSeries('R')} class="btn">Resistor (R)</button>
    <button on:click={() => appendSeries('C')} class="btn">Capacitor (C)</button>
    <button on:click={() => appendSeries('L')} class="btn">Inductor (L)</button>
  </div>

  <!-- Editor Canvas Container -->
  <div 
    use:circuitEditor={{ value: dsl }}
    on:change={handleDslChange}
    style="width: 100%; height: 400px; border: 1px solid #333; border-radius: 4px; overflow: hidden;"
  ></div>

  <!-- State Diagnostics -->
  <div class="diagnostics" style="background: #000; padding: 1rem; border-radius: 4px; font-family: monospace;">
    <strong>Current DSL:</strong> {dsl || 'Empty Circuit'}
  </div>

</div>

<style>
  .btn {
    padding: 6px 12px;
    background: #3a3a3a;
    color: white;
    border: 1px solid #555;
    border-radius: 4px;
    cursor: pointer;
  }
</style>
```