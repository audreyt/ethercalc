import {
  createExecutionContext,
  env,
  waitOnExecutionContext,
} from 'cloudflare:test';
import * as XLSX from '@e965/xlsx';
import { describe, expect, it } from 'vite-plus/test';

import worker from '../src/index.ts';

async function request(method: string, path: string, opts: RequestInit = {}) {
  const req = new Request(`https://example.test${path}`, { method, ...opts });
  const ctx = createExecutionContext();
  const res = await worker.fetch(req, env as never, ctx);
  await waitOnExecutionContext(ctx);
  return res;
}

function makeFakeZipCentralDirectory(
  entries: Array<{ name: string; compressedSize: number; uncompressedSize: number }>
): Uint8Array {
  const localHeaders: Uint8Array[] = [];
  const cdHeaders: Uint8Array[] = [];
  let localOffset = 0;
  let cdOffset = 0;
  for (const entry of entries) {
    const nameBytes = new TextEncoder().encode(entry.name);
    const local = new Uint8Array(30 + nameBytes.length + entry.compressedSize);
    const localView = new DataView(local.buffer);
    localView.setUint32(0, 0x04034b50, true);
    localView.setUint32(18, entry.compressedSize, true);
    localView.setUint32(22, entry.uncompressedSize, true);
    localView.setUint16(26, nameBytes.length, true);
    local.set(nameBytes, 30);
    localHeaders.push(local);

    const header = new Uint8Array(46 + nameBytes.length);
    const headerView = new DataView(header.buffer);
    headerView.setUint32(0, 0x02014b50, true);
    headerView.setUint32(20, entry.compressedSize, true);
    headerView.setUint32(24, entry.uncompressedSize, true);
    headerView.setUint16(28, nameBytes.length, true);
    headerView.setUint32(42, localOffset, true);
    header.set(nameBytes, 46);
    cdHeaders.push(header);
    localOffset += local.length;
    cdOffset += header.length;
  }
  const eocd = new Uint8Array(22);
  const eocdView = new DataView(eocd.buffer);
  eocdView.setUint32(0, 0x06054b50, true);
  eocdView.setUint16(8, entries.length, true);
  eocdView.setUint16(10, entries.length, true);
  eocdView.setUint32(12, cdOffset, true);
  eocdView.setUint32(16, localOffset, true);
  const result = new Uint8Array(localOffset + cdOffset + eocd.length);
  let pos = 0;
  for (const local of localHeaders) {
    result.set(local, pos);
    pos += local.length;
  }
  for (const header of cdHeaders) {
    result.set(header, pos);
    pos += header.length;
  }
  result.set(eocd, pos);
  return result;
}

const workbookTypes = [
  {
    name: 'xlsx',
    contentType:
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  },
  {
    name: 'ods',
    contentType: 'application/vnd.oasis.opendocument.spreadsheet',
  },
] as const;

