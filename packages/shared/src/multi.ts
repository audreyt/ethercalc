/** Shared limits and validation for persisted multi-sheet table-of-contents rows. */
export const MAX_MULTI_SHEETS = 256;
export const MAX_MULTI_SHEET_TITLE_LENGTH = 256;
export const MAX_MULTI_SHEET_LINK_LENGTH = 2_048;

/**
 * Accept only a same-origin, root-relative, single-segment room path.
 *
 * TOC links become iframe URLs and quoted SocialCalc sheet references. A
 * protocol-relative URL, traversal segment, encoded slash, quote, or formula
 * delimiter would otherwise cross one of those trust boundaries.
 */
export function isSafeMultiSheetLink(link: string): boolean {
  if (
    link.length < 2 ||
    link.length > MAX_MULTI_SHEET_LINK_LENGTH ||
    link[0] !== '/' ||
    // Protocol-relative `//host` is already rejected by the single-segment
    // check below; this reads as the explicit intent, so its mutants are
    // equivalent rather than untested.
    // Stryker disable next-line all
    link[1] === '/' ||
    link.slice(1).includes('/')
  ) {
    return false;
  }

  let segment: string;
  try {
    segment = decodeURIComponent(link.slice(1));
  } catch {
    return false;
  }

  if (segment === '.' || segment === '..') return false;
  return !/[\\/?#"!\u0000-\u001f\u007f]/.test(segment);
}
