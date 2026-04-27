<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';

const props = defineProps<{
  initialDsl?: string;
}>();

const emit = defineEmits<{
  (e: 'dslChange', dsl: string): void;
}>();

const containerRef = ref<HTMLDivElement | null>(null);
let editor: any = null;

onMounted(async () => {
  if (!containerRef.value) return;

  const { createSvelteCircuitEditor } = await import('/src/adapters/svelte/index.js');

  const svelteContainer = document.createElement('div');
  svelteContainer.style.height = '100%';
  containerRef.value.appendChild(svelteContainer);

  editor = createSvelteCircuitEditor(svelteContainer, {
    initialDsl: props.initialDsl,
  });

  svelteContainer.addEventListener('change', (e: any) => {
    emit('dslChange', e.detail);
  });
});

onBeforeUnmount(() => {
  editor?.destroy();
});

defineExpose({
  setValue(dsl: string) {
    editor?.setValue(dsl);
  },
  centerView() {
    // Svelte doesn't have center view in adapter
  }
});
</script>

<template>
  <div ref="containerRef" class="preview-container"></div>
</template>

<style scoped>
.preview-container {
  width: 100%;
  height: 100%;
}
</style>