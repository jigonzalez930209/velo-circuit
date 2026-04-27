<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';

const props = defineProps<{
  initialDsl?: string;
}>();

const emit = defineEmits<{
  (e: 'dslChange', dsl: string): void;
}>();

const containerRef = ref<HTMLDivElement | null>(null);
let root: any = null;

onMounted(async () => {
  if (!containerRef.value) return;

  const [React, ReactDOM, adapter] = await Promise.all([
    import('react'),
    import('react-dom/client'),
    import('/src/adapters/react/index.js'),
  ]);

  root = ReactDOM.createRoot(containerRef.value);

  const App = () => {
    const [val, setVal] = React.useState(props.initialDsl || 'R0');

    const { containerRef: editorRef } = adapter.useCircuitEditor({
      value: val,
      onDslChange: (newDsl: string) => {
        setVal(newDsl);
        emit('dslChange', newDsl);
      }
    });

    return React.createElement('div', {
      ref: editorRef,
      style: { height: '100%', width: '100%' }
    });
  };

  root.render(React.createElement(App));
});

onBeforeUnmount(() => {
  root?.unmount();
});

defineExpose({
  setValue(_dsl: string) {
    // React state managed internally
  },
  centerView() {
    // Not implemented
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