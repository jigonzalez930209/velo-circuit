export interface Token {
  type: 'element-code' | 'element-id' | 'dash' | 'parallel-kw' | 'lparen' | 'rparen' | 'comma' | 'lbracket' | 'rbracket' | 'number';
  value: string;
  position: number;
}

export interface LexError {
  type: 'lex';
  position: number;
  found: string;
  message: string;
}

export function tokenize(input: string): Token[] | LexError {
  const tokens: Token[] = [];
  let i = 0;

  while (i < input.length) {
    const ch = input[i];

    if (/\s/.test(ch)) {
      i++;
      continue;
    }

    if (ch === '-') {
      tokens.push({ type: 'dash', value: '-', position: i });
      i++;
      continue;
    }

    if (ch === '(') {
      tokens.push({ type: 'lparen', value: '(', position: i });
      i++;
      continue;
    }

    if (ch === ')') {
      tokens.push({ type: 'rparen', value: ')', position: i });
      i++;
      continue;
    }

    if (ch === ',') {
      tokens.push({ type: 'comma', value: ',', position: i });
      i++;
      continue;
    }

    if (ch === '[') {
      tokens.push({ type: 'lbracket', value: '[', position: i });
      i++;
      continue;
    }

    if (ch === ']') {
      tokens.push({ type: 'rbracket', value: ']', position: i });
      i++;
      continue;
    }

    if (ch === 'p' && input[i + 1] === '(') {
      tokens.push({ type: 'parallel-kw', value: 'p', position: i });
      i++;
      continue;
    }

    if (/[RCLQW]/.test(ch)) {
      let code = ch;

      if ((ch === 'W') && (input[i + 1] === 's' || input[i + 1] === 'o')) {
        code = ch + input[i + 1];
        tokens.push({ type: 'element-code', value: code, position: i });
        i += 2;
      } else {
        tokens.push({ type: 'element-code', value: code, position: i });
        i++;
      }

      let numStr = '';
      while (i < input.length && /\d/.test(input[i])) {
        numStr += input[i];
        i++;
      }

      if (numStr === '') {
        return { type: 'lex', position: i, found: ch, message: `Element code '${code}' must be followed by a numeric id` };
      }

      tokens.push({ type: 'element-id', value: numStr, position: i - numStr.length });
      continue;
    }

    // Number parsing (e.g. 50, 1.5, 1e-6, -2.3)
    if (/[\d\.\+\-eE]/.test(ch)) {
      // Very basic float check, could be improved but covers typical JS numbers
      const numMatch = input.substring(i).match(/^[-+]?(?:\d*\.?\d+)(?:[eE][-+]?\d+)?/);
      if (numMatch) {
        tokens.push({ type: 'number', value: numMatch[0], position: i });
        i += numMatch[0].length;
        continue;
      }
    }

    return { type: 'lex', position: i, found: ch, message: `Unexpected character '${ch}'` };
  }

  return tokens;
}