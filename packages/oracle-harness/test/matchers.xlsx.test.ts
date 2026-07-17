import { writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { zipSync } from 'fflate';
import { describe, it, expect, beforeAll } from 'vite-plus/test';

import { encodeBase64, matchXlsx } from '../src/matchers.ts';
import {
  OPTIONAL_XLSX_ZIP_ENTRIES,
  VOLATILE_XLSX_DOCPROPS,
  canonicalizeContentTypesXml,
  canonicalizeWorkbookRelsXml,
  canonicalizeXlsxWorkbookXml,
  canonicalizeXlsxWorksheetXml,
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

  it.each([
    {
      pathName: 'docProps/core.xml',
      elementName: 'cp:revision',
      namespace: 'xmlns:cp="urn:core"',
    },
    { pathName: 'docProps/app.xml', elementName: 'TotalTime', namespace: '' },
  ])(
    'canonicalizeZipEntry drops volatile $elementName metadata',
    ({ pathName, elementName, namespace }) => {
      const xml = `<root${namespace ? ` ${namespace}` : ''}><${elementName}>volatile</${elementName}><keep>stable</keep></root>`;
      const out = canonicalizeZipEntry(
        pathName,
        new TextEncoder().encode(xml),
        VOLATILE_XLSX_DOCPROPS,
      );
      expect(out).not.toContain('volatile');
      expect(out).toContain('<keep>stable</keep>');
    },
  );

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

  it('canonicalizeZipEntry does not pad the first two-digit byte', () => {
    const hex = canonicalizeZipEntry('x.bin', new Uint8Array([0x0f, 0x10]), {});
    expect(hex).toBe('0f10');
  });

  it('compareZipArchives surfaces entry-list differences', () => {
    const a = buildBasicXlsx();
    // Build a partial archive with a disjoint path set.
    const partial = zipSync({ 'only-one.xml': new Uint8Array([]) });
    const r = compareZipArchives(a, partial, VOLATILE_XLSX_DOCPROPS);
    expect(r.equal).toBe(false);
    expect(r.diff).toMatch(/entry list differs/);
  });

  it('compareZipArchives reports a required path missing from either side', () => {
    const common = new TextEncoder().encode('<root/>');
    const full = zipSync({ 'common.xml': common, 'required.xml': common });
    const partial = zipSync({ 'common.xml': common });

    const missingActual = compareZipArchives(full, partial, {});
    expect(missingActual.equal).toBe(false);
    expect(missingActual.diff).toContain('expected-only\nrequired.xml');

    const missingExpected = compareZipArchives(partial, full, {});
    expect(missingExpected.equal).toBe(false);
    expect(missingExpected.diff).toContain('actual-only\nrequired.xml');
  });

  it('compareZipArchives returns equal for identical archives', () => {
    const a = buildBasicXlsx();
    const b = buildBasicXlsx();
    const r = compareZipArchives(a, b, VOLATILE_XLSX_DOCPROPS);
    expect(r.equal).toBe(true);
    expect(r.diff).toBeUndefined();
  });

  it('canonicalizeContentTypesXml drops optional overrides and data defaults', () => {
    const legacy = `<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
      <Default Extension="xml" ContentType="application/xml"/>
      <Override PartName="/xl/sharedStrings.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sharedStrings+xml"/>
      <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
    </Types>`;
    const worker = `<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
      <Default Extension="data" ContentType="application/vnd.openxmlformats-officedocument.model+data"/>
      <Default Extension="xml" ContentType="application/xml"/>
      <Override PartName="/xl/metadata.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheetMetadata+xml"/>
      <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
    </Types>`;
    const lc = canonicalizeContentTypesXml(legacy, OPTIONAL_XLSX_ZIP_ENTRIES);
    const wc = canonicalizeContentTypesXml(worker, OPTIONAL_XLSX_ZIP_ENTRIES);
    expect(lc).toBe(wc);
    expect(lc).toContain('/xl/workbook.xml');
    expect(lc).not.toContain('sharedStrings');
    expect(lc).not.toContain('metadata');
    expect(lc).not.toContain('model+data');
  });

  it('canonicalizeContentTypesXml accepts optional paths with a leading slash', () => {
    const xml = `<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
      <Override PartName="/xl/metadata.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheetMetadata+xml"/>
      <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
    </Types>`;
    const out = canonicalizeContentTypesXml(xml, new Set(['/xl/metadata.xml']));
    expect(out).toContain('/xl/workbook.xml');
    expect(out).not.toContain('metadata');
  });

  it('canonicalizeContentTypesXml handles prefixed optional and required declarations', () => {
    const xml = `<ct:Types xmlns:ct="http://schemas.openxmlformats.org/package/2006/content-types">
      <ct:Default Extension="data" ContentType="drop-default"/>
      <ct:Default Extension="xml" ContentType="keep-default"/>
      <ct:Override PartName="/xl/metadata.xml" ContentType="drop-override"/>
      <ct:Override PartName="/xl/workbook.xml" ContentType="keep-override"/>
    </ct:Types>`;
    const out = canonicalizeContentTypesXml(xml, OPTIONAL_XLSX_ZIP_ENTRIES);
    expect(out).not.toContain('drop-default');
    expect(out).not.toContain('drop-override');
    expect(out).toContain('keep-default');
    expect(out).toContain('keep-override');
  });

  it('canonicalizeWorkbookRelsXml drops optional relationship targets', () => {
    const legacy = `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId2" Target="sharedStrings.xml" Type="sharedStrings"/><Relationship Id="rId1" Target="worksheets/sheet1.xml" Type="worksheet"/></Relationships>`;
    const worker = `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId4" Target="metadata.xml" Type="sheetMetadata"/><Relationship Id="rId1" Target="worksheets/sheet1.xml" Type="worksheet"/></Relationships>`;
    expect(canonicalizeWorkbookRelsXml(legacy, OPTIONAL_XLSX_ZIP_ENTRIES)).toBe(
      canonicalizeWorkbookRelsXml(worker, OPTIONAL_XLSX_ZIP_ENTRIES),
    );
  });

  it('canonicalizeWorkbookRelsXml keeps prefixed required and targetless relationships', () => {
    const xml = `<r:Relationships xmlns:r="http://schemas.openxmlformats.org/package/2006/relationships">
      <r:Relationship Id="drop" Target="metadata.xml" Type="drop-optional"/>
      <r:Relationship Id="keep" Target="worksheets/sheet1.xml" Type="keep-required"/>
      <r:Relationship Id="targetless" Type="keep-targetless"/>
    </r:Relationships>`;
    const out = canonicalizeWorkbookRelsXml(xml, OPTIONAL_XLSX_ZIP_ENTRIES);
    expect(out).not.toContain('drop-optional');
    expect(out).toContain('keep-required');
    expect(out).toContain('keep-targetless');
    expect(out).not.toContain('Id=');
  });

  it('canonicalizeZipEntry routes OOXML metadata files', () => {
    const contentTypes = `<Types><Default Extension="data" ContentType="drop-default"/></Types>`;
    const canonicalTypes = canonicalizeZipEntry(
      '[Content_Types].xml',
      new TextEncoder().encode(contentTypes),
      {},
    );
    expect(canonicalTypes).not.toContain('drop-default');

    const relationships = `<Relationships><Relationship Target="metadata.xml" Type="drop-optional"/></Relationships>`;
    const canonicalRelationships = canonicalizeZipEntry(
      'xl/_rels/workbook.xml.rels',
      new TextEncoder().encode(relationships),
      {},
      OPTIONAL_XLSX_ZIP_ENTRIES,
    );
    expect(canonicalRelationships).not.toContain('drop-optional');
  });

  it('canonicalizeZipEntry treats any .rels path as XML', () => {
    const xml = '<Relationships><Relationship Target="xl/workbook.xml"/></Relationships>';
    const out = canonicalizeZipEntry('_rels/.rels', new TextEncoder().encode(xml), {});
    expect(out).toContain('<Relationship');
  });

  it('canonicalizeXlsxWorkbookXml drops date1904 metadata drift', () => {
    const legacy = `<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><workbookPr date1904="false"/></workbook>`;
    const worker = `<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><workbookPr/></workbook>`;
    expect(canonicalizeXlsxWorkbookXml(legacy)).toBe(canonicalizeXlsxWorkbookXml(worker));
  });

  it('canonicalizeXlsxWorksheetXml normalizes shared-string vs inline layout drift', () => {
    const sharedStrings = new TextEncoder().encode(
      `<sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" count="1"><si><t>oracle</t></si></sst>`,
    );
    const legacy = `<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetPr codeName="Sheet1"/><dimension ref="A1"/><sheetData><row r="1"><c r="A1" t="s"><v>0</v></c></row></sheetData></worksheet>`;
    const worker = `<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><dimension ref="A1:A1"/><sheetData><row r="1"><c r="A1" t="str"><v>oracle</v></c></row></sheetData><ignoredErrors><ignoredError sqref="A1:A1"/></ignoredErrors></worksheet>`;
    const entries = { 'xl/sharedStrings.xml': sharedStrings };
    expect(canonicalizeXlsxWorksheetXml(legacy, entries)).toBe(
      canonicalizeXlsxWorksheetXml(worker, entries),
    );
  });

  it('canonicalizeZipEntry routes xl/worksheets/sheet1.xml', () => {
    const xml = `<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData><row r="1"><c r="A1" t="str"><v>x</v></c></row></sheetData></worksheet>`;
    const out = canonicalizeZipEntry('xl/worksheets/sheet1.xml', new TextEncoder().encode(xml), {});
    expect(out).toContain('<v>x</v>');
    expect(out).not.toContain('t="str"');
  });

  it('canonicalizeXlsxWorksheetXml handles namespace-prefixed worksheet scaffolding', () => {
    const xml = `<x:worksheet xmlns:x="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
      <x:sheetPr codeName="Sheet1"/>
      <x:dimension ref="A1:A1"/>
      <x:sheetData><x:row r="1"><x:c r="A1" t="str"><x:v>value</x:v></x:c></x:row></x:sheetData>
      <x:ignoredErrors/>
    </x:worksheet>`;
    const out = canonicalizeXlsxWorksheetXml(xml);
    expect(out).not.toContain('sheetPr');
    expect(out).not.toContain('ignoredErrors');
    expect(out).toContain('ref="A1"');
    expect(out).not.toContain('t="str"');
    expect(out).toContain('<x:v>value</x:v>');
  });

  it('canonicalizeZipEntry routes only numbered worksheet paths', () => {
    const xml = '<worksheet><sheetPr codeName="Sheet1"/><sheetData/></worksheet>';
    const encode = (value: string) => new TextEncoder().encode(value);

    expect(canonicalizeZipEntry('xl/worksheets/sheet10.xml', encode(xml), {})).not.toContain(
      'sheetPr',
    );
    expect(canonicalizeZipEntry('xl/worksheets/sheetA.xml', encode(xml), {})).toContain('sheetPr');
    expect(
      canonicalizeZipEntry('prefix/xl/worksheets/sheet1.xml', encode(xml), {}),
    ).toContain('sheetPr');
    expect(
      canonicalizeZipEntry('xl/worksheets/sheet1.xml.extra.xml', encode(xml), {}),
    ).toContain('sheetPr');
  });

  it('canonicalizeXlsxWorksheetXml throws on malformed xml', () => {
    expect(() => canonicalizeXlsxWorksheetXml('<')).toThrow(/xml/);
  });

  it('canonicalizeXlsxWorksheetXml handles edge branches in layout normalization', () => {
    const sharedStrings = new TextEncoder().encode(
      `<sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><si/><si><ns0:t xmlns:ns0="http://schemas.openxmlformats.org/spreadsheetml/2006/main">hi</ns0:t></si></sst>`,
    );
    const xml = `<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
      <dimension ref="A1:B2"/>
      <sheetData>
        <row r="1"><c r="A1" t="s"><v>9</v></c><c r="B1"/></row>
        <row r="2"><c r="A2"><ns0:v xmlns:ns0="http://schemas.openxmlformats.org/spreadsheetml/2006/main">1</ns0:v></c><c r="Z2"><w/></c></row>
      </sheetData>
    </worksheet>`;
    const emptyShared = canonicalizeXlsxWorksheetXml(
      `<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData><row r="3"><c r="A3" t="s">text<ns0:v xmlns:ns0="http://schemas.openxmlformats.org/spreadsheetml/2006/main">0</ns0:v></c></row></sheetData></worksheet>`,
      { 'xl/sharedStrings.xml': new Uint8Array(0) },
    );
    expect(emptyShared).toContain('ns0:v');
    const out = canonicalizeXlsxWorksheetXml(xml, { 'xl/sharedStrings.xml': sharedStrings });
    expect(out).toContain('ref="A1:B2"');
    expect(out).toContain('<v />');
    expect(out).toContain('ns0:v');
  });

  it('canonicalizeZipEntry routes xl/workbook.xml', () => {
    const xml = `<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><workbookPr date1904="false"/></workbook>`;
    const out = canonicalizeZipEntry('xl/workbook.xml', new TextEncoder().encode(xml), {});
    expect(out).not.toContain('date1904');
  });

  it('canonicalizeXlsxWorkbookXml throws on malformed xml', () => {
    expect(() => canonicalizeXlsxWorkbookXml('<')).toThrow(/xml/);
  });

  it('canonicalizeWorkbookRelsXml throws on malformed xml', () => {
    expect(() => canonicalizeWorkbookRelsXml('<', OPTIONAL_XLSX_ZIP_ENTRIES)).toThrow(/xml/);
  });

  it('canonicalizeContentTypesXml throws on malformed xml', () => {
    expect(() => canonicalizeContentTypesXml('<', OPTIONAL_XLSX_ZIP_ENTRIES)).toThrow(/xml/);
  });

  it('compareZipArchives ignores optional entry-list drift', () => {
    const full = unzipOrError(buildBasicXlsx(), 'full').entries!;
    const workerLayout = { ...full };
    delete workerLayout['xl/sharedStrings.xml'];
    workerLayout['xl/worksheets/sheet1.xml'] = new TextEncoder().encode(
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <sheetData>
    <row r="1"><c r="A1" t="str"><v>hello</v></c></row>
    <row r="2"><c r="A2"><v>42</v></c></row>
  </sheetData>
</worksheet>`,
    );
    const a = zipSync(full);
    const b = zipSync(workerLayout);
    const r = compareZipArchives(a, b, VOLATILE_XLSX_DOCPROPS, OPTIONAL_XLSX_ZIP_ENTRIES);
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
