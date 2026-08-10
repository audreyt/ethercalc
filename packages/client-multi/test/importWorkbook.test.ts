import { describe, it, expect, vi } from 'vite-plus/test';
import { MAX_MULTI_SHEETS } from '@ethercalc/shared';
import { HackFoldr, type FetchImpl } from '../src/Foldr.ts';
import {
  appendImportedWorkbook,
  getMaxSubsheetIndex,
  parseFileToSheets,
  rewriteSheetReferences,
} from '../src/importWorkbook.ts';

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

describe('importWorkbook helpers', () => {
  it('finds only numeric indices belonging to the current room', () => {
    expect(
      getMaxSubsheetIndex(
        ['/room.1', '/room.5', '/room.not-a-number', '/other.99', '/room.2'],
        'room',
      ),
    ).toBe(5);
    expect(getMaxSubsheetIndex([], 'room')).toBe(0);
  });

  it('rewrites cross-sheet formulas to allocated offset subroom ids', () => {
    const body = "cell:A1:vtf:n:1:Second!A1+'O''Brien'!B2";
    expect(rewriteSheetReferences(body, ['First', 'Second', "O'Brien"], 'room', 6)).toBe(
      "cell:A1:vtf:n:1:'room.7'!A1+'room.8'!B2",
    );
    expect(rewriteSheetReferences(body, [], 'room', 6)).toBe(body);
  });

  it('parses SocialCalc and CSV text files', async () => {
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

  it('rejects unsupported file formats', async () => {
    await expect(parseFileToSheets(new File(['unknown'], 'data.unknown'))).rejects.toThrow(
      'Unsupported text import format: data.unknown',
    );
  });
});

describe('appendImportedWorkbook', () => {
  it('POSTs binary workbooks (.xlsx, .ods, .fods) directly to the server multi-import route', async () => {
    const alert = vi.fn();
    const fetchFn = vi.fn().mockResolvedValue(new Response('OK', { status: 201 }));
    const foldr = existingFoldr(fetchFn);

    const xlsx = new File([new Uint8Array([1, 2, 3])], 'book.xlsx');
    const ok = await appendImportedWorkbook({
      foldr,
      index: 'room',
      basePath: 'http://localhost/',
      file: xlsx,
      fetchImpl: fetchFn,
      alertImpl: alert,
    });

    expect(ok).toBe(true);
    expect(alert).not.toHaveBeenCalled();
    expect(fetchFn).toHaveBeenCalledWith('http://localhost/_/=room/xlsx', {
      method: 'POST',
      body: xlsx,
    });
  });

  it('surfaces server status and body on binary workbook upload rejection', async () => {
    const alert = vi.fn();
    const fetchFn = vi.fn().mockResolvedValue(
      new Response('workbook exceeds 200000 cells', { status: 413 }),
    );
    const foldr = existingFoldr(fetchFn);

    const ok = await appendImportedWorkbook({
      foldr,
      index: 'room',
      basePath: 'http://localhost',
      file: new File([new Uint8Array([1])], 'large.ods'),
      fetchImpl: fetchFn,
      alertImpl: alert,
    });

    expect(ok).toBe(false);
    expect(alert).toHaveBeenCalledWith('Import failed (413): workbook exceeds 200000 cells');

    const fetchFallback = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      text: vi.fn().mockRejectedValue(new Error('no body')),
    });
    await appendImportedWorkbook({
      foldr: existingFoldr(fetchFallback),
      index: 'room',
      basePath: 'http://localhost',
      file: new File([new Uint8Array([1])], 'error.fods'),
      fetchImpl: fetchFallback,
      alertImpl: alert,
    });
    expect(alert).toHaveBeenLastCalledWith('Import failed (500): Server rejected sheet.');
  });

  it('surfaces network error on binary workbook upload failure', async () => {
    const alert = vi.fn();
    const fetchFn = vi.fn().mockRejectedValue(new Error('Network error'));
    const foldr = existingFoldr(fetchFn);

    const ok = await appendImportedWorkbook({
      foldr,
      index: 'room',
      basePath: 'http://localhost',
      file: new File([new Uint8Array([1])], 'data.fods'),
      fetchImpl: fetchFn,
      alertImpl: alert,
    });

    expect(ok).toBe(false);
    expect(alert).toHaveBeenCalledWith('Import failed: Network error');
  });

  it('allocates strictly after the current room maximum for single-sheet text uploads', async () => {
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

  it('rewrites cross-sheet formula references when appending a .socialcalc text file', async () => {
    const tocFetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ command: [0, 'paste A5 all'] }), { status: 200 }),
    ) as FetchImpl;
    const alert = vi.fn();
    const foldr = existingFoldr(tocFetch);
    const put = vi.fn().mockResolvedValue(new Response('OK', { status: 201 }));

    const socialCalcFile = new File(["cell:A1:vtf:n:1:Formula!A1"], 'Formula.socialcalc', {
      type: 'text/plain',
    });

    const result = await appendImportedWorkbook({
      foldr,
      index: 'room',
      basePath: 'http://localhost/',
      file: socialCalcFile,
      fetchImpl: put,
      alertImpl: alert,
    });

    expect(result).toBe(true);
    expect(put).toHaveBeenCalledWith(
      'http://localhost/_/room.6',
      expect.objectContaining({
        method: 'PUT',
        body: "cell:A1:vtf:n:1:'room.6'!A1",
      }),
    );
  });
  it('surfaces file-read, network, server 413, and TOC rejection failures for text uploads', async () => {
    const alert = vi.fn();
    const acceptedToc = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ command: [0, 'paste A5 all'] }), { status: 200 }),
    ) as FetchImpl;

    const unreadable = new File([''], 'bad.txt');
    vi.spyOn(unreadable, 'text').mockRejectedValue(new Error('read failed'));

    await expect(
      appendImportedWorkbook({
        foldr: existingFoldr(acceptedToc),
        index: 'room',
        basePath: '',
        file: unreadable,
        fetchImpl: vi.fn(),
        alertImpl: alert,
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
