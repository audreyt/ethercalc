/**
 * ZIP-archive canonicalization for xlsx/ods matchers.
 *
 * xlsx and ods are both ZIP archives containing XML entries (plus an
 * occasional binary image). For oracle-replay we want two archives
 * to compare equal when their semantic content matches, ignoring:
 *
 *   • file order in the zip stream
 *   • XML attribute order, insignificant whitespace, comments
 *     (handled by the linkedom-based canonicalizer from
 *     `html-canonical.ts`)
 *   • volatile metadata elements in `docProps/` (xlsx) and `meta.xml`
 *     (ods) that carry timestamps / authorship / tool version
 *
 * Volatile-element drop lists per file (explicit and documented here):
 *
 * xlsx `docProps/core.xml`
 *   - `<dcterms:created>`
 *   - `<dcterms:modified>`
 *   - `<cp:lastModifiedBy>`
 *   - `<cp:revision>` (rolls forward on every save)
 *
 * xlsx `docProps/app.xml`
 *   - `<AppVersion>` (rolls with the tool version)
 *   - `<TotalTime>` (edit-session clock)
 *
 * ods `meta.xml`
 *   - `<meta:creation-date>`
 *   - `<dc:date>`
 *   - `<meta:editing-duration>`
 *   - `<meta:editing-cycles>`
 *   - `<meta:generator>`
 *   - `<dc:creator>` (ods writes the OS username here)
 *
 * Non-XML binary entries (images under `xl/media/`, `Pictures/`, etc.)
 * are compared byte-for-byte — SocialCalc doesn't embed images so in
 * practice these slots are empty, but the code path is covered.
 *
 * Corrupted zips surface as an `HtmlParseError` with the fflate
 * error message so the matcher can report a meaningful diff.
 */

import { unzipSync } from 'fflate';
import { DOMParser } from 'linkedom';

import { HtmlParseError, normalizeDomNode } from './html-canonical.ts';

/** xlsx volatile element names keyed by path-within-zip. */
export const VOLATILE_XLSX_DOCPROPS: Readonly<Record<string, readonly string[]>> = {
  'docProps/core.xml': ['dcterms:created', 'dcterms:modified', 'cp:lastModifiedBy', 'cp:revision'],
  'docProps/app.xml': ['AppVersion', 'TotalTime'],
};

/** Zip paths that may appear on only one side (SheetJS / legacy layout drift). */
export const OPTIONAL_XLSX_ZIP_ENTRIES: ReadonlySet<string> = new Set([
  'xl/sharedStrings.xml',
  'xl/metadata.xml',
]);

export const OPTIONAL_ODS_ZIP_ENTRIES: ReadonlySet<string> = new Set([
  'meta.xml',
  'styles.xml',
]);

/** ods volatile element names keyed by path-within-zip. */
export const VOLATILE_ODS_META: Readonly<Record<string, readonly string[]>> = {
  'meta.xml': [
    'meta:creation-date',
    'dc:date',
    'meta:editing-duration',
    'meta:editing-cycles',
    'meta:generator',
    'dc:creator',
  ],
};

/** Shape accepted by the per-entry canonicalizer. */
interface VolatileMap {
  readonly [path: string]: readonly string[];
}

/** Minimal DOM element type we need — matches linkedom. */
interface DomElement {
  readonly childNodes: { readonly length: number; [i: number]: DomElement };
  readonly nodeType: number;
  readonly nodeName: string;
  removeChild(c: DomElement): unknown;
  readonly outerHTML: string;
}

/**
 * Result of comparing two archives. `equal` is the go/no-go; `diff`
 * carries a human-readable explanation of the first divergence we
 * found (e.g. missing entry, byte mismatch in sheet1.xml, etc.).
 */
export interface ZipCompareResult {
  readonly equal: boolean;
  readonly diff?: string;
}

/**
 * Unzip or return `{equal:false, diff:...}` describing the failure.
 * Separate from `compareZipArchives` so the caller can distinguish
 * "corrupt expected" from "corrupt actual" in the diff text.
 */
export function unzipOrError(bytes: Uint8Array, label: string): {
  readonly entries?: Readonly<Record<string, Uint8Array>>;
  readonly diff?: string;
} {
  try {
    return { entries: unzipSync(bytes) };
  } catch (err) {
    return { diff: `${label} is not a valid zip archive: ${(err as Error).message}` };
  }
}

