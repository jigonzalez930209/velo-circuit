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

  const { createVueCircuitEditor } = await import('/src/adapters/vue/index.js');

  editor = createVueCircuitEditor(containerRef.value, {
    initialDsl: props.initialDsl,
    onDslChange: (dsl) => {
      emit('dslChange', dsl);
    }
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
    // Vue doesn't have center view in adapter
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