import { writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { zipSync } from 'fflate';
import { describe, it, expect, beforeAll } from 'vitest';

import { encodeBase64, matchXlsx } from '../src/matchers.ts';
import {
  VOLATILE_XLSX_DOCPROPS,
  canonicalizeZipEntry,
  compareZipArchives,
  unzipOrError,
} from '../src/zip-canonical.ts';
import { buildBasicXlsx, buildCorruptedZip } from './zip-fixtures.ts';

const __dirnameHere = dirname(fileURLToPath(import.meta.url));

const FIXTURES_DIR = join(__dirnameHere, 'fixtures', 'xlsx');

/**
 * Persist each fixture the first time it's requested. Subsequent runs
 * rebuild the bytes in memory but only write to disk if the file is
 * missing — so the `.xlsx` files checked into git stay deterministic.
 */
function writeIfMissing(name: string, bytes: Uint8Array): void {
  const path = join(FIXTURES_DIR, name);
  if (!existsSync(path)) writeFileSync(path, bytes);
}

beforeAll(() => {
  if (!existsSync(FIXTURES_DIR)) mkdirSync(FIXTURES_DIR, { recursive: true });
  writeIfMissing('basic.xlsx', buildBasicXlsx());
  writeIfMissing(
    'docprops-only-diff.xlsx',
    buildBasicXlsx({
      created: '2099-12-31T23:59:59Z',
      modified: '2099-12-31T23:59:59Z',
      lastModifiedBy: 'rewritten-worker',
      appVersion: '999.999',
    }),
  );
  writeIfMissing('cell-value-diff.xlsx', buildBasicXlsx({ cellA2Value: 99 }));
  writeIfMissing('corrupted.xlsx', buildCorruptedZip());
});

describe('zip-canonical helpers', () => {
  it('exports the volatile docProps map', () => {
    expect(VOLATILE_XLSX_DOCPROPS['docProps/core.xml']).toContain('dcterms:created');
    expect(VOLATILE_XLSX_DOCPROPS['docProps/core.xml']).toContain('dcterms:modified');
    expect(VOLATILE_XLSX_DOCPROPS['docProps/core.xml']).toContain('cp:lastModifiedBy');
    expect(VOLATILE_XLSX_DOCPROPS['docProps/app.xml']).toContain('AppVersion');
  });

  it('unzipOrError reports fflate errors', () => {
    const r = unzipOrError(buildCorruptedZip(), 'expected body');
    expect(r.diff).toMatch(/not a valid zip/);
    expect(r.entries).toBeUndefined();
  });

  it('unzipOrError returns entries on success', () => {
    const r = unzipOrError(buildBasicXlsx(), 'expected body');
    expect(r.entries).toBeDefined();
    expect(Object.keys(r.entries!)).toContain('xl/workbook.xml');
    expect(r.diff).toBeUndefined();
  });

  it('canonicalizeZipEntry ignores volatile elements in core.xml', () => {
    const a = buildBasicXlsx({ created: '2020-01-01T00:00:00Z' });
    const b = buildBasicXlsx({ created: '2099-12-31T23:59:59Z' });
    const pathName = 'docProps/core.xml';
    const ae = unzipOrError(a, 'a').entries!;
    const be = unzipOrError(b, 'b').entries!;
    const ac = canonicalizeZipEntry(pathName, ae[pathName]!, VOLATILE_XLSX_DOCPROPS);
    const bc = canonicalizeZipEntry(pathName, be[pathName]!, VOLATILE_XLSX_DOCPROPS);
    expect(ac).toBe(bc);
  });

  it('canonicalizeZipEntry produces byte-stable output for binary entries', () => {
    // No binary entries in our xlsx fixtures; simulate by passing a
    // non-xml path. The function should route to hex encoding.
    const hex = canonicalizeZipEntry(
      'xl/media/image1.png',
      new Uint8Array([0xde, 0xad, 0xbe, 0xef]),
      {},
    );
    expect(hex).toBe('deadbeef');
  });

  it('canonicalizeZipEntry hex-encodes low-value bytes with a leading zero', () => {
    // Exercises the byte < 16 branch in bytesToHex.
    const hex = canonicalizeZipEntry('x.bin', new Uint8Array([0x00, 0x0a, 0xff]), {});
    expect(hex).toBe('000aff');
  });

  it('compareZipArchives surfaces entry-list differences', () => {
    const a = buildBasicXlsx();
    // Build a partial archive with a disjoint path set.
    const partial = zipSync({ 'only-one.xml': new Uint8Array([]) });
    const r = compareZipArchives(a, partial, VOLATILE_XLSX_DOCPROPS);
    expect(r.equal).toBe(false);
    expect(r.diff).toMatch(/entry list differs/);
  });

  it('compareZipArchives returns equal for identical archives', () => {
    const a = buildBasicXlsx();
    const b = buildBasicXlsx();
    const r = compareZipArchives(a, b, VOLATILE_XLSX_DOCPROPS);
    expect(r.equal).toBe(true);
    expect(r.diff).toBeUndefined();
  });
});

describe('matchXlsx', () => {
  it('accepts two identical archives', () => {
    const a = buildBasicXlsx();
    const b = buildBasicXlsx();
    const r = matchXlsx({ expectedBase64: encodeBase64(a), actualBytes: b });
    expect(r).toBeNull();
  });

  it('treats docProps-only differences as equal', () => {
    // Same content cells, different timestamps + authorship + app version.
    const a = buildBasicXlsx({
      created: '2026-01-01T00:00:00Z',
      modified: '2026-01-01T00:00:00Z',
      lastModifiedBy: 'oracle',
      appVersion: '16.0',
    });
    const b = buildBasicXlsx({
      created: '2099-12-31T23:59:59Z',
      modified: '2099-12-31T23:59:59Z',
      lastModifiedBy: 'rewritten-worker',
      appVersion: '999.999',
    });
    const r = matchXlsx({ expectedBase64: encodeBase64(a), actualBytes: b });
    expect(r).toBeNull();
  });

  it('reports a real cell-value difference', () => {
    const a = buildBasicXlsx({ cellA2Value: 42 });
    const b = buildBasicXlsx({ cellA2Value: 99 });
    const r = matchXlsx({ expectedBase64: encodeBase64(a), actualBytes: b });
    expect(r).toMatch(/xlsx mismatch/);
    expect(r).toMatch(/sheet1\.xml/);
    expect(r).toMatch(/42/);
    expect(r).toMatch(/99/);
  });

  it('reports a parse error on a corrupted actual archive', () => {
    const a = buildBasicXlsx();
    const b = buildCorruptedZip();
    const r = matchXlsx({ expectedBase64: encodeBase64(a), actualBytes: b });
    expect(r).toMatch(/xlsx mismatch/);
    expect(r).toMatch(/not a valid zip/);
  });

  it('reports a parse error on a corrupted expected archive', () => {
    const a = buildCorruptedZip();
    const b = buildBasicXlsx();
    const r = matchXlsx({ expectedBase64: encodeBase64(a), actualBytes: b });
    expect(r).toMatch(/xlsx mismatch/);
    expect(r).toMatch(/not a valid zip/);
  });

  it('fails loudly when expected is null', () => {
    const r = matchXlsx({ expectedBase64: null, actualBytes: buildBasicXlsx() });
    expect(r).toMatch(/null/);
  });
});