describe('Single-sheet XLSX PUT and POST room routes', () => {
  for (const { name, contentType } of workbookTypes) {
    it(`rejects unreadable ${name} on PUT without replacing the snapshot`, async () => {
      const room = `invalid-put-${name}`;
      const snapshot = 'socialcalc:version:1.5\n--SocialCalcSpreadsheetControlSave--\n';
      const seedRes = await request('PUT', `/_/${room}`, {
        headers: { 'content-type': 'text/x-socialcalc' },
        body: snapshot,
      });
      expect(seedRes.status).toBe(201);

      const putRes = await request('PUT', `/_/${room}`, {
        headers: { 'content-type': contentType },
        body: 'item,value\nfirst,second\n',
      });
      expect(putRes.status).toBe(400);
      const getRes = await request('GET', `/_/${room}`);
      expect(getRes.status).toBe(200);
      expect(await getRes.text()).toBe(snapshot);
    });

    it(`rejects unreadable ${name} on room creation`, async () => {
      const postRes = await request('POST', '/_', {
        headers: { 'content-type': contentType },
        body: 'item,value\nfirst,second\n',
      });
      expect(postRes.status).toBe(400);
      expect(postRes.headers.get('location')).toBeNull();
    });

    it(`rejects unreadable ${name} on command import without changing the room`, async () => {
      const room = `invalid-command-${name}`;
      const snapshot = 'socialcalc:version:1.5\n--SocialCalcSpreadsheetControlSave--\n';
      const seedRes = await request('PUT', `/_/${room}`, {
        headers: { 'content-type': 'text/x-socialcalc' },
        body: snapshot,
      });
      expect(seedRes.status).toBe(201);

      const postRes = await request('POST', `/_/${room}`, {
        headers: { 'content-type': contentType },
        body: 'item,value\nfirst,second\n',
      });
      expect(postRes.status).toBe(400);
      const getRes = await request('GET', `/_/${room}`);
      expect(getRes.status).toBe(200);
      expect(await getRes.text()).toBe(snapshot);
    });
  }

  it('accepts flat ODS XML with an ODS content type', async () => {
    const book = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
      book,
      XLSX.utils.aoa_to_sheet([['flat-ods']]),
      'Sheet1',
    );
    const body = XLSX.write(book, { bookType: 'fods', type: 'string' }) as string;
    const putRes = await request('PUT', '/_/valid-flat-ods', {
      headers: { 'content-type': 'application/vnd.oasis.opendocument.spreadsheet' },
      body,
    });
    expect(putRes.status).toBe(201);
    const getRes = await request('GET', '/_/valid-flat-ods');
    expect(getRes.status).toBe(200);
    expect(await getRes.text()).toContain('flat-ods');
  });

  it('reports unsupported ODF conditional style maps clearly', async () => {
    const body = '<office:document><style:map style:condition="value()>=0" ' +
      'style:apply-style-name="previous"/></office:document>';
    const response = await request('PUT', '/_/unsupported-odf-style', {
      headers: { 'content-type': 'application/vnd.oasis.opendocument.spreadsheet' },
      body,
    });
    expect(response.status).toBe(400);
    expect(await response.text()).toBe('ODF conditional style maps are unsupported for import');
  });

  it('PUT /_/:room with xlsx body imports the sheet as a new snapshot', async () => {
    const ws = {
      '!ref': 'A1:A2',
      A1: { t: 'n', v: 10 },
      A2: { t: 'n', v: 20 },
    };
    const book = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(book, ws, 'Sheet1');
    const bytes = new Uint8Array(
      XLSX.write(book, { bookType: 'xlsx', type: 'array' }) as ArrayBufferLike,
    );

    const putRes = await request('PUT', '/_/xlsx-put-room', {
      headers: {
        'content-type':
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      },
      body: bytes as unknown as BodyInit,
    });
    expect(putRes.status).toBe(201);
    expect(await putRes.text()).toBe('OK');

    const getRes = await request('GET', '/_/xlsx-put-room');
    expect(getRes.status).toBe(200);
    const saveText = await getRes.text();
    expect(saveText).toContain('socialcalc');
    expect(saveText).toContain('cell:A1:v:10');
    expect(saveText).toContain('cell:A2:v:20');
  });

  it('POST /_ with xlsx body creates a room and imports the sheet', async () => {
    const ws = {
      '!ref': 'B1:B2',
      B1: { t: 's', v: 'hello' },
      B2: { t: 's', v: 'world' },
    };
    const book = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(book, ws, 'Sheet1');
    const bytes = new Uint8Array(
      XLSX.write(book, { bookType: 'xlsx', type: 'array' }) as ArrayBufferLike,
    );

    const postRes = await request('POST', '/_', {
      headers: {
        'content-type':
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      },
      body: bytes as unknown as BodyInit,
    });
    expect(postRes.status).toBe(201);
    const location = postRes.headers.get('location') ?? '';
    expect(location).toMatch(/^\/_\/[a-z0-9]{12}$/);

    const getRes = await request('GET', location);
    expect(getRes.status).toBe(200);
    const saveText = await getRes.text();
    expect(saveText).toContain('cell:B1:t:hello');
    expect(saveText).toContain('cell:B2:t:world');
  });

  it('PUT /_/:room returns 413 for oversized archive', async () => {
    const bytes = makeFakeZipCentralDirectory([
      { name: 'xl/worksheets/sheet2.xml', compressedSize: 10, uncompressedSize: 26 * 1024 * 1024 },
    ]);
    const putRes = await request('PUT', '/_/xlsx-put-oversized', {
      headers: {
        'content-type':
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      },
      body: bytes as unknown as BodyInit,
    });
    expect(putRes.status).toBe(413);
    const text = await putRes.text();
    expect(text).toContain('xlsx/ods import expands to');
  });

  it('POST /_ returns 413 for oversized archive', async () => {
    const bytes = makeFakeZipCentralDirectory([
      { name: 'xl/worksheets/sheet2.xml', compressedSize: 10, uncompressedSize: 26 * 1024 * 1024 },
    ]);
    const postRes = await request('POST', '/_', {
      headers: {
        'content-type':
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      },
      body: bytes as unknown as BodyInit,
    });
    expect(postRes.status).toBe(413);
    const text = await postRes.text();
    expect(text).toContain('xlsx/ods import expands to');
  });

  it('PUT /_/:room returns 400 when xlsx exceeds SocialCalc ZZ column', async () => {
    const ws = {
      '!ref': 'A1:AAA1',
      A1: { t: 'n', v: 1 },
      AAA1: { t: 'n', v: 703 },
    };
    const book = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(book, ws, 'Sheet1');
    const bytes = new Uint8Array(
      XLSX.write(book, { bookType: 'xlsx', type: 'array' }) as ArrayBufferLike,
    );
    const putRes = await request('PUT', '/_/xlsx-put-aaa', {
      headers: {
        'content-type':
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      },
      body: bytes as unknown as BodyInit,
    });
    expect(putRes.status).toBe(400);
    const text = await putRes.text();
    expect(text).toMatch(/ZZ/);
    expect(text).toContain('AAA1');
  });

  it('POST /_ returns 400 when xlsx exceeds SocialCalc ZZ column', async () => {
    const ws = {
      '!ref': 'A1:AAA1',
      A1: { t: 'n', v: 1 },
      AAA1: { t: 'n', v: 703 },
    };
    const book = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(book, ws, 'Sheet1');
    const bytes = new Uint8Array(
      XLSX.write(book, { bookType: 'xlsx', type: 'array' }) as ArrayBufferLike,
    );
    const postRes = await request('POST', '/_', {
      headers: {
        'content-type':
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      },
      body: bytes as unknown as BodyInit,
    });
    expect(postRes.status).toBe(400);
    const text = await postRes.text();
    expect(text).toMatch(/ZZ/);
    expect(text).toContain('AAA1');
  });
});
