/** Allow template-copy navigation only when Fetch Metadata identifies a local action. */
export function allowsCloneNavigation(fetchSite: string | undefined | null): boolean {
  return fetchSite === 'same-origin' || fetchSite === 'none';
}
