import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { createSpreadsheet } from '../src/index.js';

type Cell = {
  datavalue?: unknown;
  valuetype?: string;
  font?: number;
};

const MIB = 1_048_576;
const LIMIT_ERROR = 'Command batch exceeds text limits';

/** A sheet whose A1 computes the longest text a formula may return. */
function sheetWithLargeValue(letter = 'a') {
  const sheet = createSpreadsheet();
  sheet.executeCommand(`set A1 formula REPT("${letter}",${MIB})`);
  return sheet;
}

function cell(sheet: ReturnType<typeof createSpreadsheet>, coord: string): Cell {
  return (sheet.exportCell(coord) ?? {}) as Cell;
}

function loggedErrors(spy: { mock: { calls: unknown[][] } }): string[] {
  return spy.mock.calls.map((call) => String(call[1]));
}

describe('command batch text limits', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it.each(['sort A1:A100 A up', 'copy A1:A100 all', 'cut A1:A100 all'])(
    'stops "%s" from copying a filled value per row before recalculation',
    (command) => {
      const errors = vi.spyOn(console, 'error').mockImplementation(() => {});
      const sheet = sheetWithLargeValue();

      const withinLimits = sheet.executeCommand(`filldown A1:A100 all\n${command}`);

      expect(withinLimits).toBe(false);
      expect(loggedErrors(errors)).toEqual([`Error: ${LIMIT_ERROR}`]);
      expect((cell(sheet, 'A1').datavalue as string).length).toBe(MIB);
      expect((cell(sheet, 'A7').datavalue as string).length).toBe(MIB);
      expect(cell(sheet, 'A8').valuetype).toMatch(/^e/);
      expect(cell(sheet, 'A100').valuetype).toMatch(/^e/);
    },
  );

  it('charges a batch as a whole and starts the next one afresh', () => {
    const errors = vi.spyOn(console, 'error').mockImplementation(() => {});
    const sheet = createSpreadsheet();
    sheet.executeCommand(`set A1 text t ${'x'.repeat(MIB)}\nfilldown A1:A40 all`);

    expect(sheet.executeCommand('copy A1:A40 all')).toBe(true);
    expect(sheet.executeCommand('copy A1:A40 all')).toBe(true);
    expect(errors).not.toHaveBeenCalled();

    expect(sheet.executeCommand('copy A1:A40 all\ncopy A1:A40 all')).toBe(false);
    expect(loggedErrors(errors)).toEqual([`Error: ${LIMIT_ERROR}`]);
  });

  it('reports only budget refusals, not other failing commands', () => {
    const errors = vi.spyOn(console, 'error').mockImplementation(() => {});
    const sheet = createSpreadsheet();

    const batch = 'loadclipboard nosuchlinetype:1\npaste A1 all\nset A1 value n 1';
    expect(sheet.executeCommand(batch)).toBe(true);
    expect(errors).toHaveBeenCalledTimes(1);
    expect(cell(sheet, 'A1').datavalue).toBe(1);
    expect(sheet.executeCommand('\n')).toBe(true);
  });

  it('leaves no style renumbering behind when a copy is cut short', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const sheet = sheetWithLargeValue();
    sheet.executeCommand(
      [
        'set C1 text t b',
        'set C1 font normal bold * *',
        'set C2 text t a',
        'set C2 font italic normal * *',
      ].join('\n'),
    );
    expect([cell(sheet, 'C1').font, cell(sheet, 'C2').font]).toEqual([1, 2]);

    sheet.executeCommand('filldown A1:A100 all\ncopy A1:A100 all');
    sheet.executeCommand('sort C1:C2 C up');

    expect(cell(sheet, 'C1')).toMatchObject({ datavalue: 'a', font: 2 });
    expect(cell(sheet, 'C2')).toMatchObject({ datavalue: 'b', font: 1 });
  });

  it('lower-cases a sort key shared by filled rows only once', () => {
    const sheet = sheetWithLargeValue('A');
    const toLowerCase = String.prototype.toLowerCase;
    let largeKeys = 0;
    vi.spyOn(String.prototype, 'toLowerCase').mockImplementation(function (
      this: string,
    ) {
      if (this.length >= MIB) largeKeys += 1;
      return toLowerCase.call(this);
    });

    sheet.executeCommand('filldown A1:A100 all\nsort B1:B100 A up');

    expect(largeKeys).toBe(1);
  });

  it('still sorts text keys without regard to case', () => {
    const sheet = createSpreadsheet();
    sheet.executeCommand(
      [
        'set A1 text t b',
        'set A2 text t A',
        'set A3 text t a',
        'set A4 text t B',
        'set A5 value n 2',
      ].join('\n'),
    );

    sheet.executeCommand('sort A1:A5 A up');

    expect(sheet.exportCSV()).toBe('2\nA\na\nb\nB\n');
  });

  it('does not keep a large clipboard after its batch', () => {
    const sheet = sheetWithLargeValue();

    sheet.executeCommand('filldown A1:A3 all\ncopy A1:A3 all');
    sheet.executeCommand('paste C1 all');

    expect(sheet.exportCell('C1')).toBeNull();
  });

  it('keeps a command-sized clipboard for a later batch', () => {
    const sheet = createSpreadsheet();

    sheet.executeCommand('set A1 text t First\ncopy A1 all');
    sheet.executeCommand('paste C1 all');

    expect(cell(sheet, 'C1').datavalue).toBe('First');
  });
});
