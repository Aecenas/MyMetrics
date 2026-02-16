import { describe, expect, it } from 'vitest';
import { ArgParseError, formatScriptArgs, parseScriptArgs } from './arg-parser';

describe('arg parser', () => {
  it('keeps legacy space-separated args compatible', () => {
    expect(parseScriptArgs('--city beijing')).toEqual(['--city', 'beijing']);
  });

  it('parses double quoted argument', () => {
    expect(parseScriptArgs('--name "hello world"')).toEqual(['--name', 'hello world']);
  });

  it('parses single quoted argument', () => {
    expect(parseScriptArgs("--path '/a b/c.py'")).toEqual(['--path', '/a b/c.py']);
  });

  it('parses escaped quotes without treating them as quote delimiters', () => {
    expect(parseScriptArgs('--msg \\"a b\\"')).toEqual(['--msg', '"a', 'b"']);
  });

  it('parses escaped spaces', () => {
    expect(parseScriptArgs('--msg a\\ b')).toEqual(['--msg', 'a b']);
  });

  it('returns empty array for empty string', () => {
    expect(parseScriptArgs('')).toEqual([]);
  });

  it('throws for unclosed quotes', () => {
    expect(() => parseScriptArgs('--name "hello world')).toThrowError(ArgParseError);

    try {
      parseScriptArgs("--path '/a b/c.py");
      throw new Error('expected parse to fail');
    } catch (error) {
      expect(error).toBeInstanceOf(ArgParseError);
      expect((error as ArgParseError).code).toBe('UNCLOSED_QUOTE');
      expect((error as ArgParseError).quote).toBe("'");
    }
  });

  it('formats args to editable text without losing spaces', () => {
    const text = formatScriptArgs(['--name', 'hello world', '--path', '/a b/c.py']);
    expect(parseScriptArgs(text)).toEqual(['--name', 'hello world', '--path', '/a b/c.py']);
  });
});
