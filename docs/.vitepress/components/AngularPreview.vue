<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';

const props = defineProps<{
  initialDsl?: string;
}>();

const emit = defineEmits<{
  (e: 'dslChange', dsl: string): void;
}>();

const containerRef = ref<HTMLDivElement | null>(null);
let componentInstance: any = null;

onMounted(async () => {
  if (!containerRef.value) return;

  const { createAngularCircuitEditorAdapter } = await import('/src/adapters/angular/index.js');

  const adapter = createAngularCircuitEditorAdapter();
  componentInstance = adapter.createComponent(containerRef.value, {
    initialDsl: props.initialDsl,
  });

  // Override emit to sync with playground
  const originalEmit = componentInstance.dslChange.emit;
  componentInstance.dslChange.emit = (dsl: string) => {
    emit('dslChange', dsl);
    originalEmit(dsl);
  };
});

onBeforeUnmount(() => {
  componentInstance?.destroy();
});

defineExpose({
  setValue(dsl: string) {
    componentInstance?.setValue(dsl);
  },
  centerView() {
    // Angular doesn't have center view in adapter
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