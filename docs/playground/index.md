---
layout: page
title: Circuit Playground
outline: false
pageClass: full-width-page
---

<CircuitPlayground 
  title="Interactive Circuit Editor" 
  height="600px"
  initial-circuit="randles"
/>

---

## Quick Start

Use the **element buttons** above to add components to your circuit. Toggle between **Series** and **Parallel** mode to control how new elements are connected.

### Supported Elements

| Element | Code | Description | Parameters |
|---------|------|-------------|------------|
| **Resistor** | `R` | Ohmic resistance | R (Ω) |
| **Capacitor** | `C` | Ideal capacitor | C (F) |
| **Inductor** | `L` | Ideal inductor | L (H) |
| **CPE** | `Q` | Constant Phase Element | Q₀ (S·sⁿ), n |
| **Warburg** | `W` | Semi-infinite diffusion | σ (Ω·s⁻½) |
| **Warburg Short** | `Ws` | Finite layer, transmissive | Y₀ (S·s½), B (s½) |
| **Warburg Open** | `Wo` | Finite layer, reflective | Y₀ (S·s½), B (s½) |

### DSL Syntax

| Operator | Description | Example |
|----------|-------------|---------|
| `-` | Series connection | `R0-C1` |
| `p(…,…)` | Parallel connection | `p(R0,C1)` |
| Nested | Combinations | `R0-p(R1,C1)-Wo2` |

---

## Circuit Examples

### Basic RC Circuit

```
R0-p(R1,C1)
```

### Randles Circuit with Warburg

```
R0-p(R1,C1)-Wo2
```

### CPE Model (Non-ideal Capacitor)

```
R0-p(R1,Q1)-Wo2
```

### Nested Parallel

```
R0-p(R1,p(R2,C1))
```

### Full Model with Inductor

```
R0-p(R1,C1)-p(R2,Q2)-L3
```
