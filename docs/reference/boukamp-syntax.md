# Boukamp Syntax Reference

## Grammar

```
circuit   ::= element | series | parallel
series    ::= circuit "-" circuit
parallel  ::= "p(" circuit "," circuit ")"
element   ::= CODE DIGIT+
CODE      ::= "R" | "C" | "L" | "Q" | "W" | "Ws" | "Wo" | "G" | "Pdw"
DIGIT     ::= [0-9]+
```

## Operator Precedence

Parallel `p()` binds tighter than series `-`. Read left-to-right for series.

## Examples

| DSL | Structure |
|-----|-----------|
| `R0` | Single resistor |
| `R0-C1` | R in series with C |
| `p(R0,C1)` | R in parallel with C |
| `R0-p(R1,C1)` | R in series with (R//C) |
| `R0-p(R1,C1)-Wo2` | Randles with Warburg open |
| `R0-p(Q1,R2-Pdw3)` | PDW literature circuit |
| `R0-p(Ws1,Wo2)-G3` | Finite diffusion plus Gerischer |
| `p(R0,p(C1,p(Q2,Wo3)))` | Triple nested |
| `R0-p(R1,C1)-p(R2,Q2)-L3` | Two parallel branches in series |

## Common Patterns

### Randles Simplified

```
R0-p(R1,C1)
```

### Randles with Warburg

```
R0-p(R1,C1)-Wo2
```

### Parallel Diffusion Warburg

```
R0-p(Q1,R2-Pdw3)
```

### Voigt Model

```
p(R0,C0)-p(R1,C1)-p(R2,C2)
```

### Extended Randles

```
R0-p(R1,Q2)-p(R3,L3)-Wo4
```