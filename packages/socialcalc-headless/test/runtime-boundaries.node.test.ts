import { describe, expect, it, vi } from 'vitest';
import { HeadlessSpreadsheet, HtmlSizeError, createSpreadsheet, csvToSave, loadSocialCalc } from '../src/index.js';

const SC = loadSocialCalc() as unknown as {
  Sheet: new () => { cells: Record<string, Record<string, unknown>> };
  FormatValueForDisplay: (sheet: unknown, value: unknown, coord: string) => string;
  FormatNumber: {
    formatNumberWithFormat: (value: number | string, format: string, currency: string) => string;
    formatTextWithFormat: (value: string, format: string) => string;
    parse_format_string: (definitions: unknown, format: string) => void;
    format_definitions: Record<string, unknown>;
  };
  FormatCellForExport: (sheet: unknown, cell: unknown, coord: string) => string;
  ConvertSaveToOtherFormat: (save: string, format: string) => string;
  special_chars: (text: string) => string;
  DetermineValueType: (value: string) => { value: unknown; type: string };
  LoadEditorSettings: (editor: SavedEditor, settings: string, flags?: unknown) => void;
  OffsetFormulaCoords: (formula: string, coloffset: number, rowoffset: number) => string;
  AdjustFormulaCoords: (
    formula: string,
    col: number,
    coloffset: number,
    row: number,
    rowoffset: number,
  ) => string;
  ReplaceFormulaCoords: (formula: string, movedto: Record<string, string>) => string;
  coordToCr: (coord: string) => { row: unknown; col: unknown };
  Popup: {
    Controls: Record<string, { type: string; data: Record<string, unknown> }>;
    Types: { ColorChooser: { MakeCustom: (type: string, id: string) => string } };
  };
  Formula: {
    StoreIoEventFormula: (
      functionName: string,
      coord: string,
      operandReverse: { type: string; value: string }[],
      sheet: unknown,
      ioParameters: string,
    ) => void;
  };
  TableEditor: {
    prototype: {
      GetStatuslineString: (
        status: string,
        arg: unknown,
        params: Record<string, unknown>,
      ) => string;
      LoadEditorSettings: (settings: string) => void;
    };
  };
};

type SavedEditor = {
  ecell?: unknown;
  context: {
    rowpanes?: { first: number; last: number }[];
    colpanes?: { first: number; last: number }[];
    highlights?: Record<string, string>;
  };
  range?: Record<string, unknown>;
  SettingsCallbacks: Record<string, unknown>;
};