/**
 * Canonicalize a single zip entry for comparison. Returns a string
 * that two equivalent entries must match on byte-for-byte.
 *
 * XML entries get DOM-normalized (attribute sort + whitespace trim +
 * volatile-element drop). Binary entries fall back to a base64-like
 * stable representation (hex string) so a text-based diff still works.
 */
export function canonicalizeZipEntry(
  path: string,
  bytes: Uint8Array,
  volatile: VolatileMap,
  optionalPaths: ReadonlySet<string> = new Set(),
  allEntries?: Readonly<Record<string, Uint8Array>>,
): string {
  if (isXmlPath(path)) {
    const text = new TextDecoder().decode(bytes);
    if (path === '[Content_Types].xml') {
      return canonicalizeContentTypesXml(text, optionalPaths);
    }
    if (path === 'META-INF/manifest.xml') {
      return canonicalizeOdsManifestXml(text, optionalPaths);
    }
    if (path === 'xl/_rels/workbook.xml.rels') {
      return canonicalizeWorkbookRelsXml(text, optionalPaths);
    }
    if (path === 'xl/workbook.xml') {
      return canonicalizeXlsxWorkbookXml(text);
    }
    if (isXlsxWorksheetPath(path)) {
      return canonicalizeXlsxWorksheetXml(text, allEntries);
    }
    if (path === 'content.xml') {
      return canonicalizeOdsContentXml(text);
    }
    if (path === 'manifest.rdf') {
      return canonicalizeOdsManifestRdf(text, optionalPaths);
    }
    return canonicalizeXmlWithDrops(text, volatile[path] ?? []);
  }
  // Binary: emit a hex digest-ish stable string. We don't hash because
  // the matcher wants to report "where" the mismatch is, and hex gives
  // per-byte context if needed (still a terse diff for small blobs).
  return bytesToHex(bytes);
}

/**
 * Compare two archives. If any entry differs, returns a description
 * of the first divergence. Missing/extra entries are reported first
 * since they change the canonical set of paths.
 */
export function compareZipArchives(
  expected: Uint8Array,
  actual: Uint8Array,
  volatile: VolatileMap,
  optionalPaths: ReadonlySet<string> = new Set(),
): ZipCompareResult {
  const e = unzipOrError(expected, 'expected body');
  if (e.diff) return { equal: false, diff: e.diff };
  const a = unzipOrError(actual, 'actual body');
  if (a.diff) return { equal: false, diff: a.diff };

  const eSet = new Set(Object.keys(e.entries!));
  const aSet = new Set(Object.keys(a.entries!));
  const allPaths = [...new Set([...eSet, ...aSet])].sort();
  const comparable: string[] = [];
  const eOnly: string[] = [];
  const aOnly: string[] = [];
  for (const path of allPaths) {
    const inE = eSet.has(path);
    const inA = aSet.has(path);
    if (inE && inA) {
      comparable.push(path);
      continue;
    }
    if (optionalPaths.has(path)) continue;
    if (inE) eOnly.push(path);
    else aOnly.push(path);
  }
  if (eOnly.length > 0 || aOnly.length > 0) {
    return {
      equal: false,
      diff: `zip entry list differs:\n--- expected-only\n${eOnly.join('\n')}\n--- actual-only\n${aOnly.join('\n')}`,
    };
  }
  for (const path of comparable) {
    const ec = canonicalizeZipEntry(path, e.entries![path]!, volatile, optionalPaths, e.entries);
    const ac = canonicalizeZipEntry(path, a.entries![path]!, volatile, optionalPaths, a.entries);
    if (ec !== ac) {
      return {
        equal: false,
        diff: `zip entry ${path} differs:\n--- expected\n${ec}\n--- actual\n${ac}`,
      };
    }
  }
  return { equal: true };
}

