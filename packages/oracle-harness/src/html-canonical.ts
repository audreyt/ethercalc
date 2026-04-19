/**
 * HTML (and XML) canonicalization for the oracle replayer.
 *
 * We want two semantically-equivalent HTML documents to compare equal
 * even when superficial details (attribute order, generated ids,
 * insignificant whitespace) differ. This module parses via `linkedom`,
 * walks the DOM, drops noise, sorts attributes, and re-serializes.
 *
 * HTML rules (documented in CLAUDE.md §4.4):
 *   • Whitespace-only text nodes are dropped. Text nodes with content
 *     are preserved with leading/trailing whitespace trimmed.
 *   • Comments are dropped entirely — both oracle and target may
 *     produce different build-stamp comments.
 *   • Attribute order is normalized by sorting alphabetically. The
 *     byte representation of the original HTML doesn't constrain
 *     attribute order per the HTML spec, so this is safe.
 *   • The following attributes are dropped anywhere they appear:
 *       - `id` values matching `/^(SocialCalc|[a-f0-9-]{32,})/` —
 *         SocialCalc generates ids like `SocialCalc-edittools-...`
 *         each page load; UUID-shaped ids also rotate.
 *       - references to those ids in `for`, `aria-labelledby`,
 *         `aria-controls`, `aria-describedby`, `headers`,
 *         `form`, `list`, and `href="#..."`.
 *
 * The `id` drop is conservative: we only strip the *volatile* id,
 * not an id like `id="result"` that a test fixture might assert on.
 *
 * The `canonicalizeXml` export applies the same rules and is used by
 * the xlsx/ods matchers in `zip-canonical.ts`. Volatile-id logic still
 * runs but on well-behaved XML (content.xml, core.xml, …) none of the
 * ids look SocialCalc-shaped so it's effectively a no-op there.
 *
 * Parse errors surface as `HtmlParseError` which the matcher translates
 * to a descriptive diff.
 */

import { parseHTML } from 'linkedom';

/** Shape returned by the canonicalizers. */
export interface Canonical {
  readonly canonical: string;
}

/** Error raised when linkedom can't construct a document root. */
export class HtmlParseError extends Error {
  constructor(reason: string) {
    super(reason);
    this.name = 'HtmlParseError';
  }
}

/**
 * Attributes that reference an `id` value — when the referenced id is
 * volatile we also drop the reference so the serialization stays stable
 * across runs.
 */
export const VOLATILE_ID_REFERRERS: readonly string[] = [
  'for',
  'aria-labelledby',
  'aria-controls',
  'aria-describedby',
  'headers',
  'form',
  'list',
];

/** Regex that flags an `id` attribute value as volatile. */
export const VOLATILE_ID_REGEX = /^(SocialCalc|[a-f0-9-]{32,})/;

/** Node-type constants — avoid depending on DOM globals. */
const ELEMENT_NODE = 1;
const TEXT_NODE = 3;
const CDATA_SECTION_NODE = 4;
const COMMENT_NODE = 8;

/**
 * Minimal structural type we need from a linkedom node. Everything we
 * call is guaranteed to exist on the real DOM surface — we keep the
 * properties non-optional so the coverage tool doesn't see spurious
 * "can be null" branches.
 */
interface DomNode {
  nodeType: number;
  nodeValue: string;
  readonly childNodes: { readonly length: number; [i: number]: DomNode };
  readonly attributes: { readonly length: number; [i: number]: { name: string; value: string } };
  removeChild(n: DomNode): unknown;
  removeAttribute(name: string): void;
  setAttribute(name: string, value: string): void;
  getAttribute(name: string): string | null;
  outerHTML: string;
}

/**
 * Walk the tree rooted at `node`, applying normalization in place.
 * Exported for direct unit testing; the canonicalizers are the usual
 * entry points.
 */
export function normalizeDomNode(node: DomNode): void {
  const volatileIds = new Set<string>();
  collectVolatileIds(node, volatileIds);
  rewriteTree(node, volatileIds);
}

