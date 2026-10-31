import { describe, expect, it } from 'vitest';
import { createSpreadsheet, loadSocialCalc } from '../src/index.js';

const SC = loadSocialCalc() as unknown as {
  Sheet: new () => { cells: Record<string, Record<string, unknown>> };
  FormatValueForDisplay: (sheet: unknown, value: unknown, coord: string) => string;
  FormatNumber: {
    formatNumberWithFormat: (value: number | string, format: string, currency: string) => string;
    formatTextWithFormat: (value: string, format: string) => string;
  };
  ConvertSaveToOtherFormat: (save: string, format: string) => string;
  TableEditor: {
    prototype: {
      GetStatuslineString: (
        status: string,
        arg: unknown,
        params: Record<string, unknown>,
      ) => string;
    };
  };
};

describe('SocialCalc runtime boundaries', () => {
  it('renders cell errors and format text as text', () => {
    const sheet = new SC.Sheet();
    sheet.cells['A1'] = { valuetype: 'e', errors: '<em>error</em>' };
    expect(SC.FormatValueForDisplay(sheet, '', 'A1')).toBe('&lt;em&gt;error&lt;/em&gt;');
    sheet.cells['A1'] = { valuetype: 'e<em>subtype</em>' };
    expect(SC.FormatValueForDisplay(sheet, '', 'A1')).toBe('&lt;em&gt;subtype&lt;/em&gt;');

    expect(SC.FormatNumber.formatNumberWithFormat(4, '"<em>"0', '')).toContain('&lt;em&gt;');
    expect(SC.FormatNumber.formatNumberWithFormat(4, '[$<em>x</em>]0', '')).toContain('&lt;em&gt;');
    expect(SC.FormatNumber.formatNumberWithFormat(4, '_x0', '')).toBe('&nbsp;4');
    expect(SC.FormatNumber.formatTextWithFormat('a', '_x@')).toBe('&nbsp;a');
    expect(SC.FormatNumber.formatNumberWithFormat(4, '[style=font-weight:bold]0', '')).toBe(
      '<span style="font-weight:bold;">4</span>',
    );
    expect(
      SC.FormatNumber.formatNumberWithFormat(
        4,
        '[style=background:url(https://example.test/x)]0',
        '',
      ),
    ).toBe('4');
    expect(
      SC.FormatNumber.formatTextWithFormat(
        'a',
        '[style=background:url(https://example.test/x)]@',
      ),
    ).toBe('a');
    expect(SC.FormatNumber.formatTextWithFormat('<em>text</em>', '0;0;0;@')).toBe(
      '&lt;em&gt;text&lt;/em&gt;',
    );
    expect(SC.FormatNumber.formatTextWithFormat('<em>text</em>', '0;0')).toBe(
      '&lt;em&gt;text&lt;/em&gt;',
    );

    const formatted = sheet as unknown as {
      cells: Record<string, Record<string, unknown>>;
      valueformats: string[];
    };
    formatted.valueformats[1] = '0;0;0;@';
    formatted.cells['A1'] = {
      valuetype: 't',
      datavalue: '<em>text</em>',
      nontextvalueformat: 1,
    };
    expect(SC.FormatValueForDisplay(sheet, '<em>text</em>', 'A1')).toBe(
      '&lt;em&gt;text&lt;/em&gt;',
    );
    formatted.valueformats[2] = '"<em>"0';
    formatted.cells['A1'] = { valuetype: 'n', datavalue: 4, nontextvalueformat: 2 };
    expect(SC.FormatValueForDisplay(sheet, 4, 'A1')).toContain('&lt;em&gt;');
  });

  it('renders status data as text', () => {
    const status = SC.TableEditor.prototype.GetStatuslineString.call(
      {
        ecell: { coord: 'A1' },
        range: { hasrange: false },
        context: { sheetobj: { attribs: { circularreferencecell: '<em>A1</em>' } } },
      },
      'startup',
      null,
      { calculating: false, command: false },
    );
    expect(status).toContain('&lt;em&gt;A1&lt;/em&gt;');
    expect(status).not.toContain('<em>A1</em>');
  });

  it('keeps plain-text exports literal while HTML display stays escaped', () => {
    const saveWithFormat = (format: string) =>
      `version:1.5\ncell:A1:v:4:ntvf:1\nsheet:c:1:r:1\nvalueformat:1:${format}\n`;

    expect(SC.FormatNumber.formatNumberWithFormat(4, '"<b>"0', '')).toBe('&lt;b&gt;4');
    expect(SC.ConvertSaveToOtherFormat(saveWithFormat('"<b>"0'), 'csv')).toBe('<b>4\n');
    expect(SC.ConvertSaveToOtherFormat(saveWithFormat('"A&B"0'), 'tab')).toBe('A&B4\n');
    expect(SC.ConvertSaveToOtherFormat(saveWithFormat('"&lt;"0'), 'csv')).toBe('&lt;4\n');
  });

  it('ignores malformed saved cell coordinates without affecting other sheets', () => {
    const seed = createSpreadsheet().createSpreadsheetSave();
    const incoming = seed.replace('sheet:c:1:r:1\n', 'sheet:c:1:r:1\ncell:__proto__:e:foreign\n');
    const sheet = createSpreadsheet({ snapshot: incoming });
    expect(sheet.createSpreadsheetSave()).not.toContain('cell:__proto__');
    expect(Object.hasOwn(Object.prototype, 'errors')).toBe(false);

    const separate = createSpreadsheet();
    separate.executeCommand('set A1 text t intact');
    expect(separate.exportCSV()).toBe('intact\n');
  });
});
