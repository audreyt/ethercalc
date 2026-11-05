/**
 * Allow template-copy navigation for a same-origin or user-initiated
 * browser request. A missing Fetch Metadata header is a non-browser
 * client (curl, the oracle harness) and stays allowed; a present
 * cross-site or same-site value is rejected.
 */
export function allowsCloneNavigation(fetchSite: string | undefined | null): boolean {
  if (fetchSite == null) return true;
  return fetchSite === 'same-origin' || fetchSite === 'none';
}
