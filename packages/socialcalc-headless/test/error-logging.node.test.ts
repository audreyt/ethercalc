import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { createSpreadsheet } from '../src/index.js';

describe('logging of SocialCalc errors', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('reports a failing batch once, with a bounded excerpt of its first error', () => {
    const errors = vi.spyOn(console, 'error').mockImplementation(() => {});
    const sheet = createSpreadsheet();
    const pairs = Array.from(
      { length: 50 },
      (_, i) => `loadclipboard ${'x'.repeat(5000)}${i}\npaste A1`,
    );
    sheet.executeCommand([...pairs, 'set B2 text t later'].join('\n'));
    expect(errors).toHaveBeenCalledTimes(1);
    const [label, detail] = errors.mock.calls[0] as [string, string];
    expect(label).toBe('Error in ExecuteSheetCommand:');
    expect(detail).toMatch(/^Unknown line type 'x{481}\.\.\. \(first of 50 failed lines\)$/);
    expect((sheet.exportCells() as Record<string, { datavalue?: unknown }>).B2?.datavalue).toBe('later');
  });

  it('logs a short error as it was thrown', () => {
    const errors = vi.spyOn(console, 'error').mockImplementation(() => {});
    createSpreadsheet().executeCommand('set A1 all :nosuchattribute:1');
    expect(errors.mock.calls).toEqual([
      ['Error in ExecuteSheetCommand:', "Unknown cell type item 'nosuchattribute'"],
    ]);
  });

  it('keeps the head of the stack of a thrown Error', () => {
    const errors = vi.spyOn(console, 'error').mockImplementation(() => {});
    createSpreadsheet().executeCommand('sort');
    expect(errors).toHaveBeenCalledTimes(1);
    const [label, detail] = errors.mock.calls[0] as [string, string];
    expect(label).toBe('Error in ExecuteSheetCommand:');
    expect(detail).toMatch(/^Error: Invalid cell coordinate\n\s+at /);
    expect(detail.length).toBeLessThanOrEqual(503);
  });

  it('bounds the error logged for a snapshot that does not parse', () => {
    const errors = vi.spyOn(console, 'error').mockImplementation(() => {});
    const snapshot = createSpreadsheet({ log: ['set A1 text t kept'] })
      .createSpreadsheetSave()
      .replace('\ncell:A1', `\n${'y'.repeat(5000)}:1\ncell:A1`);
    createSpreadsheet({ snapshot });
    expect(errors).toHaveBeenCalledTimes(1);
    const [label, detail] = errors.mock.calls[0] as [string, string];
    expect(label).toBe('Error in DecodeSpreadsheetSave:');
    expect(detail).toMatch(/^Unknown line type 'y{481}\.\.\.$/);
  });
});
