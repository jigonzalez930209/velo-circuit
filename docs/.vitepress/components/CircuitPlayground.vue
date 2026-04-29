<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useData } from 'vitepress';
import type { CircuitExample } from '../theme/circuits';
import { sampleCircuits } from '../theme/circuits';
import VanillaPreview from './VanillaPreview.vue';
import ReactPreview from './ReactPreview.vue';
import VuePreview from './VuePreview.vue';
import SveltePreview from './SveltePreview.vue';
import AngularPreview from './AngularPreview.vue';
import AstroPreview from './AstroPreview.vue';

const props = withDefaults(defineProps<{
  circuits?: CircuitExample[];
  initialCircuit?: string;
  title?: string;
  height?: string;
}>(), {
  title: 'Circuit Playground',
  height: 'calc(100dvh - var(--vp-nav-height, 64px) - 24px)',
});

const { isDark } = useData();
const activeCircuit = ref(props.initialCircuit || 'randles');
const dslInput = ref('');
const diagnosticsOutput = ref<{ type: string; message: string }[]>([]);
const activeTab = ref('preview');
const framework = ref('react');
const activePreviewRef = ref<any>(null);

const circuitsList = computed(() => props.circuits || sampleCircuits);

// Map tabs to preview components
const previewComponents: Record<string, any> = {
  preview: VanillaPreview,
  vanilla: VanillaPreview,
  react: ReactPreview,
  vue: VuePreview,
  svelte: SveltePreview,
  angular: AngularPreview,
  astro: AstroPreview,
};

const currentPreview = computed(() => previewComponents[activeTab.value] || VanillaPreview);

const frameworkCode = {
  react: `import React, { useState } from 'react';
import { useCircuitEditor } from 'velo-circuit/react';

export default function CircuitPlayground() {
  const [dsl, setDsl] = useState('${dslInput.value}');
  const { containerRef } = useCircuitEditor({ value: dsl, onChange: setDsl });
  return <div ref={containerRef} style={{ height: '500px' }} />;
}`,
  vue: `<template>
  <div ref="containerRef" style="height: 500px"></div>
</template>
<script setup>
import { ref } from 'vue';
import { useCircuitEditor } from 'velo-circuit/vue';
const dsl = ref('${dslInput.value}');
const { containerRef } = useCircuitEditor({ value: dsl });
<\/script>`,
  svelte: `<script lang="ts">
  import { circuitEditor } from 'velo-circuit/svelte';
  let dsl = '${dslInput.value}';
<\/script>
<div use:circuitEditor={{ value: dsl }} style="height: 500px"></div>`,
  angular: `@Component({
  selector: 'circuit-editor',
  template: \`<div #container style="width:100%;height:100%;"></div>\`,
})
export class CircuitEditorComponent implements AfterViewInit {
  @Input() initialDsl = '${dslInput.value}';
  private editor = createEditor();

  ngAfterViewInit() {
    this.editor.mount(this.container.nativeElement, {
      initialDsl: this.initialDsl
    });
  }
}`,
  astro: `<div id="editor" style="height: 500px"></div>
<script>
  import { mountAstroCircuitEditor } from 'velo-circuit/astro';

  const editor = mountAstroCircuitEditor(
    document.getElementById('editor'),
    { initialDsl: '${dslInput.value}' }
  );
<\/script>`
};

// Core module loaded once
let coreModule: any = null;

async function loadCore() {
  if (!coreModule) {
    coreModule = await import('../../../src/core/index.ts');
  }
  return coreModule;
}

async function updateDiagnostics() {
  const core = await loadCore();
  const { validate, parseBoukamp } = core;

  const result = parseBoukamp(dslInput.value);
  if (result && 'type' in result && (result.type === 'lex' || result.type === 'parse')) {
    diagnosticsOutput.value = [{ type: 'error', message: result.message }];
    return;
  }

  const validation = validate(result);
  diagnosticsOutput.value = validation.issues.map((i: any) => ({
    type: i.type,
    message: i.message,
  }));
}

function onDslInputChange() {
  updateDiagnostics();
  activePreviewRef.value?.setValue(dslInput.value);
}

function copyDsl() {
  navigator.clipboard.writeText(dslInput.value).catch(() => {});
}

function copySvg() {
  // Get SVG from the current preview's container
  const svgEl = document.querySelector('.framework-mount-point svg');
  if (svgEl) {
    navigator.clipboard.writeText(svgEl.outerHTML).catch(() => {});
  }
}

function centerView() {
  activePreviewRef.value?.centerView();
}

