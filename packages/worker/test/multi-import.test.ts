import {
  createExecutionContext,
  env,
  waitOnExecutionContext,
} from 'cloudflare:test';
import { describe, it, expect } from 'vitest';

/* eslint-disable @typescript-eslint/no-explicit-any */
import * as XLSX from '@e965/xlsx';

import worker from '../src/index.ts';
import type { Env } from '../src/env.ts';

/**
 * Phase 8.1 integration test — multi-sheet workbook IMPORT through workerd.
 *
 * Drives requests the same way `exports.test.ts` does: a fresh
 * `createExecutionContext()` per request + `waitOnExecutionContext()` so the
 * DO fan-out (sub-rooms first, TOC last) completes before assertions run.
 */
async function request(
  method: string,
  path: string,
  opts: RequestInit = {},
): Promise<Response> {
  const req = new Request(`https://example.test${path}`, { method, ...opts });
  const ctx = createExecutionContext();
  const res = await worker.fetch(req, env as unknown as Env, ctx);
  await waitOnExecutionContext(ctx);
  return res;
}

function twoSheetXlsx(): Uint8Array {
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.aoa_to_sheet([['hello', 1]]),
    'First',
  );
  // Second sheet carries a formula so we can prove formula fidelity on a
  // NON-first sheet (acceptance criterion 2).
  const second: any = XLSX.utils.aoa_to_sheet([[10], [20]]);
  second['A3'] = { t: 'n', f: 'SUM(A1:A2)' };
  second['!ref'] = 'A1:A3';
  XLSX.utils.book_append_sheet(wb, second, 'Second');
  return new Uint8Array(
    XLSX.write(wb, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer,
  );
}

describe('PUT multi-sheet import', () => {
  it('PUT /=:room.xlsx imports a workbook into TOC + sub-rooms and round-trips through export', async () => {
    const room = 'mimport-' + Math.random().toString(36).slice(2, 8);
    const put = await request('PUT', `/=${room}.xlsx`, {
      body: twoSheetXlsx() as unknown as BodyInit,
    });
    expect(put.status).toBe(201);
    expect(await put.text()).toBe('OK');

    // Sub-rooms exist.
    const sub1 = await request('GET', `/_/${room}.1`);
    expect(sub1.status).toBe(200);
    expect(await sub1.text()).toContain('hello');

    // Formula fidelity on the NON-first sheet (acceptance criterion 2):
    // the second sub-room's raw save keeps the formula. SocialCalc's save
    // format is colon-delimited, so it escapes the range colon as `\c` —
    // `SUM(A1:A2)` is stored as `SUM(A1\cA2)` in the `vtf` field. Asserting
    // on the escaped text still proves the SUM-over-A1:A2 formula survived.
    const sub2 = await request('GET', `/_/${room}.2`);
    const sub2Save = await sub2.text();
    expect(sub2Save).toContain('vtf:n:');
    expect(sub2Save).toContain('SUM(A1\\cA2)');

    // Round-trip: re-export the multi-sheet workbook and confirm both sheets survive.
    const exp = await request('GET', `/_/=${room}/xlsx`);
    expect(exp.status).toBe(200);
    const wb = XLSX.read(new Uint8Array(await exp.arrayBuffer()), {
      type: 'array',
    });
    expect(wb.SheetNames).toEqual(['First', 'Second']);
  });

  it('PUT /_/=:room/ods is accepted too', async () => {
    const room = 'mimport-ods-' + Math.random().toString(36).slice(2, 8);
    const res = await request('PUT', `/_/=${room}/ods`, {
      body: twoSheetXlsx() as unknown as BodyInit,
    });
    expect(res.status).toBe(201);
  });
});
