/**
 * Fixture builders for xlsx/ods matcher tests.
 *
 * Each exported `build*` function returns a deterministic `Uint8Array`
 * representing a tiny, real (if minimal) zip archive. The underlying
 * XML payloads are inlined here as string literals so a reader can see
 * exactly what each fixture contains without opening a binary file.
 *
 * The fixtures are *also* written to disk (by the test setup hook in
 * `matchers.xlsx.test.ts` / `matchers.ods.test.ts`) so you can
 * `unzip test/fixtures/xlsx/basic.xlsx` to inspect them from the CLI.
 */

import { zipSync, strToU8 } from 'fflate';

// ─── XLSX ────────────────────────────────────────────────────────────────

/**
 * Minimal xlsx archive with a single sheet containing two cells:
 *   A1 = "hello" (shared string)
 *   A2 = 42
 *
 * Entries included (all required by the OOXML spec for a well-formed
 * xlsx that Excel would open):
 *   • `[Content_Types].xml` — MIME catalog
 *   • `_rels/.rels` — root relationships
 *   • `docProps/core.xml` — core properties (timestamps etc.)
 *   • `docProps/app.xml` — extended properties (AppVersion, etc.)
 *   • `xl/workbook.xml` — workbook definition
 *   • `xl/_rels/workbook.xml.rels` — workbook relationships
 *   • `xl/worksheets/sheet1.xml` — the actual sheet cells
 *   • `xl/sharedStrings.xml` — shared-string table
 */
export function buildBasicXlsx(options: XlsxOptions = {}): Uint8Array {
  const opts = { ...defaultXlsxOptions, ...options };
  return zipSync({
    '[Content_Types].xml': strToU8(CONTENT_TYPES_XLSX),
    '_rels/.rels': strToU8(ROOT_RELS_XLSX),
    'docProps/core.xml': strToU8(coreXml(opts.created, opts.modified, opts.lastModifiedBy)),
    'docProps/app.xml': strToU8(appXml(opts.appVersion)),
    'xl/workbook.xml': strToU8(WORKBOOK_XML),
    'xl/_rels/workbook.xml.rels': strToU8(WORKBOOK_RELS),
    'xl/worksheets/sheet1.xml': strToU8(sheetXml(opts.cellA2Value)),
    'xl/sharedStrings.xml': strToU8(SHARED_STRINGS),
  });
}

export interface XlsxOptions {
  /** dcterms:created timestamp. Default: "2026-01-01T00:00:00Z". */
  readonly created?: string;
  /** dcterms:modified timestamp. Default: "2026-01-01T00:00:00Z". */
  readonly modified?: string;
  /** cp:lastModifiedBy. Default: "oracle". */
  readonly lastModifiedBy?: string;
  /** AppVersion in docProps/app.xml. Default: "16.0". */
  readonly appVersion?: string;
  /** Numeric value written to sheet1!A2. Default: 42. */
  readonly cellA2Value?: number;
}

const defaultXlsxOptions: Required<XlsxOptions> = {
  created: '2026-01-01T00:00:00Z',
  modified: '2026-01-01T00:00:00Z',
  lastModifiedBy: 'oracle',
  appVersion: '16.0',
  cellA2Value: 42,
};

const CONTENT_TYPES_XLSX = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/sharedStrings.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sharedStrings+xml"/>
  <Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
  <Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>
</Types>`;

const ROOT_RELS_XLSX = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>
</Relationships>`;

function coreXml(created: string, modified: string, lastModifiedBy: string): string {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <dc:creator>oracle</dc:creator>
  <dcterms:created xsi:type="dcterms:W3CDTF">${created}</dcterms:created>
  <dcterms:modified xsi:type="dcterms:W3CDTF">${modified}</dcterms:modified>
  <cp:lastModifiedBy>${lastModifiedBy}</cp:lastModifiedBy>
</cp:coreProperties>`;
}

function appXml(appVersion: string): string {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties">
  <Application>ethercalc-oracle-harness</Application>
  <AppVersion>${appVersion}</AppVersion>
</Properties>`;
}

const WORKBOOK_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>
    <sheet name="Sheet1" sheetId="1" r:id="rId1"/>
  </sheets>
</workbook>`;

const WORKBOOK_RELS = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/sharedStrings" Target="sharedStrings.xml"/>
</Relationships>`;