function loadEditorSettings(settings: string): SavedEditor {
  const editor: SavedEditor = { context: {}, SettingsCallbacks: {} };
  SC.LoadEditorSettings(editor, `version:1.0\n${settings}\n`);
  return editor;
}

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
    expect(
      SC.FormatNumber.formatNumberWithFormat(4, '[style= color : RED ; font-weight:bold ]0', ''),
    ).toBe('<span style="color:red;font-weight:bold;">4</span>');
    expect(SC.FormatNumber.formatNumberWithFormat(4, '[style=color: ]0', '')).toBe('4');
    expect(SC.FormatNumber.formatNumberWithFormat(4, '[style=color:red ; ]0', '')).toBe('4');
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

  it('quotes CSV fields that contain a carriage return', () => {
    // An unquoted CR reads as a record terminator downstream (RFC 4180), so a
    // CR-filled cell would otherwise export as one row per CR. Direct saves
    // with raw CRs keep them quoted; executeCommand saves normalize CR to LF
    // before CSV quoting.
    expect(
      SC.ConvertSaveToOtherFormat(
        'version:1.5\ncell:A1:t:a\rb\ncell:B1:t:\r\r\rx\ncell:C1:t:end\nsheet:c:3:r:1\n',
        'csv',
      ),
    ).toBe('"a\rb","\r\r\rx",end\n');
    const sheet = createSpreadsheet();
    sheet.executeCommand('set A1 text t a\rb\nset B1 formula REPT("\r",3)\nset C1 text t end');
    expect(sheet.exportCSV()).toBe('"a\nb","\n\n\n",end\n');
  });

  it('checks a format style in linear time', () => {
    const blanks = ' '.repeat(200_000);
    const started = performance.now();
    expect(SC.FormatNumber.formatNumberWithFormat(4, `[style=color:red${blanks}x]0`, '')).toBe('4');
    expect(SC.FormatNumber.formatTextWithFormat('a', `[style=color:red${blanks}x]@`)).toBe('a');
    expect(
      SC.FormatNumber.formatNumberWithFormat(
        4,
        `[style=${blanks}color${blanks}:${blanks}red${blanks}]0`,
        '',
      ),
    ).toBe('<span style="color:red;">4</span>');
    expect(performance.now() - started).toBeLessThan(2_000);
  });

  it('keeps parsed number formats for a bounded amount of format text', () => {
    const cachedText = () =>
      Object.keys(SC.FormatNumber.format_definitions).reduce((sum, format) => sum + format.length, 0);
    let most = 0;
    for (let serial = 0; serial < 2000; serial++) {
      const format = `${';'.repeat(230)}"${String(serial).padStart(11, '0')}"`;
      expect(SC.FormatNumber.formatNumberWithFormat(4, format, '')).toBe(
        String(serial).padStart(11, '0'),
      );
      expect(SC.FormatNumber.formatNumberWithFormat(4, `0.0"${serial}"`, '')).toBe(`4.0${serial}`);
      expect(SC.FormatNumber.formatTextWithFormat('a', `@"${serial}"`)).toBe(`a${serial}`);
      most = Math.max(most, cachedText());
    }
    expect(most).toBeGreaterThan(16384);
    expect(most).toBeLessThanOrEqual(32768);
    expect(SC.FormatNumber.formatNumberWithFormat(4, '0.0"0"', '')).toBe('4.00');
    expect(SC.FormatNumber.formatNumberWithFormat(4, '0.0"0"', '')).toBe('4.00');
    for (let serial = 0; serial < 2000; serial++) {
      expect(SC.FormatNumber.formatNumberWithFormat(4, `[<0]"${serial}";[<1]0`, '')).toBe('4');
    }
    const long = `@"${'x'.repeat(40_000)}"`;
    expect(SC.FormatNumber.formatTextWithFormat('a', long)).toBe(`a${'x'.repeat(40_000)}`);
    expect(Object.keys(SC.FormatNumber.format_definitions)).toEqual([long]);
    expect(SC.FormatNumber.formatNumberWithFormat(4, '0.00', '')).toBe('4.00');
    expect(Object.keys(SC.FormatNumber.format_definitions)).toEqual(['0.00']);
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

    const cursor = SC.TableEditor.prototype.GetStatuslineString.call(
      {
        ecell: { coord: '<em>B2</em>' },
        range: { hasrange: false },
        context: { sheetobj: { attribs: {} } },
      },
      'startup',
      null,
      { calculating: false, command: false },
    );
    expect(cursor).toBe('&lt;em&gt;B2&lt;/em&gt; &nbsp; ');
  });

  it('ignores a saved cursor or range anchor that is not a cell coordinate', () => {
    const editor: SavedEditor = { context: {}, SettingsCallbacks: {} };
    SC.LoadEditorSettings(
      editor,
      'version:1.0\necell:<em>A1</em>\nrange:<em>A1</em>:1:2:1:2\n',
      undefined,
    );
    expect(editor).toMatchObject({
      ecell: { coord: 'A1', row: 1, col: 1 },
      range: { hasrange: false },
      context: { highlights: { A1: 'cursor' } },
    });
    expect(JSON.stringify(editor)).not.toContain('<em>');

    SC.LoadEditorSettings(editor, 'version:1.0\necell:\nrange\n', undefined);
    expect(editor).toMatchObject({ ecell: { coord: 'A1' }, range: { hasrange: false } });

    SC.LoadEditorSettings(editor, 'version:1.0\necell:B2\nrange:B2:2:3:2:3\n', undefined);
    expect(editor).toMatchObject({
      ecell: { coord: 'B2', row: 2, col: 2 },
      range: { hasrange: true, anchorcoord: 'B2', top: 2, bottom: 3, left: 2, right: 3 },
      context: { highlights: { B2: 'cursor', C3: 'range' } },
    });
  });

  it.each([
    ['Col', 'set A width <em>80</em>', 'coltoresize'],
    ['Row', 'set 1 height <em>80</em>', 'rowtoresize'],
  ] as const)('renders the %s resize indicator as text', (axis, command, target) => {
    const ui = SC as unknown as {
      Parse: new (command: string) => unknown;
      ExecuteSheetCommand: (sheet: unknown, command: unknown, saveundo: boolean) => void;
      RenderContext: new (sheet: unknown) => {
        CalculateColWidthData: () => void;
        CalculateRowHeightData: () => void;
      };
      EditorMouseInfo: { editor: unknown };
      SetMouseMoveUp: () => void;
      GetSpreadsheetControlObject: () => unknown;
      ProcessEditorColsizeMouseDown: (event: unknown, element: unknown, result: unknown) => void;
      ProcessEditorRowsizeMouseDown: (event: unknown, element: unknown, result: unknown) => void;
    };
    const sheet = new SC.Sheet();
    ui.ExecuteSheetCommand(sheet, new ui.Parse(command), false);
    const context = new ui.RenderContext(sheet);
    context.CalculateColWidthData();
    context.CalculateRowHeightData();

    const shown: { innerHTML: string }[] = [];
    const listen = vi.spyOn(ui, 'SetMouseMoveUp').mockImplementation(() => {});
    const control = vi
      .spyOn(ui, 'GetSpreadsheetControlObject')
      .mockReturnValue({ spreadsheetDiv: { firstChild: { offsetHeight: 0 } } });
    ui.EditorMouseInfo.editor = {
      toplevel: {
        appendChild: (node: { innerHTML: string }) => shown.push(node),
        getBoundingClientRect: () => ({ left: 0, right: 0, top: 0, bottom: 0 }),
      },
      context,
      headposition: { left: 0, top: 0 },
      colpositions: [0, 0],
      rowpositions: [0, 0],
    };
    try {
      ui[`ProcessEditor${axis}sizeMouseDown`]({ clientX: 0, clientY: 0 }, null, { [target]: 1 });
    } finally {
      ui.EditorMouseInfo.editor = null;
      listen.mockRestore();
      control.mockRestore();
    }

    expect(shown).toHaveLength(1);
    expect(shown[0]!.innerHTML).toContain('&lt;em&gt;80&lt;/em&gt;');
    expect(shown[0]!.innerHTML).not.toContain('<em>');
  });

  it('renders a stored color as text in the custom color dialog', () => {
    const stored = '"><iframe onload="window.x=1';
    SC.Popup.Controls['color-test'] = { type: 'ColorChooser', data: { value: stored } };
    const dialog = SC.Popup.Types.ColorChooser.MakeCustom('ColorChooser', 'color-test');
    expect(dialog).toContain('value="&quot;&gt;&lt;iframe onload=&quot;window.x=1"><br><br>');
    expect(dialog).not.toContain('<iframe');
    delete SC.Popup.Controls['color-test'];
  });

  it('keeps plain-text exports literal while HTML display stays escaped', () => {
    const saveWithFormat = (format: string) =>
      `version:1.5\ncell:A1:v:4:ntvf:1\nsheet:c:1:r:1\nvalueformat:1:${format}\n`;

    expect(SC.FormatNumber.formatNumberWithFormat(4, '"<b>"0', '')).toBe('&lt;b&gt;4');
    expect(SC.ConvertSaveToOtherFormat(saveWithFormat('"<b>"0'), 'csv')).toBe('<b>4\n');
    expect(SC.ConvertSaveToOtherFormat(saveWithFormat('"A&B"0'), 'tab')).toBe('A&B4\n');
    expect(SC.ConvertSaveToOtherFormat(saveWithFormat('"&lt;"0'), 'csv')).toBe('&lt;4\n');
  });

  it('formats plain-text exports without escaping and decoding each literal', () => {
    const save = (cell: string, format: string) =>
      `version:1.5\ncell:A1:${cell}:ntvf:1\nsheet:c:1:r:1\nvalueformat:1:${format}\n`;
    const escape = SC.special_chars;
    let escaped = 0;
    SC.special_chars = (text) => {
      escaped++;
      return escape(text);
    };
    try {
      expect(SC.ConvertSaveToOtherFormat(save('v:4', '"<b>"0*&[$&x]'), 'csv')).toBe('<b>4&&&&&&x\n');
      expect(SC.ConvertSaveToOtherFormat(save('vt:e#N/A:<i>&amp;', '0;0;0;"<"@'), 'tab')).toBe(
        '<<i>&amp;\n',
      );
      expect(SC.ConvertSaveToOtherFormat(save('vt:e#N/A:<i>', '0;0'), 'tab')).toBe('<i>\n');
      expect(escaped).toBe(0);

      expect(SC.FormatNumber.formatNumberWithFormat(4, '"<b>"0*&[$&x]', '')).toBe(
        '&lt;b&gt;4&amp;&amp;&amp;&amp;&amp;&amp;x',
      );
      expect(SC.FormatNumber.formatTextWithFormat('<i>', '0;0;0;"<"@')).toBe('&lt;&lt;i&gt;');
      expect(escaped).toBeGreaterThan(0);
    } finally {
      SC.special_chars = escape;
    }
  });

  it('returns to HTML escaping after a plain-text export throws', () => {
    const sheet = new SC.Sheet() as unknown as {
      attribs: Record<string, unknown>;
      valueformats: string[];
    };
    sheet.valueformats[1] = '"<b>"0';
    const cell = { valuetype: 'n', datavalue: 4, nontextvalueformat: 1 };
    const parse = SC.FormatNumber.parse_format_string;
    SC.FormatNumber.parse_format_string = () => {
      throw new Error('format parser failed');
    };
    try {
      expect(() => SC.FormatCellForExport(sheet, cell, 'A1')).toThrow('format parser failed');
    } finally {
      SC.FormatNumber.parse_format_string = parse;
    }
    expect(SC.FormatNumber.formatNumberWithFormat(4, '"<b>"0', '')).toBe('&lt;b&gt;4');
    expect(SC.FormatCellForExport(sheet, cell, 'A1')).toBe('<b>4');
  });

  it('resolves font defaults in one pass over each stored font', () => {
    const sheet = createSpreadsheet();
    sheet.executeCommand(
      [
        'set sheet defaultfont * 14pt Georgia',
        'set A1 text t x',
        'set A1 font * 12pt *',
        'set A2 text t y',
        'set A2 font italic bold * *',
        `set A3 font ${'a'.repeat(100_000)}`,
      ].join('\n'),
    );
    const started = performance.now();
    const html = sheet.createSheetHTML();
    expect(performance.now() - started).toBeLessThan(1000);
    expect(html).toContain(
      'font-style:normal;font-weight:normal;font-size:12pt;font-family:Georgia;',
    );
    expect(html).toContain('font-style:italic;font-weight:bold;font-size:14pt;font-family:Georgia;');
  });

  it('keeps stored cell formats inside their own style declarations', () => {
    const overlay = 'position:fixed;top:0;left:0;width:100vw;height:100vh;z-index:2147483647';
    const sheet = createSpreadsheet();
    sheet.executeCommand('set A1 text t styled');
    sheet.executeCommand(`set A1 cellformat center;${overlay}`);
    sheet.executeCommand(`set A1 layout padding:1px 2px 3px 4px;vertical-align:middle;${overlay};`);
    sheet.executeCommand(`set A1 font italic bold 12pt serif;${overlay}`);
    sheet.executeCommand(`set A1 color rgb(255,0,0);${overlay}`);
    sheet.executeCommand('set A1 bgcolor rgb(255,255,0);background-image:url(data:image/png,x)');
    sheet.executeCommand(`set A1 bt 1px solid rgb(0,0,0);${overlay}`);
    sheet.executeCommand('set A2 text t nested');
    sheet.executeCommand('set A2 cellformat left{}position:fixed');
    const html = sheet.createSheetHTML();
    expect(html).toContain(
      'style="padding:1px 2px 3px 4px;vertical-align:middle;font-style:italic;font-weight:bold;' +
        'font-size:12pt;font-family:serif;color:rgb(255,0,0);background-color:rgb(255,255,0);' +
        'text-align:center;border-top:1px solid rgb(0,0,0);"',
    );
    expect(html).not.toMatch(/position|z-index|100v[wh]|background-image/);

    const saved = createSpreadsheet({
      snapshot: sheet
        .createSpreadsheetSave()
        .replace(/^cellformat:1:.*$/m, 'cellformat:1:right;position\\cfixed'),
    });
    expect(saved.createSheetHTML()).toContain('text-align:right;');
    expect(saved.createSheetHTML()).not.toContain('position');
  });

  it('classifies values without backtracking and with unchanged results', () => {
    expect(SC.DetermineValueType(' 1,234.5 ')).toEqual({ value: 1234.5, type: 'n' });
    expect(SC.DetermineValueType('1.5e3')).toEqual({ value: 1500, type: 'n' });
    expect(SC.DetermineValueType('12.5 %')).toEqual({ value: 0.125, type: 'n%' });
    expect(SC.DetermineValueType('1,234 %')).toEqual({ value: 12.34, type: 'n%' });
    expect(SC.DetermineValueType('$ 5.')).toEqual({ value: 5, type: 'n$' });
    expect(SC.DetermineValueType('-$1,234.50')).toEqual({ value: -1234.5, type: 'n$' });
    expect(SC.DetermineValueType('1,2.3.4').type).toBe('t');
    expect(SC.DetermineValueType('<b x=">">bold</B>').type).toBe('th');
    expect(SC.DetermineValueType('<a <i>x</a>').type).toBe('th');
    expect(SC.DetermineValueType('<constructor>x').type).toBe('t');
    expect(SC.DetermineValueType('<a_b>x</a_b>').type).toBe('t');
    expect(SC.DetermineValueType('</b><b>').type).toBe('t');

    const groups = '1,'.repeat(28);
    const long = 100_000;
    for (const value of [
      `${groups}x`,
      `${groups}x%`,
      `$${groups}x`,
      `${'1'.repeat(long)}x`,
      `${'1'.repeat(long)}x%`,
      `$${'1'.repeat(long)}x`,
      `$${' '.repeat(long)}x`,
      `a${' '.repeat(long)}b`,
      '<a>'.repeat(long),
      '<a'.repeat(long),
    ]) {
      expect(SC.DetermineValueType(value).type).toBe('t');
    }
  });

  it('stops an HTML export at its character limit', () => {
    const sheet = createSpreadsheet();
    sheet.executeCommand(
      `set T20 text t end\nset sheet defaultfont normal normal 12pt ${'f'.repeat(200)}`,
    );
    const html = sheet.createSheetHTML();
    expect(html.length).toBeGreaterThan(20 * 20 * 200);
    expect(sheet.createSheetHTML(html.length)).toBe(html);
    expect(() => sheet.createSheetHTML(100_000)).toThrow(HtmlSizeError);
    expect(() => sheet.createSheetHTML(0)).toThrow('HTML export exceeds resource limits');

    expect(sheet.createSheetHTML()).toBe(html);
    const plain = createSpreadsheet();
    plain.executeCommand('set T20 text t end');
    expect(plain.createSheetHTML(100_000).length).toBeLessThan(100_000);
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

  it('records only cell coordinates as formula trigger cells', () => {
    const sheet = new SC.Sheet() as unknown as { ioEventTree: Record<string, unknown> };
    expect(Object.getPrototypeOf(sheet.ioEventTree)).toBeNull();
    for (const value of ['__proto__', 'constructor', 'B7!OTHER', '$B$7']) {
      const operands = [{ type: 'coord', value }];
      SC.Formula.StoreIoEventFormula('COPYVALUE', 'A2', operands, sheet, 'EventTree');
    }
    SC.Formula.StoreIoEventFormula(
      'COPYVALUE',
      'A3',
      [{ type: 'range', value: 'B7|B8|' }],
      sheet,
      'EventTree',
    );
    expect(Object.keys(sheet.ioEventTree)).toEqual(['B7', 'B8']);
    expect(Object.getPrototypeOf(sheet.ioEventTree['B7'])).toBeNull();
    expect(sheet.ioEventTree['B7']).toEqual({ A2: 'A2', A3: 'A3' });
    expect(sheet.ioEventTree['B8']).toEqual({ A3: 'A3' });
    expect(Object.hasOwn(Object.prototype, 'A2')).toBe(false);
  });

  it('keeps formula operand kinds and record separators out of stored value types', () => {
    const seed = createSpreadsheet().createSpreadsheetSave();
    const incoming = seed.replace(
      'sheet:c:1:r:1\n',
      'sheet:c:2:r:1\ncell:A1:vt:coord:__proto__\ncell:B1:vt:nd:45000\n',
    );
    const loaded = createSpreadsheet({ snapshot: incoming }).createSpreadsheetSave();
    expect(loaded).toContain('cell:A1:vt:e#VALUE!:__proto__');
    expect(loaded).toContain('cell:B1:vt:nd:45000');

    const sheet = createSpreadsheet();
    sheet.executeCommand(
      [
        'set AA1 value n 1',
        'set AB1 text coord __proto__',
        'set AC1 text range A1|A3000000|',
        'set AD1 constant name 1 x',
        'set AE1 text th <b>kept</b>',
        'set A2 formula COPYVALUE(VLOOKUP(1,AA1:AB1,2),AC1,AD1)',
        'set A3 formula COPYVALUE(VLOOKUP(1,AA1:AC1,3),AC1,AD1)',
        'set A4 formula 1+1',
      ].join('\n'),
    );
    const save = sheet.createSpreadsheetSave();
    expect(save).toContain('cell:AB1:vt:e#VALUE!:__proto__');
    expect(save).toContain('cell:AC1:vt:e#VALUE!:A1|A3000000|');
    expect(save).toContain('cell:AD1:vtc:e#VALUE!:1:x');
    expect(save).toContain('cell:AE1:vt:th:<b>kept</b>');
    expect(Object.hasOwn(Object.prototype, 'A2')).toBe(false);
    expect(sheet.exportCell('A4')).toMatchObject({ datavalue: 2 });

    const withSep = createSpreadsheet({
      snapshot: seed.replace(
        'sheet:c:1:r:1\n',
        'sheet:c:1:r:3\ncell:A1:vt:tx\rcell:Z99\ncell:A3:vtc:nd\rcol:45000:2023-03-15\n',
      ),
    });
    withSep.executeCommand('set B1 formula A1\nset C1 text t:q hello\nset D1 constant n:$ 5 $5\nset E1 text th kept');
    const sepSave = withSep.createSpreadsheetSave();
    expect(sepSave).toContain('cell:A1:vt:e#VALUE!:Z99');
    expect(sepSave).toContain('cell:A3:vtc:e#VALUE!:45000:2023-03-15');
    expect(sepSave).toContain('cell:B1:vtf:e#VALUE!:Z99:A1');
    expect(sepSave).toContain('cell:C1:vt:e#VALUE!:hello');
    expect(sepSave).toContain('cell:D1:vtc:e#VALUE!:5:$5');
    expect(sepSave).toContain('cell:E1:vt:th:kept');
    expect(sepSave).not.toContain('\r');
    expect(createSpreadsheet({ snapshot: sepSave }).createSpreadsheetSave()).toBe(sepSave);
  });

  it('parses a coordinate without keeping its text', () => {
    expect(SC.coordToCr('$AB$12')).toEqual({ row: 12, col: 28 });
    expect(SC.coordToCr('zz9')).toEqual({ row: 9, col: 702 });
    expect(SC.coordToCr('AAA1')).toEqual({ row: 1, col: 0 });
    expect(SC.coordToCr('constructor')).toEqual({ row: 0, col: 0 });
    for (const table of Object.values(SC)) {
      if (table && typeof table === 'object') expect(Object.hasOwn(table, '$AB$12')).toBe(false);
    }
    const sheet = createSpreadsheet();
    sheet.executeCommand('set A1 formula A1000+$B$2000+C1\ninsertrow A2\ninsertrow A2');
    const cells = sheet.exportCells() as Record<string, { formula: string }>;
    expect(cells['A1']?.formula).toBe('A1002+$B$2002+C1');
  });

  it('finds cross-sheet references among names that are not references', () => {
    const ss = createSpreadsheet();
    ss.executeCommand(
      [
        'set A1 formula localname+SUM(B1:B2)',
        'set A2 formula localname+bare.room-1!B2+"text"',
        'set A3 formula "quoted room"!B2&"not a room"',
        "set A4 formula 'single room'!B2+bare.room-1!C3",
      ].join('\n'),
    );
    expect(ss.findCrossSheetRefs()).toEqual(['bare.room-1', 'quoted room', 'single room']);
    expect(ss.findCrossSheetRefs(1)).toEqual(['bare.room-1']);
  });

  it('scans long names and special values in linear time', () => {
    const ss = createSpreadsheet();
    const name = 'a'.repeat(50_000);
    ss.executeCommand(
      [`set A1 formula ${name}`, `set A2 formula "${name}"+${name}+other!A1`].join('\n'),
    );
    const refStart = performance.now();
    expect(ss.findCrossSheetRefs()).toEqual(['other']);
    expect(performance.now() - refStart).toBeLessThan(2000);

    const digits = '1'.repeat(200_000);
    const tokStart = performance.now();
    ss.executeCommand(
      [
        `set B1 formula #${digits}`,
        'set B2 formula #12345678!',
        'set B3 formula #N/A',
        'set B4 formula #name?',
        'set B5 formula #REF!+1',
      ].join('\n'),
    );
    expect(performance.now() - tokStart).toBeLessThan(2000);
    const valuetype = (coord: string) => (ss.exportCell(coord) as { valuetype: string }).valuetype;
    expect(valuetype('B1')).toBe('e#VALUE!');
    expect(valuetype('B2')).toBe('e#NAME?');
    expect(valuetype('B3')).toBe('e#N/A');
    expect(valuetype('B4')).toBe('e#NAME?');
    expect(valuetype('B5')).toBe('e#REF!');
  });

  it('stops skipping hidden columns at grid bounds (1..702)', () => {
    const withinCap = createSpreadsheet();
    withinCap.executeCommand('set C hide yes\npane col 3');
    expect(withinCap.createSpreadsheetSave()).toContain('colpane:1:4:4');

    const last = createSpreadsheet();
    last.executeCommand('set ZZ hide yes\npane col 702');
    expect(last.createSpreadsheetSave()).toContain('colpane:1:51:51');

    const all = createSpreadsheet();
    all.executeCommand('set A:ZZ hide yes\npane col 1');
    expect(all.createSpreadsheetSave()).toContain('colpane:1:51:51');

    const beyond = createSpreadsheet();
    beyond.executeCommand('set ZZ hide yes\npane x 5000\nset A1 text t after');
    expect(beyond.exportCSV()).toContain('after');

    const negative = createSpreadsheet();
    negative.executeCommand('set A hide yes\npane x -10000000000000\nset A1 text t after');
    expect(negative.exportCSV()).toContain('after');

    const visible = createSpreadsheet();
    visible.executeCommand('set ZY hide yes\npane col 701');
    expect(visible.createSpreadsheetSave()).toContain('colpane:1:51:51');
  });

  it('evaluates FACT without an argument-sized loop', () => {
    const evaluate = (formula: string) => {
      const sheet = createSpreadsheet();
      sheet.executeCommand(`set A1 formula ${formula}\nrecalc`);
      const { datavalue, valuetype } = sheet.exportCell('A1') as Record<string, unknown>;
      return { datavalue, valuetype };
    };
    expect(evaluate('FACT(0)')).toEqual({ datavalue: 1, valuetype: 'n' });
    expect(evaluate('FACT(5)')).toEqual({ datavalue: 120, valuetype: 'n' });
    expect(evaluate('FACT(170)')).toEqual({ datavalue: 7.257415615308004e306, valuetype: 'n' });
    expect(evaluate('FACT(171)')).toEqual({ datavalue: 0, valuetype: 'e#NUM!' });
    expect(evaluate('FACT(1e17)')).toEqual({ datavalue: 0, valuetype: 'e#NUM!' });
    expect(evaluate('FACT(1e308)')).toEqual({ datavalue: 0, valuetype: 'e#NUM!' });
  });

  it('bounds the work of stored merge spans', () => {
    const seed = createSpreadsheet().createSpreadsheetSave();
    const withCells = (records: string, sheet = 'sheet:c:1:r:1') =>
      seed.replace('sheet:c:1:r:1\n', `${records}\n${sheet}\n`);

    const merged = createSpreadsheet({
      snapshot: withCells(
        'cell:A1:t:x:colspan:2:rowspan:2\ncell:C1:t:y\ncell:A3:t:z',
        'sheet:c:3:r:3',
      ),
    });
    expect(merged.createSheetHTML()).toContain('id="cell_A1" colspan="2" rowspan="2"');
    merged.executeCommand('insertcol B\ninsertrow A2');
    expect(merged.createSpreadsheetSave()).toContain('cell:A1:t:x:colspan:3:rowspan:3');
    expect(merged.createSheetHTML()).toContain('id="cell_A1" colspan="3" rowspan="3"');

    const canonical = createSpreadsheet({ snapshot: withCells('cell:A1:t:x:colspan:3:rowspan:2') });
    canonical.executeCommand('insertcol B');
    expect(canonical.createSpreadsheetSave()).toContain('cell:A1:t:x:colspan:4:rowspan:2');

    for (const span of [
      'colspan:9007199254740991',
      'rowspan:9007199254740991',
      'colspan:Infinity:rowspan:Infinity',
      'colspan:702:rowspan:1048576',
    ]) {
      const hostile = createSpreadsheet({ snapshot: withCells(`cell:A1:t:x:${span}`) });
      const html = hostile.createSheetHTML();
      expect(html).toContain('id="cell_A1"');
      expect(html).not.toContain('colspan=');
      expect(html).not.toContain('rowspan=');
      hostile.executeCommand('insertrow A2\ninsertcol B\ndeleterow A2\ndeletecol B');
      expect(hostile.exportCSV()).toBe('x\n');
    }

    const viaCommand = createSpreadsheet();
    viaCommand.executeCommand('set A1 all :t:x:colspan:9007199254740991\ninsertrow A2');
    expect(viaCommand.exportCSV()).toBe('x\n');

    const spent = createSpreadsheet({
      snapshot: withCells('cell:A1:t:x:rowspan:400000\ncell:B1:t:y:colspan:2', 'sheet:c:2:r:1'),
    });
    const spentHtml = spent.createSheetHTML();
    expect(spentHtml).toContain('id="cell_A1" rowspan=');
    expect(spentHtml).not.toContain('colspan=');
  });

  it('ignores saved style records that would leave a sparse style table', () => {
    const tables = {
      layout: 'layouts',
      font: 'fonts',
      color: 'colors',
      border: 'borderstyles',
      cellformat: 'cellformats',
      valueformat: 'valueformats',
    } as const;
    const parse = (save: string) => {
      const sheet = new SC.Sheet() as unknown as Record<string, string[]> & {
        ParseSheetSave: (save: string) => void;
      };
      sheet.ParseSheetSave(save);
      return sheet;
    };
    for (const [record, table] of Object.entries(tables)) {
      for (const index of ['80000000', '8e7', '0x4C4B400', '3']) {
        const sheet = parse(
          `version:1.5\ncell:A1:t:hello\nsheet:c:1:r:1\n${record}:1:kept\n${record}:${index}:dropped\n`,
        );
        expect(sheet[table]!.length, `${record}:${index}`).toBe(2);
        expect(sheet[table]![1]).toBe('kept');
      }
    }
    const dense = Array.from({ length: 300 }, (_, i) => `valueformat:${i + 1}:f${i + 1}`);
    const loaded = parse(`version:1.5\n${dense.join('\n')}\nvalueformat:2:again\n`).valueformats!;
    expect(loaded).toHaveLength(301);
    expect(loaded[2]).toBe('again');
    expect(loaded[300]).toBe('f300');

    const exported = createSpreadsheet({
      snapshot: createSpreadsheet()
        .createSpreadsheetSave()
        .replace('sheet:c:1:r:1\n', 'sheet:c:1:r:1\nvalueformat:80000000:x\n'),
    }).exportSheetData();
    expect(exported.valueformats).toHaveLength(0);
  });

  it('takes only columns as sort keys', () => {
    const rows = 'set A1 value n 3\nset A2 value n 1\nset A3 value n 2';
    const sorted = createSpreadsheet();
    sorted.executeCommand(rows);
    sorted.executeCommand('sort A1:A3 A up');
    expect(sorted.exportCSV()).toBe('1\n2\n3\n');

    const errors = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      for (const key of ['A'.repeat(300), 'AAA', 'A1']) {
        const sheet = createSpreadsheet();
        sheet.executeCommand(rows);
        sheet.executeCommand(`sort A1:A3 ${key} up`);
        expect(errors).toHaveBeenLastCalledWith(
          'Error in ExecuteSheetCommand:',
          expect.stringMatching(/^Error: Invalid sort column\n/),
        );
        expect(Object.keys(sheet.exportCells()), key).toEqual(['A1', 'A2', 'A3']);
        expect(sheet.exportCSV(), key).toBe('3\n1\n2\n');
      }
    } finally {
      errors.mockRestore();
    }
  });

  it('reads a saved record that ends before a value as one with an empty value', () => {
    const seed = createSpreadsheet();
    seed.executeCommand('set A1 text t January\nset B1 text t February\nset C1 formula LEN(A1)&"x"');
    const save = seed.createSpreadsheetSave();
    const load = (records: string) => {
      const incoming = save.replace('cell:A1:t:January\n', `${records}\n`);
      expect(incoming).not.toBe(save);
      return createSpreadsheet({ snapshot: incoming });
    };

    const logged: unknown[][] = [];
    const original = console.error;
    console.error = (...args: unknown[]) => logged.push(args);
    try {
      for (const [short, full] of [
        ['cell:A1:t', 'cell:A1:t:'],
        ['cell:A1:v', 'cell:A1:v:'],
        ['cell:A1:vt', 'cell:A1:vt::'],
        ['cell:A1:vt:t', 'cell:A1:vt:t:'],
        ['cell:A1:vt:n', 'cell:A1:vt:n:'],
        ['cell:A1:vtf', 'cell:A1:vtf:::'],
        ['cell:A1:vtf:t', 'cell:A1:vtf:t::'],
        ['cell:A1:vtf:t:x', 'cell:A1:vtf:t:x:'],
        ['cell:A1:vtc:th', 'cell:A1:vtc:th::'],
        ['cell:A1:t:x:ro', 'cell:A1:t:x:ro:'],
        ['cell:A1:t:January:f:1\nfont:1', 'cell:A1:t:January:f:1\nfont:1:'],
        ['cell:A1:vtf:n:1:TOTAL\nname:TOTAL', 'cell:A1:vtf:n:1:TOTAL\nname:TOTAL::'],
      ] as const) {
        const sheet = load(short);
        const expected = load(full);
        expect(sheet.createSheetSave(), short).toBe(expected.createSheetSave());
        expect(sheet.createSheetHTML(), short).toContain('February');
        sheet.recalc();
        expected.recalc();
        expect(sheet.createSheetSave(), short).toBe(expected.createSheetSave());
        expect(sheet.createSheetHTML(), short).toContain('February');
      }

      const commanded = createSpreadsheet();
      commanded.executeCommand('set B1 text t February\nset A1 all :t');
      expect(commanded.exportCell('A1')).toMatchObject({ datatype: 't', datavalue: '' });
      expect(commanded.createSheetHTML()).toContain('February');
    } finally {
      console.error = original;
    }
    expect(logged).toEqual([]);
  });

  it('parses a clipboard text once however often one batch pastes it', () => {
    const namespace = loadSocialCalc();
    const sheet = new HeadlessSpreadsheet(namespace, new namespace.SpreadsheetControl());
    const clipboard = namespace.Clipboard;
    const parse = vi.spyOn(SC.Sheet.prototype, 'ParseSheetSave');
    const errors = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      const load = 'loadclipboard cell:A1:t:x\\ncopiedfrom:A1:A1\n';
      sheet.executeCommand(`${load}paste A1 all\npaste B1 all\npaste C2 formulas`);
      expect(parse).toHaveBeenCalledTimes(1);
      expect(clipboard.parsedText).toBeNull();
      expect(clipboard.parsedSheet).toBeNull();
      expect(sheet.exportCSV()).toBe('x,x,\n,,x\n');

      parse.mockClear();
      sheet.executeCommand(
        `${load}paste A1 all\nset D1 text t y\ncopy D1 all\npaste A1 all\npaste A2 all\n` +
          'cut A1 all\npaste B2 all\npaste D2 all',
      );
      expect(parse).toHaveBeenCalledTimes(3);
      expect(sheet.exportCSV()).toBe(',x,,y\ny,y,x,y\n');

      parse.mockClear();
      sheet.executeCommand(
        `loadclipboard cell:A1:t:z\\ncol:A:zz\\ncopiedfrom:A1:A1\n${'paste A1 all\n'.repeat(3)}`,
      );
      expect(parse).toHaveBeenCalledTimes(1);
      expect(errors).toHaveBeenCalledTimes(1);
      expect(sheet.exportCSV()).toBe(',x,,y\ny,y,x,y\n');
    } finally {
      parse.mockRestore();
      errors.mockRestore();
    }
  });

  it('treats missing/malformed default styles and sparse font/layout tables safely', () => {
    const cells = [
      'set A1 text t Hello',
      'set A2 font * * Arial',
      'set A3 layout padding:* * * 9px;vertical-align:*;',
    ];
    const plain = createSpreadsheet();
    plain.executeCommand(cells.join('\n'));
    const html = plain.createSheetHTML();
    expect(html).toContain('Hello');

    const sheet = createSpreadsheet();
    sheet.executeCommand([...cells, 'set sheet defaultfont x', 'set sheet defaultlayout y'].join('\n'));
    expect(sheet.createSheetHTML()).toBe(html);
    const save = sheet.createSpreadsheetSave();
    expect(save).toMatch(/^font:\d+:x$/m);
    expect(save).toMatch(/^layout:\d+:y$/m);
    expect(createSpreadsheet({ snapshot: save }).createSheetHTML()).toBe(html);

    const dangling = plain
      .createSpreadsheetSave()
      .replace(/^sheet:.*$/m, (record) => `${record}:layout:9:font:9`);
    expect(createSpreadsheet({ snapshot: dangling }).createSheetHTML()).toBe(html);

    // Sparse style tables (e.g. font:3 or layout:3 with holes at 1, 2) must not throw.
    const sparse = plain
      .createSpreadsheetSave()
      .replace('sheet:c:1:r:3', 'sheet:c:1:r:3\nfont:3:normal bold 12pt *\nlayout:3:padding:1px 2px 3px 4px;vertical-align:top;');
    expect(createSpreadsheet({ snapshot: sparse }).createSheetHTML()).toContain('Hello');

    const settingsSheet = new SC.Sheet() as unknown as {
      ParseSheetSave: (save: string) => void;
      EncodeSheetAttributes: () => Record<string, { def: boolean; val: string }>;
      EncodeCellAttributes: (coord: string) => Record<string, { def: boolean; val: string }>;
    };
    for (const styles of ['font:1:x\nlayout:1:y\n', '']) {
      settingsSheet.ParseSheetSave(`version:1.5\ncell:A1:t:Hello:f:1:l:1\nsheet:c:1:r:1:layout:1:font:1\n${styles}`);
      for (const attribs of [settingsSheet.EncodeSheetAttributes(), settingsSheet.EncodeCellAttributes('A1')]) {
        for (const name of ['fontfamily', 'fontlook', 'fontsize', 'padtop', 'padleft', 'alignvert']) {
          expect(attribs[name], name).toEqual({ def: true, val: '' });
        }
      }
    }
  });

  it('restores saved editor panes and selections and bounds frozen panes', () => {
    const editor = loadEditorSettings(
      'rowpane:0:1:3\nrowpane:1:4:103\ncolpane:0:2:16\necell:B2\nrange:B2:2:4:2:3',
    );
    expect(editor.context.rowpanes).toEqual([
      { first: 1, last: 3 },
      { first: 4, last: 103 },
    ]);
    expect(editor.context.colpanes).toEqual([{ first: 2, last: 16 }]);
    expect(editor.range).toMatchObject({ hasrange: true, top: 2, bottom: 4, left: 2, right: 3 });
    expect(editor.context.highlights).toMatchObject({ B2: 'cursor', C4: 'range' });

    const wholeSheet = loadEditorSettings('range:A1:1:1000:1:200');
    expect(Object.keys(wholeSheet.context.highlights!)).toHaveLength(200_000);

    for (const setting of [
      'range:A1:1:1:1:1000000000000000',
      'range:A1:1:100000000:1:702',
      'range:A1:1:1001:1:200',
      'range:A1:1:1048577:1:1',
      'range:A1:1:1:1:703',
      'range:A1:3:1:1:1',
      'range:A1:1:1:3:1',
      'range:A1:0:1:1:1',
      'range:A1:1:1.5:1:1',
      'range:A1:1:x:1:1',
      'range:A1:1:Infinity:1:1',
      'range:A1:1:1',
      'rowpane:0:1:1000000000000000',
      'rowpane:0:1000000000:1',
      'rowpane:0:0:1',
      'rowpane:0:1048576:1048577',
      'rowpane:2:1:2',
      'rowpane:4294967290:1:2',
      'rowpane:-1:1:2',
      'rowpane:0.5:1:2',
      'rowpane:0:1',
      'rowpane:0:1:5:9',
      'rowpane:0:1e300:1e300',
      'rowpane:0:Infinity:Infinity',
      'rowpane:x:1:5',
      'colpane:0:1:1000000000000000',
      'colpane:0:702:703',
      'colpane:2:1:2',
      'colpane:0:1e300:1e300',
    ]) {
      const ignored = loadEditorSettings(`${setting}\necell:A1`);
      expect(ignored.context.rowpanes, setting).toEqual([{ first: 1, last: 1 }]);
      expect(ignored.context.colpanes, setting).toEqual([{ first: 1, last: 1 }]);
      expect(ignored.range, setting).toEqual({ hasrange: false });
      expect(ignored.context.highlights, setting).toEqual({ A1: 'cursor' });
    }

    const firstRangeOnly = loadEditorSettings(
      'range:A1:1:1:1:2\n' + 'range:C3:3:1002:3:202\n'.repeat(5000),
    );
    expect(firstRangeOnly.range).toMatchObject({ anchorcoord: 'A1', top: 1, bottom: 1, left: 1, right: 2 });
    expect(firstRangeOnly.context.highlights).toEqual({ A1: 'range', B1: 'range' });

    const panes = (save: string) => save.split('\n').filter((line) => /^(row|col)pane:/.test(line));
    const frozen = ['rowpane:0:1:200', 'rowpane:1:201:201', 'colpane:0:1:50', 'colpane:1:51:51'];
    const sheet = createSpreadsheet();
    sheet.executeCommand('pane row 5\npane col 3');
    expect(panes(sheet.createSpreadsheetSave())).toEqual([
      'rowpane:0:1:4',
      'rowpane:1:5:5',
      'colpane:0:1:2',
      'colpane:1:3:3',
    ]);
    sheet.executeCommand('pane row 1048576\npane col 702');
    expect(panes(sheet.createSpreadsheetSave())).toEqual(frozen);
    sheet.executeCommand('pane row 1\npane col 1');
    expect(panes(sheet.createSpreadsheetSave())).toEqual(['rowpane:0:1:200', 'colpane:0:1:50']);

    const unnamed = createSpreadsheet();
    unnamed.executeCommand('pane diagonal 9999999');
    expect(panes(unnamed.createSpreadsheetSave())).toEqual([
      'rowpane:0:1:1',
      'colpane:0:1:50',
      'colpane:1:51:51',
    ]);
    const hidden = createSpreadsheet();
    hidden.executeCommand('set 5:400 hide yes\nset C:BZ hide yes\npane row 5\npane col 3');
    expect(panes(hidden.createSpreadsheetSave())).toEqual(frozen);

    const clamped = loadEditorSettings(
      'rowpane:0:1:1048575\nrowpane:1:1048576:1048576\ncolpane:0:3:701\ncolpane:1:702:702',
    );
    expect(clamped.context.rowpanes).toEqual([
      { first: 1, last: 200 },
      { first: 1048576, last: 1048576 },
    ]);
    expect(clamped.context.colpanes).toEqual([
      { first: 3, last: 52 },
      { first: 702, last: 702 },
    ]);
  });

  it('keeps untokenizable formulas as typed when rewriting coordinates', () => {
    for (const formula of ['A1+{2', '<<<<A1', 'A1&"unterminated', '1e+', '#foo']) {
      expect(SC.OffsetFormulaCoords(formula, 1, 1)).toBe(formula);
      expect(SC.AdjustFormulaCoords(formula, 1, 1, 1, 1)).toBe(formula);
      expect(SC.ReplaceFormulaCoords(formula, { A1: 'C3' })).toBe(formula);
    }
    expect(SC.OffsetFormulaCoords('a1+B2', 1, 1)).toBe('B2+C3');
    expect(SC.AdjustFormulaCoords('a1+B2', 1, 1, 1, 1)).toBe('B2+C3');
    expect(SC.ReplaceFormulaCoords('a1+B2', { A1: 'C3' })).toBe('C3+B2');

    const formula = 'A1+' + '{'.repeat(1000);
    const save = csvToSave(`=${formula}\n`);
    expect(save.length).toBeLessThan(2 * formula.length + 1000);
    const sheet = createSpreadsheet({ snapshot: save });
    expect((sheet.exportCell('A1') as { formula?: string }).formula).toBe(formula);

    sheet.executeCommand(
      'copy A1 formulas\npaste B2 formulas\ninsertrow A1\nmovepaste A2 A3 formulas',
    );
    expect((sheet.exportCell('B3') as { formula?: string }).formula).toBe(formula);
    expect((sheet.exportCell('A3') as { formula?: string }).formula).toBe(formula);
  });

  it('treats SELECT values and save boundaries as literal text', () => {
    const selectSheet = createSpreadsheet();
    selectSheet.executeCommand('set A1 formula SELECT("C++","C,C++")\nset B1 formula 1+1');
    expect((selectSheet.exportCell('A1') as { datavalue: unknown }).datavalue).toBe('C++');
    expect((selectSheet.exportCell('B1') as { datavalue: unknown }).datavalue).toBe(2);

    const source = createSpreadsheet();
    source.executeCommand('set A1 text t kept');
    const snapshot = source
      .createSpreadsheetSave()
      .replaceAll('SocialCalcSpreadsheetControlSave', '(x+x+)+y');
    expect(createSpreadsheet({ snapshot }).exportCSV()).toBe('kept\n');
    const viewer = loadSocialCalc() as unknown as {
      SpreadsheetViewerDecodeSpreadsheetSave(viewer: unknown, save: string): Record<string, unknown>;
    };
    expect(viewer.SpreadsheetViewerDecodeSpreadsheetSave(null, snapshot).sheet).toBeDefined();
  });
});

