import { describe, it, expect, vi, afterEach } from 'vite-plus/test';
import { MAX_MULTI_SHEETS } from '@ethercalc/shared';
import { HackFoldr, type FetchImpl } from '../src/Foldr.ts';
import {
  appendImportedWorkbook,
  getMaxSubsheetIndex,
  loadXlsx,
  parseFileToSheets,
  rewriteSheetReferences,
  sheetToSocialCalc,
  type XlsxApi,
} from '../src/importWorkbook.ts';

const encodeCell = ({ r, c }: { r: number; c: number }): string =>
  `${String.fromCharCode(65 + c)}${r + 1}`;

function fakeXlsx(
  sheetNames: readonly string[],
  sheets: Readonly<Record<string, unknown>>,
): XlsxApi {
  return {
    read: vi.fn().mockReturnValue({ SheetNames: sheetNames, Sheets: sheets }),
    utils: {
      decode_range: vi.fn().mockReturnValue({ s: { r: 0, c: 0 }, e: { r: 1, c: 2 } }),
      encode_cell: encodeCell,
    },
  };
}

function existingFoldr(tocFetch: FetchImpl): HackFoldr {
  const foldr = new HackFoldr('http://localhost', { fetchImpl: tocFetch });
  foldr.id = 'room';
  foldr.rows = [
    { link: '/room.1', title: 'Sheet1', row: 2 },
    { link: '/other.99', title: 'External', row: 3 },
    { link: '/room.5', title: 'Data', row: 4 },
  ];
  return foldr;
}

afterEach(() => {
  delete window.XLSX;
  vi.restoreAllMocks();
});

describe('browser SheetJS loader', () => {
  it('reuses SheetJS when the page already loaded it', async () => {
    const xlsx = fakeXlsx([], {});
    window.XLSX = xlsx;
    await expect(loadXlsx()).resolves.toBe(xlsx);
  });

  it('loads the tracked JSZip and SheetJS assets in order', async () => {
    const xlsx = fakeXlsx([], {});
    const loaded: string[] = [];
    const fakeWindow = {} as Window;
    const fakeDocument = {
      createElement: () => ({ src: '', onload: null, onerror: null }),
      head: {
        append: (script: HTMLScriptElement) => {
          loaded.push(script.src);
          if (script.src.endsWith('/static/xlsx.core.min.js')) fakeWindow.XLSX = xlsx;
          script.onload?.(new Event('load'));
        },
      },
    } as unknown as Document;

    await expect(loadXlsx(fakeWindow, fakeDocument)).resolves.toBe(xlsx);
    expect(loaded).toEqual(['/static/jszip.js', '/static/xlsx.core.min.js']);
  });

  it('rejects when a tracked parser asset cannot load', async () => {
    const fakeDocument = {
      createElement: () => ({ src: '', onload: null, onerror: null }),
      head: {
        append: (script: HTMLScriptElement) => script.onerror?.(new Event('error')),
      },
    } as unknown as Document;

    await expect(loadXlsx({} as Window, fakeDocument)).rejects.toThrow(
      'failed to load /static/jszip.js',
    );
  });

  it('rejects when the scripts load without initializing SheetJS', async () => {
    const fakeDocument = {
      createElement: () => ({ src: '', onload: null, onerror: null }),
      head: {
        append: (script: HTMLScriptElement) => script.onload?.(new Event('load')),
      },
    } as unknown as Document;

    await expect(loadXlsx({} as Window, fakeDocument)).rejects.toThrow(
      'SheetJS did not initialize',
    );
  });
});


  it('finds only numeric indices belonging to the current room', () => {
    expect(
      getMaxSubsheetIndex(
        ['/room.1', '/room.5', '/room.not-a-number', '/other.99', '/room.2'],
        'room',
      ),
    ).toBe(5);
    expect(getMaxSubsheetIndex([], 'room')).toBe(0);
  });

