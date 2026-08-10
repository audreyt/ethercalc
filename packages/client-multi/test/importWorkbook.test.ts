import { describe, it, expect, vi } from 'vite-plus/test';
import { HackFoldr, type FetchImpl } from '../src/Foldr.ts';
import {
  appendImportedWorkbook,
  extensionOf,
  isSupportedImportFormat,
  MAX_MULTI_IMPORT_UPLOAD_BYTES,
} from '../src/importWorkbook.ts';

function existingFoldr(tocFetch: FetchImpl): HackFoldr {
  const foldr = new HackFoldr('http://localhost', { fetchImpl: tocFetch });
  foldr.id = 'room';
  foldr.rows = [
    { link: '/room.1', title: 'Sheet1', row: 2 },
    { link: '/room.5', title: 'Data', row: 3 },
  ];
  return foldr;
}

describe('importWorkbook helpers', () => {
  it('recognises supported multi-import extensions only', () => {
    expect(extensionOf('Book.XLSX')).toBe('xlsx');
    expect(extensionOf('notes.TXT')).toBe('txt');
    expect(extensionOf('noext')).toBeNull();
    expect(isSupportedImportFormat('csv')).toBe(true);
    expect(isSupportedImportFormat('socialcalc')).toBe(true);
    expect(isSupportedImportFormat('exe')).toBe(false);
    expect(isSupportedImportFormat(null)).toBe(false);
  });
});

