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
): string {
  if (isXmlPath(path)) {
    const text = new TextDecoder().decode(bytes);
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
): ZipCompareResult {
  const e = unzipOrError(expected, 'expected body');
  if (e.diff) return { equal: false, diff: e.diff };
  const a = unzipOrError(actual, 'actual body');
  if (a.diff) return { equal: false, diff: a.diff };

  const ePaths = Object.keys(e.entries!).sort();
  const aPaths = Object.keys(a.entries!).sort();
  if (ePaths.length !== aPaths.length || ePaths.some((p, i) => p !== aPaths[i])) {
    return {
      equal: false,
      diff: `zip entry list differs:\n--- expected\n${ePaths.join('\n')}\n--- actual\n${aPaths.join('\n')}`,
    };
  }
  for (const path of ePaths) {
    const ec = canonicalizeZipEntry(path, e.entries![path]!, volatile);
    const ac = canonicalizeZipEntry(path, a.entries![path]!, volatile);
    if (ec !== ac) {
      return {
        equal: false,
        diff: `zip entry ${path} differs:\n--- expected\n${ec}\n--- actual\n${ac}`,
      };
    }
  }
  return { equal: true };
}

/**
 * Parse as XML, drop any element (at any depth) whose `nodeName`
 * matches one of `dropNames`, and re-serialize through
 * `normalizeDomNode` for whitespace/attribute normalization.
 *
 * Depth-walk matters because ODS buries its volatile metadata under
 * `<office:meta>` inside `<office:document-meta>`, not at the root.
 *
 * Throws on parse failure so the caller can tag it with the entry
 * path that failed.
 */
export function canonicalizeXmlWithDrops(raw: string, dropNames: readonly string[]): string {
  const doc = new DOMParser().parseFromString(raw, 'text/xml');
  const de = (doc as unknown as { documentElement: DomElementWithParent | null }).documentElement;
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
  node: DomElementWithParent,
  set: Set<string>,
): void {
  const toRemove: DomElementWithParent[] = [];
  walk(node, (el) => {
    if (el.nodeType === 1 && set.has(el.nodeName)) toRemove.push(el);
  });
  for (const el of toRemove) el.parentNode?.removeChild(el);
}

function walk(node: DomElementWithParent, visit: (n: DomElementWithParent) => void): void {
  visit(node);
  for (let i = 0; i < node.childNodes.length; i++) {
    walk(node.childNodes[i]! as DomElementWithParent, visit);
  }
}

interface DomElementWithParent extends DomElement {
  readonly parentNode?: DomElementWithParent | null;
}

function isXmlPath(path: string): boolean {
  return path.endsWith('.xml') || path.endsWith('.rels') || path === '[Content_Types].xml';
}

function bytesToHex(bytes: Uint8Array): string {
  let out = '';
  for (let i = 0; i < bytes.length; i++) {
    const b = bytes[i]!;
    out += (b < 16 ? '0' : '') + b.toString(16);
  }
  return out;
}
