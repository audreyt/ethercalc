import { describe, expect, it } from 'vitest';
import { createSpreadsheet } from '../src/index.js';

describe('headless spreadsheet state', () => {
  it('keeps resolved sibling sheets within one spreadsheet', () => {
    const first = createSpreadsheet();
    first.executeCommand('set A1 formula "source"!A1');
    first.addSiblingSheet('source', 'version:1.5\ncell:A1:t:First\nsheet:c:1:r:1\n');
    first.recalc();
    expect(first.exportCSV()).toBe('First\n');

    const second = createSpreadsheet();
    second.executeCommand('set A1 formula "source"!A1');
    expect(second.exportCSV()).not.toContain('First');

    first.resetSiblingSheets();
    first.recalc();
    expect(first.exportCSV()).not.toContain('First');
  });

  it('keeps clipboard contents within one spreadsheet', () => {
    const first = createSpreadsheet();
    first.executeCommand('set A1 text t First\ncopy A1 all');

    const second = createSpreadsheet();
    second.executeCommand('COPY A1 all\npaste A1 all');
    expect(second.exportCell('A1')).toBeNull();
  });
});