describe('workbook conversion', () => {
  it('preserves text, numbers, formulas, dimensions, and SocialCalc escaping', () => {
    const xlsx = fakeXlsx([], {});
    const save = sheetToSocialCalc(
      {
        '!ref': 'A1:C2',
        A1: { t: 's', v: 'a:b\\c\nd' },
        B1: { t: 'n', v: 42 },
        C1: { t: 'n', v: 42, f: 'Second!A1' },
        A2: { t: 'b', v: true },
      },
      xlsx,
    );

    expect(save).toContain('cell:A1:t:a\\cb\\bc\\nd');
    expect(save).toContain('cell:B1:v:42');
    expect(save).toContain('cell:C1:vtf:n:42:Second!A1');
    expect(save).not.toContain('cell:A2');
    expect(save).toContain('sheet:c:3:r:2:tvf:1');
    expect(save).toContain('copiedfrom:A1:C2');
  });

  it('produces a valid empty SocialCalc envelope for a blank worksheet', () => {
    const save = sheetToSocialCalc({}, fakeXlsx([], {}));
    expect(save).toContain('# SocialCalc Spreadsheet Control Save');
    expect(save).not.toContain('copiedfrom:');
  });

  it('rewrites cross-sheet formulas to allocated offset subroom ids', () => {
    const body = "cell:A1:vtf:n:1:Second!A1+'O''Brien'!B2";
    expect(rewriteSheetReferences(body, ['First', 'Second', "O'Brien"], 'room', 6)).toBe(
      "cell:A1:vtf:n:1:'room.7'!A1+'room.8'!B2",
    );
    expect(rewriteSheetReferences(body, [], 'room', 6)).toBe(body);
  });

  it('parses SocialCalc and CSV text without loading SheetJS', async () => {
    const socialCalc = await parseFileToSheets(
      new File(['socialcalc:version:1.5'], 'saved.socialcalc'),
    );
    const csv = await parseFileToSheets(new File(['a,b\n1,2'], 'data.csv'));

    expect(socialCalc[0]).toEqual({
      title: 'saved',
      contentType: 'text/x-socialcalc; charset=utf-8',
      body: 'socialcalc:version:1.5',
    });
    expect(csv[0]).toEqual({
      title: 'data',
      contentType: 'text/csv; charset=utf-8',
      body: 'a,b\n1,2',
    });
  });

  it('parses every workbook sheet into a SocialCalc save', async () => {
    const xlsx = fakeXlsx(
      ['First', 'Missing', 'Second'],
      {
        First: { '!ref': 'A1', A1: { t: 's', v: 'one' } },
        Second: { '!ref': 'A1', A1: { t: 'n', v: 2 } },
      },
    );
    const parsed = await parseFileToSheets(new File([new Uint8Array([1, 2])], 'book.xlsx'), xlsx);

    expect(parsed.map((sheet) => sheet.title)).toEqual(['First', 'Second']);
    expect(parsed.every((sheet) => sheet.contentType.startsWith('text/x-socialcalc'))).toBe(true);
  });

  it('uses the browser-loaded parser for a real workbook upload path', async () => {
    const xlsx = fakeXlsx(['Only'], {
      Only: { '!ref': 'A1', A1: { t: 's', v: 'loaded' } },
    });
    window.XLSX = xlsx;

    const parsed = await parseFileToSheets(
      new File([new Uint8Array([1, 2])], 'browser.xlsx'),
    );
    expect(parsed[0]?.body).toContain('cell:A1:t:loaded');
  });
});

