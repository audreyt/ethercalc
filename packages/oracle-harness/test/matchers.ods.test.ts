import { writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, it, expect, beforeAll } from 'vitest';

import { encodeBase64, matchOds } from '../src/matchers.ts';
import {
  VOLATILE_ODS_META,
  canonicalizeXmlWithDrops,
} from '../src/zip-canonical.ts';
import { buildBasicOds, buildCorruptedZip } from './zip-fixtures.ts';

const __dirnameHere = dirname(fileURLToPath(import.meta.url));
const FIXTURES_DIR = join(__dirnameHere, 'fixtures', 'ods');

function writeIfMissing(name: string, bytes: Uint8Array): void {
  const path = join(FIXTURES_DIR, name);
  if (!existsSync(path)) writeFileSync(path, bytes);
}

beforeAll(() => {
  if (!existsSync(FIXTURES_DIR)) mkdirSync(FIXTURES_DIR, { recursive: true });
  writeIfMissing('basic.ods', buildBasicOds());
  writeIfMissing(
    'docprops-only-diff.ods',
    buildBasicOds({
      creationDate: '2099-12-31T23:59:59.999999999',
      generator: 'rewritten/9.9',
      creator: 'rewritten-worker',
    }),
  );
  writeIfMissing('cell-value-diff.ods', buildBasicOds({ cellA2Value: 99 }));
  writeIfMissing('corrupted.ods', buildCorruptedZip());
});

describe('zip-canonical helpers (ods)', () => {
  it('exports the volatile meta.xml element list', () => {
    expect(VOLATILE_ODS_META['meta.xml']).toContain('meta:creation-date');
    expect(VOLATILE_ODS_META['meta.xml']).toContain('dc:date');
    expect(VOLATILE_ODS_META['meta.xml']).toContain('meta:generator');
    expect(VOLATILE_ODS_META['meta.xml']).toContain('dc:creator');
  });

  it('canonicalizeXmlWithDrops strips listed elements', () => {
    const xml = '<r><a>x</a><b>y</b></r>';
    const keepBoth = canonicalizeXmlWithDrops(xml, []);
    const dropA = canonicalizeXmlWithDrops(xml, ['a']);
    expect(keepBoth).toContain('<a>x</a>');
    expect(keepBoth).toContain('<b>y</b>');
    expect(dropA).not.toContain('<a>');
    expect(dropA).toContain('<b>y</b>');
  });

  it('canonicalizeXmlWithDrops throws on malformed xml', () => {
    expect(() => canonicalizeXmlWithDrops('<', [])).toThrow(/xml/);
  });

  it('canonicalizeXmlWithDrops leaves non-matching children alone', () => {
    // Exercise the "drop list set membership miss" branch.
    const xml = '<root><keeper/></root>';
    const out = canonicalizeXmlWithDrops(xml, ['stranger']);
    expect(out).toContain('<keeper');
  });
});

describe('matchOds', () => {
  it('accepts two identical archives', () => {
    const a = buildBasicOds();
    const b = buildBasicOds();
    const r = matchOds({ expectedBase64: encodeBase64(a), actualBytes: b });
    expect(r).toBeNull();
  });

  it('treats meta.xml-only differences as equal', () => {
    const a = buildBasicOds({
      creationDate: '2026-01-01T00:00:00.000000000',
      generator: 'ethercalc/1.0',
      creator: 'oracle',
    });
    const b = buildBasicOds({
      creationDate: '2099-12-31T23:59:59.999999999',
      generator: 'rewritten/9.9',
      creator: 'rewritten-worker',
    });
    const r = matchOds({ expectedBase64: encodeBase64(a), actualBytes: b });
    expect(r).toBeNull();
  });

  it('reports a real cell-value difference in content.xml', () => {
    const a = buildBasicOds({ cellA2Value: 42 });
    const b = buildBasicOds({ cellA2Value: 99 });
    const r = matchOds({ expectedBase64: encodeBase64(a), actualBytes: b });
    expect(r).toMatch(/ods mismatch/);
    expect(r).toMatch(/content\.xml/);
    expect(r).toMatch(/42/);
    expect(r).toMatch(/99/);
  });

  it('reports a parse error on a corrupted actual archive', () => {
    const a = buildBasicOds();
    const b = buildCorruptedZip();
    const r = matchOds({ expectedBase64: encodeBase64(a), actualBytes: b });
    expect(r).toMatch(/ods mismatch/);
    expect(r).toMatch(/not a valid zip/);
  });

  it('fails loudly when expected is null', () => {
    const r = matchOds({ expectedBase64: null, actualBytes: buildBasicOds() });
    expect(r).toMatch(/null/);
  });
});
