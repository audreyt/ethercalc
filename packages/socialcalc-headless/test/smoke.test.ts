import { describe, it, expect } from 'vitest';
import { createSpreadsheet, csvToSave, loadSocialCalc } from '../src/index.js';

describe('socialcalc headless (Phase 1 spike — Plan A)', () => {
  it('loads SocialCalc namespace in workerd', () => {
    const SC = loadSocialCalc();
    expect(typeof SC).toBe('object');
    expect(typeof SC.SpreadsheetControl).toBe('function');
    expect(typeof SC.ConvertSaveToOtherFormat).toBe('function');
    expect(typeof SC.Parse).toBe('function');
  });

  it('instantiates a SpreadsheetControl with a default empty sheet', () => {
    const ss = createSpreadsheet();
    const save = ss.createSheetSave();
    expect(save).toContain('version:1.5');
    expect(save).toContain('sheet:');
  });

  it('executes set + SUM formula and exports CSV', () => {
    const ss = createSpreadsheet();
    ss.executeCommand(
      ['set A1 value n 1', 'set A2 value n 2', 'set A3 formula SUM(A1:A2)', 'recalc'].join('\n'),
    );
    expect(ss.exportCSV()).toBe('1\n2\n3\n');
  });

  it('loads from snapshot and applies log', () => {
    const ss1 = createSpreadsheet();
    ss1.executeCommand('set A1 value n 42');
    // Use full spreadsheet save format — this is what the DO will persist,
    // matching the legacy `snapshot-<room>` Redis key.
    const snapshot = ss1.createSpreadsheetSave();

    const ss2 = createSpreadsheet({
      snapshot,
      log: ['set B1 formula A1*2', 'recalc'],
    });
    expect(ss2.exportCSV()).toBe('42,84\n');
  });

  it('survives a recalc where no formulas reference anything', () => {
    const ss = createSpreadsheet();
    ss.executeCommand('set A1 value n 7\nrecalc');
    expect(ss.exportCSV()).toBe('7\n');
  });

  it('handles text cells and basic arithmetic', () => {
    const ss = createSpreadsheet();
    ss.executeCommand(
      [
        'set A1 text t hello',
        'set B1 value n 10',
        'set B2 value n 20',
        'set B3 formula B1+B2',
        'recalc',
      ].join('\n'),
    );
    expect(ss.exportCSV()).toBe('hello,10\n,20\n,30\n');
  });

  /**
   * `csvToSave` round-trip. The PUT /_/:room handler stores this as the
   * room snapshot; rehydrated, it must parse as a full spreadsheet save
   * (including the multipart envelope) and export back to the same CSV.
   *
   * Regression guard: `ConvertOtherFormatToSave(csv, 'csv')` alone
   * returns a clipboard-style snippet with a `copiedfrom:` trailer that
   * DecodeSpreadsheetSave can't handle — rehydrated exports came back
   * empty. Found by 2026-04-20 browser smoke PUT + GET CSV.
   */
  it('csvToSave produces a full save that round-trips through createSpreadsheet', () => {
    const csv = 'a,b,c\n1,2,3\n';
    const save = csvToSave(csv);
    // Envelope markers legacy clients + our DecodeSpreadsheetSave expect.
    expect(save).toContain('SocialCalcSpreadsheetControlSave');
    expect(save).toContain('part:sheet');
    // Round-trip: rehydrate and export CSV. Must match the input row
    // shape (trailing newline is SocialCalc's convention).
    const ss = createSpreadsheet({ snapshot: save });
    expect(ss.exportCSV()).toBe('a,b,c\n1,2,3\n');
  });
});
