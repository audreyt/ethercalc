/**
 * Room-name helpers.
 *
 * `generateRoomId` — produce a fresh 12-char lowercase alphanumeric ID.
 *
 * Legacy used `uuid-pure`'s `newId(12, 36)`, yielding about 62 bits from
 * `[0-9a-z]`. Project the full random UUID into base36 before taking the
 * final 12 digits; slicing UUID hex directly would retain only 48 bits.
 * The oracle's `^/[a-z0-9]{12}$` shape remains unchanged.
 *
 * `encodeRoom` — parity with legacy `encodeURI(params.room)` used on
 * every room-derived code path (src/main.ls:101,272,278,297…). In Hono
 * we receive already-decoded path params, so we must re-encode via the
 * *same* `encodeURI` function to derive storage keys that match the
 * oracle byte-for-byte. `encodeURI` preserves ASCII + reserved URI
 * characters (`;/?:@&=+$,#`) and percent-encodes everything else.
 */

const ROOM_ID_LEN = 12;
export const MAX_ROOM_NAME_CHARS = 2_048;
const ROOM_CONTROL_CHARS = /[\u0000-\u001f\u007f]/;

/** Validate a room before it becomes a DO id, D1 key, URL, or header value. */
export function isValidRoomName(raw: unknown): raw is string {
  if (
    typeof raw !== 'string' ||
    raw.length === 0 ||
    raw.length > MAX_ROOM_NAME_CHARS ||
    ROOM_CONTROL_CHARS.test(raw)
  ) {
    return false;
  }
  for (let index = 0; index < raw.length; index += 1) {
    const code = raw.charCodeAt(index);
    if (code >= 0xd800 && code <= 0xdbff) {
      const next = raw.charCodeAt(index + 1);
      // A high surrogate at the very end yields NaN here; every `<`/`>`
      // comparison against NaN is false, so the test must be positive.
      if (!(next >= 0xdc00 && next <= 0xdfff)) return false;
      index += 1;
    } else if (code >= 0xdc00 && code <= 0xdfff) {
      return false;
    }
  }
  return true;
}

/**
 * Generate a fresh 12-char lowercase base36 room id.
 */
export function generateRoomId(): string {
  const hex = crypto.randomUUID().replaceAll('-', '');
  return BigInt(`0x${hex}`)
    .toString(36)
    .padStart(ROOM_ID_LEN, '0')
    .slice(-ROOM_ID_LEN);
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
  if (!isValidRoomName(raw)) throw new RangeError('Invalid room name');
  return encodeURI(raw);
}
