# Unified Circuit DSL

`velo-circuit` and `velo-spectroz` share the same Boukamp-compatible element vocabulary. `velo-circuit` owns editing, validation, serialization, and rendering; `velo-spectroz` owns numerical impedance, fitting, and validation against experimental data.

## Grammar

```text
circuit   ::= element | series | parallel
series    ::= circuit "-" circuit
parallel  ::= "p(" circuit "," circuit ("," circuit)* ")"
element   ::= CODE DIGIT+
CODE      ::= "R" | "C" | "L" | "Q" | "W" | "Ws" | "Wo" | "G" | "Pdw"
DIGIT     ::= [0-9]+
```

## Elements

| Code | Element | Parameters |
|------|---------|------------|
| `R` | Resistor | `R` |
| `C` | Capacitor | `C` |
| `L` | Inductor | `L` |
| `Q` | Constant Phase Element | `Q0`, `n` |
| `W` | Warburg Infinite | `sigma` |
| `Ws` | Warburg Short | `Y0`, `B` |
| `Wo` | Warburg Open | `Y0`, `B` |
| `G` | Gerischer | `Y0`, `K` |
| `Pdw` | Parallel Diffusion Warburg | `D1`, `D2`, `theta`, `Lambda` |

## Compatibility Examples

These expressions should parse and serialize identically in both projects:

```text
R0
G0
Pdw0
R0-p(Q1,R2-Pdw3)
R0-p(Ws1,Wo2)-G3
```
