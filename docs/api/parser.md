# Parser API

Parse and validate the Boukamp DSL.

## parseBoukamp

```ts
import { parseBoukamp } from 'velo-circuit-editor'

const result = parseBoukamp('R0-p(R1,C1)')

if ('type' in result && result.type === 'lex') {
  // Lex error at position
  console.error(result.position, result.message)
} else if ('type' in result && result.type === 'parse') {
  // Parse error
  console.error(result.expected, result.found)
} else {
  const ast = result
  // use ast
}
```

## tokenize

```ts
import { tokenize } from 'velo-circuit-editor'

const tokens = tokenize('R0-p(R1,C1)')
// → [Token, Token, ...]
```

## serialize

```ts
import { serialize } from 'velo-circuit-editor'

const dsl = serialize(ast)
// → 'R0-p(R1,C1)-Wo2'
```

## validate

```ts
import { validate } from 'velo-circuit-editor'

const result = validate(ast)
// → { issues: [...], hasErrors: false, hasWarnings: false }
```

## Error Types

```ts
interface LexError {
  type: 'lex'
  position: number
  found: string
  message: string
}

interface ParseError {
  type: 'parse'
  position: number
  expected: string
  found: string
  message: string
}
```

## Round-Trip

```ts
const dsl = 'R0-p(R1,C1)-Wo2'
const ast = parseBoukamp(dsl)
const output = serialize(ast)
assert(output === dsl) // always true for valid input
```