function collectVolatileIds(node: DomNode, out: Set<string>): void {
  if (node.nodeType === ELEMENT_NODE) {
    const id = node.getAttribute('id');
    if (id !== null && VOLATILE_ID_REGEX.test(id)) out.add(id);
  }
  for (let i = 0; i < node.childNodes.length; i++) {
    collectVolatileIds(node.childNodes[i]!, out);
  }
}

function rewriteTree(node: DomNode, volatileIds: Set<string>): void {
  // Walk children first; collect nodes to remove in a separate pass so
  // the live child index isn't invalidated mid-iteration. Everything
  // reaching the `else` recursion below is guaranteed to be an element
  // — comment/text/cdata are handled in their own branches.
  const toRemove: DomNode[] = [];
  for (let i = 0; i < node.childNodes.length; i++) {
    const child = node.childNodes[i]!;
    if (child.nodeType === COMMENT_NODE) {
      toRemove.push(child);
      continue;
    }
    if (child.nodeType === TEXT_NODE || child.nodeType === CDATA_SECTION_NODE) {
      const trimmed = child.nodeValue.trim();
      if (trimmed === '') toRemove.push(child);
      else child.nodeValue = trimmed;
      continue;
    }
    rewriteTree(child, volatileIds);
  }
  for (const c of toRemove) node.removeChild(c);

  // Snapshot attributes before we start removing (live NamedNodeMap),
  // drop volatile entries, then re-insert in reverse-alphabetical
  // order. linkedom's `setAttribute` *prepends* to the attribute list,
  // so setting Z before A yields alphabetical serialization.
  const entries: Array<[string, string]> = [];
  for (let i = 0; i < node.attributes.length; i++) {
    const a = node.attributes[i]!;
    entries.push([a.name, a.value]);
  }
  for (const [name] of entries) node.removeAttribute(name);

  const keep: Array<[string, string]> = [];
  for (const [name, value] of entries) {
    if (name === 'id' && VOLATILE_ID_REGEX.test(value)) continue;
    if (VOLATILE_ID_REFERRERS.includes(name) && refersToVolatileId(value, volatileIds)) continue;
    if (name === 'href' && value.startsWith('#') && volatileIds.has(value.slice(1))) continue;
    keep.push([name, value]);
  }
  // Sort reverse-alphabetical so the prepend-on-set produces alphabetical
  // in the final output. Attribute names are unique within an element,
  // so the equal-keys branch never fires — hence the simpler compare.
  keep.sort(([a], [b]) => (a < b ? 1 : -1));
  for (const [name, value] of keep) node.setAttribute(name, value);
}

function refersToVolatileId(value: string, volatileIds: Set<string>): boolean {
  // `aria-labelledby` accepts space-separated id lists; `for` is one id.
  // Same tokenization handles both. Empty/whitespace value → no match.
  const tokens = value.split(/\s+/).filter((t) => t.length > 0);
  if (tokens.length === 0) return false;
  return tokens.every((t) => volatileIds.has(t) || VOLATILE_ID_REGEX.test(t));
}

/**
 * Parse as HTML via linkedom, canonicalize in-place, and return the
 * re-serialized document. We read `outerHTML` on the root element so
 * the comparison isn't affected by doctype positioning.
 *
 * linkedom's `parseHTML` is forgiving — it recovers silently from
 * nearly all malformed input. The only failure mode we see in practice
 * is a totally empty input (empty string → no `documentElement`),
 * which we surface as `HtmlParseError`.
 */
export function canonicalizeHtml(raw: string): Canonical {
  const { document } = parseHTML(raw);
  const de = (document as unknown as { documentElement: DomNode | null }).documentElement;
  if (!de) throw new HtmlParseError('linkedom returned no documentElement');
  normalizeDomNode(de);
  return { canonical: de.outerHTML };
}

// `canonicalizeXml` lives in `zip-canonical.ts` alongside the xlsx/ods
// drop lists — it reuses `normalizeDomNode` from here.
