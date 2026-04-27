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

  const { mountAstroCircuitEditor } = await import('/src/adapters/astro/index.js');

  editor = mountAstroCircuitEditor(containerRef.value, {
    initialDsl: props.initialDsl,
  });

  editor.on('ast-changed', () => {
    emit('dslChange', editor!.getValue());
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
    // Astro doesn't have center view in adapter
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