watch(isDark, (val) => {
  if (typeof document === 'undefined') {
    return;
  }
  const editors = document.querySelectorAll('.ce-editor');
  editors.forEach(el => {
    if (val) el.classList.add('ce-dark');
    else el.classList.remove('ce-dark');
  });
}, { immediate: true });

function selectCircuit(circuitId: string) {
  activeCircuit.value = circuitId;
  const circuit = circuitsList.value.find(c => c.id === circuitId);
  if (circuit) {
    dslInput.value = circuit.dsl;
    activePreviewRef.value?.setValue(circuit.dsl);
    updateDiagnostics();
  }
}

function onPreviewDslChange(newDsl: string) {
  dslInput.value = newDsl;
  updateDiagnostics();
}

onMounted(async () => {
  const circuit = circuitsList.value.find(c => c.id === activeCircuit.value) || circuitsList.value[0];
  dslInput.value = circuit.dsl;
  await updateDiagnostics();
});
</script>

<template>
  <div class="playground-wrapper" :style="{ height }">
    <div class="playground-chrome">
      <div class="chrome-dots">
        <span class="chrome-dot chrome-dot--red"></span>
        <span class="chrome-dot chrome-dot--yellow"></span>
        <span class="chrome-dot chrome-dot--green"></span>
      </div>
      <div class="chrome-title">{{ title }}</div>
    </div>

    <div class="playground-toolbar">
      <div class="circuit-selector">
        <span class="toolbar-label">Select Example:</span>
        <button
          v-for="circuit in circuitsList"
          :key="circuit.id"
          :class="['circuit-btn', { active: activeCircuit === circuit.id }]"
          @click="selectCircuit(circuit.id)"
        >
          {{ circuit.title }}
        </button>
        <div style="flex: 1"></div>
        <button class="circuit-btn" @click="centerView" title="Center View">🎯 Center</button>
      </div>
    </div>

    <div class="framework-tabs">
      <button :class="['tab-btn', { active: activeTab === 'preview' }]" @click="activeTab = 'preview'">Live Preview</button>
      <button :class="['tab-btn', { active: activeTab === 'react' }]" @click="activeTab = 'react'">React</button>
      <button :class="['tab-btn', { active: activeTab === 'vue' }]" @click="activeTab = 'vue'">Vue</button>
      <button :class="['tab-btn', { active: activeTab === 'svelte' }]" @click="activeTab = 'svelte'">Svelte</button>
      <button :class="['tab-btn', { active: activeTab === 'angular' }]" @click="activeTab = 'angular'">Angular</button>
      <button :class="['tab-btn', { active: activeTab === 'astro' }]" @click="activeTab = 'astro'">Astro</button>
      <button :class="['tab-btn', { active: activeTab === 'code' }]" @click="activeTab = 'code'">Code Example</button>
    </div>

    <div class="playground-main">
      <div v-show="activeTab === 'code'" class="code-view">
         <div class="code-tabs">
            <button v-for="fw in ['react', 'vue', 'svelte', 'angular', 'astro']" :key="fw" :class="['code-tab-btn', { active: framework === fw }]" @click="framework = fw">{{ fw }}</button>
         </div>
         <pre><code>{{ frameworkCode[framework as keyof typeof frameworkCode] }}</code></pre>
      </div>

      <div v-show="activeTab !== 'code'" class="playground-canvas">
        <div class="horizontal-panels">
          <div class="panel panel-dsl">
            <div class="panel-header">
              <span>Boukamp DSL</span>
              <button class="action-btn" @click="copyDsl">📋</button>
            </div>
            <div class="panel-body">
              <textarea v-model="dslInput" @input="onDslInputChange" class="dsl-textarea" spellcheck="false"></textarea>
            </div>
          </div>
          <div class="panel panel-diag">
            <div class="panel-header">
              <span>Diagnostics</span>
              <span class="diag-count" v-if="diagnosticsOutput.length">{{ diagnosticsOutput.length }}</span>
            </div>
            <div class="panel-body">
              <div v-if="diagnosticsOutput.length === 0" class="diag-empty">✓ OK</div>
              <div v-for="(d, i) in diagnosticsOutput.slice(0, 2)" :key="i" :class="['diag-item', `diag-${d.type}`]">
                {{ d.message }}
              </div>
            </div>
          </div>
          <div class="panel panel-export-wrap">
            <div class="panel-header">Export</div>
            <div class="panel-body panel-export">
              <button class="export-btn" @click="copySvg">SVG</button>
              <button class="export-btn" @click="copyDsl">DSL</button>
            </div>
          </div>
        </div>

        <div class="framework-mount-point" :style="{ height }">
          <component
            :is="currentPreview"
            ref="activePreviewRef"
            :initial-dsl="dslInput"
            @dsl-change="onPreviewDslChange"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.playground-wrapper {
  margin: 0;
  border-radius: 0px;
  overflow: hidden;
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg);
  box-shadow: 0 10px 30px rgba(0,0,0,0.1);
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.horizontal-panels {
  display: flex;
  background: var(--vp-c-bg-soft);
  border-top: 1px solid var(--vp-c-divider);
  gap: 1px;
  background: var(--vp-c-divider);
}

