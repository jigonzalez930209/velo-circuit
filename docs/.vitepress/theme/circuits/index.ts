export interface CircuitExample {
  id: string;
  title: string;
  description: string;
  dsl: string;
  elements: string[];
}

export const basicCircuit: CircuitExample = {
  id: 'basic',
  title: 'Basic RC',
  description: 'A simple resistor in series with a parallel RC branch',
  dsl: 'R0-p(R1,C1)',
  elements: ['R', 'C'],
};

export const randlesCircuit: CircuitExample = {
  id: 'randles',
  title: 'Randles Circuit',
  description: 'Classic Randles circuit: solution resistance + charge transfer with double-layer capacitance',
  dsl: 'R0-p(R1,C1)-Wo2',
  elements: ['R', 'C', 'Wo'],
};

export const warburgCircuit: CircuitExample = {
  id: 'warburg',
  title: 'Warburg Short',
  description: 'Circuit with finite Warburg (short) for diffusion through thin layer',
  dsl: 'R0-p(R1,C1)-Ws2',
  elements: ['R', 'C', 'Ws'],
};

export const nestedCircuit: CircuitExample = {
  id: 'nested',
  title: 'Nested Parallel',
  description: 'Nested parallel groups demonstrating complex circuit topology',
  dsl: 'R0-p(R1,p(R2,C1))',
  elements: ['R', 'C'],
};

export const cpeCircuit: CircuitExample = {
  id: 'cpe',
  title: 'CPE Circuit',
  description: 'Circuit with Constant Phase Element for non-ideal capacitive behavior',
  dsl: 'R0-p(R1,Q1)-Wo2',
  elements: ['R', 'Q', 'Wo'],
};

export const fullRandlesCircuit: CircuitExample = {
  id: 'full-randles',
  title: 'Full Randles + CPE',
  description: 'Extended Randles model with CPE branch and inductor',
  dsl: 'R0-p(R1,C1)-p(R2,Q2)-L3',
  elements: ['R', 'C', 'Q', 'L'],
};

export const multiWarburgCircuit: CircuitExample = {
  id: 'multi-warburg',
  title: 'Multi-Warburg',
  description: 'Circuit comparing different Warburg element types',
  dsl: 'R0-p(R1,C1)-W2',
  elements: ['R', 'C', 'W'],
};

export const sampleCircuits: CircuitExample[] = [
  basicCircuit,
  randlesCircuit,
  warburgCircuit,
  nestedCircuit,
  cpeCircuit,
  fullRandlesCircuit,
  multiWarburgCircuit,
];

export interface PlaygroundConfig {
  initialCircuit: CircuitExample;
  showToolbar: boolean;
  showSidebar: boolean;
  theme: 'light' | 'dark';
}

export const defaultPlaygroundConfig: PlaygroundConfig = {
  initialCircuit: randlesCircuit,
  showToolbar: true,
  showSidebar: true,
  theme: 'light',
};
