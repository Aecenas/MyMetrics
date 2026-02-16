export type ArgQuote = '"' | "'";

export type ArgParseErrorCode = 'UNCLOSED_QUOTE';

export class ArgParseError extends Error {
  readonly code: ArgParseErrorCode;
  readonly quote?: ArgQuote;
  readonly index: number;

  constructor(code: ArgParseErrorCode, options: { quote?: ArgQuote; index: number }) {
    super(code);
    this.name = 'ArgParseError';
    this.code = code;
    this.quote = options.quote;
    this.index = options.index;
  }
}

const isWhitespace = (value: string) => /\s/.test(value);

const canEscape = (value: string) =>
  value === '"' || value === "'" || value === '\\' || isWhitespace(value);

export const parseScriptArgs = (input: string): string[] => {
  const args: string[] = [];
  let current = '';
  let quote: ArgQuote | null = null;
  let quoteStartIndex = -1;
  let hasToken = false;

  for (let index = 0; index < input.length; index += 1) {
    const char = input[index];

    if (char === '\\') {
      const next = input[index + 1];
      if (next !== undefined && canEscape(next)) {
        current += next;
        hasToken = true;
        index += 1;
        continue;
      }

      current += char;
      hasToken = true;
      continue;
    }

    if (quote) {
      if (char === quote) {
        quote = null;
        continue;
      }

      current += char;
      hasToken = true;
      continue;
    }

    if (char === '"' || char === "'") {
      quote = char;
      quoteStartIndex = index;
      hasToken = true;
      continue;
    }

    if (isWhitespace(char)) {
      if (hasToken) {
        args.push(current);
        current = '';
        hasToken = false;
      }
      continue;
    }

    current += char;
    hasToken = true;
  }

  if (quote) {
    throw new ArgParseError('UNCLOSED_QUOTE', {
      quote,
      index: quoteStartIndex,
    });
  }

  if (hasToken) {
    args.push(current);
  }

  return args;
};

const needsQuoting = (value: string) => value === '' || /[\s"'\\]/.test(value);

export const formatScriptArgs = (args: string[]): string =>
  args
    .map((arg) => {
      if (!needsQuoting(arg)) return arg;
      const escaped = arg.replace(/([\\"])/g, '\\$1');
      return `"${escaped}"`;
    })
    .join(' ');
