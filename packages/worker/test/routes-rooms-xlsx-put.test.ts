import {
  createExecutionContext,
  env,
  waitOnExecutionContext,
} from 'cloudflare:test';
import { describe, it, expect } from 'vitest';
import * as XLSX from '@e965/xlsx';

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
  const cdHeaders: Uint8Array[] = [];
  let cdOffset = 0;
  for (const entry of entries) {
    const nameBytes = new TextEncoder().encode(entry.name);
    const header = new Uint8Array(46 + nameBytes.length);
    header[0] = 0x50;
    header[1] = 0x4b;
    header[2] = 0x01;
    header[3] = 0x02;
    header[20] = entry.compressedSize & 0xff;
    header[21] = (entry.compressedSize >> 8) & 0xff;
    header[22] = (entry.compressedSize >> 16) & 0xff;
    header[23] = (entry.compressedSize >> 24) & 0xff;
    header[24] = entry.uncompressedSize & 0xff;
    header[25] = (entry.uncompressedSize >> 8) & 0xff;
    header[26] = (entry.uncompressedSize >> 16) & 0xff;
    header[27] = (entry.uncompressedSize >> 24) & 0xff;
    header[28] = nameBytes.length & 0xff;
    header[29] = (nameBytes.length >> 8) & 0xff;
    header.set(nameBytes, 46);
    cdHeaders.push(header);
    cdOffset += header.length;
  }
  const eocd = new Uint8Array(22);
  eocd[0] = 0x50;
  eocd[1] = 0x4b;
  eocd[2] = 0x05;
  eocd[3] = 0x06;
  eocd[8] = entries.length & 0xff;
  eocd[9] = (entries.length >> 8) & 0xff;
  eocd[10] = entries.length & 0xff;
  eocd[11] = (entries.length >> 8) & 0xff;
  eocd[12] = cdOffset & 0xff;
  eocd[13] = (cdOffset >> 8) & 0xff;
  eocd[14] = (cdOffset >> 16) & 0xff;
  eocd[15] = (cdOffset >> 24) & 0xff;
  eocd[16] = 0;
  eocd[17] = 0;
  eocd[18] = 0;
  eocd[19] = 0;
  const result = new Uint8Array(cdOffset + eocd.length);
  let pos = 0;
  for (const header of cdHeaders) {
    result.set(header, pos);
    pos += header.length;
  }
  result.set(eocd, pos);
  return result;
}

describe('Single-sheet XLSX PUT and POST room routes', () => {
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
});
