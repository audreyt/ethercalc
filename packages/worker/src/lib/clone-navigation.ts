/**
 * Allow template-copy navigation for a same-origin or user-initiated
 * browser request. A missing Fetch Metadata header is a non-browser
 * client (curl, the oracle harness) and stays allowed; a present
 * cross-site or same-site value is rejected.
 *
 * `same-origin` only names the requesting document, and our own sheets
 * render cell content written by anyone: an `<img>` in a cell is a
 * same-origin request too. `Sec-Fetch-Mode` is what tells such a
 * subresource load (`no-cors`, `cors`) from a navigation, so a present
 * mode must be `navigate`.
 */
export function allowsCloneNavigation(
  fetchSite: string | undefined | null,
  fetchMode: string | undefined | null,
): boolean {
  if (fetchSite == null) return true;
  if (fetchSite !== 'same-origin' && fetchSite !== 'none') return false;
  return fetchMode == null || fetchMode === 'navigate';
}