/** Drop MIME catalog rows for zip paths that may exist on only one side. */
export function canonicalizeContentTypesXml(
  raw: string,
  optionalZipPaths: ReadonlySet<string>,
): string {
  const optionalParts = new Set(
    [...optionalZipPaths].map((p) => (p.startsWith('/') ? p : `/${p}`)),
  );
  const doc = new DOMParser().parseFromString(raw, 'text/xml');
  const de = (doc as unknown as { documentElement: DomElementWithAttrs | null }).documentElement;
  if (!de) throw new HtmlParseError('linkedom could not parse xml as a rooted document');
  const toRemove: DomElementWithAttrs[] = [];
  walk(de, (el) => {
    if (el.nodeType !== 1) return;
    const name = el.nodeName;
    if (name === 'Override' || name.endsWith(':Override')) {
      const part = el.getAttribute('PartName');
      if (part && optionalParts.has(part)) toRemove.push(el);
      return;
    }
    if (name === 'Default' || name.endsWith(':Default')) {
      if (el.getAttribute('Extension') === 'data') toRemove.push(el);
    }
  });
  for (const el of toRemove) el.parentNode?.removeChild(el);
  normalizeDomNode(de as unknown as Parameters<typeof normalizeDomNode>[0]);
  return de.outerHTML;
}

/** Drop workbook relationships that point at optional xlsx parts. */
export function canonicalizeWorkbookRelsXml(
  raw: string,
  optionalZipPaths: ReadonlySet<string>,
): string {
  const optionalTargets = new Set(
    [...optionalZipPaths]
      .filter((p) => p.startsWith('xl/'))
      .map((p) => p.slice('xl/'.length)),
  );
  const doc = new DOMParser().parseFromString(raw, 'text/xml');
  const de = (doc as unknown as { documentElement: DomElementWithAttrs | null }).documentElement;
  if (!de) throw new HtmlParseError('linkedom could not parse xml as a rooted document');
  const toRemove: DomElementWithAttrs[] = [];
  walk(de, (el) => {
    if (el.nodeType !== 1) return;
    const name = el.nodeName;
    if (name !== 'Relationship' && !name.endsWith(':Relationship')) return;
    const target = el.getAttribute('Target');
    if (target && optionalTargets.has(target)) toRemove.push(el);
    el.removeAttribute('Id');
  });
  for (const el of toRemove) el.parentNode?.removeChild(el);
  normalizeDomNode(de as unknown as Parameters<typeof normalizeDomNode>[0]);
  return de.outerHTML;
}

/** Drop SheetJS vs legacy worksheet scaffolding and normalize string cells. */
export function canonicalizeXlsxWorksheetXml(
  raw: string,
  allEntries?: Readonly<Record<string, Uint8Array>>,
): string {
  const sharedStrings = parseXlsxSharedStrings(allEntries?.['xl/sharedStrings.xml']);
  const doc = new DOMParser().parseFromString(raw, 'text/xml');
  const de = (doc as unknown as { documentElement: DomElementWithAttrs | null }).documentElement;
  if (!de) throw new HtmlParseError('linkedom could not parse xml as a rooted document');
  const toRemove: DomElementWithAttrs[] = [];
  walk(de, (el) => {
    if (el.nodeType !== 1) return;
    const name = el.nodeName;
    if (name === 'sheetPr' || name.endsWith(':sheetPr')) {
      toRemove.push(el);
      return;
    }
    if (name === 'ignoredErrors' || name.endsWith(':ignoredErrors')) {
      toRemove.push(el);
      return;
    }
    if (name === 'dimension' || name.endsWith(':dimension')) {
      const ref = el.getAttribute('ref');
      if (ref?.includes(':')) {
        const [start, end] = ref.split(':');
        if (start === end) el.setAttribute('ref', start!);
      }
      return;
    }
    if (name !== 'c' && !name.endsWith(':c')) return;
    const t = el.getAttribute('t');
    const vEl = firstChildElement(el, 'v');
    if (!vEl) return;
    if (t === 's') {
      const idx = Number.parseInt(textContent(vEl), 10);
      const resolved = sharedStrings[idx] ?? '';
      el.removeAttribute('t');
      setTextContent(vEl, resolved);
      return;
    }
    if (t === 'str') el.removeAttribute('t');
  });
  for (const el of toRemove) el.parentNode?.removeChild(el);
  normalizeDomNode(de as unknown as Parameters<typeof normalizeDomNode>[0]);
  return de.outerHTML;
}