.panel {
  flex: 1;
  background: var(--vp-c-bg);
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 10px;
  background: var(--vp-c-bg-soft);
  font-size: 9px;
  font-weight: 700;
  text-transform: uppercase;
  color: var(--vp-c-text-2);
  border-bottom: 1px solid var(--vp-c-divider);
}

.panel-body {
  padding: 6px;
  flex: 1;
}

.dsl-textarea {
  width: 100%;
  height: 40px;
  padding: 4px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 4px;
  font-family: monospace;
  font-size: 11px;
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-1);
  resize: none;
}

.diag-item {
  font-size: 10px;
  padding: 2px 4px;
  border-radius: 3px;
  margin-bottom: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.diag-error { background: rgba(239, 68, 68, 0.1); color: #ef4444; }
.diag-warning { background: rgba(245, 158, 11, 0.1); color: #f59e0b; }

.panel-export {
  display: flex;
  gap: 4px;
}
.export-btn {
  flex: 1;
  padding: 4px;
  font-size: 10px;
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg-soft);
  border-radius: 4px;
  cursor: pointer;
}

.playground-chrome {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
  background: var(--vp-c-bg-soft);
  border-bottom: 1px solid var(--vp-c-divider);
}

.chrome-dots { display: flex; gap: 6px; }
.chrome-dot { width: 12px; height: 12px; border-radius: 50%; }
.chrome-dot--red { background: #ff5f56; }
.chrome-dot--yellow { background: #ffbd2e; }
.chrome-dot--green { background: #27c93f; }

.chrome-title {
  flex: 1;
  font-size: 11px;
  font-weight: 700;
  color: var(--vp-c-text-2);
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.playground-toolbar {
  padding: 12px 16px;
  background: var(--vp-c-bg);
  border-bottom: 1px solid var(--vp-c-divider);
}

.circuit-selector {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.toolbar-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--vp-c-text-2);
  margin-right: 4px;
}

.circuit-btn {
  padding: 4px 12px;
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg-soft);
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  color: var(--vp-c-text-1);
  border-radius: 6px;
  transition: all 0.2s;
}
.circuit-btn:hover { border-color: var(--vp-c-brand-1); background: var(--vp-c-bg); }
.circuit-btn.active { background: var(--vp-c-brand-1); border-color: var(--vp-c-brand-1); color: white; }

.framework-tabs {
  display: flex;
  gap: 4px;
  padding: 8px 16px;
  background: var(--vp-c-bg-soft);
  border-bottom: 1px solid var(--vp-c-divider);
}

.tab-btn {
  padding: 6px 14px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
  color: var(--vp-c-text-2);
  transition: all 0.2s;
  border: 1px solid transparent;
  cursor: pointer;
  background: transparent;
}
.tab-btn:hover { color: var(--vp-c-text-1); background: var(--vp-c-bg-mute); }
.tab-btn.active { background: var(--vp-c-bg); color: var(--vp-c-brand-1); box-shadow: 0 2px 5px rgba(0,0,0,0.05); }

.playground-main {
  position: relative;
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
}

.playground-canvas {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  width: 100%;
}

.framework-mount-point {
  width: 100%;
  background: #f0f2f5;
  flex: 1;
  min-height: 0;
}
.dark .framework-mount-point { background: #0f172a; }

.code-view {
  padding: 16px;
  background: #1e1e1e;
  color: #d4d4d4;
  font-family: monospace;
  font-size: 13px;
  min-height: 400px;
}

.code-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}
.code-tab-btn {
  padding: 4px 8px;
  border: 1px solid #444;
  border-radius: 4px;
  background: #333;
  color: #ccc;
  cursor: pointer;
}
.code-tab-btn:hover { background: #444; }
.code-tab-btn.active { background: #555; color: white; }

:deep(.ce-editor) {
  height: 100% !important;
}
</style>