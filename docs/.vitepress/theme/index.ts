import DefaultTheme from 'vitepress/theme';
import type { Theme } from 'vitepress';
import CircuitPlayground from '../components/CircuitPlayground.vue';
import './style.css';

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('CircuitPlayground', CircuitPlayground);
  },
} satisfies Theme;
