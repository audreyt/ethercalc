/**
 * Shared oversized-entry filter used by every migration source.
 *
 * Cloudflare Durable Object storage rejects values larger than 128 KiB
 * per key. A handful of legacy `loadclipboard` audit entries in real
 * dumps are 1–5 MB and would 500 the DO seed without this filter. We
 * default to 120 KiB (~8 KiB headroom for the JSON envelope the seed
 * PUT wraps each entry in) and report drops through `onOversizedEntry`
 * so the CLI can surface them.
 *
 * Sequence indices on the DO side go by `i` in the filtered array, so
 * dropped audits silently disappear from the post-migration history —
 * fine, they're historical audit noise, not load-bearing state.
 */
export type OversizedKind = 'log' | 'audit' | 'chat';

export type OversizedCallback = (info: {
  readonly room: string;
  readonly kind: OversizedKind;
  readonly index: number;
  readonly bytes: number;
}) => void;

export function filterOversized(
  entries: readonly string[],
  kind: OversizedKind,
  room: string,
  max: number,
  cb?: OversizedCallback,
): string[] {
  const out: string[] = [];
  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i] as string;
    // Compute real UTF-8 byte length — an earlier "length * 3" fast-path
    // false-positived on mostly-ASCII strings (e.g. 60k ASCII chars
    // report `length * 3 = 180k` but actual is 60k).
    const bytes = Buffer.byteLength(entry, 'utf8');
    if (bytes > max) {
      cb?.({ room, kind, index: i, bytes });
      continue;
    }
    out.push(entry);
  }
  return out;
}