describe('appendImportedWorkbook', () => {
  it('allocates strictly after the current room maximum and appends the TOC row', async () => {
    const tocFetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ command: [0, 'paste A5 all'] }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    ) as FetchImpl;
    const alert = vi.fn();
    const foldr = existingFoldr(tocFetch);
    const put = vi.fn().mockResolvedValue(new Response('OK', { status: 201 }));

    const result = await appendImportedWorkbook({
      foldr,
      index: 'room',
      basePath: 'http://localhost/',
      file: new File(['a,b'], 'Data.csv'),
      fetchImpl: put,
      alertImpl: alert,
    });
    expect(alert).not.toHaveBeenCalled();
    expect(result).toBe(true);

    expect(put).toHaveBeenCalledWith(
      'http://localhost/_/room.6',
      expect.objectContaining({ method: 'PUT', body: 'a,b' }),
    );
    expect(foldr.rows.at(-1)).toEqual({ link: '/room.6', title: 'Data_6', row: 5 });
  });

  it('rewrites workbook formulas using indices after the existing maximum', async () => {
    const tocFetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ command: [0, 'paste A6 all'] }), { status: 200 }),
    ) as FetchImpl;
    const foldr = existingFoldr(tocFetch);
    const put = vi.fn().mockResolvedValue(new Response('OK', { status: 201 }));
    const xlsx = fakeXlsx(
      ['First', 'Second'],
      {
        First: { '!ref': 'A1', A1: { t: 'n', v: 2, f: 'Second!A1' } },
        Second: { '!ref': 'A1', A1: { t: 'n', v: 2 } },
      },
    );

    await appendImportedWorkbook({
      foldr,
      index: 'room',
      basePath: 'http://localhost',
      file: new File([new Uint8Array([1])], 'book.xlsx'),
      fetchImpl: put,
      alertImpl: vi.fn(),
      xlsxImpl: xlsx,
    });

    expect(put.mock.calls[0]?.[1]?.body).toContain("'room.7'!A1");
    expect(put.mock.calls[1]?.[0]).toBe('http://localhost/_/room.7');
  });

  it('surfaces file-read, network, server 413, and TOC rejection failures', async () => {
    const alert = vi.fn();
    const readFailure = new File([''], 'book.xlsx');
    vi.spyOn(readFailure, 'arrayBuffer').mockRejectedValue(new Error('read failed'));
    const acceptedToc = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ command: [0, 'paste A5 all'] }), { status: 200 }),
    ) as FetchImpl;

    await expect(
      appendImportedWorkbook({
        foldr: existingFoldr(acceptedToc),
        index: 'room',
        basePath: '',
        file: readFailure,
        fetchImpl: vi.fn(),
        alertImpl: alert,
        xlsxImpl: fakeXlsx([], {}),
      }),
    ).resolves.toBe(false);
    expect(alert).toHaveBeenLastCalledWith('Import failed — could not parse file.');

    const csv = new File(['a'], 'data.csv');
    await appendImportedWorkbook({
      foldr: existingFoldr(acceptedToc),
      index: 'room',
      basePath: '',
      file: csv,
      fetchImpl: vi.fn().mockRejectedValue(new Error('offline')),
      alertImpl: alert,
    });
    expect(alert).toHaveBeenLastCalledWith('Import failed: Network error');

    await appendImportedWorkbook({
      foldr: existingFoldr(acceptedToc),
      index: 'room',
      basePath: '',
      file: csv,
      fetchImpl: vi.fn().mockResolvedValue(new Response('sheet exceeds limits', { status: 413 })),
      alertImpl: alert,
    });
    expect(alert).toHaveBeenLastCalledWith('Import failed (413): sheet exceeds limits');

    const rejectedToc = vi.fn().mockResolvedValue(
      new Response('TOC too large', { status: 413 }),
    ) as FetchImpl;
    const rejectedFoldr = existingFoldr(rejectedToc);
    const firstPut = vi.fn().mockResolvedValue(new Response('OK', { status: 201 }));
    await appendImportedWorkbook({
      foldr: rejectedFoldr,
      index: 'room',
      basePath: '',
      file: csv,
      fetchImpl: firstPut,
      alertImpl: alert,
    });
    expect(alert).toHaveBeenLastCalledWith(
      'Import failed: sheet saved, but the table of contents update was rejected.',
    );

    const retryPut = vi.fn().mockResolvedValue(new Response('OK', { status: 201 }));
    await appendImportedWorkbook({
      foldr: rejectedFoldr,
      index: 'room',
      basePath: '',
      file: csv,
      fetchImpl: retryPut,
      alertImpl: alert,
    });
    expect(retryPut.mock.calls[0]?.[0]).toBe('/_/room.7');
  });

  it('uses a fallback server message and refuses to exceed the shared sheet cap', async () => {
    const alert = vi.fn();
    const foldr = existingFoldr(vi.fn() as FetchImpl);
    await appendImportedWorkbook({
      foldr,
      index: 'room',
      basePath: '',
      file: new File(['a'], 'data.csv'),
      fetchImpl: vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        text: vi.fn().mockRejectedValue(new Error('response body unavailable')),
      } as unknown as Response),
      alertImpl: alert,
    });
    expect(alert).toHaveBeenLastCalledWith('Import failed (500): Server rejected sheet.');

    foldr.rows = Array.from({ length: MAX_MULTI_SHEETS }, (_, offset) => ({
      link: `/room.${offset + 1}`,
      title: `Sheet${offset + 1}`,
      row: offset + 2,
    }));
    const put = vi.fn();
    await appendImportedWorkbook({
      foldr,
      index: 'room',
      basePath: '',
      file: new File(['a'], 'extra.csv'),
      fetchImpl: put,
      alertImpl: alert,
    });
    expect(put).not.toHaveBeenCalled();
    expect(alert).toHaveBeenLastCalledWith(
      `Import failed: a workbook may contain at most ${MAX_MULTI_SHEETS} sheets.`,
    );
  });
});
