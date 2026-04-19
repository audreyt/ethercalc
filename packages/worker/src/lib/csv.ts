/**
 * CSV helpers for the Room HTTP layer.
 *
 * - `csvToSocialCalc` converts a CSV string to a SocialCalc save string by
 *   delegating to the `csvToSave` wrapper in `@ethercalc/socialcalc-headless`,
 *   which calls `SocialCalc.ConvertOtherFormatToSave(csv, 'csv')`. This is
 *   the same entry point the legacy `src/main.ls` used via the `J` library
 *   (J.utils.to_socialcalc produces an object keyed by sheet name — we only
 *   consume the primary sheet here, matching the legacy `for k, save of …`
 *   first-iteration behavior).
 *
 * - `decodeDoubleEncoded` reproduces the `text/x-ethercalc-csv-double-encoded`
 *   round-trip (§7 item 4 in CLAUDE.md): UTF-8 decode → Latin-1 encode →
 *   UTF-8 decode. Legacy did this via `iconv-lite` (Node-only); we use the
 *   platform `TextDecoder('latin1')` / `TextEncoder` which is available in
 *   both workerd and Node 20+.
 */
import { csvToSave } from '@ethercalc/socialcalc-headless';

/** Convert a CSV string to a SocialCalc save string. */
export function csvToSocialCalc(csv: string): string {
  return csvToSave(csv);
}

/**
 * Re-encode a UTF-8 → Latin-1 → UTF-8 double-encoded body. Equivalent to
 * the legacy `iconv-lite` triple-step.
 */
export function decodeDoubleEncoded(bytes: Uint8Array): string {
  const first = new TextDecoder('utf-8').decode(bytes);
  const latin1Bytes = new Uint8Array(first.length);
  for (let i = 0; i < first.length; i++) {
    // Latin-1 is a strict subset of Unicode up to U+00FF; code points above
    // that never survived the original round-trip either (legacy would have
    // produced the same replacement character). Mask to 8 bits.
    latin1Bytes[i] = first.charCodeAt(i) & 0xff;
  }
  return new TextDecoder('utf-8').decode(latin1Bytes);
}
