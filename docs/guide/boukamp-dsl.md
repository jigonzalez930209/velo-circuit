# Boukamp DSL Reference

## Syntax

```
circuit   ::= element | series | parallel
series    ::= circuit "-" circuit
parallel  ::= "p(" circuit "," circuit ")"
element   ::= CODE DIGIT+
CODE      ::= "R" | "C" | "L" | "Q" | "W" | "Ws" | "Wo"
DIGIT     ::= [0-9]+
```

## Element Codes

| Code | Element | Parameters |
|------|---------|------------|
| `R` | Resistor | R (Ω) |
| `C` | Capacitor | C (F) |
| `L` | Inductor | L (H) |
| `Q` | CPE (Constant Phase Element) | Q₀ (S·sⁿ), n |
| `W` | Warburg Infinite | σ (Ω·s⁻½) |
| `Ws` | Warburg Short | Y₀ (S·s½), B (s½) |
| `Wo` | Warburg Open | Y₀ (S·s½), B (s½) |

## Examples

### Series

```
R0-C1        → R in series with C
R0-C1-L2     → R, C, and L in series
R0-C1-L2-Q3-Wo4
```

### Parallel

```
p(R0,C1)     → R and C in parallel
p(R0,p(C1,Q2))  → R in parallel with (C in parallel with Q)
```

### Mixed

```
R0-p(R1,C1)     → Randles simplified
R0-p(R1,C1)-Wo2 → Randles with finite Warburg
R0-p(R1,p(C1,Q2))-L3  → nested parallel branches
```

## Validation Rules

The parser validates:

- **Duplicate IDs** — `R0-p(R0,C1)` → error: `R0` appears twice
- **Unknown codes** — `X0` → lex error at position
- **Unbalanced parentheses** — `p(R0,C1` → parse error
- **DC path** — `p(C0,L1)` → warning: no resistive path

## Next

- [Element Types Reference](/reference/element-types)