describe('appendImportedWorkbook', () => {
  it('POSTs every supported format through the guarded server multi-import route', async () => {
    const alert = vi.fn();
    const fetchFn = vi.fn().mockResolvedValue(new Response('OK', { status: 201 }));
    const foldr = existingFoldr(fetchFn);
    const refresh = vi.spyOn(foldr, 'refreshToc').mockResolvedValue(true);

    const cases: Array<{ name: string; url: string }> = [
      { name: 'book.xlsx', url: 'http://localhost/_/=room/xlsx?title=book' },
      { name: 'sheet.ods', url: 'http://localhost/_/=room/ods?title=sheet' },
      { name: 'flat.fods', url: 'http://localhost/_/=room/fods?title=flat' },
      { name: 'Data.csv', url: 'http://localhost/_/=room/csv?title=Data' },
      { name: 'tabs.tsv', url: 'http://localhost/_/=room/tsv?title=tabs' },
      { name: 'notes.txt', url: 'http://localhost/_/=room/txt?title=notes' },
      {
        name: 'Formula.socialcalc',
        url: 'http://localhost/_/=room/socialcalc?title=Formula',
      },
    ];

    for (const c of cases) {
      fetchFn.mockClear();
      refresh.mockClear();
      const file = new File([new Uint8Array([1, 2, 3])], c.name);
      const ok = await appendImportedWorkbook({
        foldr,
        index: 'room',
        basePath: 'http://localhost/',
        file,
        fetchImpl: fetchFn,
        alertImpl: alert,
      });
      expect(ok).toBe(true);
      expect(fetchFn).toHaveBeenCalledWith(c.url, {
        method: 'POST',
        body: file,
      });
      expect(refresh).toHaveBeenCalledTimes(1);
    }
    expect(alert).not.toHaveBeenCalled();
  });

  it('omits the title query when the filename stem is blank', async () => {
    const alert = vi.fn();
    const fetchFn = vi.fn().mockResolvedValue(new Response('OK', { status: 201 }));
    const foldr = existingFoldr(fetchFn);
    vi.spyOn(foldr, 'refreshToc').mockResolvedValue(true);

    const ok = await appendImportedWorkbook({
      foldr,
      index: 'room',
      basePath: 'http://localhost',
      file: new File(['a'], '.csv'),
      fetchImpl: fetchFn,
      alertImpl: alert,
    });

    expect(ok).toBe(true);
    expect(fetchFn).toHaveBeenCalledWith('http://localhost/_/=room/csv', {
      method: 'POST',
      body: expect.any(File),
    });
    expect(alert).not.toHaveBeenCalled();
  });

  it('never PUTs a sub-room from the client for text uploads', async () => {
    const alert = vi.fn();
    const fetchFn = vi.fn().mockResolvedValue(new Response('OK', { status: 201 }));
    const foldr = existingFoldr(fetchFn);
    vi.spyOn(foldr, 'refreshToc').mockResolvedValue(true);
    await appendImportedWorkbook({
      foldr,
      index: 'room',
      basePath: 'http://localhost',
      file: new File(['a,b'], 'Data.csv'),
      fetchImpl: fetchFn,
      alertImpl: alert,
    });

    expect(fetchFn.mock.calls.map((call) => call[0])).toEqual([
      'http://localhost/_/=room/csv?title=Data',
    ]);
    expect(
      fetchFn.mock.calls.some(
        (call) => typeof call[0] === 'string' && String(call[0]).includes('/_/room.'),
      ),
    ).toBe(false);
  });

  it('rejects oversized files before reading them into memory', async () => {
    const alert = vi.fn();
    const fetchFn = vi.fn();
    const foldr = existingFoldr(fetchFn);
    const huge = new File(['x'], 'huge.csv');
    Object.defineProperty(huge, 'size', { value: MAX_MULTI_IMPORT_UPLOAD_BYTES + 1 });
    const textSpy = vi.spyOn(huge, 'text');

    const ok = await appendImportedWorkbook({
      foldr,
      index: 'room',
      basePath: 'http://localhost',
      file: huge,
      fetchImpl: fetchFn,
      alertImpl: alert,
    });

    expect(ok).toBe(false);
    expect(fetchFn).not.toHaveBeenCalled();
    expect(textSpy).not.toHaveBeenCalled();
    expect(alert).toHaveBeenCalledWith(
      `Import failed (413): file exceeds ${MAX_MULTI_IMPORT_UPLOAD_BYTES} bytes (limit ${MAX_MULTI_IMPORT_UPLOAD_BYTES}).`,
    );
  });

  it('surfaces server status and body, including private-room 409 text', async () => {
    const alert = vi.fn();
    const foldr = existingFoldr(vi.fn() as FetchImpl);

    const privateMsg =
      'Multi-sheet import is unavailable for private rooms because new sub-sheets would be public.';
    const fetch409 = vi.fn().mockResolvedValue(new Response(privateMsg, { status: 409 }));
    await appendImportedWorkbook({
      foldr,
      index: 'room',
      basePath: 'http://localhost',
      file: new File(['a'], 'secret.csv'),
      fetchImpl: fetch409,
      alertImpl: alert,
    });
    expect(alert).toHaveBeenLastCalledWith(`Import failed (409): ${privateMsg}`);

    const fetch413 = vi.fn().mockResolvedValue(
      new Response('workbook exceeds 200000 cells', { status: 413 }),
    );
    await appendImportedWorkbook({
      foldr,
      index: 'room',
      basePath: 'http://localhost',
      file: new File([new Uint8Array([1])], 'large.ods'),
      fetchImpl: fetch413,
      alertImpl: alert,
    });
    expect(alert).toHaveBeenLastCalledWith('Import failed (413): workbook exceeds 200000 cells');

    const fetchFallback = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      text: vi.fn().mockRejectedValue(new Error('no body')),
    });
    await appendImportedWorkbook({
      foldr,
      index: 'room',
      basePath: 'http://localhost',
      file: new File([new Uint8Array([1])], 'error.fods'),
      fetchImpl: fetchFallback,
      alertImpl: alert,
    });
    expect(alert).toHaveBeenLastCalledWith('Import failed (500): Server rejected sheet.');
  });

  it('surfaces network errors and unsupported extensions', async () => {
    const alert = vi.fn();
    const foldr = existingFoldr(vi.fn() as FetchImpl);

    const okNet = await appendImportedWorkbook({
      foldr,
      index: 'room',
      basePath: 'http://localhost',
      file: new File([new Uint8Array([1])], 'data.fods'),
      fetchImpl: vi.fn().mockRejectedValue(new Error('Network error')),
      alertImpl: alert,
    });
    expect(okNet).toBe(false);
    expect(alert).toHaveBeenLastCalledWith('Import failed: Network error');

    const fetchFn = vi.fn();
    const okBad = await appendImportedWorkbook({
      foldr,
      index: 'room',
      basePath: 'http://localhost',
      file: new File(['x'], 'data.unknown'),
      fetchImpl: fetchFn,
      alertImpl: alert,
    });
    expect(okBad).toBe(false);
    expect(fetchFn).not.toHaveBeenCalled();
    expect(alert).toHaveBeenLastCalledWith('Import failed — unsupported file type: data.unknown');
  });
});
