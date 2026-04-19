/**
 * Room-name helpers.
 *
 * `generateRoomId` — produce a fresh 12-char lowercase alphanumeric ID.
 *
 * Legacy used `uuid-pure`'s `newId(12, 36)` which drew 12 random characters
 * from the 36-char alphabet `[0-9a-z]`. The compatibility risk §7 item 6
 * in CLAUDE.md commits us to replicating the *shape* via
 * `crypto.randomUUID().replace(/-/g,'').slice(0,12)` — that gives us 12
 * lowercase hex chars, a strict subset of `[0-9a-z]`. The oracle
 * recording `misc/get-new-redirect` regexes `^/[a-z0-9]{12}$`, so the
 * subset still matches.
 *
 * `encodeRoom` — parity with legacy `encodeURI(params.room)` used on
 * every room-derived code path (src/main.ls:101,272,278,297…). In Hono
 * we receive already-decoded path params, so we must re-encode via the
 * *same* `encodeURI` function to derive storage keys that match the
 * oracle byte-for-byte. `encodeURI` preserves ASCII + reserved URI
 * characters (`;/?:@&=+$,#`) and percent-encodes everything else.
 */

const ROOM_ID_LEN = 12;

/**
 * Generate a fresh 12-char lowercase alphanumeric room id. Uses
 * `crypto.randomUUID` (Web Crypto, available in Node ≥ 19 and workerd).
 */
export function generateRoomId(): string {
  return crypto.randomUUID().replace(/-/g, '').slice(0, ROOM_ID_LEN);
}

/**
 * Encode a room name the way legacy does. Thin wrapper over `encodeURI`
 * so we have one choke-point should a future divergence be desired.
 *
 * Known divergence: `encodeURI` leaves `;/?:@&=+$,#` alone. A room name
 * containing e.g. `?` would be a bug in both oracle and target (the URL
 * router would strip the query before seeing it), but documented here
 * for completeness. No fix planned — preserve legacy behavior.
 */
export function encodeRoom(raw: string): string {
  return encodeURI(raw);
}