function sheetXml(cellA2Value: number): string {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <sheetData>
    <row r="1"><c r="A1" t="s"><v>0</v></c></row>
    <row r="2"><c r="A2"><v>${cellA2Value}</v></c></row>
  </sheetData>
</worksheet>`;
}

const SHARED_STRINGS = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" count="1" uniqueCount="1">
  <si><t>hello</t></si>
</sst>`;

// ─── ODS ─────────────────────────────────────────────────────────────────

/**
 * Minimal ods archive with a single sheet containing two cells:
 *   A1 = "hello"
 *   A2 = 42
 *
 * Entries included:
 *   • `mimetype` — must be first, uncompressed (we compress for simplicity;
 *     the matcher doesn't validate the mimetype-first requirement)
 *   • `META-INF/manifest.xml` — manifest of zip contents
 *   • `meta.xml` — volatile metadata (creation-date, dc:date, generator)
 *   • `settings.xml` — view settings (stable)
 *   • `styles.xml` — style definitions (stable)
 *   • `content.xml` — the sheet cells (the real payload)
 */
export function buildBasicOds(options: OdsOptions = {}): Uint8Array {
  const opts = { ...defaultOdsOptions, ...options };
  return zipSync({
    mimetype: strToU8(MIMETYPE_ODS),
    'META-INF/manifest.xml': strToU8(MANIFEST_XML),
    'meta.xml': strToU8(odsMetaXml(opts.creationDate, opts.generator, opts.creator)),
    'settings.xml': strToU8(ODS_SETTINGS_XML),
    'styles.xml': strToU8(ODS_STYLES_XML),
    'content.xml': strToU8(odsContentXml(opts.cellA2Value)),
  });
}

export interface OdsOptions {
  /** meta:creation-date. Default: "2026-01-01T00:00:00.000000000". */
  readonly creationDate?: string;
  /** meta:generator. Default: "ethercalc/1.0". */
  readonly generator?: string;
  /** dc:creator. Default: "oracle". */
  readonly creator?: string;
  /** Numeric value written to table:A2. Default: 42. */
  readonly cellA2Value?: number;
}

const defaultOdsOptions: Required<OdsOptions> = {
  creationDate: '2026-01-01T00:00:00.000000000',
  generator: 'ethercalc/1.0',
  creator: 'oracle',
  cellA2Value: 42,
};

const MIMETYPE_ODS = 'application/vnd.oasis.opendocument.spreadsheet';

const MANIFEST_XML = `<?xml version="1.0" encoding="UTF-8"?>
<manifest:manifest xmlns:manifest="urn:oasis:names:tc:opendocument:xmlns:manifest:1.0">
  <manifest:file-entry manifest:full-path="/" manifest:media-type="application/vnd.oasis.opendocument.spreadsheet"/>
  <manifest:file-entry manifest:full-path="content.xml" manifest:media-type="text/xml"/>
  <manifest:file-entry manifest:full-path="styles.xml" manifest:media-type="text/xml"/>
  <manifest:file-entry manifest:full-path="meta.xml" manifest:media-type="text/xml"/>
  <manifest:file-entry manifest:full-path="settings.xml" manifest:media-type="text/xml"/>
</manifest:manifest>`;

function odsMetaXml(creationDate: string, generator: string, creator: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<office:document-meta xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0" xmlns:meta="urn:oasis:names:tc:opendocument:xmlns:meta:1.0" xmlns:dc="http://purl.org/dc/elements/1.1/">
  <office:meta>
    <meta:generator>${generator}</meta:generator>
    <meta:creation-date>${creationDate}</meta:creation-date>
    <dc:date>${creationDate}</dc:date>
    <dc:creator>${creator}</dc:creator>
    <meta:editing-cycles>1</meta:editing-cycles>
    <meta:editing-duration>PT0S</meta:editing-duration>
  </office:meta>
</office:document-meta>`;
}

const ODS_SETTINGS_XML = `<?xml version="1.0" encoding="UTF-8"?>
<office:document-settings xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0">
  <office:settings/>
</office:document-settings>`;

const ODS_STYLES_XML = `<?xml version="1.0" encoding="UTF-8"?>
<office:document-styles xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0">
  <office:styles/>
</office:document-styles>`;

function odsContentXml(cellA2Value: number): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<office:document-content xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0" xmlns:table="urn:oasis:names:tc:opendocument:xmlns:table:1.0" xmlns:text="urn:oasis:names:tc:opendocument:xmlns:text:1.0">
  <office:body>
    <office:spreadsheet>
      <table:table table:name="Sheet1">
        <table:table-row>
          <table:table-cell office:value-type="string"><text:p>hello</text:p></table:table-cell>
        </table:table-row>
        <table:table-row>
          <table:table-cell office:value-type="float" office:value="${cellA2Value}"><text:p>${cellA2Value}</text:p></table:table-cell>
        </table:table-row>
      </table:table>
    </office:spreadsheet>
  </office:body>
</office:document-content>`;
}

// ─── corrupted ───────────────────────────────────────────────────────────

/**
 * Deterministic non-zip bytes — used to exercise the corruption path.
 * Matches `fflate`'s "invalid zip data" error branch.
 */
export function buildCorruptedZip(): Uint8Array {
  return new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
}
