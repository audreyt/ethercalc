/**
 * socket.io v0.9 wire-frame codec.
 *
 * Protocol reference: https://github.com/socketio/socket.io-protocol/tree/v1
 * (v0.9 uses what the spec calls "protocol 1" — the colon-delimited text
 * format, *not* the later Engine.IO packet encoding.)
 *
 * Frame shape: `<type>:<id>:<endpoint>:<data>`
 *
 * Fields:
 *   - type:     0-8 single digit (see PacketType below)
 *   - id:       message id for ack tracking; optional; can end with `+` for
 *               "ack auto-reply on server receive" (we accept but discard)
 *   - endpoint: namespace path, typically empty or `/namespace`
 *   - data:     opaque remainder. For type 5 (event) this is a JSON blob
 *               `{"name":"…","args":[…]}`.
 *
 * Only `data` may contain colons — we split exactly three times from the left
 * so `data` keeps its colons intact. This matches the reference socket.io
 * 0.9 parser behavior (`lib/parser.js:110`).
 */

/** socket.io v0.9 packet type codes. */
export const PacketType = {
  Disconnect: 0,
  Connect: 1,
  Heartbeat: 2,
  Message: 3,
  Json: 4,
  Event: 5,
  Ack: 6,
  Error: 7,
  Noop: 8,
} as const;

export type PacketTypeCode = (typeof PacketType)[keyof typeof PacketType];

/**
 * A decoded packet. `id`/`endpoint`/`data` are all optional; callers decide
 * which combinations make sense per type. We keep `data` as the raw string
 * rather than parsing the JSON eagerly: translate.ts owns the JSON layer.
 */
export interface Packet {
  type: PacketTypeCode;
  id?: number;
  endpoint?: string;
  data?: string;
}

const VALID_TYPES: readonly number[] = [0, 1, 2, 3, 4, 5, 6, 7, 8];

/**
 * Encode a Packet back to the colon-delimited wire form.
 *
 * Omitted id/endpoint/data are serialized as empty segments — the reference
 * socket.io implementation is sensitive to the exact colon count. We always
 * emit all three separator colons to keep the framing unambiguous, then
 * trim trailing ones only when strictly safe (no data and no endpoint).
 */
export function encodeFrame(packet: Packet): string {
  const typePart = String(packet.type);
  const idPart = packet.id === undefined ? '' : String(packet.id);
  const endpointPart = packet.endpoint ?? '';
  const dataPart = packet.data ?? '';

  // Always emit at least `<type>:<id>:<endpoint>`. Append `:<data>` only if
  // data is present — trailing empty segment is legal but noisy, and the
  // reference parser is happy with either form.
  if (dataPart === '') {
    return `${typePart}:${idPart}:${endpointPart}`;
  }
  return `${typePart}:${idPart}:${endpointPart}:${dataPart}`;
}

/**
 * Decode a raw wire string into a Packet, or return null for anything
 * unparseable.
 *
 * Accepts:
 *   - `N` (just the type)
 *   - `N:` / `N::` / `N:::` (trailing empty segments)
 *   - `N:<id>:<endpoint>:<data>` (full form)
 *
 * Rejects:
 *   - Empty input
 *   - Non-digit first character
 *   - Type code outside 0-8
 *   - Non-numeric id segment (e.g. `5:abc:/:...`)
 */
export function decodeFrame(raw: string): Packet | null {
  if (typeof raw !== 'string' || raw.length === 0) return null;

  // Split at most 3 times from the left so `data` retains any embedded colons.
  // JS's String.split with a limit *truncates* — it doesn't pack the tail
  // into the last chunk — so we roll our own.
  const parts: string[] = [];
  let start = 0;
  for (let i = 0; i < 3 && start <= raw.length; i++) {
    const colon = raw.indexOf(':', start);
    if (colon === -1) {
      parts.push(raw.slice(start));
      start = raw.length + 1;
      break;
    }
    parts.push(raw.slice(start, colon));
    start = colon + 1;
  }
  if (start <= raw.length) parts.push(raw.slice(start));

  const typeStr = parts[0];
  if (typeof typeStr !== 'string' || typeStr.length === 0) return null;
  // Reject multi-digit or non-digit types (e.g. "42" — Engine.IO's later format).
  if (typeStr.length !== 1 || typeStr < '0' || typeStr > '9') return null;

  const typeNum = Number(typeStr);
  if (!VALID_TYPES.includes(typeNum)) return null;

  const packet: Packet = { type: typeNum as PacketTypeCode };

  const idRaw = parts[1];
  if (idRaw !== undefined && idRaw !== '') {
    // The `+` suffix means "auto-ack on server receive" in v0.9. We don't
    // generate acks, so strip and keep only the numeric portion.
    const trimmed = idRaw.endsWith('+') ? idRaw.slice(0, -1) : idRaw;
    if (trimmed === '' || !/^\d+$/.test(trimmed)) return null;
    packet.id = Number(trimmed);
  }

  const endpointRaw = parts[2];
  if (endpointRaw !== undefined && endpointRaw !== '') {
    packet.endpoint = endpointRaw;
  }

  const dataRaw = parts[3];
  if (dataRaw !== undefined && dataRaw !== '') {
    packet.data = dataRaw;
  }

  return packet;
}