describe('SocialCalc save line boundaries', () => {
  const BOUNDARY = '--SocialCalcSpreadsheetControlSave';
  const SEPARATORS = ['\r', '\u2028', '\u2029'];

  type SavedCell = { datavalue: unknown; errors?: string };
  const cellsOf = (snapshot: string) =>
    createSpreadsheet({ snapshot }).exportCells() as Record<string, SavedCell>;

  it('saves every kind of line break in a field as the escaped line feed', () => {
    const sheet = createSpreadsheet();
    sheet.executeCommand('set A1 text t x');
    (sheet.exportCells() as Record<string, SavedCell>).A1!.datavalue = 'a\r\nb\rc\u2028d\u2029e\nf';
    const save = sheet.createSpreadsheetSave();
    expect(save).toContain('cell:A1:t:a\\nb\\nc\\nd\\ne\\nf\n');
    expect(cellsOf(save).A1!.datavalue).toBe('a\nb\nc\nd\ne\nf');
  });

  it('keeps the cells after imported text that ends in a line break and the part boundary', () => {
    for (const separator of SEPARATORS) {
      const save = csvToSave(`"note${separator}${BOUNDARY}"\nrow2\nrow3\n`);
      expect(save).not.toMatch(/[\r\u2028\u2029]/);
      const cells = cellsOf(save);
      expect(Object.keys(cells)).toEqual(['A1', 'A2', 'A3']);
      expect(cells.A1!.datavalue).toBe(`note\n${BOUNDARY}`);
    }
  });

  it('keeps the cells after an error text taken from another sheet', () => {
    for (const separator of SEPARATORS) {
      const sheet = createSpreadsheet();
      sheet.executeCommand(
        ['set A1 formula "rates"!A1*10', 'set A2 text t payroll', 'set A3 text t reserve'].join('\n'),
      );
      sheet.addSiblingSheet('rates', `cell:A1:vt:ex${separator}${BOUNDARY}:0\n`);
      sheet.recalc();
      const cells = cellsOf(sheet.createSpreadsheetSave());
      expect(Object.keys(cells)).toEqual(['A1', 'A2', 'A3']);
      expect(cells.A1!.errors).toBe(separator === '\r' ? '#VALUE!' : `x\n${BOUNDARY}`);
    }
  });

  it('reads a stored save with such a line break in a field to its real end', () => {
    const sheet = createSpreadsheet();
    sheet.executeCommand('set A1 text t first\nset A2 text t second\nset A3 text t third');
    const save = sheet.createSpreadsheetSave();
    for (const separator of SEPARATORS) {
      for (const tail of [BOUNDARY, `${BOUNDARY}--`]) {
        const stored = save.replace('cell:A1:t:first\n', `cell:A1:t:first${separator}${tail}\n`);
        expect(stored).not.toBe(save);
        expect(Object.keys(cellsOf(stored))).toEqual(['A1', 'A2', 'A3']);
      }
    }
    expect(Object.keys(cellsOf(save.replace(/\n/g, '\r\n')))).toEqual(['A1', 'A2', 'A3']);
  });

  it('reports the rectangle a save will serialize without serializing it', () => {
    const sheet = createSpreadsheet();
    expect(sheet.saveDimensions()).toEqual({ rows: 1, columns: 1 });

    // Row/column settings extend the canonical sheet although they leave
    // `lastrow`/`lastcol` alone; lowering `lastrow` does not shrink it.
    sheet.executeCommand('set B3 bgcolor rgb(255,0,0)\nset 1048576 height 20\nset ZZ hide yes');
    sheet.executeCommand('set sheet lastrow 1');
    expect(sheet.exportSheetData().attribs).toMatchObject({ lastrow: 1, lastcol: 2 });
    expect(sheet.saveDimensions()).toEqual({ rows: 1_048_576, columns: 702 });

    sheet.executeCommand('set 1048576 height\nset ZZ hide');
    expect(sheet.saveDimensions()).toEqual({ rows: 3, columns: 2 });
    // The probe leaves no translation tables behind: the save that follows
    // declares the same rectangle and still encodes the cell's style.
    const save = sheet.createSheetSave();
    expect(save).toContain('sheet:c:2:r:3\n');
    expect(save).toContain('cell:B3:bg:1\n');
    expect(createSpreadsheet({ snapshot: sheet.createSpreadsheetSave() }).createSheetSave()).toBe(save);
  });
});
