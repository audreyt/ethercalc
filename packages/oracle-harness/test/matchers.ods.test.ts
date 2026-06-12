import { writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, it, expect, beforeAll } from 'vitest';

import { encodeBase64, matchOds } from '../src/matchers.ts';
import {
  OPTIONAL_ODS_ZIP_ENTRIES,
  VOLATILE_ODS_META,
  canonicalizeOdsContentXml,
  canonicalizeOdsManifestRdf,
  canonicalizeOdsManifestXml,
  canonicalizeXmlWithDrops,
  canonicalizeZipEntry,
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

  it('canonicalizeOdsManifestXml drops optional file entries', () => {
    const legacy = `<manifest:manifest xmlns:manifest="urn:oasis:names:tc:opendocument:xmlns:manifest:1.0">
      <manifest:file-entry manifest:full-path="/" manifest:media-type="application/vnd.oasis.opendocument.spreadsheet"/>
      <manifest:file-entry manifest:full-path="content.xml" manifest:media-type="text/xml"/>
      <manifest:file-entry manifest:full-path="manifest.rdf" manifest:media-type="application/rdf+xml"/>
    </manifest:manifest>`;
    const worker = `<manifest:manifest xmlns:manifest="urn:oasis:names:tc:opendocument:xmlns:manifest:1.0">
      <manifest:file-entry manifest:full-path="/" manifest:media-type="application/vnd.oasis.opendocument.spreadsheet"/>
      <manifest:file-entry manifest:full-path="content.xml" manifest:media-type="text/xml"/>
      <manifest:file-entry manifest:full-path="styles.xml" manifest:media-type="text/xml"/>
      <manifest:file-entry manifest:full-path="meta.xml" manifest:media-type="text/xml"/>
      <manifest:file-entry manifest:full-path="manifest.rdf" manifest:media-type="application/rdf+xml"/>
    </manifest:manifest>`;
    expect(canonicalizeOdsManifestXml(legacy, OPTIONAL_ODS_ZIP_ENTRIES)).toBe(
      canonicalizeOdsManifestXml(worker, OPTIONAL_ODS_ZIP_ENTRIES),
    );
  });

  it('canonicalizeOdsManifestXml accepts un-prefixed full-path attributes', () => {
    const xml = `<manifest:manifest xmlns:manifest="urn:oasis:names:tc:opendocument:xmlns:manifest:1.0">
      <manifest:file-entry full-path="meta.xml" manifest:media-type="text/xml"/>
      <manifest:file-entry manifest:full-path="content.xml" manifest:media-type="text/xml"/>
    </manifest:manifest>`;
    const out = canonicalizeOdsManifestXml(xml, OPTIONAL_ODS_ZIP_ENTRIES);
    expect(out).toContain('content.xml');
    expect(out).not.toContain('meta.xml');
  });

  it('canonicalizeOdsContentXml ignores automatic-styles layout drift', () => {
    const legacy = `<office:document-content xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0" xmlns:table="urn:oasis:names:tc:opendocument:xmlns:table:1.0" xmlns:text="urn:oasis:names:tc:opendocument:xmlns:text:1.0"><office:body><office:spreadsheet><table:table><table:table-row><table:table-cell><text:p>oracle</text:p></table:table-cell></table:table-row></table:table></office:spreadsheet></office:body></office:document-content>`;
    const worker = `<office:document-content xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0" xmlns:table="urn:oasis:names:tc:opendocument:xmlns:table:1.0" xmlns:text="urn:oasis:names:tc:opendocument:xmlns:text:1.0"><office:automatic-styles/><office:body><office:spreadsheet><table:table table:style-name="ta1"><table:table-row><table:table-cell><text:p>oracle</text:p></table:table-cell></table:table-row></table:table></office:spreadsheet></office:body></office:document-content>`;
    expect(canonicalizeOdsContentXml(legacy)).toBe(canonicalizeOdsContentXml(worker));
  });

  it('canonicalizeOdsManifestRdf drops optional file entries', () => {
    const legacy = `<rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"><rdf:Description rdf:about="content.xml"/><rdf:Description rdf:about=""><rdf:type rdf:resource="http://docs.oasis-open.org/ns/office/1.2/meta/pkg#Document"/></rdf:Description></rdf:RDF>`;
    const worker = `<rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"><rdf:Description rdf:about="content.xml"/><rdf:Description rdf:about="styles.xml"/><rdf:Description rdf:about=""><ns0:hasPart xmlns:ns0="http://docs.oasis-open.org/ns/office/1.2/meta/pkg#" rdf:resource="styles.xml"/></rdf:Description><rdf:Description rdf:about=""><rdf:type rdf:resource="http://docs.oasis-open.org/ns/office/1.2/meta/pkg#Document"/></rdf:Description></rdf:RDF>`;
    expect(canonicalizeOdsManifestRdf(legacy, OPTIONAL_ODS_ZIP_ENTRIES)).toBe(
      canonicalizeOdsManifestRdf(worker, OPTIONAL_ODS_ZIP_ENTRIES),
    );
  });

  it('canonicalizeOdsManifestRdf drops about= and resource=/ optional paths', () => {
    const worker = `<rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
      <rdf:Description rdf:about="meta.xml"/>
      <rdf:Description rdf:about=""><ns0:hasPart xmlns:ns0="http://docs.oasis-open.org/ns/office/1.2/meta/pkg#" rdf:resource="/styles.xml"/></rdf:Description>
      <rdf:Description rdf:about=""><ns0:hasPart xmlns:ns0="http://docs.oasis-open.org/ns/office/1.2/meta/pkg#" rdf:resource="meta.xml"/></rdf:Description>
    </rdf:RDF>`;
    const out = canonicalizeOdsManifestRdf(worker, OPTIONAL_ODS_ZIP_ENTRIES);
    expect(out).not.toContain('meta.xml');
    expect(out).not.toContain('styles.xml');
  });

  it('canonicalizeOdsManifestRdf accepts unprefixed hasPart/resource and prunes empty Description', () => {
    const xml = `<rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
      <rdf:Description about=""><hasPart resource="styles.xml"/></rdf:Description>
      <rdf:Description about=""><rdf:type rdf:resource="http://docs.oasis-open.org/ns/office/1.2/meta/pkg#Document"/></rdf:Description>
    </rdf:RDF>`;
    const out = canonicalizeOdsManifestRdf(xml, OPTIONAL_ODS_ZIP_ENTRIES);
    expect(out).not.toContain('styles.xml');
    expect(out).not.toContain('<hasPart');
    expect(out).toContain('pkg#Document');
  });

  it('canonicalizeOdsManifestRdf keeps non-optional hasPart and bare Description nodes', () => {
    const xml = `<rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
      <rdf:Description rdf:about="content.xml"/>
      <rdf:Description><hasPart/></rdf:Description>
      <rdf:Description><hasPart rdf:resource="content.xml"/></rdf:Description>
    </rdf:RDF>`;
    const out = canonicalizeOdsManifestRdf(xml, OPTIONAL_ODS_ZIP_ENTRIES);
    expect(out).toContain('content.xml');
    expect(out).toContain('<hasPart');
  });

  it('canonicalizeZipEntry routes manifest.rdf', () => {
    const xml = `<?xml version="1.0"?><rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"><rdf:Description rdf:about="content.xml"/></rdf:RDF>`;
    const out = canonicalizeZipEntry('manifest.rdf', new TextEncoder().encode(xml), {}, OPTIONAL_ODS_ZIP_ENTRIES);
    expect(out).toContain('content.xml');
  });

  it('canonicalizeOdsManifestRdf throws on malformed xml', () => {
    expect(() => canonicalizeOdsManifestRdf('<', OPTIONAL_ODS_ZIP_ENTRIES)).toThrow(/xml/);
  });

  it('canonicalizeOdsContentXml throws on malformed xml', () => {
    expect(() => canonicalizeOdsContentXml('<')).toThrow(/xml/);
  });

  it('canonicalizeOdsManifestXml throws on malformed xml', () => {
    expect(() => canonicalizeOdsManifestXml('<', OPTIONAL_ODS_ZIP_ENTRIES)).toThrow(/xml/);
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
