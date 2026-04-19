import { describe, it, expect } from 'vitest';

import {
  computeLastRow,
  enrichLoadClipboard,
  isBannedWikiFormat,
  isLoadClipboard,
  isMultiCascade,
} from '../src/lib/loadclipboard.ts';

/**
 * Unit tests for src/lib/loadclipboard.ts. Every branch of every
 * helper is exercised. Istanbul 100% coverage gate applies via
 * vitest.node.config.ts (see CLAUDE.md section 5.1).
 */

describe('isLoadClipboard', () => {
  it('matches loadclipboard followed by space', () => {
    expect(isLoadClipboard('loadclipboard cell:A1:t:hi\\ncopiedfrom:A1:A1\\n')).toBe(true);
  });
  it('matches when followed by newline (whitespace character)', () => {
    expect(isLoadClipboard('loadclipboard\ncell:A1:t:hi')).toBe(true);
  });
  it('does not match a bare loadclipboard with no trailing whitespace', () => {
    expect(isLoadClipboard('loadclipboard')).toBe(false);
  });
  it('does not match arbitrary non-loadclipboard commands', () => {
    expect(isLoadClipboard('set A1 value n 1')).toBe(false);
    expect(isLoadClipboard('')).toBe(false);
  });
  it('is anchored at start -- nested loadclipboard does not match', () => {
    expect(isLoadClipboard('  loadclipboard foo')).toBe(false);
  });
});

describe('isMultiCascade', () => {
  it('returns the A-ref for a canonical match', () => {
    expect(isMultiCascade('set A12:B3 empty multi-cascade')).toBe('A12');
  });
  it('returns null for an unrelated command', () => {
    expect(isMultiCascade('set A1 value n 1')).toBeNull();
  });
  it('returns null when the left is not A-digits', () => {
    expect(isMultiCascade('set C1:B3 empty multi-cascade')).toBeNull();
  });
  it('returns null when the right is not B-digits', () => {
    expect(isMultiCascade('set A1:C3 empty multi-cascade')).toBeNull();
  });
  it('returns null when the mode is not empty multi-cascade', () => {
    expect(isMultiCascade('set A1:B3 empty single-cascade')).toBeNull();
  });
  it('allows trailing content after multi-cascade (anchor-left-only)', () => {
    expect(isMultiCascade('set A7:B2 empty multi-cascade extra')).toBe('A7');
  });
});

describe('isBannedWikiFormat', () => {
  it('matches the canonical drop command', () => {
    expect(isBannedWikiFormat('set sheet defaulttextvalueformat text-wiki')).toBe(true);
  });
  it('tolerates trailing whitespace', () => {
    expect(isBannedWikiFormat('set sheet defaulttextvalueformat text-wiki  ')).toBe(true);
    expect(isBannedWikiFormat('set sheet defaulttextvalueformat text-wiki\n')).toBe(true);
  });
  it('rejects any non-whitespace tail', () => {
    expect(isBannedWikiFormat('set sheet defaulttextvalueformat text-wiki extra')).toBe(false);
  });
  it('rejects a different format', () => {
    expect(isBannedWikiFormat('set sheet defaulttextvalueformat text-plain')).toBe(false);
  });
  it('rejects unrelated commands', () => {
    expect(isBannedWikiFormat('')).toBe(false);
    expect(isBannedWikiFormat('set A1 value n 1')).toBe(false);
  });
});

describe('computeLastRow', () => {
  it('parses a standard sheet dimension line', () => {
    const snapshot = [
      'version:1.5',
      'sheet:c:3:r:7:tvf:g',
      'cell:A1:t:hi',
    ].join('\n') + '\n';
    expect(computeLastRow(snapshot)).toBe(7);
  });
  it('returns 1 when no sheet:c:...:r:...: line is present (default)', () => {
    expect(computeLastRow('')).toBe(1);
    expect(computeLastRow('version:1.5\n')).toBe(1);
  });
  it('requires a leading newline (legacy regex is anchored)', () => {
    // Without leading newline, legacy regex /\n.../ does not match.
    expect(computeLastRow('sheet:c:1:r:9:')).toBe(1);
  });
  it('handles multi-digit row values', () => {
    expect(computeLastRow('\nsheet:c:10:r:1234:tvf:g')).toBe(1234);
  });
});

describe('enrichLoadClipboard', () => {
  const LC = 'loadclipboard cell:A1:t:x\\ncopiedfrom:A1:A1\\n';

  it('returns [cmd, paste A2 all] when snapshot is empty (row = 2)', () => {
    expect(enrichLoadClipboard(LC, { rowQueryParam: null, snapshot: '' })).toEqual([
      LC,
      'paste A2 all',
    ]);
  });
  it('returns [cmd, paste A(lastrow+1) all] when snapshot has a sheet dim', () => {
    const snap = '\nsheet:c:3:r:5:tvf:g\n';
    expect(enrichLoadClipboard(LC, { rowQueryParam: null, snapshot: snap })).toEqual([
      LC,
      'paste A6 all',
    ]);
  });
  it('prepends insertrow + paste when rowQueryParam is a positive finite number', () => {
    expect(enrichLoadClipboard(LC, { rowQueryParam: 42, snapshot: '' })).toEqual([
      LC,
      'insertrow A42',
      'paste A42 all',
    ]);
  });
  it('ignores rowQueryParam of 0 (legacy parseInt falsiness)', () => {
    expect(enrichLoadClipboard(LC, { rowQueryParam: 0, snapshot: '' })).toEqual([
      LC,
      'paste A2 all',
    ]);
  });
  it('ignores rowQueryParam of NaN', () => {
    expect(enrichLoadClipboard(LC, { rowQueryParam: Number.NaN, snapshot: '' })).toEqual([
      LC,
      'paste A2 all',
    ]);
  });
  it('ignores rowQueryParam of Infinity (not finite)', () => {
    expect(
      enrichLoadClipboard(LC, { rowQueryParam: Number.POSITIVE_INFINITY, snapshot: '' }),
    ).toEqual([LC, 'paste A2 all']);
  });
  it('accepts both snapshot-derived and rowQueryParam -- the latter wins', () => {
    const snap = '\nsheet:c:3:r:5:tvf:g\n';
    expect(enrichLoadClipboard(LC, { rowQueryParam: 2, snapshot: snap })).toEqual([
      LC,
      'insertrow A2',
      'paste A2 all',
    ]);
  });
});