/** Drop legacy-only workbook metadata that SheetJS omits. */
export function canonicalizeXlsxWorkbookXml(raw: string): string {
  const doc = new DOMParser().parseFromString(raw, 'text/xml');
  const de = (doc as unknown as { documentElement: DomElementWithAttrs | null }).documentElement;
  if (!de) throw new HtmlParseError('linkedom could not parse xml as a rooted document');
  walk(de, (el) => {
    if (el.nodeType !== 1) return;
    const name = el.nodeName;
    if (name === 'workbookPr' || name.endsWith(':workbookPr')) {
      el.removeAttribute('date1904');
    }
  });
  normalizeDomNode(de as unknown as Parameters<typeof normalizeDomNode>[0]);
  return de.outerHTML;
}

/** Drop RDF manifest entries for optional ODS parts. */
export function canonicalizeOdsManifestRdf(
  raw: string,
  optionalZipPaths: ReadonlySet<string>,
): string {
  const doc = new DOMParser().parseFromString(raw, 'text/xml');
  const de = (doc as unknown as { documentElement: DomElementWithAttrs | null }).documentElement;
  if (!de) throw new HtmlParseError('linkedom could not parse xml as a rooted document');
  const toRemove: DomElementWithAttrs[] = [];
  walk(de, (el) => {
    if (el.nodeType !== 1) return;
    const name = el.nodeName;
    const about = el.getAttribute('rdf:about') ?? el.getAttribute('about');
    if (about && about !== '' && about !== '/') {
      const path = about.replace(/^\//, '');
      if (optionalZipPaths.has(path)) toRemove.push(el);
    }
    if (name.endsWith(':hasPart') || name === 'hasPart') {
      const resource = el.getAttribute('rdf:resource') ?? el.getAttribute('resource') ?? '';
      const path = resource.replace(/^\//, '');
      if (optionalZipPaths.has(path)) toRemove.push(el);
    }
  });
  for (const el of toRemove) el.parentNode?.removeChild(el);
  const emptyDescriptions: DomElementWithAttrs[] = [];
  walk(de, (el) => {
    if (el.nodeType !== 1) return;
    const name = el.nodeName;
    if (!name.endsWith(':Description') && name !== 'Description') return;
    const about = el.getAttribute('rdf:about') ?? el.getAttribute('about') ?? '';
    if (about !== '') return;
    let hasElements = false;
    walk(el, (child) => {
      if (child !== el && child.nodeType === 1) hasElements = true;
    });
    if (!hasElements) emptyDescriptions.push(el);
  });
  for (const el of emptyDescriptions) el.parentNode?.removeChild(el);
  normalizeDomNode(de as unknown as Parameters<typeof normalizeDomNode>[0]);
  return de.outerHTML;
}

/** Drop ODS automatic-styles scaffolding that SheetJS adds. */
export function canonicalizeOdsContentXml(raw: string): string {
  const doc = new DOMParser().parseFromString(raw, 'text/xml');
  const de = (doc as unknown as { documentElement: DomElementWithAttrs | null }).documentElement;
  if (!de) throw new HtmlParseError('linkedom could not parse xml as a rooted document');
  const toRemove: DomElementWithAttrs[] = [];
  walk(de, (el) => {
    if (el.nodeType !== 1) return;
    const name = el.nodeName;
    if (name === 'office:automatic-styles' || name.endsWith(':automatic-styles')) {
      toRemove.push(el);
      return;
    }
    if (name === 'table:table' || name.endsWith(':table')) {
      el.removeAttribute('table:style-name');
      el.removeAttribute('style-name');
    }
  });
  for (const el of toRemove) el.parentNode?.removeChild(el);
  normalizeDomNode(de as unknown as Parameters<typeof normalizeDomNode>[0]);
  return de.outerHTML;
}

/** Drop manifest rows for ODS paths that may exist on only one exporter. */
export function canonicalizeOdsManifestXml(
  raw: string,
  optionalZipPaths: ReadonlySet<string>,
): string {
  const doc = new DOMParser().parseFromString(raw, 'text/xml');
  const de = (doc as unknown as { documentElement: DomElementWithAttrs | null }).documentElement;
  if (!de) throw new HtmlParseError('linkedom could not parse xml as a rooted document');
  const toRemove: DomElementWithAttrs[] = [];
  walk(de, (el) => {
    if (el.nodeType !== 1) return;
    const name = el.nodeName;
    if (name !== 'manifest:file-entry' && !name.endsWith(':file-entry')) return;
    const fullPath = el.getAttribute('manifest:full-path') ?? el.getAttribute('full-path');
    if (fullPath && optionalZipPaths.has(fullPath.replace(/^\//, ''))) toRemove.push(el);
  });
  for (const el of toRemove) el.parentNode?.removeChild(el);
  normalizeDomNode(de as unknown as Parameters<typeof normalizeDomNode>[0]);
  return de.outerHTML;
}

/**
 * Parse as XML, drop any element (at any depth) whose `nodeName`
 * matches one of `dropNames`, and re-serialize through
 * `normalizeDomNode` for whitespace/attribute normalization.
 */
export function canonicalizeXmlWithDrops(raw: string, dropNames: readonly string[]): string {
  const doc = new DOMParser().parseFromString(raw, 'text/xml');
  const de = (doc as unknown as { documentElement: DomElementWithAttrs | null }).documentElement;
  if (!de) throw new HtmlParseError('linkedom could not parse xml as a rooted document');
  if (dropNames.length > 0) {
    const set = new Set(dropNames);
    removeMatchingDescendants(de, set);
  }
  normalizeDomNode(de as unknown as Parameters<typeof normalizeDomNode>[0]);
  return de.outerHTML;
}

/** Walk the tree rooted at `node`, removing any element whose `nodeName` matches `set`. */
function removeMatchingDescendants(
  node: DomElementWithAttrs,
  set: Set<string>,
): void {
  const toRemove: DomElementWithAttrs[] = [];
  walk(node, (el) => {
    if (el.nodeType === 1 && set.has(el.nodeName)) toRemove.push(el);
  });
  for (const el of toRemove) el.parentNode?.removeChild(el);
}

function walk(node: DomElementWithAttrs, visit: (n: DomElementWithAttrs) => void): void {
  visit(node);
  for (let i = 0; i < node.childNodes.length; i++) {
    walk(node.childNodes[i]! as DomElementWithAttrs, visit);
  }
}

interface DomElementWithParent extends DomElement {
  readonly parentNode?: DomElementWithParent | null;
}

interface DomElementWithAttrs extends DomElementWithParent {
  getAttribute(name: string): string | null;
  setAttribute(name: string, value: string): void;
  removeAttribute(name: string): void;
}

function isXmlPath(path: string): boolean {
  return (
    path.endsWith('.xml') ||
    path.endsWith('.rels') ||
    path === '[Content_Types].xml' ||
    path === 'manifest.rdf'
  );
}

function isXlsxWorksheetPath(path: string): boolean {
  return /^xl\/worksheets\/sheet\d+\.xml$/.test(path);
}

function parseXlsxSharedStrings(bytes: Uint8Array | undefined): readonly string[] {
  if (!bytes) return [];
  const text = new TextDecoder().decode(bytes);
  const doc = new DOMParser().parseFromString(text, 'text/xml');
  const de = (doc as unknown as { documentElement: DomElementWithAttrs | null }).documentElement;
  if (!de) return [];
  const out: string[] = [];
  walk(de, (el) => {
    if (el.nodeType !== 1) return;
    const name = el.nodeName;
    if (name !== 'si' && !name.endsWith(':si')) return;
    const tEl = firstChildElement(el, 't');
    out.push(tEl ? textContent(tEl) : '');
  });
  return out;
}

function firstChildElement(
  parent: DomElementWithAttrs,
  localName: string,
): DomElementWithAttrs | null {
  for (let i = 0; i < parent.childNodes.length; i++) {
    const child = parent.childNodes[i]! as DomElementWithAttrs;
    if (child.nodeType !== 1) continue;
    if (xmlLocalName(child.nodeName) === localName) return child;
  }
  return null;
}

function xmlLocalName(name: string): string {
  const idx = name.lastIndexOf(':');
  return idx >= 0 ? name.slice(idx + 1) : name;
}

function textContent(el: DomElementWithAttrs): string {
  return (el as unknown as { textContent: string }).textContent;
}

function setTextContent(el: DomElementWithAttrs, value: string): void {
  (el as unknown as { textContent: string }).textContent = value;
}

function bytesToHex(bytes: Uint8Array): string {
  let out = '';
  for (let i = 0; i < bytes.length; i++) {
    const b = bytes[i]!;
    out += (b < 16 ? '0' : '') + b.toString(16);
  }
  return out;
}
