import { describe, it, expect } from 'vitest';

import { csvToMarkdown, renderMarkdownTable } from '../src/lib/md.ts';

/**
 * Pure unit tests for the GFM markdown renderer.
 */
describe('renderMarkdownTable', () => {
  it('returns empty string for empty grid', () => {
    expect(renderMarkdownTable([])).toBe('');
  });

  it('returns empty string for grid with zero-width rows', () => {
    // A row with no cells renders no columns — equivalent to empty.
    expect(renderMarkdownTable([[]])).toBe('');
  });

  it('renders a one-row grid as header + separator (no body rows)', () => {
    expect(renderMarkdownTable([['a', 'b']])).toBe('| a | b |\n| --- | --- |');
  });

  it('renders a header + body rows', () => {
    expect(
      renderMarkdownTable([
        ['h1', 'h2'],
        ['a', 'b'],
        ['1', '2'],
      ]),
    ).toBe('| h1 | h2 |\n| --- | --- |\n| a | b |\n| 1 | 2 |');
  });

  it('pads short rows with empty cells and truncates long rows by padding up', () => {
    // Widest row wins; short rows get empty cells to match.
    expect(
      renderMarkdownTable([
        ['a', 'b', 'c'],
        ['1'],
      ]),
    ).toBe('| a | b | c |\n| --- | --- | --- |\n| 1 |  |  |');
  });

  it('escapes pipes inside cells', () => {
    expect(renderMarkdownTable([['a|b']])).toBe('| a\\|b |\n| --- |');
  });

  it('escapes backslashes', () => {
    expect(renderMarkdownTable([['a\\b']])).toBe('| a\\\\b |\n| --- |');
  });

  it('escapes backticks', () => {
    expect(renderMarkdownTable([['`code`']])).toBe('| \\`code\\` |\n| --- |');
  });

  it('replaces embedded LF with <br>', () => {
    expect(renderMarkdownTable([['a\nb']])).toBe('| a<br>b |\n| --- |');
  });

  it('replaces embedded CRLF with <br>', () => {
    expect(renderMarkdownTable([['a\r\nb']])).toBe('| a<br>b |\n| --- |');
  });

  it('replaces lone CR with <br>', () => {
    expect(renderMarkdownTable([['a\rb']])).toBe('| a<br>b |\n| --- |');
  });
});

describe('csvToMarkdown', () => {
  it('is equivalent to parseCSV + renderMarkdownTable', () => {
    // End-to-end: compose via the public API.
    expect(csvToMarkdown('a,b\n1,2\n')).toBe(
      '| a | b |\n| --- | --- |\n| 1 | 2 |',
    );
  });

  it('handles empty CSV', () => {
    expect(csvToMarkdown('')).toBe('');
  });

  it('handles quoted CSV with commas', () => {
    expect(csvToMarkdown('"a,b",c\n1,2\n')).toBe(
      '| a,b | c |\n| --- | --- |\n| 1 | 2 |',
    );
  });
});
