/**
 * Search-engine indexing policy.
 *
 * Room slugs are the ONLY thing standing between a public room and the
 * world. Once a room URL is indexed, "unguessable URL" degrades into "first
 * search result", and every spreadsheet someone linked from a public page
 * drags its neighbours in with it. So the default for the whole surface is
 * `noindex`, and only `/` opts back in.
 *
 * WHY THERE IS NO `Disallow:` IN `ROBOTS_TXT` — read before "fixing" it:
 * `Disallow` forbids *fetching*, not indexing. A crawler that is not allowed
 * to fetch a URL can never see its `X-Robots-Tag: noindex`, so a blanket
 * `Disallow: /` would FREEZE every already-indexed room in the index as a
 * bare-title result, permanently. De-indexing requires the opposite: the URL
 * must stay fetchable and answer with `noindex`. Keep it that way.
 */

/** Applied to every response that is not on the indexable allowlist. */
export const ROBOTS_NOINDEX = 'noindex, nofollow, noarchive';

/**
 * Sole public marketing/landing surface. Everything
 * else — rooms, exports, APIs, operator routes — is user content.
 */
const INDEXABLE_PATHS: Readonly<Record<string, true>> = {
  '/': true,
};

/**
 * True when a path may appear in search results. Deliberately an exact-match
 * allowlist rather than a room-shaped denylist: a new route is user data
 * until someone proves otherwise, and an omission fails closed (hidden)
 * instead of open (indexed).
 */
export function isIndexablePath(pathname: string): boolean {
  return INDEXABLE_PATHS[pathname] === true;
}

/**
 * `robots.txt` body. Crawling is allowed precisely so that crawlers keep
 * reaching the `noindex` header above; no sitemap is advertised, because
 * enumerating rooms is the exact thing we are preventing.
 */
export const ROBOTS_TXT = `User-agent: *
Allow: /

# Room URLs are unlisted by design. Crawling is intentionally permitted so
# that crawlers can read the "X-Robots-Tag: noindex" header every non-landing
# response carries; a Disallow rule here would hide that header and strand
# already-indexed rooms in the index forever.
`;
